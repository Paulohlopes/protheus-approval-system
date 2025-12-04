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
  ParseBoolPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FormTemplateService } from './form-template.service';
import { DataSourceService } from './services/data-source.service';
import { LookupService } from './services/lookup.service';
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
  ) {}

  /**
   * Create new form template from SX3 structure
   */
  @Post()
  create(@Body() dto: CreateFormTemplateDto) {
    return this.formTemplateService.create(dto);
  }

  /**
   * Get all form templates
   */
  @Get()
  findAll(@Query('includeFields', new ParseBoolPipe({ optional: true })) includeFields?: boolean) {
    return this.formTemplateService.findAll(includeFields);
  }

  /**
   * Get form template by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formTemplateService.findOne(id);
  }

  /**
   * Get form template by table name
   */
  @Get('by-table/:tableName')
  findByTableName(@Param('tableName') tableName: string) {
    return this.formTemplateService.findByTableName(tableName);
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

  // ==========================================
  // DATA SOURCE ENDPOINTS
  // ==========================================

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
   * Get list of allowed tables for SQL queries
   */
  @Get('data-sources/allowed-tables')
  getAllowedTables() {
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
  // MULTI-TABLE TEMPLATE ENDPOINTS
  // ==========================================

  /**
   * Create a new multi-table template
   */
  @Post('multi-table')
  createMultiTableTemplate(@Body() dto: CreateMultiTableTemplateDto) {
    return this.formTemplateService.createMultiTableTemplate(dto);
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
    },
  ) {
    console.log('[LookupController] searchLookup called with body:', JSON.stringify(body, null, 2));
    const { config, search = '', page = 0, limit = 20 } = body;

    try {
      const result = await this.lookupService.search(config, search, { page, limit });
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
    },
  ) {
    return this.lookupService.getRecord(body.config, body.value);
  }

  /**
   * Validate a lookup value
   */
  @Post('lookup/validate')
  async validateLookupValue(
    @Body() body: {
      config: LookupConfigDto;
      value: string;
    },
  ) {
    return this.lookupService.validateValue(body.config, body.value);
  }

  /**
   * Get allowed tables for lookup
   */
  @Get('lookup/allowed-tables')
  getLookupAllowedTables() {
    return this.lookupService.getAllowedTables();
  }
}
