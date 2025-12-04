import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  LookupConfigDto,
  LookupSearchResponseDto,
  LookupRecordResponseDto,
} from '../dto/lookup-config.dto';
import { AllowedTablesService } from './allowed-tables.service';

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
    @InjectDataSource('protheusConnection')
    private dataSource: DataSource,
    private allowedTablesService: AllowedTablesService,
  ) {}

  /**
   * Search records for lookup modal using SQL query from config
   */
  async search(
    config: LookupConfigDto,
    searchTerm: string,
    pagination: { page: number; limit: number },
  ): Promise<LookupSearchResponseDto> {
    this.logger.log(`Lookup search called with config: ${JSON.stringify(config)}`);
    this.logger.log(`Search term: "${searchTerm}", pagination: ${JSON.stringify(pagination)}`);

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

    // Build query with search filter
    let baseQuery = config.sqlQuery;

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
      const countResult = await this.executeQuery(countQuery);
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

    this.logger.debug(`Executing lookup search: ${paginatedQuery.substring(0, 200)}...`);

    try {
      const results = await this.executeQuery(paginatedQuery);

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
  ): Promise<LookupRecordResponseDto> {
    if (!config.sqlQuery || !config.valueField) {
      throw new BadRequestException('Configuração de lookup incompleta');
    }

    // Validate the SQL query
    await this.validateCustomQuery(config.sqlQuery);

    // Build query to get single record
    const escapedValue = this.escapeValue(value);
    let query = config.sqlQuery;

    // Add WHERE clause to find specific record
    const valueCondition = `${config.valueField} = '${escapedValue}'`;
    if (query.toUpperCase().includes('WHERE')) {
      query += ` AND ${valueCondition}`;
    } else {
      query += ` WHERE ${valueCondition}`;
    }

    this.logger.debug(`Executing getRecord query: ${query.substring(0, 200)}...`);

    try {
      const results = await this.executeQuery(query);

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
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      const result = await this.getRecord(config, value);
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
   * Escape value for SQL
   */
  private escapeValue(value: string): string {
    return value.replace(/'/g, "''").trim();
  }

  /**
   * Execute query using query runner
   */
  private async executeQuery(query: string): Promise<any[]> {
    const queryRunner = this.dataSource.createQueryRunner();
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

    // Extract and validate table names
    const tablePattern = /\bFROM\s+(\w+)/gi;
    const joinPattern = /\bJOIN\s+(\w+)/gi;

    const tables: string[] = [];

    let match;
    while ((match = tablePattern.exec(query)) !== null) {
      tables.push(match[1].toUpperCase());
    }
    while ((match = joinPattern.exec(query)) !== null) {
      tables.push(match[1].toUpperCase());
    }

    // Get allowed tables from database
    const allowedTables = await this.allowedTablesService.getAllowedTableNames();

    // Validate all tables are in whitelist
    for (const table of tables) {
      if (!allowedTables.includes(table)) {
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
