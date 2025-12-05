import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

// ==========================================
// EXPORT DTOs
// ==========================================

export interface TemplateExportField {
  fieldName: string;
  sx3FieldName?: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
  isVisible: boolean;
  isEnabled: boolean;
  isCustomField: boolean;
  isSyncField: boolean;
  fieldOrder: number;
  fieldGroup?: string;
  tableAlias?: string; // Reference to TemplateTable.alias for multi-table
  labelPtBR?: string;
  labelEn?: string;
  labelEs?: string;
  descriptionPtBR?: string;
  descriptionEn?: string;
  descriptionEs?: string;
  dataSourceType?: string;
  dataSourceConfig?: any;
  lookupConfig?: any;
  validationRules?: any;
  attachmentConfig?: any;
  metadata?: any;
  placeholder?: string;
  helpText?: string;
}

export interface TemplateExportTable {
  tableName: string;
  alias: string;
  label: string;
  tableOrder: number;
  relationType?: string;
  parentTableAlias?: string; // Reference to parent table by alias
  foreignKeyConfig?: any;
  isActive: boolean;
  metadata?: any;
}

export interface TemplateExportData {
  tableName?: string;
  label: string;
  description?: string;
  isActive: boolean;
  isMultiTable: boolean;
  countryCode?: string; // Country code instead of ID for portability
  metadata?: any;
  // Bulk import settings
  allowBulkImport?: boolean;
  bulkKeyFields?: string[];
}

export interface TemplateExportDto {
  exportVersion: string;
  exportDate: string;
  exportedBy?: string;
  template: TemplateExportData;
  tables: TemplateExportTable[];
  fields: TemplateExportField[];
}

// ==========================================
// IMPORT DTOs
// ==========================================

export interface ImportOptions {
  overwriteExisting?: boolean;
  countryId?: string;
}

export interface ValidationWarning {
  type: 'info' | 'warning' | 'error';
  message: string;
  field?: string;
}

export interface ValidationResult {
  valid: boolean;
  warnings: ValidationWarning[];
  templateExists: boolean;
  existingTemplateId?: string;
}

// ==========================================
// SERVICE
// ==========================================

@Injectable()
export class TemplateExportService {
  private readonly logger = new Logger(TemplateExportService.name);
  private readonly EXPORT_VERSION = '1.0';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Export a template as JSON
   */
  async exportTemplate(templateId: string, userEmail?: string): Promise<TemplateExportDto> {
    this.logger.log(`Exporting template ${templateId}`);

    // Fetch template with all relations
    const template = await this.prisma.formTemplate.findUnique({
      where: { id: templateId },
      include: {
        country: {
          select: { code: true },
        },
        tables: {
          orderBy: { tableOrder: 'asc' },
          include: {
            fields: { orderBy: { fieldOrder: 'asc' } },
            parentTable: { select: { alias: true } },
          },
        },
        fields: {
          orderBy: { fieldOrder: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    // Build export data
    const exportData: TemplateExportDto = {
      exportVersion: this.EXPORT_VERSION,
      exportDate: new Date().toISOString(),
      exportedBy: userEmail,
      template: {
        tableName: template.tableName || undefined,
        label: template.label,
        description: template.description || undefined,
        isActive: template.isActive,
        isMultiTable: template.isMultiTable,
        countryCode: template.country?.code || undefined,
        metadata: template.metadata || undefined,
        // Bulk import settings
        allowBulkImport: template.allowBulkImport || false,
        bulkKeyFields: template.bulkKeyFields || [],
      },
      tables: [],
      fields: [],
    };

    // Export tables (for multi-table templates)
    if (template.isMultiTable && template.tables) {
      exportData.tables = template.tables.map((table) => ({
        tableName: table.tableName,
        alias: table.alias,
        label: table.label,
        tableOrder: table.tableOrder,
        relationType: table.relationType || undefined,
        parentTableAlias: table.parentTable?.alias || undefined,
        foreignKeyConfig: table.foreignKeyConfig || undefined,
        isActive: table.isActive,
        metadata: table.metadata || undefined,
      }));

      // Export fields from tables
      for (const table of template.tables) {
        if (table.fields) {
          for (const field of table.fields) {
            exportData.fields.push(this.mapFieldToExport(field, table.alias));
          }
        }
      }
    }

    // Export direct template fields (for single-table or legacy templates)
    if (template.fields) {
      for (const field of template.fields) {
        // Avoid duplicates if field is already in a table
        if (!field.tableId) {
          exportData.fields.push(this.mapFieldToExport(field));
        }
      }
    }

    this.logger.log(`Exported template with ${exportData.fields.length} fields and ${exportData.tables.length} tables`);
    return exportData;
  }

  /**
   * Validate import data before importing
   */
  async validateImport(data: TemplateExportDto): Promise<ValidationResult> {
    const warnings: ValidationWarning[] = [];
    let valid = true;

    // Check export version
    if (!data.exportVersion) {
      warnings.push({ type: 'error', message: 'Missing exportVersion field' });
      valid = false;
    } else if (data.exportVersion !== this.EXPORT_VERSION) {
      warnings.push({
        type: 'warning',
        message: `Export version ${data.exportVersion} differs from current version ${this.EXPORT_VERSION}`,
      });
    }

    // Check template data
    if (!data.template) {
      warnings.push({ type: 'error', message: 'Missing template data' });
      valid = false;
    } else if (!data.template.label) {
      warnings.push({ type: 'error', message: 'Template label is required' });
      valid = false;
    }

    // Check if template already exists
    let templateExists = false;
    let existingTemplateId: string | undefined;

    if (data.template?.tableName) {
      const existing = await this.prisma.formTemplate.findUnique({
        where: { tableName: data.template.tableName },
        select: { id: true },
      });
      if (existing) {
        templateExists = true;
        existingTemplateId = existing.id;
        warnings.push({
          type: 'warning',
          message: `Template for table ${data.template.tableName} already exists`,
        });
      }
    }

    // Check fields
    if (!data.fields || data.fields.length === 0) {
      warnings.push({ type: 'warning', message: 'No fields found in export' });
    }

    // Check for SQL data sources (may need adjustment)
    const sqlFields = data.fields?.filter((f) => f.dataSourceType === 'sql') || [];
    if (sqlFields.length > 0) {
      warnings.push({
        type: 'info',
        message: `${sqlFields.length} field(s) have SQL data sources that may need adjustment after import`,
      });
    }

    // Check for SQL lookups
    const lookupFields = data.fields?.filter((f) => f.lookupConfig?.sqlQuery) || [];
    if (lookupFields.length > 0) {
      warnings.push({
        type: 'info',
        message: `${lookupFields.length} field(s) have lookup SQL queries that may need adjustment after import`,
      });
    }

    // Check country
    if (data.template?.countryCode) {
      const country = await this.prisma.country.findFirst({
        where: { code: data.template.countryCode, isActive: true },
      });
      if (!country) {
        warnings.push({
          type: 'warning',
          message: `Country ${data.template.countryCode} not found. Template will use selected country.`,
        });
      }
    }

    return {
      valid,
      warnings,
      templateExists,
      existingTemplateId,
    };
  }

  /**
   * Import a template from JSON
   */
  async importTemplate(data: TemplateExportDto, options?: ImportOptions): Promise<any> {
    this.logger.log(`Importing template: ${data.template.label}`);

    // Validate first
    const validation = await this.validateImport(data);
    if (!validation.valid) {
      throw new BadRequestException(`Invalid import data: ${validation.warnings.map((w) => w.message).join(', ')}`);
    }

    // Check if we need to overwrite
    if (validation.templateExists && !options?.overwriteExisting) {
      throw new BadRequestException(
        `Template for table ${data.template.tableName} already exists. Set overwriteExisting to true to replace it.`,
      );
    }

    // Resolve country
    let countryId: string | null = null;
    if (options?.countryId) {
      countryId = options.countryId;
    } else if (data.template.countryCode) {
      const country = await this.prisma.country.findFirst({
        where: { code: data.template.countryCode, isActive: true },
      });
      countryId = country?.id || null;
    }

    // Delete existing template if overwriting
    if (validation.templateExists && validation.existingTemplateId && options?.overwriteExisting) {
      this.logger.log(`Deleting existing template ${validation.existingTemplateId}`);
      await this.prisma.formTemplate.delete({
        where: { id: validation.existingTemplateId },
      });
    }

    // Create template in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create template
      const template = await tx.formTemplate.create({
        data: {
          tableName: data.template.tableName || null,
          label: data.template.label,
          description: data.template.description || null,
          isActive: data.template.isActive,
          isMultiTable: data.template.isMultiTable,
          countryId,
          metadata: data.template.metadata || null,
          // Bulk import settings
          allowBulkImport: data.template.allowBulkImport || false,
          bulkKeyFields: data.template.bulkKeyFields || [],
        },
      });

      // Create alias -> tableId map for field references
      const tableAliasMap = new Map<string, string>();

      // Create tables (for multi-table templates)
      if (data.template.isMultiTable && data.tables.length > 0) {
        // Sort tables to create parents first
        const sortedTables = [...data.tables].sort((a, b) => {
          if (!a.parentTableAlias && b.parentTableAlias) return -1;
          if (a.parentTableAlias && !b.parentTableAlias) return 1;
          return a.tableOrder - b.tableOrder;
        });

        for (const tableData of sortedTables) {
          const parentTableId = tableData.parentTableAlias
            ? tableAliasMap.get(tableData.parentTableAlias)
            : null;

          const table = await tx.templateTable.create({
            data: {
              templateId: template.id,
              tableName: tableData.tableName,
              alias: tableData.alias,
              label: tableData.label,
              tableOrder: tableData.tableOrder,
              relationType: tableData.relationType || null,
              parentTableId,
              foreignKeyConfig: tableData.foreignKeyConfig || null,
              isActive: tableData.isActive,
              metadata: tableData.metadata || null,
            },
          });

          tableAliasMap.set(tableData.alias, table.id);
        }
      }

      // Create fields
      for (const fieldData of data.fields) {
        const tableId = fieldData.tableAlias
          ? tableAliasMap.get(fieldData.tableAlias)
          : null;

        await tx.formField.create({
          data: {
            templateId: template.id,
            tableId,
            fieldName: fieldData.fieldName,
            sx3FieldName: fieldData.sx3FieldName || null,
            label: fieldData.label,
            fieldType: fieldData.fieldType,
            isRequired: fieldData.isRequired,
            isVisible: fieldData.isVisible,
            isEnabled: fieldData.isEnabled,
            isCustomField: fieldData.isCustomField,
            isSyncField: fieldData.isSyncField,
            fieldOrder: fieldData.fieldOrder,
            fieldGroup: fieldData.fieldGroup || null,
            labelPtBR: fieldData.labelPtBR || null,
            labelEn: fieldData.labelEn || null,
            labelEs: fieldData.labelEs || null,
            descriptionPtBR: fieldData.descriptionPtBR || null,
            descriptionEn: fieldData.descriptionEn || null,
            descriptionEs: fieldData.descriptionEs || null,
            dataSourceType: fieldData.dataSourceType || null,
            dataSourceConfig: fieldData.dataSourceConfig || null,
            lookupConfig: fieldData.lookupConfig || null,
            validationRules: fieldData.validationRules || null,
            attachmentConfig: fieldData.attachmentConfig || null,
            metadata: fieldData.metadata || null,
            placeholder: fieldData.placeholder || null,
            helpText: fieldData.helpText || null,
          },
        });
      }

      return template;
    });

    this.logger.log(`Imported template ${result.id} with ${data.fields.length} fields`);

    // Return full template with relations
    return this.prisma.formTemplate.findUnique({
      where: { id: result.id },
      include: {
        fields: { orderBy: { fieldOrder: 'asc' } },
        tables: {
          orderBy: { tableOrder: 'asc' },
          include: {
            fields: { orderBy: { fieldOrder: 'asc' } },
          },
        },
        country: { select: { id: true, code: true, name: true } },
      },
    });
  }

  /**
   * Map a field to export format
   */
  private mapFieldToExport(field: any, tableAlias?: string): TemplateExportField {
    return {
      fieldName: field.fieldName,
      sx3FieldName: field.sx3FieldName || undefined,
      label: field.label,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      isVisible: field.isVisible,
      isEnabled: field.isEnabled,
      isCustomField: field.isCustomField,
      isSyncField: field.isSyncField,
      fieldOrder: field.fieldOrder,
      fieldGroup: field.fieldGroup || undefined,
      tableAlias: tableAlias || undefined,
      labelPtBR: field.labelPtBR || undefined,
      labelEn: field.labelEn || undefined,
      labelEs: field.labelEs || undefined,
      descriptionPtBR: field.descriptionPtBR || undefined,
      descriptionEn: field.descriptionEn || undefined,
      descriptionEs: field.descriptionEs || undefined,
      dataSourceType: field.dataSourceType || undefined,
      dataSourceConfig: field.dataSourceConfig || undefined,
      lookupConfig: field.lookupConfig || undefined,
      validationRules: field.validationRules || undefined,
      attachmentConfig: field.attachmentConfig || undefined,
      metadata: field.metadata || undefined,
      placeholder: field.placeholder || undefined,
      helpText: field.helpText || undefined,
    };
  }
}
