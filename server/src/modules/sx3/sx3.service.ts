import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Sx3FieldDto, TableStructureDto } from './dto/sx3-field.dto';
import { ConnectionManagerService } from '../country/connection-manager.service';
import { CountryService } from '../country/country.service';

@Injectable()
export class Sx3Service {
  private readonly logger = new Logger(Sx3Service.name);
  // Cache per country: Map<countryId, Map<tableName, fields>>
  private cache: Map<string, Map<string, Sx3FieldDto[]>> = new Map();

  constructor(
    private readonly connectionManager: ConnectionManagerService,
    private readonly countryService: CountryService,
  ) {}

  /**
   * Get table structure from SX3 for a specific country
   * Results are cached for performance
   */
  async getTableStructure(tableName: string, countryId?: string): Promise<TableStructureDto> {
    // Get country ID (use default if not provided)
    const resolvedCountryId = await this.resolveCountryId(countryId);
    const country = await this.countryService.findOne(resolvedCountryId);

    this.logger.log(`Getting table structure for ${tableName} (country: ${country.code})`);

    // Check cache first
    const countryCache = this.cache.get(resolvedCountryId) || new Map();
    if (countryCache.has(tableName)) {
      this.logger.debug(`Cache hit for table ${tableName} (country: ${country.code})`);
      return {
        tableName,
        fields: countryCache.get(tableName),
      };
    }

    // Get connection for the country
    const connection = await this.connectionManager.getConnection(resolvedCountryId);

    // Build SX3 table name with suffix
    const sx3Table = `SX3${country.tableSuffix}`;

    // Query SX3
    const sx3Records = await connection.query(`
      SELECT *
      FROM ${sx3Table}
      WHERE X3_ARQUIVO = @0
        AND D_E_L_E_T_ = ''
      ORDER BY X3_ORDEM
    `, [tableName]);

    if (sx3Records.length === 0) {
      throw new NotFoundException(`Table ${tableName} not found in SX3 for country ${country.code}`);
    }

    // Map to DTO
    const fields = sx3Records.map((record: any) => this.mapToDto(record));

    // Cache the result
    if (!this.cache.has(resolvedCountryId)) {
      this.cache.set(resolvedCountryId, new Map());
    }
    this.cache.get(resolvedCountryId)!.set(tableName, fields);
    this.logger.log(`Cached structure for table ${tableName} (${fields.length} fields, country: ${country.code})`);

    return {
      tableName,
      fields,
    };
  }

  /**
   * Get all available tables from SX3 for a specific country
   */
  async getAvailableTables(countryId?: string): Promise<string[]> {
    const resolvedCountryId = await this.resolveCountryId(countryId);
    const country = await this.countryService.findOne(resolvedCountryId);

    this.logger.log(`Getting available tables from SX3 (country: ${country.code})`);

    const connection = await this.connectionManager.getConnection(resolvedCountryId);
    const sx3Table = `SX3${country.tableSuffix}`;

    const result = await connection.query(`
      SELECT DISTINCT X3_ARQUIVO as tableName
      FROM ${sx3Table}
      WHERE D_E_L_E_T_ = ''
      ORDER BY X3_ARQUIVO
    `);

    return result.map((r: any) => r.tableName?.trim()).filter(Boolean);
  }

  /**
   * Sync cache - clears cached data for a specific country or all countries
   */
  syncCache(countryId?: string): void {
    if (countryId) {
      this.cache.delete(countryId);
      this.logger.log(`Cleared cache for country: ${countryId}`);
    } else {
      this.cache.clear();
      this.logger.log('Cleared all SX3 cache');
    }
  }

  /**
   * Auto-sync cache daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  handleCron() {
    this.logger.log('Running scheduled cache sync');
    this.syncCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(countryId?: string) {
    if (countryId) {
      const countryCache = this.cache.get(countryId);
      return {
        countryId,
        cachedTables: countryCache?.size || 0,
        tables: countryCache ? Array.from(countryCache.keys()) : [],
      };
    }

    const stats: Record<string, { cachedTables: number; tables: string[] }> = {};
    for (const [cId, cCache] of this.cache) {
      stats[cId] = {
        cachedTables: cCache.size,
        tables: Array.from(cCache.keys()),
      };
    }
    return stats;
  }

  /**
   * Resolve country ID - use default if not provided
   */
  private async resolveCountryId(countryId?: string): Promise<string> {
    if (countryId) {
      return countryId;
    }

    const defaultCountry = await this.countryService.getDefault();
    if (!defaultCountry) {
      throw new BadRequestException('No country specified and no default country configured');
    }
    return defaultCountry.id;
  }

  /**
   * Map SX3 raw record to DTO
   */
  private mapToDto(record: any): Sx3FieldDto {
    const labelPtBR = record.X3_TITULO?.trim() || '';
    const labelEn = record.X3_TITENG?.trim() || '';
    const labelEs = record.X3_TITSPA?.trim() || '';
    const descriptionPtBR = record.X3_DESCRIC?.trim() || '';
    const descriptionEn = record.X3_DESCENG?.trim() || '';
    const descriptionEs = record.X3_DESCSPA?.trim() || '';

    return {
      fieldName: record.X3_CAMPO?.trim() || '',
      // Default label/description (Portuguese as fallback)
      label: labelPtBR,
      description: descriptionPtBR,
      // Multi-language labels (fallback to Portuguese if empty)
      labelPtBR,
      labelEn: labelEn || labelPtBR,
      labelEs: labelEs || labelPtBR,
      // Multi-language descriptions (fallback to Portuguese if empty)
      descriptionPtBR,
      descriptionEn: descriptionEn || descriptionPtBR,
      descriptionEs: descriptionEs || descriptionPtBR,
      // Other fields
      fieldType: this.mapFieldType(record.X3_TIPO),
      size: record.X3_TAMANHO || 0,
      decimals: record.X3_DECIMAL || 0,
      isRequired: record.X3_OBRIGAT?.trim() === 'S',
      mask: record.X3_PICTURE?.trim() || '',
      lookup: record.X3_F3?.trim() || '',
      order: record.X3_ORDEM?.trim() || '',
      validation: record.X3_VALID?.trim() || '',
      when: record.X3_WHEN?.trim() || '',
      defaultValue: record.X3_RELACAO?.trim() || '',
    };
  }

  /**
   * Map Protheus field type to standard type
   */
  private mapFieldType(sx3Type: string): 'string' | 'number' | 'date' | 'boolean' | 'text' {
    const typeMap: Record<string, 'string' | 'number' | 'date' | 'boolean' | 'text'> = {
      C: 'string', // Character
      N: 'number', // Numeric
      D: 'date', // Date
      L: 'boolean', // Logical
      M: 'text', // Memo/Text
    };

    return typeMap[sx3Type?.trim()] || 'string';
  }
}
