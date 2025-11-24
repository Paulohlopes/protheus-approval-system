import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Sx3 } from './entities/sx3.entity';
import { Sx3FieldDto, TableStructureDto } from './dto/sx3-field.dto';

@Injectable()
export class Sx3Service {
  private readonly logger = new Logger(Sx3Service.name);
  private cache: Map<string, Sx3FieldDto[]> = new Map();

  constructor(
    @InjectRepository(Sx3, 'protheusConnection')
    private sx3Repository: Repository<Sx3>,
  ) {}

  /**
   * Get table structure from SX3
   * Results are cached for performance
   */
  async getTableStructure(tableName: string): Promise<TableStructureDto> {
    this.logger.log(`Getting table structure for ${tableName}`);

    // Check cache first
    if (this.cache.has(tableName)) {
      this.logger.debug(`Cache hit for table ${tableName}`);
      return {
        tableName,
        fields: this.cache.get(tableName),
      };
    }

    // Query SX3
    const sx3Records = await this.sx3Repository.find({
      where: {
        x3Arquivo: tableName,
        deleted: In(['', ' ']), // Not deleted
      },
      order: {
        x3Ordem: 'ASC',
      },
    });

    if (sx3Records.length === 0) {
      throw new NotFoundException(`Table ${tableName} not found in SX3`);
    }

    // Map to DTO
    const fields = sx3Records.map((record) => this.mapToDto(record));

    // Cache the result
    this.cache.set(tableName, fields);
    this.logger.log(`Cached structure for table ${tableName} (${fields.length} fields)`);

    return {
      tableName,
      fields,
    };
  }

  /**
   * Get all available tables from SX3
   */
  async getAvailableTables(): Promise<string[]> {
    this.logger.log('Getting available tables from SX3');

    const result = await this.sx3Repository
      .createQueryBuilder('sx3')
      .select('DISTINCT sx3.x3Arquivo', 'tableName')
      .where("sx3.deleted IN ('', ' ')")
      .getRawMany();

    return result.map((r) => r.tableName).sort();
  }

  /**
   * Sync cache - clears all cached data
   * This will force a fresh read from SX3 on next request
   */
  syncCache(): void {
    this.logger.log('Syncing cache - clearing all cached structures');
    this.cache.clear();
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
   * Map SX3 entity to DTO
   */
  private mapToDto(record: Sx3): Sx3FieldDto {
    return {
      fieldName: record.x3Campo?.trim() || '',
      label: record.x3Titulo?.trim() || '',
      description: record.x3Descric?.trim() || '',
      fieldType: this.mapFieldType(record.x3Tipo),
      size: record.x3Tamanho || 0,
      decimals: record.x3Decimal || 0,
      isRequired: record.x3Obrigat?.trim() === 'S',
      mask: record.x3Picture?.trim() || '',
      lookup: record.x3F3?.trim() || '',
      order: record.x3Ordem?.trim() || '',
      validation: record.x3Valid?.trim() || '',
      when: record.x3When?.trim() || '',
      defaultValue: record.x3Relacao?.trim() || '',
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

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedTables: this.cache.size,
      tables: Array.from(this.cache.keys()),
    };
  }
}
