import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  ParseBoolPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FormTemplateService } from './form-template.service';
import { DataSourceService } from './services/data-source.service';
import { LookupService } from './services/lookup.service';
import { AllowedTablesService } from './services/allowed-tables.service';
import { TemplateExportService, TemplateExportDto, ImportOptions } from './services/template-export.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { UpdateFormFieldDto } from './dto/update-form-field.dto';
import { ReorderFieldsDto } from './dto/reorder-fields.dto';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import {
  CreateTemplateTableDto,
  UpdateTemplateTableDto,
  CreateMultiTableTemplateDto,
} from './dto/template-table.dto';
import { LookupConfigDto } from './dto/lookup-config.dto';

@Controller('form-templates')
export class FormTemplateController {
  constructor(
    private readonly formTemplateService: FormTemplateService,
    private readonly dataSourceService: DataSourceService,
    private readonly lookupService: LookupService,
    private readonly allowedTablesService: AllowedTablesService,
    private readonly templateExportService: TemplateExportService,
  ) {}

  // ==========================================
  // STATIC ROUTES (must come BEFORE :id routes)
  // ==========================================

  // ==========================================
  // ALLOWED TABLES MANAGEMENT ENDPOINTS
  // ==========================================

  /**
   * Get all allowed tables with details
   */
  @Get('allowed-tables')
  async getAllAllowedTables() {
    return this.allowedTablesService.findAll();
  }

  /**
   * Get active allowed tables only
   */
  @Get('allowed-tables/active')
  async getActiveAllowedTables() {
    return this.allowedTablesService.findActive();
  }

  /**
   * Get a single allowed table by ID
   */
  @Get('allowed-tables/:id')
  async getAllowedTable(@Param('id') id: string) {
    return this.allowedTablesService.findOne(id);
  }

  /**
   * Create a new allowed table
   */
  @Post('allowed-tables')
  async createAllowedTable(
    @Body() body: { tableName: string; description?: string; isActive?: boolean },
  ) {
    return this.allowedTablesService.create(body);
  }

  /**
   * Update an allowed table
   */
  @Put('allowed-tables/:id')
  async updateAllowedTable(
    @Param('id') id: string,
    @Body() body: { tableName?: string; description?: string; isActive?: boolean },
  ) {
    return this.allowedTablesService.update(id, body);
  }

  /**
   * Toggle allowed table active status
   */
  @Patch('allowed-tables/:id/toggle')
  async toggleAllowedTable(@Param('id') id: string) {
    return this.allowedTablesService.toggleActive(id);
  }

  /**
   * Delete an allowed table
   */
  @Delete('allowed-tables/:id')
  async deleteAllowedTable(@Param('id') id: string) {
    return this.allowedTablesService.remove(id);
  }

  // ==========================================
  // LOOKUP ENDPOINTS
  // ==========================================

  /**
   * Search records for lookup modal
   */
  @Post('lookup/search')
  async searchLookup(
    @Body() body: {
      config: LookupConfigDto;
      search?: string;
      page?: number;
      limit?: number;
      countryId?: string;
    },
    @Headers('x-country-id') headerCountryId?: string,
  ) {
    console.log('[LookupController] searchLookup called with body:', JSON.stringify(body, null, 2));
    const { config, search = '', page = 0, limit = 20, countryId } = body;

    // Use countryId from body or header
    const resolvedCountryId = countryId || headerCountryId;

    try {
      const result = await this.lookupService.search(config, search, { page, limit }, resolvedCountryId);
      console.log('[LookupController] searchLookup success, returning', result.data?.length, 'records');
      return result;
    } catch (error) {
      console.error('[LookupController] searchLookup error:', error);
      throw error;
    }
  }

  /**
   * Get a single record for lookup display
   */
  @Post('lookup/record')
  async getLookupRecord(
    @Body() body: {
      config: LookupConfigDto;
      value: string;
      countryId?: string;
    },
    @Headers('x-country-id') headerCountryId?: string,
  ) {
    const resolvedCountryId = body.countryId || headerCountryId;
    return this.lookupService.getRecord(body.config, body.value, resolvedCountryId);
  }

  /**
   * Validate a lookup value
   */
  @Post('lookup/validate')
  async validateLookupValue(
    @Body() body: {
      config: LookupConfigDto;
      value: string;
      countryId?: string;
    },
    @Headers('x-country-id') headerCountryId?: string,
  ) {
    const resolvedCountryId = body.countryId || headerCountryId;
    return this.lookupService.validateValue(body.config, body.value, resolvedCountryId);
  }

  /**
   * Get allowed tables for lookup (names only)
   */
  @Get('lookup/allowed-tables')
  async getLookupAllowedTables() {
    return this.lookupService.getAllowedTables();
  }

  // ==========================================
  // DATA SOURCE ENDPOINTS
  // ==========================================

  /**
   * Get list of allowed tables for SQL queries
   */
  @Get('data-sources/allowed-tables')
  getAllowedTablesForDataSources() {
    return this.dataSourceService.getAllowedTables();
  }

  /**
   * Get available SX5 tables for selection
   */
  @Get('data-sources/sx5-tables')
  getAvailableSx5Tables() {
    return this.dataSourceService.getAvailableSx5Tables();
  }

  // ==========================================
  // TEMPLATE EXPORT/IMPORT ENDPOINTS
  // ==========================================

  /**
   * Validate import data before importing
   */
  @Post('import/validate')
  validateImport(@Body() data: TemplateExportDto) {
    return this.templateExportService.validateImport(data);
  }

  /**
   * Import a template from JSON
   */
  @Post('import')
  importTemplate(
    @Body() data: TemplateExportDto,
    @Query('overwriteExisting', new ParseBoolPipe({ optional: true })) overwriteExisting?: boolean,
    @Query('countryId') countryId?: string,
  ) {
    const options: ImportOptions = {
      overwriteExisting: overwriteExisting ?? false,
      countryId,
    };
    return this.templateExportService.importTemplate(data, options);
  }

  // ==========================================
  // MULTI-TABLE TEMPLATE ENDPOINTS
  // ==========================================

  /**
   * Create a new multi-table template
   */
  @Post('multi-table')
  createMultiTableTemplate(@Body() dto: CreateMultiTableTemplateDto) {
    return this.formTemplateService.createMultiTableTemplate(dto);
  }

  // ==========================================
  // TEMPLATE BY TABLE NAME
  // ==========================================

  /**
   * Get form template by table name
   */
  @Get('by-table/:tableName')
  findByTableName(@Param('tableName') tableName: string) {
    return this.formTemplateService.findByTableName(tableName);
  }

  // ==========================================
  // BASE TEMPLATE ROUTES (no params)
  // ==========================================

  /**
   * Create new form template from SX3 structure
   */
  @Post()
  create(
    @Body() dto: CreateFormTemplateDto,
    @Headers('x-country-id') countryIdHeader?: string,
  ) {
    // Use country from header if not in body
    if (!dto.countryId && countryIdHeader) {
      dto.countryId = countryIdHeader;
    }
    return this.formTemplateService.create(dto);
  }

  /**
   * Get all form templates
   */
  @Get()
  findAll(@Query('includeFields', new ParseBoolPipe({ optional: true })) includeFields?: boolean) {
    return this.formTemplateService.findAll(includeFields);
  }

  // ==========================================
  // TEMPLATE ROUTES WITH :id (must come LAST)
  // ==========================================

  /**
   * Get form template by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formTemplateService.findOne(id);
  }

  /**
   * Export form template as JSON
   */
  @Get(':id/export')
  exportTemplate(@Param('id') id: string) {
    return this.templateExportService.exportTemplate(id);
  }

  /**
   * Update form template
   */
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFormTemplateDto) {
    return this.formTemplateService.update(id, dto);
  }

  /**
   * Delete form template
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formTemplateService.remove(id);
  }

  /**
   * Update a specific field in the template
   */
  @Put(':id/fields/:fieldId')
  updateField(
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateFormFieldDto,
  ) {
    return this.formTemplateService.updateField(id, fieldId, dto);
  }

  /**
   * Reorder fields in the template
   */
  @Post(':id/reorder')
  reorderFields(@Param('id') id: string, @Body() dto: ReorderFieldsDto) {
    return this.formTemplateService.reorderFields(id, dto);
  }

  /**
   * Get visible fields (for form rendering)
   */
  @Get(':id/visible-fields')
  getVisibleFields(@Param('id') id: string) {
    return this.formTemplateService.getVisibleFields(id);
  }

  /**
   * Sync template with SX3 (refresh field metadata)
   */
  @Post(':id/sync')
  syncWithSx3(@Param('id') id: string) {
    return this.formTemplateService.syncWithSx3(id);
  }

  /**
   * Create a custom field in the template
   */
  @Post(':id/custom-fields')
  createCustomField(
    @Param('id') id: string,
    @Body() dto: CreateCustomFieldDto,
  ) {
    return this.formTemplateService.createCustomField(id, dto);
  }

  /**
   * Delete a field from the template
   */
  @Delete(':id/fields/:fieldId')
  deleteField(
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
  ) {
    return this.formTemplateService.deleteField(id, fieldId);
  }

  /**
   * Get options for a field's data source
   */
  @Get(':id/fields/:fieldId/options')
  async getFieldOptions(
    @Param('id') templateId: string,
    @Param('fieldId') fieldId: string,
    @Query() filters: Record<string, string>,
  ) {
    return this.formTemplateService.getFieldOptions(templateId, fieldId, filters);
  }

  /**
   * Validate a field value using SQL validation
   */
  @Post(':id/fields/:fieldId/validate')
  async validateFieldValue(
    @Param('id') templateId: string,
    @Param('fieldId') fieldId: string,
    @Body() body: { value: string },
  ) {
    return this.formTemplateService.validateFieldValue(templateId, fieldId, body.value);
  }

  /**
   * Add a table to an existing template
   */
  @Post(':id/tables')
  addTableToTemplate(
    @Param('id') id: string,
    @Body() dto: CreateTemplateTableDto,
  ) {
    return this.formTemplateService.addTableToTemplate(id, dto);
  }

  /**
   * Update a template table
   */
  @Patch(':id/tables/:tableId')
  updateTemplateTable(
    @Param('id') id: string,
    @Param('tableId') tableId: string,
    @Body() dto: UpdateTemplateTableDto,
  ) {
    return this.formTemplateService.updateTemplateTable(id, tableId, dto);
  }

  /**
   * Remove a table from template
   */
  @Delete(':id/tables/:tableId')
  removeTableFromTemplate(
    @Param('id') id: string,
    @Param('tableId') tableId: string,
  ) {
    return this.formTemplateService.removeTableFromTemplate(id, tableId);
  }

  /**
   * Sync a specific table with SX3
   */
  @Post(':id/tables/:tableId/sync')
  syncTableWithSx3(
    @Param('id') id: string,
    @Param('tableId') tableId: string,
  ) {
    return this.formTemplateService.syncTableWithSx3(id, tableId);
  }

  /**
   * Get fields for a specific table
   */
  @Get(':id/tables/:tableId/fields')
  getTableFields(
    @Param('id') id: string,
    @Param('tableId') tableId: string,
  ) {
    return this.formTemplateService.getTableFields(id, tableId);
  }
}
