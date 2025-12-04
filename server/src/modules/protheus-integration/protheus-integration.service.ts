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

  /**
   * Check if a record exists in Protheus by key fields
   * Returns the record data if found, null if not found
   */
  async findRecordByKeys(
    tableName: string,
    keyFields: Record<string, any>,
  ): Promise<{ exists: boolean; recno?: string; data?: Record<string, any> }> {
    this.logger.log(`Checking if record exists in Protheus table ${tableName}`, keyFields);

    const token = await this.getToken();
    const baseUrl = this.configService.get('PROTHEUS_API_URL');
    const endpoint = this.getEndpoint(tableName);

    // Build filter query from key fields
    // Example: A1_COD='000001' AND A1_LOJA='01'
    const filterParts = Object.entries(keyFields)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([field, value]) => `${field}='${String(value).trim()}'`);

    if (filterParts.length === 0) {
      return { exists: false };
    }

    const filter = filterParts.join(' AND ');

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          params: {
            $filter: filter,
            $top: 1,
          },
        }),
      );

      // Handle different response formats
      const items = response.data?.items || response.data?.value || response.data;
      const record = Array.isArray(items) ? items[0] : items;

      if (record && (record.R_E_C_N_O_ || record.recno || record.id)) {
        const recno = String(record.R_E_C_N_O_ || record.recno || record.id);
        this.logger.log(`Record found in Protheus. RECNO: ${recno}`);
        return {
          exists: true,
          recno,
          data: record,
        };
      }

      this.logger.log(`Record not found in Protheus for filter: ${filter}`);
      return { exists: false };
    } catch (error) {
      // 404 means not found, which is not an error in this context
      if (error.response?.status === 404) {
        this.logger.log(`Record not found in Protheus (404)`);
        return { exists: false };
      }

      this.logger.error(`Failed to check record in Protheus`, {
        tableName,
        keyFields,
        error: error.message,
        response: error.response?.data,
      });

      throw new Error(
        `Protheus API error: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Check multiple records existence in batch
   * Returns array with existence info for each record
   */
  async checkRecordsExistence(
    tableName: string,
    keyFieldNames: string[],
    records: Record<string, any>[],
  ): Promise<Array<{ index: number; exists: boolean; recno?: string; data?: Record<string, any>; error?: string }>> {
    this.logger.log(`Checking ${records.length} records existence in Protheus table ${tableName}`);

    // Pre-fetch token to avoid multiple concurrent token requests
    try {
      await this.getToken();
      this.logger.log('Token obtained successfully, starting record checks');
    } catch (error) {
      this.logger.error('Failed to get Protheus token for batch check', error.message);
      // Return all records with error flag so caller knows verification failed
      return records.map((_, index) => ({
        index,
        exists: false,
        error: `Authentication failed: ${error.message}`,
      }));
    }

    const results: Array<{ index: number; exists: boolean; recno?: string; data?: Record<string, any>; error?: string }> = [];

    // Process in batches to avoid overwhelming the API
    const batchSize = 5; // Reduced batch size for better reliability
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      // Process batch sequentially to avoid token race conditions
      for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
        const record = batch[batchIndex];
        const index = i + batchIndex;

        // Extract key field values from record
        const keyFields: Record<string, any> = {};
        for (const fieldName of keyFieldNames) {
          if (record[fieldName] !== undefined) {
            keyFields[fieldName] = record[fieldName];
          }
        }

        this.logger.log(`Checking record ${index + 1}/${records.length}: ${JSON.stringify(keyFields)}`);

        // Skip if no key fields have values
        if (Object.keys(keyFields).length === 0) {
          results.push({ index, exists: false, error: 'No key fields provided' });
          continue;
        }

        try {
          const result = await this.findRecordByKeys(tableName, keyFields);
          results.push({ index, ...result });
        } catch (error) {
          this.logger.warn(`Error checking record at index ${index}: ${error.message}`);
          // Include error info so caller can decide how to handle
          results.push({ index, exists: false, error: error.message });
        }
      }
    }

    const existingCount = results.filter(r => r.exists).length;
    const errorCount = results.filter(r => r.error).length;
    this.logger.log(`Found ${existingCount} existing records out of ${records.length} (${errorCount} errors)`);

    return results;
  }
}
