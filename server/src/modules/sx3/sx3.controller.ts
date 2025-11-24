import { Controller, Get, Post, Param } from '@nestjs/common';
import { Sx3Service } from './sx3.service';
import { TableStructureDto } from './dto/sx3-field.dto';

@Controller('sx3')
export class Sx3Controller {
  constructor(private readonly sx3Service: Sx3Service) {}

  /**
   * Get structure of a specific table from SX3
   * @param tableName - Protheus table name (e.g., SB1, SA1, SA2)
   */
  @Get('tables/:tableName/fields')
  async getTableStructure(
    @Param('tableName') tableName: string,
  ): Promise<TableStructureDto> {
    return this.sx3Service.getTableStructure(tableName.toUpperCase());
  }

  /**
   * Get list of all available tables in SX3
   */
  @Get('tables')
  async getAvailableTables(): Promise<{ tables: string[] }> {
    const tables = await this.sx3Service.getAvailableTables();
    return { tables };
  }

  /**
   * Sync cache - clears cached structures
   * Forces fresh read from SX3 on next request
   */
  @Post('sync')
  syncCache(): { message: string } {
    this.sx3Service.syncCache();
    return { message: 'Cache synced successfully' };
  }

  /**
   * Get cache statistics
   */
  @Get('cache/stats')
  getCacheStats() {
    return this.sx3Service.getCacheStats();
  }
}
