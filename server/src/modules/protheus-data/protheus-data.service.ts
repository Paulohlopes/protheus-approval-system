import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Sx3Service } from '../sx3/sx3.service';
import { SearchFieldDto, ProtheusRecordDto, SearchResultDto } from './dto/search-records.dto';

@Injectable()
export class ProtheusDataService {
  private readonly logger = new Logger(ProtheusDataService.name);

  // Mapeamento de tabelas Protheus para suas colunas de chave primária
  private readonly tableKeyFields: Record<string, string[]> = {
    SB1: ['B1_FILIAL', 'B1_COD'],           // Produtos
    SA1: ['A1_FILIAL', 'A1_COD', 'A1_LOJA'], // Clientes
    SA2: ['A2_FILIAL', 'A2_COD', 'A2_LOJA'], // Fornecedores
    DA0: ['DA0_FILIAL', 'DA0_CODTAB'],       // Tabela de Preços (header)
    DA1: ['DA1_FILIAL', 'DA1_CODTAB'],       // Tabela de Preços (itens)
  };

  // Campos de descrição para exibição na busca
  private readonly tableDescFields: Record<string, string> = {
    SB1: 'B1_DESC',
    SA1: 'A1_NOME',
    SA2: 'A2_NOME',
    DA0: 'DA0_DESCRI',
    DA1: 'DA1_CODPRO',
  };

  constructor(
    @InjectDataSource('protheusConnection')
    private dataSource: DataSource,
    private sx3Service: Sx3Service,
  ) {}

  /**
   * Buscar registros com filtros dinâmicos
   */
  async searchRecords(
    tableName: string,
    filters: Record<string, string> = {},
    limit: number = 50,
    offset: number = 0,
  ): Promise<SearchResultDto> {
    this.logger.log(`Searching records in ${tableName} with filters: ${JSON.stringify(filters)}`);

    // Validar tabela
    const validTables = Object.keys(this.tableKeyFields);
    if (!validTables.includes(tableName.toUpperCase())) {
      throw new BadRequestException(`Table ${tableName} is not supported for search. Valid tables: ${validTables.join(', ')}`);
    }

    const tableNameUpper = tableName.toUpperCase();

    // Obter estrutura da tabela do SX3
    const tableStructure = await this.sx3Service.getTableStructure(tableNameUpper);
    const validFieldNames = tableStructure.fields.map(f => f.fieldName);

    // Construir query com filtros seguros
    const whereConditions: string[] = ["D_E_L_E_T_ = ''"];
    const parameters: any[] = [];
    let paramIndex = 0;

    for (const [fieldName, value] of Object.entries(filters)) {
      if (!value || value.trim() === '') continue;

      // Validar que o campo existe na tabela
      if (!validFieldNames.includes(fieldName)) {
        this.logger.warn(`Field ${fieldName} not found in table ${tableNameUpper}, skipping`);
        continue;
      }

      // Usar LIKE para busca parcial (case-insensitive no SQL Server)
      whereConditions.push(`${fieldName} LIKE @${paramIndex}`);
      parameters.push({ name: String(paramIndex), value: `%${value.trim()}%` });
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Query para contar total
    const countQuery = `SELECT COUNT(*) as total FROM ${tableNameUpper}010 WHERE ${whereClause}`;

    // Query para buscar registros
    const selectQuery = `
      SELECT TOP ${limit} *
      FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY R_E_C_N_O_) as row_num
        FROM ${tableNameUpper}010
        WHERE ${whereClause}
      ) as numbered
      WHERE row_num > ${offset}
      ORDER BY row_num
    `;

    try {
      // Executar queries
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        // Set parameters
        let countQueryWithParams = countQuery;
        let selectQueryWithParams = selectQuery;

        for (const param of parameters) {
          const placeholder = `@${param.name}`;
          const value = `'${param.value.replace(/'/g, "''")}'`; // Escape single quotes
          countQueryWithParams = countQueryWithParams.replace(placeholder, value);
          selectQueryWithParams = selectQueryWithParams.replace(placeholder, value);
        }

        const [countResult] = await queryRunner.query(countQueryWithParams);
        const total = parseInt(countResult?.total || '0', 10);

        const records = await queryRunner.query(selectQueryWithParams);

        // Mapear resultados
        const mappedRecords: ProtheusRecordDto[] = records.map((record: any) => ({
          recno: String(record.R_E_C_N_O_),
          data: this.cleanRecordData(record),
        }));

        this.logger.log(`Found ${total} records, returning ${mappedRecords.length}`);

        return {
          records: mappedRecords,
          total,
          limit,
          offset,
        };
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(`Error searching records in ${tableNameUpper}: ${error.message}`, error.stack);
      throw new BadRequestException(`Error searching records: ${error.message}`);
    }
  }

  /**
   * Buscar registro específico por RECNO
   */
  async getRecordByRecno(tableName: string, recno: string): Promise<ProtheusRecordDto> {
    this.logger.log(`Getting record from ${tableName} with RECNO: ${recno}`);

    const validTables = Object.keys(this.tableKeyFields);
    const tableNameUpper = tableName.toUpperCase();

    if (!validTables.includes(tableNameUpper)) {
      throw new BadRequestException(`Table ${tableName} is not supported`);
    }

    const query = `
      SELECT *
      FROM ${tableNameUpper}010
      WHERE R_E_C_N_O_ = '${recno.replace(/'/g, "''")}'
      AND D_E_L_E_T_ = ''
    `;

    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        const records = await queryRunner.query(query);

        if (!records || records.length === 0) {
          throw new NotFoundException(`Record with RECNO ${recno} not found in ${tableNameUpper}`);
        }

        const record = records[0];

        return {
          recno: String(record.R_E_C_N_O_),
          data: this.cleanRecordData(record),
        };
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error getting record from ${tableNameUpper}: ${error.message}`, error.stack);
      throw new BadRequestException(`Error getting record: ${error.message}`);
    }
  }

  /**
   * Obter campos disponíveis para busca
   */
  async getSearchableFields(tableName: string): Promise<SearchFieldDto[]> {
    this.logger.log(`Getting searchable fields for ${tableName}`);

    const tableNameUpper = tableName.toUpperCase();

    // Obter estrutura da tabela
    const tableStructure = await this.sx3Service.getTableStructure(tableNameUpper);

    // Retornar campos que fazem sentido para busca (excluir memos, etc.)
    const searchableFields = tableStructure.fields
      .filter(field => ['string', 'number'].includes(field.fieldType))
      .map(field => ({
        fieldName: field.fieldName,
        label: field.label || field.fieldName,
        fieldType: field.fieldType,
        size: field.size,
      }));

    // Colocar campos-chave no início
    const keyFields = this.tableKeyFields[tableNameUpper] || [];
    const descField = this.tableDescFields[tableNameUpper];

    searchableFields.sort((a, b) => {
      const aIsKey = keyFields.includes(a.fieldName);
      const bIsKey = keyFields.includes(b.fieldName);
      const aIsDesc = a.fieldName === descField;
      const bIsDesc = b.fieldName === descField;

      if (aIsKey && !bIsKey) return -1;
      if (!aIsKey && bIsKey) return 1;
      if (aIsDesc && !bIsDesc) return -1;
      if (!aIsDesc && bIsDesc) return 1;
      return 0;
    });

    return searchableFields;
  }

  /**
   * Obter campos-chave de uma tabela
   */
  getKeyFields(tableName: string): string[] {
    return this.tableKeyFields[tableName.toUpperCase()] || [];
  }

  /**
   * Obter campo de descrição de uma tabela
   */
  getDescriptionField(tableName: string): string | undefined {
    return this.tableDescFields[tableName.toUpperCase()];
  }

  /**
   * Limpar dados do registro (remover campos internos, trimmar strings)
   */
  private cleanRecordData(record: any): Record<string, any> {
    const cleaned: Record<string, any> = {};

    for (const [key, value] of Object.entries(record)) {
      // Pular campos internos do SQL Server
      if (key === 'row_num') continue;

      // Trimmar strings
      if (typeof value === 'string') {
        cleaned[key] = value.trim();
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }
}
