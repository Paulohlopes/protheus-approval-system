import { Controller, Get, Post, Param, Headers, Query } from '@nestjs/common';
import { Sx3Service } from './sx3.service';
import { TableStructureDto } from './dto/sx3-field.dto';

@Controller('sx3')
export class Sx3Controller {
  constructor(private readonly sx3Service: Sx3Service) {}

  /**
   * Get structure of a specific table from SX3
   * @param tableName - Protheus table name (e.g., SB1, SA1, SA2)
   * @param countryId - Optional country ID from header
   */
  @Get('tables/:tableName/fields')
  async getTableStructure(
    @Param('tableName') tableName: string,
    @Headers('x-country-id') countryId?: string,
  ): Promise<TableStructureDto> {
    return this.sx3Service.getTableStructure(tableName.toUpperCase(), countryId);
  }

  /**
   * Get list of all available tables in SX3
   * @param countryId - Optional country ID from header
   */
  @Get('tables')
  async getAvailableTables(
    @Headers('x-country-id') countryId?: string,
  ): Promise<{ tables: string[] }> {
    const tables = await this.sx3Service.getAvailableTables(countryId);
    return { tables };
  }

  /**
   * Sync cache - clears cached structures
   * Forces fresh read from SX3 on next request
   * @param countryId - Optional country ID to sync only that country's cache
   */
  @Post('sync')
  syncCache(
    @Query('countryId') countryId?: string,
  ): { message: string } {
    this.sx3Service.syncCache(countryId);
    return {
      message: countryId
        ? `Cache synced for country ${countryId}`
        : 'All cache synced successfully'
    };
  }

  /**
   * Get cache statistics
   * @param countryId - Optional country ID to get stats for specific country
   */
  @Get('cache/stats')
  getCacheStats(@Query('countryId') countryId?: string) {
    return this.sx3Service.getCacheStats(countryId);
  }
}
