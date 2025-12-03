import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  LookupConfigDto,
  LookupFilterOperator,
  LookupSearchResponseDto,
  LookupRecordResponseDto,
} from '../dto/lookup-config.dto';

@Injectable()
export class LookupService {
  private readonly logger = new Logger(LookupService.name);

  // Whitelist of allowed tables for lookup queries
  private readonly allowedTables = [
    'SA1010', // Clientes
    'SA2010', // Fornecedores
    'SA3010', // Vendedores
    'SB1010', // Produtos
    'SB2010', // Saldos em Estoque
    'SC5010', // Pedidos de Venda
    'SC6010', // Itens de Pedidos
    'SC7010', // Pedidos de Compra
    'SD1010', // Itens NF Entrada
    'SD2010', // Itens NF Saída
    'SE1010', // Contas a Receber
    'SE2010', // Contas a Pagar
    'SF1010', // NF Entrada
    'SF2010', // NF Saída
    'SX5010', // Tabelas Genéricas
    'CTT010', // Centro de Custo
    'CTD010', // Plano de Contas
    'DA0010', // Tabela de Preços (header)
    'DA1010', // Tabela de Preços (itens)
    'SG1010', // Estrutura de Produtos
    'SM0010', // Cadastro de Empresas
    'SYA010', // Países
    'CC2010', // Estados
  ];

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
  ) {}

  /**
   * Search records for lookup modal
   */
  async search(
    config: LookupConfigDto,
    filters: Record<string, string>,
    pagination: { page: number; limit: number },
  ): Promise<LookupSearchResponseDto> {
    // Validate source table
    this.validateTable(config.sourceTable);

    // Build select fields
    const selectFields = this.buildSelectFields(config);

    // Build base query
    let baseQuery = `FROM ${config.sourceTable} WHERE D_E_L_E_T_ = ''`;

    // Add fixed filters from config
    if (config.filters && config.filters.length > 0) {
      for (const filter of config.filters) {
        const filterCondition = this.buildFilterCondition(filter.field, filter.operator, filter.value);
        baseQuery += ` AND ${filterCondition}`;
      }
    }

    // Add dynamic filters from search modal
    if (filters && Object.keys(filters).length > 0) {
      for (const [field, value] of Object.entries(filters)) {
        if (value && value.trim()) {
          // Validate field name
          if (!/^[a-zA-Z0-9_]+$/.test(field)) {
            this.logger.warn(`Invalid filter field name: ${field}, skipping`);
            continue;
          }
          const escapedValue = this.escapeValue(value);
          baseQuery += ` AND ${field} LIKE '%${escapedValue}%'`;
        }
      }
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    this.logger.debug(`Executing count query: ${countQuery.substring(0, 200)}...`);

    let total = 0;
    try {
      const countResult = await this.executeQuery(countQuery);
      total = parseInt(countResult[0]?.total || '0', 10);
    } catch (error) {
      this.logger.error(`Error executing count query: ${error.message}`);
      throw new BadRequestException('Erro ao contar registros');
    }

    // Build paginated query
    const offset = pagination.page * pagination.limit;
    const dataQuery = `
      SELECT ${selectFields}
      ${baseQuery}
      ORDER BY ${config.valueField}
      OFFSET ${offset} ROWS
      FETCH NEXT ${pagination.limit} ROWS ONLY
    `;

    this.logger.debug(`Executing search query: ${dataQuery.substring(0, 200)}...`);

    try {
      const results = await this.executeQuery(dataQuery);

      const data = results.map((row: any) => {
        const record: Record<string, any> = {};
        // Trim all string values
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
      this.logger.error(`Error executing search query: ${error.message}`);
      throw new BadRequestException('Erro ao buscar registros');
    }
  }

  /**
   * Get a single record by value
   */
  async getRecord(
    config: LookupConfigDto,
    value: string,
  ): Promise<LookupRecordResponseDto> {
    // Validate source table
    this.validateTable(config.sourceTable);

    // Build select fields (include return fields)
    const selectFields = this.buildSelectFields(config, true);

    // Build query
    const escapedValue = this.escapeValue(value);
    const query = `
      SELECT TOP 1 ${selectFields}
      FROM ${config.sourceTable}
      WHERE D_E_L_E_T_ = ''
      AND ${config.valueField} = '${escapedValue}'
    `;

    this.logger.debug(`Executing getRecord query: ${query.substring(0, 200)}...`);

    try {
      const results = await this.executeQuery(query);

      if (results.length === 0) {
        return { data: null, found: false };
      }

      const record: Record<string, any> = {};
      // Trim all string values
      for (const [key, value] of Object.entries(results[0])) {
        record[key] = typeof value === 'string' ? value.trim() : value;
      }

      return { data: record, found: true };
    } catch (error) {
      this.logger.error(`Error executing getRecord query: ${error.message}`);
      throw new BadRequestException('Erro ao buscar registro');
    }
  }

  /**
   * Validate that a value exists in the lookup table
   */
  async validateValue(
    config: LookupConfigDto,
    value: string,
  ): Promise<{ valid: boolean; message?: string }> {
    // Validate source table
    this.validateTable(config.sourceTable);

    const escapedValue = this.escapeValue(value);
    const query = `
      SELECT COUNT(*) as count
      FROM ${config.sourceTable}
      WHERE D_E_L_E_T_ = ''
      AND ${config.valueField} = '${escapedValue}'
    `;

    this.logger.debug(`Executing validation query: ${query.substring(0, 200)}...`);

    try {
      const results = await this.executeQuery(query);
      const count = parseInt(results[0]?.count || '0', 10);

      return {
        valid: count > 0,
        message: count > 0 ? undefined : 'Valor não encontrado na tabela de origem',
      };
    } catch (error) {
      this.logger.error(`Error executing validation query: ${error.message}`);
      return { valid: false, message: 'Erro ao validar valor' };
    }
  }

  /**
   * Execute custom SQL query for lookup (if customQuery is provided)
   */
  async executeCustomQuery(
    customQuery: string,
    filters: Record<string, string>,
    pagination: { page: number; limit: number },
  ): Promise<LookupSearchResponseDto> {
    // Validate and sanitize query
    this.validateCustomQuery(customQuery);

    // Add filters to query
    let query = customQuery;
    if (filters && Object.keys(filters).length > 0) {
      const filterConditions: string[] = [];
      for (const [field, value] of Object.entries(filters)) {
        if (value && value.trim()) {
          if (!/^[a-zA-Z0-9_]+$/.test(field)) {
            continue;
          }
          const escapedValue = this.escapeValue(value);
          filterConditions.push(`${field} LIKE '%${escapedValue}%'`);
        }
      }

      if (filterConditions.length > 0) {
        if (query.toUpperCase().includes('WHERE')) {
          query += ` AND ${filterConditions.join(' AND ')}`;
        } else {
          query += ` WHERE ${filterConditions.join(' AND ')}`;
        }
      }
    }

    // Get count (wrap original query)
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as subquery`;
    let total = 0;
    try {
      const countResult = await this.executeQuery(countQuery);
      total = parseInt(countResult[0]?.total || '0', 10);
    } catch (error) {
      this.logger.warn(`Could not get total count: ${error.message}`);
    }

    // Add pagination
    const offset = pagination.page * pagination.limit;
    const paginatedQuery = `
      ${query}
      OFFSET ${offset} ROWS
      FETCH NEXT ${pagination.limit} ROWS ONLY
    `;

    this.logger.debug(`Executing custom query: ${paginatedQuery.substring(0, 200)}...`);

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
      this.logger.error(`Error executing custom query: ${error.message}`);
      throw new BadRequestException('Erro ao executar consulta personalizada');
    }
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  /**
   * Validate table is in whitelist
   */
  private validateTable(tableName: string): void {
    const normalizedTable = tableName.toUpperCase().trim();
    if (!this.allowedTables.includes(normalizedTable)) {
      this.logger.warn(`Table ${tableName} not in whitelist`);
      throw new BadRequestException(`Tabela ${tableName} não permitida para lookup`);
    }
  }

  /**
   * Build SELECT field list from config
   */
  private buildSelectFields(config: LookupConfigDto, includeReturnFields = false): string {
    const fields = new Set<string>();

    // Always include value and display fields
    fields.add(config.valueField);
    fields.add(config.displayField);

    // Add search fields
    for (const sf of config.searchFields) {
      fields.add(sf.field);
    }

    // Add return fields if requested
    if (includeReturnFields && config.returnFields) {
      for (const rf of config.returnFields) {
        fields.add(rf.sourceField);
      }
    }

    return Array.from(fields).join(', ');
  }

  /**
   * Build filter condition based on operator
   */
  private buildFilterCondition(
    field: string,
    operator: LookupFilterOperator | string,
    value: string | string[],
  ): string {
    // Validate field name
    if (!/^[a-zA-Z0-9_]+$/.test(field)) {
      throw new BadRequestException(`Nome de campo inválido: ${field}`);
    }

    switch (operator) {
      case LookupFilterOperator.EQUALS:
      case 'equals':
        const escapedEquals = this.escapeValue(String(value));
        return `${field} = '${escapedEquals}'`;

      case LookupFilterOperator.LIKE:
      case 'like':
        const escapedLike = this.escapeValue(String(value));
        return `${field} LIKE '%${escapedLike}%'`;

      case LookupFilterOperator.IN:
      case 'in':
        const values = Array.isArray(value) ? value : [value];
        const escapedValues = values.map(v => `'${this.escapeValue(v)}'`).join(', ');
        return `${field} IN (${escapedValues})`;

      default:
        throw new BadRequestException(`Operador de filtro desconhecido: ${operator}`);
    }
  }

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
  private validateCustomQuery(query: string): void {
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

    // Validate all tables are in whitelist
    for (const table of tables) {
      if (!this.allowedTables.includes(table)) {
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
  getAllowedTables(): string[] {
    return [...this.allowedTables];
  }
}
