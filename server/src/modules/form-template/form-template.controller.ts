import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import { FormTemplateService } from './form-template.service';
import { DataSourceService } from './services/data-source.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { UpdateFormFieldDto } from './dto/update-form-field.dto';
import { ReorderFieldsDto } from './dto/reorder-fields.dto';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';

@Controller('form-templates')
export class FormTemplateController {
  constructor(
    private readonly formTemplateService: FormTemplateService,
    private readonly dataSourceService: DataSourceService,
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
}
