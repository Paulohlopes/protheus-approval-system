import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../prisma/prisma.service';
import { RegistrationStatus } from '@prisma/client';
import { firstValueFrom } from 'rxjs';

interface ProtheusTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable()
export class ProtheusIntegrationService {
  private readonly logger = new Logger(ProtheusIntegrationService.name);
  private tokenCache: {
    token: string;
    expiresAt: Date;
  } | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get OAuth2 token from Protheus
   * Tokens are cached until expiration
   */
  private async getToken(): Promise<string> {
    // Check cache
    if (this.tokenCache && this.tokenCache.expiresAt > new Date()) {
      this.logger.debug('Using cached Protheus token');
      return this.tokenCache.token;
    }

    this.logger.log('Getting new Protheus OAuth2 token');

    const oauthUrl = this.configService.get('PROTHEUS_OAUTH_URL');
    const username = this.configService.get('PROTHEUS_DB_USERNAME');
    const password = this.configService.get('PROTHEUS_DB_PASSWORD');

    try {
      const response = await firstValueFrom(
        this.httpService.post<ProtheusTokenResponse>(
          `${oauthUrl}/rest/api/oauth2/v1/token`,
          new URLSearchParams({
            grant_type: 'password',
            username,
            password,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      const { access_token, expires_in } = response.data;

      // Cache token (expires_in is in seconds)
      this.tokenCache = {
        token: access_token,
        expiresAt: new Date(Date.now() + expires_in * 1000 - 60000), // Subtract 1 minute for safety
      };

      this.logger.log('Successfully obtained Protheus token');
      return access_token;
    } catch (error) {
      this.logger.error('Failed to get Protheus token', error);
      throw new Error(`Protheus authentication failed: ${error.message}`);
    }
  }

  /**
   * Get REST API endpoint for a table
   */
  private getEndpoint(tableName: string): string {
    const endpoints: Record<string, string> = {
      SB1: '/rest/MATA010', // Produtos
      SA1: '/rest/MATA030', // Clientes
      SA2: '/rest/MATA020', // Fornecedores
      DA0: '/rest/MATA140', // Tabela de Preços (header)
      DA1: '/rest/MATA141', // Tabela de Preços (itens)
    };

    return endpoints[tableName] || `/rest/${tableName}`;
  }

  /**
   * Map form data to Protheus format
   * This converts field names and values to Protheus-compatible format
   */
  private mapFormDataToProtheus(tableName: string, formData: Record<string, any>): any {
    // For now, we assume formData already has correct field names (B1_COD, B1_DESC, etc.)
    // In a production system, you might need more sophisticated mapping

    this.logger.debug(`Mapping form data for table ${tableName}`, formData);

    // Add any table-specific transformations here
    const mapped = { ...formData };

    // Example: Ensure required fields are present
    // Example: Format dates, numbers, etc.

    return mapped;
  }

  /**
   * Create record in Protheus via REST API
   */
  async createRecord(tableName: string, formData: Record<string, any>): Promise<string> {
    this.logger.log(`Creating record in Protheus table ${tableName}`);

    const token = await this.getToken();
    const baseUrl = this.configService.get('PROTHEUS_API_URL');
    const endpoint = this.getEndpoint(tableName);
    const protheusData = this.mapFormDataToProtheus(tableName, formData);

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${baseUrl}${endpoint}`, protheusData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      const recno = response.data?.recno || response.data?.R_E_C_N_O_ || response.data?.id;

      if (!recno) {
        this.logger.warn('Protheus did not return a RECNO', response.data);
      }

      this.logger.log(`Successfully created record in Protheus. RECNO: ${recno}`);
      return String(recno);
    } catch (error) {
      this.logger.error(`Failed to create record in Protheus`, {
        tableName,
        error: error.message,
        response: error.response?.data,
      });

      throw new Error(
        `Protheus API error: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Update existing record in Protheus via REST API (PUT)
   */
  async updateRecord(tableName: string, recno: string, formData: Record<string, any>): Promise<void> {
    this.logger.log(`Updating record in Protheus table ${tableName}, RECNO: ${recno}`);

    const token = await this.getToken();
    const baseUrl = this.configService.get('PROTHEUS_API_URL');
    const endpoint = this.getEndpoint(tableName);
    const protheusData = this.mapFormDataToProtheus(tableName, formData);

    try {
      await firstValueFrom(
        this.httpService.put(`${baseUrl}${endpoint}/${recno}`, protheusData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(`Successfully updated record in Protheus. RECNO: ${recno}`);
    } catch (error) {
      this.logger.error(`Failed to update record in Protheus`, {
        tableName,
        recno,
        error: error.message,
        response: error.response?.data,
      });

      throw new Error(
        `Protheus API error: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Sync registration request to Protheus
   * This is called after a registration is fully approved
   * Handles both NEW registrations (POST) and ALTERATIONS (PUT)
   */
  async syncToProtheus(registrationId: string): Promise<void> {
    this.logger.log(`Syncing registration ${registrationId} to Protheus`);

    // Get registration
    const registration = await this.prisma.registrationRequest.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new Error(`Registration ${registrationId} not found`);
    }

    if (registration.status !== RegistrationStatus.APPROVED) {
      throw new Error(`Registration ${registrationId} is not approved`);
    }

    const isAlteration = registration.operationType === 'ALTERATION';
    this.logger.log(`Operation type: ${registration.operationType}`);

    // Update status to SYNCING
    await this.prisma.registrationRequest.update({
      where: { id: registrationId },
      data: {
        status: RegistrationStatus.SYNCING_TO_PROTHEUS,
      },
    });

    try {
      let recno: string;

      if (isAlteration && registration.originalRecno) {
        // ALTERATION: Update existing record in Protheus
        await this.updateRecord(
          registration.tableName,
          registration.originalRecno,
          registration.formData as any,
        );
        recno = registration.originalRecno;
        this.logger.log(`Updated existing record in Protheus. RECNO: ${recno}`);
      } else {
        // NEW: Create new record in Protheus
        recno = await this.createRecord(registration.tableName, registration.formData as any);
        this.logger.log(`Created new record in Protheus. RECNO: ${recno}`);
      }

      // Update registration with success
      await this.prisma.registrationRequest.update({
        where: { id: registrationId },
        data: {
          status: RegistrationStatus.SYNCED,
          protheusRecno: recno,
          syncedAt: new Date(),
          syncError: null,
          syncLog: {
            syncedAt: new Date().toISOString(),
            recno,
            operationType: registration.operationType,
            success: true,
          },
        },
      });

      this.logger.log(`Successfully synced registration ${registrationId} to Protheus`);
    } catch (error) {
      this.logger.error(`Failed to sync registration ${registrationId} to Protheus`, error);

      // Update registration with error
      await this.prisma.registrationRequest.update({
        where: { id: registrationId },
        data: {
          status: RegistrationStatus.SYNC_FAILED,
          syncError: error.message,
          syncLog: {
            syncedAt: new Date().toISOString(),
            error: error.message,
            operationType: registration.operationType,
            success: false,
          },
        },
      });

      throw error;
    }
  }

  /**
   * Test connection to Protheus
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const token = await this.getToken();
      return {
        success: true,
        message: 'Successfully connected to Protheus',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect to Protheus: ${error.message}`,
      };
    }
  }
}
