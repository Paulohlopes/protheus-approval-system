import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchRecordsDto {
  @ApiPropertyOptional({
    description: 'Filtros de busca no formato campo: valor',
    example: { B1_COD: 'PROD001', B1_DESC: 'PRODUTO' },
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Número máximo de registros a retornar',
    default: 50,
    minimum: 1,
    maximum: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Offset para paginação',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

export class SearchFieldDto {
  @ApiProperty({ description: 'Nome do campo no Protheus' })
  fieldName: string;

  @ApiProperty({ description: 'Label do campo' })
  label: string;

  @ApiProperty({ description: 'Tipo do campo' })
  fieldType: string;

  @ApiProperty({ description: 'Tamanho máximo' })
  size: number;
}

export class ProtheusRecordDto {
  @ApiProperty({ description: 'R_E_C_N_O_ do registro' })
  recno: string;

  @ApiProperty({ description: 'Dados do registro' })
  data: Record<string, any>;
}

export class SearchResultDto {
  @ApiProperty({ description: 'Registros encontrados', type: [ProtheusRecordDto] })
  records: ProtheusRecordDto[];

  @ApiProperty({ description: 'Total de registros encontrados' })
  total: number;

  @ApiProperty({ description: 'Limit utilizado' })
  limit: number;

  @ApiProperty({ description: 'Offset utilizado' })
  offset: number;
}
