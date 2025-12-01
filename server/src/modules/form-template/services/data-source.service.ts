import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  DataSourceType,
  DataSourceConfigDto,
  DataSourceOptionDto,
} from '../dto/data-source.dto';

@Injectable()
export class DataSourceService {
  private readonly logger = new Logger(DataSourceService.name);

  // Whitelist of allowed tables for SQL queries
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
    'SYS_COMPANY', // Empresas do Sistema
    'SYS_USR', // Usuários do Sistema
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
   * Get options for a field based on data source configuration
   */
  async getOptions(
    dataSourceType: DataSourceType | string,
    dataSourceConfig: DataSourceConfigDto | any,
    filters?: Record<string, string>,
  ): Promise<DataSourceOptionDto[]> {
    this.logger.log(`Getting options for data source type: ${dataSourceType}`);

    switch (dataSourceType) {
      case DataSourceType.FIXED:
      case 'fixed':
        return this.getFixedOptions(dataSourceConfig);

      case DataSourceType.SQL:
      case 'sql':
        return this.executeSqlQuery(dataSourceConfig, filters);

      case DataSourceType.SX5:
      case 'sx5':
        return this.getSx5Options(dataSourceConfig.sx5Table, filters);

      default:
        this.logger.warn(`Unknown data source type: ${dataSourceType}`);
        return [];
    }
  }

  /**
   * Get fixed options from configuration
   */
  private getFixedOptions(config: DataSourceConfigDto): DataSourceOptionDto[] {
    if (!config.fixedOptions || !Array.isArray(config.fixedOptions)) {
      return [];
    }

    return config.fixedOptions.map((opt) => ({
      value: String(opt.value || '').trim(),
      label: String(opt.label || opt.value || '').trim(),
    }));
  }

  /**
   * Execute SQL query to get options
   * IMPORTANT: Strict validation to prevent SQL Injection
   */
  private async executeSqlQuery(
    config: DataSourceConfigDto | any,
    filters?: Record<string, string>,
  ): Promise<DataSourceOptionDto[]> {
    // Validate required fields
    if (!config.sqlQuery) {
      throw new BadRequestException('SQL query is required');
    }

    const valueField = config.valueField || 'value';
    const labelField = config.labelField || 'label';

    // Validate and sanitize query
    const sanitizedQuery = this.validateAndSanitizeQuery(config.sqlQuery);

    // Build final query with filters
    let query = sanitizedQuery;

    // Add filter conditions if provided
    if (filters && Object.keys(filters).length > 0) {
      const filterConditions: string[] = [];

      for (const [field, value] of Object.entries(filters)) {
        // Validate field name (alphanumeric and underscore only)
        if (!/^[a-zA-Z0-9_]+$/.test(field)) {
          this.logger.warn(`Invalid filter field name: ${field}, skipping`);
          continue;
        }

        if (value && value.trim()) {
          // Escape single quotes
          const escapedValue = value.replace(/'/g, "''").trim();
          filterConditions.push(`${field} LIKE '%${escapedValue}%'`);
        }
      }

      if (filterConditions.length > 0) {
        // Add to existing WHERE clause or create new one
        if (query.toUpperCase().includes('WHERE')) {
          query += ` AND ${filterConditions.join(' AND ')}`;
        } else {
          query += ` WHERE ${filterConditions.join(' AND ')}`;
        }
      }
    }

    // Limit results
    if (!query.toUpperCase().includes('TOP')) {
      query = query.replace(/^SELECT/i, 'SELECT TOP 1000');
    }

    this.logger.debug(`Executing SQL query: ${query.substring(0, 200)}...`);

    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        const results = await queryRunner.query(query);

        return results.map((row: any) => ({
          value: String(row[valueField] ?? '').trim(),
          label: String(row[labelField] ?? row[valueField] ?? '').trim(),
        }));
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(`Error executing SQL query: ${error.message}`);
      throw new BadRequestException('Erro ao executar consulta SQL');
    }
  }

  /**
   * Get options from SX5 (generic codes table)
   */
  private async getSx5Options(
    tableCode: string,
    filters?: Record<string, string>,
  ): Promise<DataSourceOptionDto[]> {
    // Validate table code (2 alphanumeric characters)
    if (!tableCode || !/^[a-zA-Z0-9]{2}$/.test(tableCode)) {
      throw new BadRequestException('Código de tabela SX5 inválido');
    }

    let query = `
      SELECT RTRIM(X5_CHAVE) as value, RTRIM(X5_DESCRI) as label
      FROM SX5010
      WHERE X5_TABELA = '${tableCode.toUpperCase()}'
      AND D_E_L_E_T_ = ''
    `;

    // Add search filter if provided
    if (filters?.search && filters.search.trim()) {
      const escapedSearch = filters.search.replace(/'/g, "''").trim();
      query += ` AND (X5_CHAVE LIKE '%${escapedSearch}%' OR X5_DESCRI LIKE '%${escapedSearch}%')`;
    }

    query += ' ORDER BY X5_CHAVE';

    this.logger.debug(`Getting SX5 options for table: ${tableCode}`);

    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        const results = await queryRunner.query(query);

        return results.map((row: any) => ({
          value: String(row.value || '').trim(),
          label: String(row.label || '').trim(),
        }));
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(`Error getting SX5 options: ${error.message}`);
      throw new BadRequestException('Erro ao buscar opções da tabela SX5');
    }
  }

  /**
   * Validate value using SQL query
   */
  async validateWithSql(
    query: string,
    value: string,
  ): Promise<{ valid: boolean; message?: string }> {
    // Validate query
    this.validateAndSanitizeQuery(query);

    // Replace placeholder with escaped value
    const escapedValue = value.replace(/'/g, "''").trim();
    const finalQuery = query.replace(/:value/g, `'${escapedValue}'`);

    this.logger.debug(`Validating with SQL: ${finalQuery.substring(0, 200)}...`);

    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        const [result] = await queryRunner.query(finalQuery);

        // Query should return COUNT > 0 for valid
        const count = Object.values(result)[0];
        const isValid = Number(count) > 0;

        return {
          valid: isValid,
          message: isValid ? undefined : 'Valor não encontrado',
        };
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(`Error validating with SQL: ${error.message}`);
      return { valid: false, message: 'Erro ao validar valor' };
    }
  }

  /**
   * Validate and sanitize SQL query for security
   */
  private validateAndSanitizeQuery(query: string): string {
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
      // Use word boundary to avoid false positives
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

    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      /--/, // SQL comments
      /\/\*/, // Multi-line comments
      /;/, // Multiple statements
      /\bUNION\b/i, // Union injection (be careful with this)
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        this.logger.warn(`Dangerous pattern detected in query`);
        throw new BadRequestException('Query SQL contém padrões não permitidos');
      }
    }

    return query.trim();
  }

  /**
   * Get list of allowed tables for reference
   */
  getAllowedTables(): string[] {
    return [...this.allowedTables];
  }

  /**
   * Get list of available SX5 tables
   */
  async getAvailableSx5Tables(): Promise<DataSourceOptionDto[]> {
    const query = `
      SELECT DISTINCT X5_TABELA as value,
        (SELECT TOP 1 X5_DESCRI FROM SX5010 s2 WHERE s2.X5_TABELA = s1.X5_TABELA AND D_E_L_E_T_ = '') as label
      FROM SX5010 s1
      WHERE D_E_L_E_T_ = ''
      ORDER BY X5_TABELA
    `;

    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        const results = await queryRunner.query(query);

        return results.map((row: any) => ({
          value: String(row.value || '').trim(),
          label: `${row.value} - ${String(row.label || '').trim().substring(0, 50)}`,
        }));
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(`Error getting SX5 tables: ${error.message}`);
      return [];
    }
  }
}
