import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

// Default tables to seed if database is empty
const DEFAULT_ALLOWED_TABLES = [
  { tableName: 'SA1010', description: 'Clientes' },
  { tableName: 'SA2010', description: 'Fornecedores' },
  { tableName: 'SA3010', description: 'Vendedores' },
  { tableName: 'SB1010', description: 'Produtos' },
  { tableName: 'SB2010', description: 'Saldos em Estoque' },
  { tableName: 'SC5010', description: 'Pedidos de Venda' },
  { tableName: 'SC6010', description: 'Itens de Pedidos' },
  { tableName: 'SC7010', description: 'Pedidos de Compra' },
  { tableName: 'SD1010', description: 'Itens NF Entrada' },
  { tableName: 'SD2010', description: 'Itens NF Saída' },
  { tableName: 'SE1010', description: 'Contas a Receber' },
  { tableName: 'SE2010', description: 'Contas a Pagar' },
  { tableName: 'SF1010', description: 'NF Entrada' },
  { tableName: 'SF2010', description: 'NF Saída' },
  { tableName: 'SX5010', description: 'Tabelas Genéricas' },
  { tableName: 'CTT010', description: 'Centro de Custo' },
  { tableName: 'CTD010', description: 'Plano de Contas' },
  { tableName: 'DA0010', description: 'Tabela de Preços (header)' },
  { tableName: 'DA1010', description: 'Tabela de Preços (itens)' },
  { tableName: 'SG1010', description: 'Estrutura de Produtos' },
  { tableName: 'SM0010', description: 'Cadastro de Empresas' },
  { tableName: 'SYA010', description: 'Países' },
  { tableName: 'CC2010', description: 'Estados' },
  { tableName: 'SYS_COMPANY', description: 'Empresas/Filiais do sistema' },
];

@Injectable()
export class AllowedTablesService {
  private readonly logger = new Logger(AllowedTablesService.name);
  private cachedTables: string[] | null = null;

  constructor(private prisma: PrismaService) {
    // Seed default tables on startup
    this.seedDefaultTables();
  }

  /**
   * Seed default tables if the database is empty
   */
  private async seedDefaultTables() {
    try {
      const count = await this.prisma.allowedLookupTable.count();
      if (count === 0) {
        this.logger.log('Seeding default allowed lookup tables...');
        await this.prisma.allowedLookupTable.createMany({
          data: DEFAULT_ALLOWED_TABLES,
          skipDuplicates: true,
        });
        this.logger.log(`Seeded ${DEFAULT_ALLOWED_TABLES.length} default tables`);
        this.invalidateCache();
      }
    } catch (error) {
      this.logger.warn(`Could not seed default tables: ${error.message}`);
    }
  }

  /**
   * Get all allowed table names (cached for performance)
   */
  async getAllowedTableNames(): Promise<string[]> {
    if (this.cachedTables) {
      return this.cachedTables;
    }

    const tables = await this.prisma.allowedLookupTable.findMany({
      where: { isActive: true },
      select: { tableName: true },
    });

    this.cachedTables = tables.map(t => t.tableName.toUpperCase());
    return this.cachedTables;
  }

  /**
   * Get all allowed tables with details
   */
  async findAll() {
    return this.prisma.allowedLookupTable.findMany({
      orderBy: { tableName: 'asc' },
    });
  }

  /**
   * Get active tables only
   */
  async findActive() {
    return this.prisma.allowedLookupTable.findMany({
      where: { isActive: true },
      orderBy: { tableName: 'asc' },
    });
  }

  /**
   * Get a single table by ID
   */
  async findOne(id: string) {
    const table = await this.prisma.allowedLookupTable.findUnique({
      where: { id },
    });

    if (!table) {
      throw new NotFoundException(`Tabela com ID ${id} não encontrada`);
    }

    return table;
  }

  /**
   * Create a new allowed table
   */
  async create(data: { tableName: string; description?: string; isActive?: boolean }) {
    const normalizedName = data.tableName.toUpperCase().trim();

    // Check if table already exists
    const existing = await this.prisma.allowedLookupTable.findUnique({
      where: { tableName: normalizedName },
    });

    if (existing) {
      throw new ConflictException(`Tabela ${normalizedName} já está cadastrada`);
    }

    const table = await this.prisma.allowedLookupTable.create({
      data: {
        tableName: normalizedName,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    });

    this.invalidateCache();
    this.logger.log(`Created allowed table: ${normalizedName}`);
    return table;
  }

  /**
   * Update an allowed table
   */
  async update(id: string, data: { tableName?: string; description?: string; isActive?: boolean }) {
    await this.findOne(id); // Throws if not found

    const updateData: any = {};

    if (data.tableName !== undefined) {
      updateData.tableName = data.tableName.toUpperCase().trim();
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    const table = await this.prisma.allowedLookupTable.update({
      where: { id },
      data: updateData,
    });

    this.invalidateCache();
    this.logger.log(`Updated allowed table: ${table.tableName}`);
    return table;
  }

  /**
   * Delete an allowed table
   */
  async remove(id: string) {
    const table = await this.findOne(id); // Throws if not found

    await this.prisma.allowedLookupTable.delete({
      where: { id },
    });

    this.invalidateCache();
    this.logger.log(`Deleted allowed table: ${table.tableName}`);
    return { message: `Tabela ${table.tableName} removida com sucesso` };
  }

  /**
   * Toggle table active status
   */
  async toggleActive(id: string) {
    const table = await this.findOne(id);

    const updated = await this.prisma.allowedLookupTable.update({
      where: { id },
      data: { isActive: !table.isActive },
    });

    this.invalidateCache();
    this.logger.log(`Toggled table ${updated.tableName} to ${updated.isActive ? 'active' : 'inactive'}`);
    return updated;
  }

  /**
   * Check if a table is allowed
   */
  async isTableAllowed(tableName: string): Promise<boolean> {
    const allowedTables = await this.getAllowedTableNames();
    return allowedTables.includes(tableName.toUpperCase());
  }

  /**
   * Invalidate the cache
   */
  private invalidateCache() {
    this.cachedTables = null;
  }
}
