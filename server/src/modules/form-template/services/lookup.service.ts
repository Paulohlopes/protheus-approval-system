import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  LookupConfigDto,
  LookupSearchResponseDto,
  LookupRecordResponseDto,
} from '../dto/lookup-config.dto';
import { AllowedTablesService } from './allowed-tables.service';
import { ConnectionManagerService } from '../../country/connection-manager.service';
import { CountryService } from '../../country/country.service';

@Injectable()
export class LookupService {
  private readonly logger = new Logger(LookupService.name);

  // Forbidden SQL commands
  private readonly forbiddenCommands = [
    'DROP',
    'DELETE',
    'UPDATE',
    'INSERT',
    'ALTER',
    'TRUNCATE',
    'EXEC',
    'EXECUTE',
    'CREATE',
    'GRANT',
    'REVOKE',
    'MERGE',
    'CALL',
    'BULK',
    'OPENROWSET',
    'OPENDATASOURCE',
    'XP_',
    'SP_',
  ];

  constructor(
    private connectionManager: ConnectionManagerService,
    private countryService: CountryService,
    private allowedTablesService: AllowedTablesService,
  ) {}

  /**
   * Search records for lookup modal using SQL query from config
   */
  async search(
    config: LookupConfigDto,
    searchTerm: string,
    pagination: { page: number; limit: number },
    countryId?: string,
  ): Promise<LookupSearchResponseDto> {
    this.logger.log(`Lookup search called with config: ${JSON.stringify(config)}`);
    this.logger.log(`Search term: "${searchTerm}", pagination: ${JSON.stringify(pagination)}`);

    const resolvedCountryId = await this.resolveCountryId(countryId);
    const country = await this.countryService.findOne(resolvedCountryId);

    if (!config.sqlQuery) {
      throw new BadRequestException('Consulta SQL não configurada para este lookup');
    }

    // Validate the SQL query
    try {
      await this.validateCustomQuery(config.sqlQuery);
    } catch (error) {
      this.logger.error(`Query validation failed: ${error.message}`);
      throw error;
    }

    // Apply table suffix to the query
    let baseQuery = this.applyTableSuffix(config.sqlQuery, country.tableSuffix);

    // Add search filter if user typed something
    if (searchTerm && searchTerm.trim()) {
      const escapedSearch = this.escapeValue(searchTerm);
      const searchConditions: string[] = [];

      // Search in all columns or specific searchable fields
      if (config.searchableFields && config.searchableFields.length > 0) {
        for (const field of config.searchableFields) {
          if (/^[a-zA-Z0-9_]+$/.test(field)) {
            searchConditions.push(`${field} LIKE '%${escapedSearch}%'`);
          }
        }
      } else {
        // Default: search in valueField and displayField
        if (config.valueField) {
          searchConditions.push(`${config.valueField} LIKE '%${escapedSearch}%'`);
        }
        if (config.displayField && config.displayField !== config.valueField) {
          searchConditions.push(`${config.displayField} LIKE '%${escapedSearch}%'`);
        }
      }

      if (searchConditions.length > 0) {
        const searchClause = `(${searchConditions.join(' OR ')})`;
        if (baseQuery.toUpperCase().includes('WHERE')) {
          baseQuery += ` AND ${searchClause}`;
        } else {
          baseQuery += ` WHERE ${searchClause}`;
        }
      }
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as countQuery`;
    let total = 0;
    try {
      const countResult = await this.executeQuery(countQuery, resolvedCountryId);
      total = parseInt(countResult[0]?.total || '0', 10);
    } catch (error) {
      this.logger.warn(`Could not get total count: ${error.message}`);
    }

    // Add ORDER BY and pagination
    const offset = pagination.page * pagination.limit;
    let paginatedQuery = baseQuery;

    // Add ORDER BY if not present and we have a valueField
    if (!baseQuery.toUpperCase().includes('ORDER BY') && config.valueField) {
      paginatedQuery += ` ORDER BY ${config.valueField}`;
    }

    paginatedQuery += ` OFFSET ${offset} ROWS FETCH NEXT ${pagination.limit} ROWS ONLY`;

    this.logger.debug(`Executing lookup search (country: ${country.code}): ${paginatedQuery.substring(0, 200)}...`);

    try {
      const results = await this.executeQuery(paginatedQuery, resolvedCountryId);

      const data = results.map((row: any) => {
        const record: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
          record[key] = typeof value === 'string' ? value.trim() : value;
        }
        return record;
      });

      return {
        data,
        total,
        page: pagination.page,
        limit: pagination.limit,
      };
    } catch (error) {
      this.logger.error(`Error executing lookup search: ${error.message}`);
      throw new BadRequestException('Erro ao buscar registros do lookup');
    }
  }

  /**
   * Get a single record by value
   */
  async getRecord(
    config: LookupConfigDto,
    value: string,
    countryId?: string,
  ): Promise<LookupRecordResponseDto> {
    if (!config.sqlQuery || !config.valueField) {
      throw new BadRequestException('Configuração de lookup incompleta');
    }

    const resolvedCountryId = await this.resolveCountryId(countryId);
    const country = await this.countryService.findOne(resolvedCountryId);

    // Validate the SQL query
    await this.validateCustomQuery(config.sqlQuery);

    // Apply table suffix to the query
    let query = this.applyTableSuffix(config.sqlQuery, country.tableSuffix);

    // Build query to get single record
    const escapedValue = this.escapeValue(value);

    // Add WHERE clause to find specific record
    const valueCondition = `${config.valueField} = '${escapedValue}'`;
    if (query.toUpperCase().includes('WHERE')) {
      query += ` AND ${valueCondition}`;
    } else {
      query += ` WHERE ${valueCondition}`;
    }

    this.logger.debug(`Executing getRecord query (country: ${country.code}): ${query.substring(0, 200)}...`);

    try {
      const results = await this.executeQuery(query, resolvedCountryId);

      if (results.length === 0) {
        return { data: null, found: false };
      }

      const record: Record<string, any> = {};
      for (const [key, val] of Object.entries(results[0])) {
        record[key] = typeof val === 'string' ? val.trim() : val;
      }

      return { data: record, found: true };
    } catch (error) {
      this.logger.error(`Error executing getRecord query: ${error.message}`);
      throw new BadRequestException('Erro ao buscar registro');
    }
  }

  /**
   * Validate that a value exists in the lookup
   */
  async validateValue(
    config: LookupConfigDto,
    value: string,
    countryId?: string,
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      const result = await this.getRecord(config, value, countryId);
      return {
        valid: result.found,
        message: result.found ? undefined : 'Valor não encontrado',
      };
    } catch (error) {
      this.logger.error(`Error validating lookup value: ${error.message}`);
      return { valid: false, message: 'Erro ao validar valor' };
    }
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

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
   * Apply table suffix to SQL query
   * Replaces table names like SA1, SB1 with SA1010, SB1030 etc.
   */
  private applyTableSuffix(query: string, tableSuffix: string): string {
    // Pattern to match Protheus table names (SA1, SB1, SX3, etc.)
    // These are typically 2-3 letters followed by 1 digit
    const tablePattern = /\b(S[A-Z][0-9A-Z])\b/gi;

    return query.replace(tablePattern, (match) => {
      return `${match}${tableSuffix}`;
    });
  }

  /**
   * Escape value for SQL
   */
  private escapeValue(value: string): string {
    return value.replace(/'/g, "''").trim();
  }

  /**
   * Execute query using connection manager
   */
  private async executeQuery(query: string, countryId: string): Promise<any[]> {
    const dataSource = await this.connectionManager.getConnection(countryId);
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      return await queryRunner.query(query);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Validate custom SQL query for security
   */
  private async validateCustomQuery(query: string): Promise<void> {
    if (!query || typeof query !== 'string') {
      throw new BadRequestException('Query SQL inválida');
    }

    const normalizedQuery = query.toUpperCase().trim();

    // Must start with SELECT
    if (!normalizedQuery.startsWith('SELECT')) {
      throw new BadRequestException('Apenas queries SELECT são permitidas');
    }

    // Check for forbidden commands
    for (const cmd of this.forbiddenCommands) {
      const regex = new RegExp(`\\b${cmd}\\b`, 'i');
      if (regex.test(normalizedQuery)) {
        this.logger.warn(`Forbidden SQL command detected: ${cmd}`);
        throw new BadRequestException(`Comando SQL não permitido: ${cmd}`);
      }
    }

    // Extract and validate table names (without suffix)
    const tablePattern = /\bFROM\s+(\w+)/gi;
    const joinPattern = /\bJOIN\s+(\w+)/gi;

    const tables: string[] = [];

    let match;
    while ((match = tablePattern.exec(query)) !== null) {
      // Extract base table name (without suffix)
      const tableName = match[1].toUpperCase().replace(/\d{3}$/, '');
      tables.push(tableName);
    }
    while ((match = joinPattern.exec(query)) !== null) {
      const tableName = match[1].toUpperCase().replace(/\d{3}$/, '');
      tables.push(tableName);
    }

    // Get allowed tables from database
    const allowedTables = await this.allowedTablesService.getAllowedTableNames();

    // Validate all tables are in whitelist (compare base names)
    for (const table of tables) {
      // Check if the base table name (without suffix) is allowed
      const baseTableAllowed = allowedTables.some(
        allowed => allowed.replace(/\d{3}$/, '') === table
      );
      if (!baseTableAllowed) {
        this.logger.warn(`Table ${table} not in whitelist`);
        throw new BadRequestException(`Tabela ${table} não permitida para consulta`);
      }
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /--/,
      /\/\*/,
      /;/,
      /\bUNION\b/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        this.logger.warn(`Dangerous pattern detected in query`);
        throw new BadRequestException('Query SQL contém padrões não permitidos');
      }
    }
  }

  /**
   * Get list of allowed tables for reference
   */
  async getAllowedTables(): Promise<string[]> {
    return this.allowedTablesService.getAllowedTableNames();
  }
}
