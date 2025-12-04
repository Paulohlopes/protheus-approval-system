import { Controller, Get, Param, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ProtheusJwtAuthGuard } from '../auth/guards/protheus-jwt-auth.guard';
import { ProtheusDataService } from './protheus-data.service';
import { SearchRecordsDto, SearchResultDto, SearchFieldDto, ProtheusRecordDto } from './dto/search-records.dto';

@ApiTags('Protheus Data')
@ApiBearerAuth('JWT-auth')
@UseGuards(ProtheusJwtAuthGuard)
@Controller('protheus-data')
export class ProtheusDataController {
  constructor(private readonly protheusDataService: ProtheusDataService) {}

  @Get(':tableName/search')
  @ApiOperation({
    summary: 'Buscar registros no Protheus',
    description: 'Busca registros em uma tabela do Protheus com filtros dinâmicos',
  })
  @ApiHeader({ name: 'x-country-id', required: false, description: 'ID do país para busca' })
  @ApiParam({ name: 'tableName', description: 'Nome da tabela (ex: SB1, SA1, SA2)' })
  @ApiQuery({ name: 'filters', required: false, description: 'Filtros no formato JSON' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de registros (max 500)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset para paginação' })
  @ApiResponse({ status: 200, description: 'Registros encontrados', type: SearchResultDto })
  @ApiResponse({ status: 400, description: 'Tabela não suportada ou erro na busca' })
  async searchRecords(
    @Param('tableName') tableName: string,
    @Headers('x-country-id') countryId?: string,
    @Query('filters') filtersJson?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<SearchResultDto> {
    // Parse filters from JSON string
    let filters: Record<string, string> = {};
    if (filtersJson) {
      try {
        filters = JSON.parse(filtersJson);
      } catch {
        // Se não for JSON válido, tentar como campo único
        filters = {};
      }
    }

    return this.protheusDataService.searchRecords(
      tableName,
      filters,
      limit || 50,
      offset || 0,
      countryId,
    );
  }

  @Get(':tableName/record/:recno')
  @ApiOperation({
    summary: 'Buscar registro por RECNO',
    description: 'Busca um registro específico pelo seu R_E_C_N_O_',
  })
  @ApiHeader({ name: 'x-country-id', required: false, description: 'ID do país para busca' })
  @ApiParam({ name: 'tableName', description: 'Nome da tabela (ex: SB1, SA1, SA2)' })
  @ApiParam({ name: 'recno', description: 'R_E_C_N_O_ do registro' })
  @ApiResponse({ status: 200, description: 'Registro encontrado', type: ProtheusRecordDto })
  @ApiResponse({ status: 404, description: 'Registro não encontrado' })
  async getRecordByRecno(
    @Param('tableName') tableName: string,
    @Param('recno') recno: string,
    @Headers('x-country-id') countryId?: string,
  ): Promise<ProtheusRecordDto> {
    return this.protheusDataService.getRecordByRecno(tableName, recno, countryId);
  }

  @Get(':tableName/searchable-fields')
  @ApiOperation({
    summary: 'Obter campos disponíveis para busca',
    description: 'Retorna a lista de campos que podem ser usados como filtro na busca',
  })
  @ApiHeader({ name: 'x-country-id', required: false, description: 'ID do país para busca' })
  @ApiParam({ name: 'tableName', description: 'Nome da tabela (ex: SB1, SA1, SA2)' })
  @ApiResponse({ status: 200, description: 'Campos disponíveis', type: [SearchFieldDto] })
  async getSearchableFields(
    @Param('tableName') tableName: string,
    @Headers('x-country-id') countryId?: string,
  ): Promise<SearchFieldDto[]> {
    return this.protheusDataService.getSearchableFields(tableName, countryId);
  }

  @Get(':tableName/key-fields')
  @ApiOperation({
    summary: 'Obter campos-chave da tabela',
    description: 'Retorna os campos que compõem a chave primária da tabela',
  })
  @ApiParam({ name: 'tableName', description: 'Nome da tabela (ex: SB1, SA1, SA2)' })
  @ApiResponse({ status: 200, description: 'Campos-chave' })
  getKeyFields(@Param('tableName') tableName: string): { keyFields: string[]; descriptionField?: string } {
    return {
      keyFields: this.protheusDataService.getKeyFields(tableName),
      descriptionField: this.protheusDataService.getDescriptionField(tableName),
    };
  }
}
