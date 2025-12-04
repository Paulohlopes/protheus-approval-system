import {
  Injectable,
  Logger,
  OnModuleDestroy,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, DataSourceOptions } from 'typeorm';
import { CountryService } from './country.service';
import { TestConnectionDto, TestConnectionResultDto } from './dto';
import { SettingsService } from '../settings/settings.service';

interface ConnectionEntry {
  dataSource: DataSource;
  lastUsed: Date;
  countryId: string;
}

@Injectable()
export class ConnectionManagerService implements OnModuleDestroy {
  private readonly logger = new Logger(ConnectionManagerService.name);
  private readonly connectionPool = new Map<string, ConnectionEntry>();
  private readonly maxIdleTimeMs = 30 * 60 * 1000; // 30 minutes

  constructor(
    private readonly countryService: CountryService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Get or create a database connection for a country
   */
  async getConnection(countryId: string): Promise<DataSource> {
    // Check if connection exists and is alive
    const existing = this.connectionPool.get(countryId);
    if (existing && existing.dataSource.isInitialized) {
      existing.lastUsed = new Date();
      return existing.dataSource;
    }

    // Create new connection
    const credentials = await this.countryService.getConnectionCredentials(countryId);

    const options: DataSourceOptions = {
      type: 'mssql',
      host: credentials.dbHost,
      port: credentials.dbPort,
      database: credentials.dbDatabase,
      username: credentials.dbUsername,
      password: credentials.dbPassword,
      options: {
        encrypt: credentials.dbOptions?.encrypt ?? false,
        trustServerCertificate: credentials.dbOptions?.trustServerCertificate ?? true,
        connectTimeout: 30000,
      },
      extra: {
        validateConnection: true,
        connectionTimeout: 30000,
        requestTimeout: 60000,
      },
    };

    const dataSource = new DataSource(options);

    try {
      await dataSource.initialize();

      this.connectionPool.set(countryId, {
        dataSource,
        lastUsed: new Date(),
        countryId,
      });

      // Update connection status
      await this.countryService.updateConnectionStatus(countryId, 'connected');

      this.logger.log(`Connection established for country: ${countryId}`);
      return dataSource;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.countryService.updateConnectionStatus(countryId, 'failed', errorMessage);
      this.logger.error(`Failed to connect for country ${countryId}: ${errorMessage}`);
      throw new BadRequestException(`Database connection failed: ${errorMessage}`);
    }
  }

  /**
   * Test a database connection without storing it
   */
  async testConnection(dto: TestConnectionDto): Promise<TestConnectionResultDto> {
    const options: DataSourceOptions = {
      type: 'mssql',
      host: dto.dbHost,
      port: dto.dbPort ?? 1433,
      database: dto.dbDatabase,
      username: dto.dbUsername,
      password: dto.dbPassword,
      options: {
        encrypt: dto.dbOptions?.encrypt ?? false,
        trustServerCertificate: dto.dbOptions?.trustServerCertificate ?? true,
        connectTimeout: 15000,
      },
      extra: {
        requestTimeout: 15000,
      },
    };

    const dataSource = new DataSource(options);

    try {
      await dataSource.initialize();

      // Get server version
      const versionResult = await dataSource.query('SELECT @@VERSION as version');
      const serverVersion = versionResult[0]?.version?.split('\n')[0] || 'Unknown';

      // Test if SX3 table exists with the given suffix
      const tableSuffix = dto.tableSuffix || '010';
      const sx3Table = `SX3${tableSuffix}`;
      let testTableFound = false;

      try {
        const tableCheck = await dataSource.query(`
          SELECT TOP 1 1 as found
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_NAME = '${sx3Table}'
        `);
        testTableFound = tableCheck.length > 0;
      } catch {
        // Table check failed, but connection is OK
      }

      await dataSource.destroy();

      return {
        success: true,
        message: testTableFound
          ? `Connection successful! SX3 table found (${sx3Table})`
          : `Connection successful! Warning: SX3 table (${sx3Table}) not found`,
        details: {
          serverVersion,
          database: dto.dbDatabase,
          testTableFound,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Try to clean up
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }

      return {
        success: false,
        message: `Connection failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Test connection for an existing country
   */
  async testCountryConnection(countryId: string): Promise<TestConnectionResultDto> {
    const credentials = await this.countryService.getConnectionCredentials(countryId);

    const result = await this.testConnection({
      dbHost: credentials.dbHost,
      dbPort: credentials.dbPort,
      dbDatabase: credentials.dbDatabase,
      dbUsername: credentials.dbUsername,
      dbPassword: credentials.dbPassword,
      dbOptions: credentials.dbOptions || undefined,
      tableSuffix: credentials.tableSuffix,
    });

    // Update connection status
    if (result.success) {
      await this.countryService.updateConnectionStatus(countryId, 'connected');
    } else {
      await this.countryService.updateConnectionStatus(countryId, 'failed', result.message);
    }

    return result;
  }

  /**
   * Close a specific connection
   */
  async closeConnection(countryId: string): Promise<void> {
    const entry = this.connectionPool.get(countryId);
    if (entry && entry.dataSource.isInitialized) {
      await entry.dataSource.destroy();
      this.connectionPool.delete(countryId);
      this.logger.log(`Connection closed for country: ${countryId}`);
    }
  }

  /**
   * Close all connections
   */
  async closeAllConnections(): Promise<void> {
    for (const [countryId, entry] of this.connectionPool) {
      if (entry.dataSource.isInitialized) {
        await entry.dataSource.destroy();
      }
    }
    this.connectionPool.clear();
    this.logger.log('All connections closed');
  }

  /**
   * Clean up idle connections (runs every hour)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupIdleConnections(): Promise<void> {
    const now = new Date();
    const toClose: string[] = [];

    for (const [countryId, entry] of this.connectionPool) {
      const idleTime = now.getTime() - entry.lastUsed.getTime();
      if (idleTime > this.maxIdleTimeMs) {
        toClose.push(countryId);
      }
    }

    for (const countryId of toClose) {
      await this.closeConnection(countryId);
      this.logger.log(`Closed idle connection for country: ${countryId}`);
    }

    if (toClose.length > 0) {
      this.logger.log(`Cleaned up ${toClose.length} idle connections`);
    }
  }

  /**
   * Get connection pool status (for monitoring)
   */
  getPoolStatus(): Array<{
    countryId: string;
    isConnected: boolean;
    lastUsed: Date;
    idleMinutes: number;
  }> {
    const now = new Date();
    const status: Array<{
      countryId: string;
      isConnected: boolean;
      lastUsed: Date;
      idleMinutes: number;
    }> = [];

    for (const [countryId, entry] of this.connectionPool) {
      status.push({
        countryId,
        isConnected: entry.dataSource.isInitialized,
        lastUsed: entry.lastUsed,
        idleMinutes: Math.round((now.getTime() - entry.lastUsed.getTime()) / 60000),
      });
    }

    return status;
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    await this.closeAllConnections();
  }
}
