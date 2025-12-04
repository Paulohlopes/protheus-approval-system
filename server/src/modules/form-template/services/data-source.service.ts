import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  DataSourceType,
  DataSourceConfigDto,
  DataSourceOptionDto,
  DataSourceResponseDto,
} from '../dto/data-source.dto';
import { ConnectionManagerService } from '../../country/connection-manager.service';
import { CountryService } from '../../country/country.service';
import { AllowedTablesService } from './allowed-tables.service';

@Injectable()
export class DataSourceService {
  private readonly logger = new Logger(DataSourceService.name);

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
   * Get options for a field based on data source configuration
   */
  async getOptions(
    dataSourceType: DataSourceType | string,
    dataSourceConfig: DataSourceConfigDto | any,
    filters?: Record<string, string>,
    countryId?: string,
  ): Promise<DataSourceResponseDto> {
    this.logger.log(`Getting options for data source type: ${dataSourceType}`);

    switch (dataSourceType) {
      case DataSourceType.FIXED:
      case 'fixed':
        return { options: this.getFixedOptions(dataSourceConfig) };

      case DataSourceType.SQL:
      case 'sql':
        return this.executeSqlQuery(dataSourceConfig, filters, countryId);

      case DataSourceType.SX5:
      case 'sx5':
        return { options: await this.getSx5Options(dataSourceConfig.sx5Table, filters, countryId) };

      default:
        this.logger.warn(`Unknown data source type: ${dataSourceType}`);
        return { options: [] };
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
    countryId?: string,
  ): Promise<DataSourceResponseDto> {
    // Validate required fields
    if (!config.sqlQuery) {
      throw new BadRequestException('SQL query is required');
    }

    const resolvedCountryId = await this.resolveCountryId(countryId);
    const country = await this.countryService.findOne(resolvedCountryId);

    const keyField = config.keyField; // Optional: unique field for React keys
    const valueField = config.valueField || 'value';
    const labelField = config.labelField || 'label';

    // Validate and sanitize query
    const sanitizedQuery = await this.validateAndSanitizeQuery(config.sqlQuery);

    // Apply table suffix
    let query = this.applyTableSuffix(sanitizedQuery, country.tableSuffix);

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

    this.logger.debug(`Executing SQL query (country: ${country.code}): ${query.substring(0, 200)}...`);

    try {
      const dataSource = await this.connectionManager.getConnection(resolvedCountryId);
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        const results = await queryRunner.query(query);

        // Track values to detect duplicates
        const valueCount = new Map<string, number>();

        const options = results.map((row: any, index: number) => {
          const value = String(row[valueField] ?? '').trim();
          const label = String(row[labelField] ?? row[valueField] ?? '').trim();

          // Count occurrences of each value
          valueCount.set(value, (valueCount.get(value) || 0) + 1);

          // Generate unique key: always include index to guarantee uniqueness
          // even if keyField has duplicate values
          let key: string;
          if (keyField && row[keyField] !== undefined) {
            key = `${String(row[keyField]).trim()}_${index}`;
          } else {
            key = `${value}_${index}`;
          }

          return { key, value, label };
        });

        // Check for duplicate values
        const duplicates = Array.from(valueCount.entries())
          .filter(([_, count]) => count > 1);

        const response: DataSourceResponseDto = { options };

        if (duplicates.length > 0) {
          const duplicateCount = duplicates.reduce((sum, [_, count]) => sum + count - 1, 0);
          const duplicateValues = duplicates
            .slice(0, 5) // Show only first 5 duplicates
            .map(([val, count]) => `"${val}" (${count}x)`)
            .join(', ');

          response.warning = `Atenção: ${duplicates.length} valor(es) duplicado(s) encontrado(s): ${duplicateValues}${duplicates.length > 5 ? '...' : ''}. Verifique sua query SQL e use DISTINCT ou GROUP BY para evitar duplicatas.`;
          response.duplicateCount = duplicateCount;

          this.logger.warn(`Duplicate values detected in SQL query results: ${duplicateValues}`);
        }

        return response;
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
    countryId?: string,
  ): Promise<DataSourceOptionDto[]> {
    // Validate table code (2 alphanumeric characters)
    if (!tableCode || !/^[a-zA-Z0-9]{2}$/.test(tableCode)) {
      throw new BadRequestException('Código de tabela SX5 inválido');
    }

    const resolvedCountryId = await this.resolveCountryId(countryId);
    const country = await this.countryService.findOne(resolvedCountryId);

    const sx5Table = `SX5${country.tableSuffix}`;

    let query = `
      SELECT RTRIM(X5_CHAVE) as value, RTRIM(X5_DESCRI) as label
      FROM ${sx5Table}
      WHERE X5_TABELA = '${tableCode.toUpperCase()}'
      AND D_E_L_E_T_ = ''
    `;

    // Add search filter if provided
    if (filters?.search && filters.search.trim()) {
      const escapedSearch = filters.search.replace(/'/g, "''").trim();
      query += ` AND (X5_CHAVE LIKE '%${escapedSearch}%' OR X5_DESCRI LIKE '%${escapedSearch}%')`;
    }

    query += ' ORDER BY X5_CHAVE';

    this.logger.debug(`Getting SX5 options for table: ${tableCode} (country: ${country.code})`);

    try {
      const dataSource = await this.connectionManager.getConnection(resolvedCountryId);
      const queryRunner = dataSource.createQueryRunner();
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
    countryId?: string,
  ): Promise<{ valid: boolean; message?: string }> {
    // Validate query
    await this.validateAndSanitizeQuery(query);

    const resolvedCountryId = await this.resolveCountryId(countryId);
    const country = await this.countryService.findOne(resolvedCountryId);

    // Apply table suffix and replace placeholder with escaped value
    let finalQuery = this.applyTableSuffix(query, country.tableSuffix);
    const escapedValue = value.replace(/'/g, "''").trim();
    finalQuery = finalQuery.replace(/:value/g, `'${escapedValue}'`);

    this.logger.debug(`Validating with SQL (country: ${country.code}): ${finalQuery.substring(0, 200)}...`);

    try {
      const dataSource = await this.connectionManager.getConnection(resolvedCountryId);
      const queryRunner = dataSource.createQueryRunner();
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
   */
  private applyTableSuffix(query: string, tableSuffix: string): string {
    // Pattern to match Protheus table names (SA1, SB1, SX5, etc.)
    const tablePattern = /\b(S[A-Z][0-9A-Z])\b/gi;

    return query.replace(tablePattern, (match) => {
      return `${match}${tableSuffix}`;
    });
  }

  /**
   * Validate and sanitize SQL query for security
   */
  private async validateAndSanitizeQuery(query: string): Promise<string> {
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
      const baseTableAllowed = allowedTables.some(
        allowed => allowed.replace(/\d{3}$/, '') === table
      );
      if (!baseTableAllowed) {
        this.logger.warn(`Table ${table} not in whitelist`);
        throw new BadRequestException(`Tabela ${table} não permitida para consulta`);
      }
    }

    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      /--/, // SQL comments
      /\/\*/, // Multi-line comments
      /;/, // Multiple statements
      /\bUNION\b/i, // Union injection
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
  async getAllowedTables(): Promise<string[]> {
    return this.allowedTablesService.getAllowedTableNames();
  }

  /**
   * Get list of available SX5 tables
   * Optimized: Uses GROUP BY instead of correlated subquery
   */
  async getAvailableSx5Tables(countryId?: string): Promise<DataSourceOptionDto[]> {
    const resolvedCountryId = await this.resolveCountryId(countryId);
    const country = await this.countryService.findOne(resolvedCountryId);

    const sx5Table = `SX5${country.tableSuffix}`;

    const query = `
      SELECT X5_TABELA as value, MIN(X5_DESCRI) as label
      FROM ${sx5Table}
      WHERE D_E_L_E_T_ = ''
      GROUP BY X5_TABELA
      ORDER BY X5_TABELA
    `;

    try {
      const dataSource = await this.connectionManager.getConnection(resolvedCountryId);
      const results = await dataSource.query(query);

      return results.map((row: any) => ({
        value: String(row.value || '').trim(),
        label: `${row.value} - ${String(row.label || '').trim().substring(0, 50)}`,
      }));
    } catch (error) {
      this.logger.error(`Error getting SX5 tables: ${error.message}`);
      return [];
    }
  }
}
