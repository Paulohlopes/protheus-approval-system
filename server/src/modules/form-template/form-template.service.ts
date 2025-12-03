import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Sx3Service } from '../sx3/sx3.service';
import { DataSourceService } from './services/data-source.service';
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

@Injectable()
export class FormTemplateService {
  private readonly logger = new Logger(FormTemplateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sx3Service: Sx3Service,
    private readonly dataSourceService: DataSourceService,
  ) {}

  /**
   * Create form template from SX3 structure
   * This will read the table structure from SX3 and create a template with all fields
   * By default, only required fields (X3_OBRIGAT = 'S') are visible
   */
  async create(dto: CreateFormTemplateDto) {
    this.logger.log(`Creating form template for table ${dto.tableName}`);

    // Check if template already exists
    const existing = await this.prisma.formTemplate.findUnique({
      where: { tableName: dto.tableName },
    });

    if (existing) {
      throw new BadRequestException(`Template for table ${dto.tableName} already exists`);
    }

    // Get structure from SX3
    const structure = await this.sx3Service.getTableStructure(dto.tableName);

    // Create template
    const template = await this.prisma.formTemplate.create({
      data: {
        tableName: dto.tableName,
        label: dto.label,
        description: dto.description,
        isActive: dto.isActive ?? true,
        fields: {
          create: structure.fields.map((field, index) => ({
            fieldName: field.fieldName, // Use SX3 field name as fieldName
            sx3FieldName: field.fieldName,
            label: field.label,
            fieldType: field.fieldType,
            isRequired: field.isRequired,
            isVisible: field.isRequired, // Only required fields visible by default
            isEnabled: true,
            isCustomField: false, // SX3 fields are not custom
            isSyncField: true, // SX3 fields are synced to Protheus
            fieldOrder: index,
            fieldGroup: null,
            // Multi-language labels from SX3
            labelPtBR: field.labelPtBR,
            labelEn: field.labelEn,
            labelEs: field.labelEs,
            // Multi-language descriptions from SX3
            descriptionPtBR: field.descriptionPtBR,
            descriptionEn: field.descriptionEn,
            descriptionEs: field.descriptionEs,
            validationRules: null,
            metadata: {
              size: field.size,
              decimals: field.decimals,
              mask: field.mask,
              lookup: field.lookup,
              validation: field.validation,
              when: field.when,
              defaultValue: field.defaultValue,
            },
          })),
        },
      },
      include: {
        fields: {
          orderBy: { fieldOrder: 'asc' },
        },
      },
    });

    this.logger.log(`Created template ${template.id} with ${template.fields.length} fields`);
    return template;
  }

  /**
   * Find all templates
   */
  async findAll(includeFields = false) {
    return this.prisma.formTemplate.findMany({
      include: {
        fields: includeFields ? { orderBy: { fieldOrder: 'asc' } } : false,
        tables: {
          orderBy: { tableOrder: 'asc' },
          include: {
            parentTable: true,
          },
        },
        _count: {
          select: {
            fields: true,
            workflows: true,
            requests: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find template by table name
   */
  async findByTableName(tableName: string) {
    const template = await this.prisma.formTemplate.findUnique({
      where: { tableName },
      include: {
        fields: {
          orderBy: { fieldOrder: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Template for table ${tableName} not found`);
    }

    return template;
  }

  /**
   * Update template
   */
  async update(id: string, dto: UpdateFormTemplateDto) {
    // Update directly - Prisma throws P2025 if not found
    try {
      return await this.prisma.formTemplate.update({
        where: { id },
        data: dto,
        include: {
          fields: {
            orderBy: { fieldOrder: 'asc' },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Template ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Delete template
   */
  async remove(id: string) {
    // Single query to check existence and get counts
    const template = await this.prisma.formTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            workflows: true,
            requests: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    if (template._count.workflows > 0 || template._count.requests > 0) {
      throw new BadRequestException(
        'Cannot delete template with existing workflows or requests',
      );
    }

    return this.prisma.formTemplate.delete({
      where: { id },
    });
  }

  /**
   * Update form field
   */
  async updateField(templateId: string, fieldId: string, dto: UpdateFormFieldDto) {
    // Single query to check field exists and belongs to template
    const field = await this.prisma.formField.findFirst({
      where: { id: fieldId, templateId },
    });

    if (!field) {
      throw new NotFoundException(`Field ${fieldId} not found in template ${templateId}`);
    }

    // Convert DTO to plain object for Prisma (JSON fields need plain objects)
    const updateData: any = { ...dto };
    if (dto.dataSourceConfig) {
      updateData.dataSourceConfig = JSON.parse(JSON.stringify(dto.dataSourceConfig));
    }
    if (dto.validationRules) {
      updateData.validationRules = JSON.parse(JSON.stringify(dto.validationRules));
    }
    if (dto.attachmentConfig) {
      updateData.attachmentConfig = JSON.parse(JSON.stringify(dto.attachmentConfig));
    }

    return this.prisma.formField.update({
      where: { id: fieldId },
      data: updateData,
    });
  }

  /**
   * Reorder fields
   */
  async reorderFields(templateId: string, dto: ReorderFieldsDto) {
    this.logger.log(`Reordering ${dto.fieldIds.length} fields for template ${templateId}`);

    // Update field order in transaction (validates templateId via where clause)
    const updates = dto.fieldIds.map((fieldId, index) =>
      this.prisma.formField.updateMany({
        where: { id: fieldId, templateId },
        data: { fieldOrder: index },
      }),
    );

    await this.prisma.$transaction(updates);

    this.logger.log(`Reordered ${dto.fieldIds.length} fields`);

    // Return updated template with fields
    return this.prisma.formTemplate.findUnique({
      where: { id: templateId },
      include: {
        fields: { orderBy: { fieldOrder: 'asc' } },
        workflows: true,
      },
    });
  }

  /**
   * Get visible fields for form rendering
   */
  async getVisibleFields(templateId: string) {
    const template = await this.findOne(templateId);

    return template.fields.filter((field) => field.isVisible && field.isEnabled);
  }

  /**
   * Sync template with SX3 (update field metadata)
   * This will refresh field metadata from SX3 without changing visibility/order
   */
  async syncWithSx3(templateId: string) {
    this.logger.log(`Syncing template ${templateId} with SX3`);

    const template = await this.findOne(templateId);
    const structure = await this.sx3Service.getTableStructure(template.tableName);

    // Create a map of SX3 fields for quick lookup
    const sx3FieldsMap = new Map(
      structure.fields.map((field) => [field.fieldName, field]),
    );

    // Update existing fields
    const updates = template.fields.map((field) => {
      const sx3Field = sx3FieldsMap.get(field.sx3FieldName);
      if (!sx3Field) return null;

      return this.prisma.formField.update({
        where: { id: field.id },
        data: {
          label: sx3Field.label,
          fieldType: sx3Field.fieldType,
          isRequired: sx3Field.isRequired,
          // Multi-language labels from SX3
          labelPtBR: sx3Field.labelPtBR,
          labelEn: sx3Field.labelEn,
          labelEs: sx3Field.labelEs,
          // Multi-language descriptions from SX3
          descriptionPtBR: sx3Field.descriptionPtBR,
          descriptionEn: sx3Field.descriptionEn,
          descriptionEs: sx3Field.descriptionEs,
          metadata: {
            ...(typeof field.metadata === 'object' && field.metadata !== null ? field.metadata : {}),
            size: sx3Field.size,
            decimals: sx3Field.decimals,
            mask: sx3Field.mask,
            lookup: sx3Field.lookup,
            validation: sx3Field.validation,
            when: sx3Field.when,
            defaultValue: sx3Field.defaultValue,
          },
        },
      });
    });

    await this.prisma.$transaction(updates.filter((u) => u !== null));

    this.logger.log(`Synced template ${templateId} with SX3`);

    return this.findOne(templateId);
  }

  /**
   * Create a custom field in the template
   * Custom fields are not from SX3 and will not be synced to Protheus
   */
  async createCustomField(templateId: string, dto: CreateCustomFieldDto) {
    this.logger.log(`Creating custom field ${dto.fieldName} for template ${templateId}`);

    const template = await this.prisma.formTemplate.findUnique({
      where: { id: templateId },
      include: { fields: true },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    // Check if field name already exists
    const existingField = template.fields.find(
      (f) => f.fieldName === dto.fieldName || f.sx3FieldName === dto.fieldName,
    );

    if (existingField) {
      throw new BadRequestException(`Field with name ${dto.fieldName} already exists`);
    }

    // Get max field order
    const maxOrder = template.fields.reduce(
      (max, f) => Math.max(max, f.fieldOrder),
      -1,
    );

    // Create the custom field with all new options
    await this.prisma.formField.create({
      data: {
        templateId,
        fieldName: dto.fieldName,
        sx3FieldName: null, // Custom fields don't have SX3 field name
        label: dto.label,
        fieldType: dto.fieldType,
        isRequired: dto.isRequired ?? false,
        isVisible: true,
        isEnabled: true,
        isCustomField: true,
        isSyncField: false, // Custom fields are not synced to Protheus
        fieldOrder: maxOrder + 1,
        fieldGroup: dto.fieldGroup || 'Campos Customizados',
        placeholder: dto.placeholder,
        helpText: dto.helpText,
        // New fields for data source
        dataSourceType: dto.dataSourceType,
        dataSourceConfig: dto.dataSourceConfig as any,
        // Validation rules
        validationRules: dto.validationRules as any,
        // Attachment config
        attachmentConfig: dto.attachmentConfig as any,
        // Additional metadata
        metadata: dto.metadata,
      },
    });

    this.logger.log(`Custom field ${dto.fieldName} created for template ${templateId}`);

    return this.findOne(templateId);
  }

  /**
   * Delete a field from the template
   * Only custom fields can be deleted
   */
  async deleteField(templateId: string, fieldId: string) {
    this.logger.log(`Deleting field ${fieldId} from template ${templateId}`);

    const field = await this.prisma.formField.findFirst({
      where: {
        id: fieldId,
        templateId,
      },
    });

    if (!field) {
      throw new NotFoundException(`Field ${fieldId} not found in template ${templateId}`);
    }

    if (!field.isCustomField) {
      throw new BadRequestException('Only custom fields can be deleted. SX3 fields can only be hidden.');
    }

    await this.prisma.formField.delete({
      where: { id: fieldId },
    });

    this.logger.log(`Field ${fieldId} deleted from template ${templateId}`);

    return { success: true };
  }

  // ==========================================
  // DATA SOURCE METHODS
  // ==========================================

  /**
   * Get options for a field's data source
   */
  async getFieldOptions(
    templateId: string,
    fieldId: string,
    filters?: Record<string, string>,
  ) {
    const field = await this.prisma.formField.findFirst({
      where: {
        id: fieldId,
        templateId,
      },
    });

    if (!field) {
      throw new NotFoundException(`Field ${fieldId} not found in template ${templateId}`);
    }

    if (!field.dataSourceType || !field.dataSourceConfig) {
      return [];
    }

    return this.dataSourceService.getOptions(
      field.dataSourceType,
      field.dataSourceConfig as any,
      filters,
    );
  }

  /**
   * Validate a field value using SQL validation
   */
  async validateFieldValue(
    templateId: string,
    fieldId: string,
    value: string,
  ): Promise<{ valid: boolean; message?: string }> {
    const field = await this.prisma.formField.findFirst({
      where: {
        id: fieldId,
        templateId,
      },
    });

    if (!field) {
      throw new NotFoundException(`Field ${fieldId} not found in template ${templateId}`);
    }

    const validationRules = field.validationRules as any;

    if (!validationRules?.sqlValidation?.query) {
      return { valid: true };
    }

    const result = await this.dataSourceService.validateWithSql(
      validationRules.sqlValidation.query,
      value,
    );

    if (!result.valid) {
      return {
        valid: false,
        message: validationRules.sqlValidation.errorMessage || 'Valor inválido',
      };
    }

    return { valid: true };
  }

  // ==========================================
  // MULTI-TABLE TEMPLATE METHODS
  // ==========================================

  /**
   * Create a multi-table template
   * This creates a template with multiple tables linked together
   */
  async createMultiTableTemplate(dto: CreateMultiTableTemplateDto) {
    this.logger.log(`Creating multi-table template: ${dto.label}`);

    // Create template and tables in transaction
    const template = await this.prisma.$transaction(async (tx) => {
      // Create the template
      const newTemplate = await tx.formTemplate.create({
        data: {
          label: dto.label,
          description: dto.description,
          isActive: dto.isActive ?? true,
          isMultiTable: true,
          tableName: null, // Multi-table templates don't have a single tableName
        },
      });

      // If no tables provided, just return the template (user will add tables later)
      if (!dto.tables || dto.tables.length === 0) {
        return newTemplate;
      }

      // Create tables with fields
      for (let i = 0; i < dto.tables.length; i++) {
        const tableDto = dto.tables[i];
        const tableOrder = tableDto.tableOrder ?? i;

        // Create the table
        const newTable = await tx.templateTable.create({
          data: {
            templateId: newTemplate.id,
            tableName: tableDto.tableName.toUpperCase(),
            alias: tableDto.alias.toLowerCase(),
            label: tableDto.label,
            tableOrder,
            relationType: tableDto.relationType || null,
            parentTableId: tableDto.parentTableId || null,
            foreignKeyConfig: tableDto.foreignKeyConfig as any || null,
            isActive: tableDto.isActive ?? true,
          },
        });

        // Get structure from SX3 and create fields
        try {
          const structure = await this.sx3Service.getTableStructure(tableDto.tableName);

          for (let fieldIndex = 0; fieldIndex < structure.fields.length; fieldIndex++) {
            const field = structure.fields[fieldIndex];
            await tx.formField.create({
              data: {
                templateId: newTemplate.id,
                tableId: newTable.id,
                fieldName: field.fieldName,
                sx3FieldName: field.fieldName,
                label: field.label,
                fieldType: field.fieldType,
                isRequired: field.isRequired,
                isVisible: field.isRequired,
                isEnabled: true,
                isCustomField: false,
                isSyncField: true,
                fieldOrder: fieldIndex,
                fieldGroup: null,
                labelPtBR: field.labelPtBR,
                labelEn: field.labelEn,
                labelEs: field.labelEs,
                descriptionPtBR: field.descriptionPtBR,
                descriptionEn: field.descriptionEn,
                descriptionEs: field.descriptionEs,
                validationRules: null,
                metadata: {
                  size: field.size,
                  decimals: field.decimals,
                  mask: field.mask,
                  lookup: field.lookup,
                  validation: field.validation,
                  when: field.when,
                  defaultValue: field.defaultValue,
                },
              },
            });
          }
        } catch (error) {
          this.logger.warn(`Could not load SX3 structure for table ${tableDto.tableName}: ${error.message}`);
        }
      }

      return newTemplate;
    });

    this.logger.log(`Created multi-table template ${template.id}`);

    // Return template with tables and fields
    return this.findOne(template.id);
  }

  /**
   * Add a table to an existing template
   */
  async addTableToTemplate(templateId: string, dto: CreateTemplateTableDto) {
    this.logger.log(`Adding table ${dto.tableName} to template ${templateId}`);

    const template = await this.prisma.formTemplate.findUnique({
      where: { id: templateId },
      include: { tables: true },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    // Check if table already exists
    const existingTable = template.tables?.find(
      (t) => t.tableName === dto.tableName.toUpperCase(),
    );

    if (existingTable) {
      throw new BadRequestException(`Table ${dto.tableName} already exists in template`);
    }

    // Check alias uniqueness
    const existingAlias = template.tables?.find(
      (t) => t.alias === dto.alias.toLowerCase(),
    );

    if (existingAlias) {
      throw new BadRequestException(`Alias ${dto.alias} already exists in template`);
    }

    // Get max table order
    const maxOrder = template.tables?.reduce(
      (max, t) => Math.max(max, t.tableOrder),
      -1,
    ) ?? -1;

    // Create table with fields in transaction
    await this.prisma.$transaction(async (tx) => {
      // Create the table
      const newTable = await tx.templateTable.create({
        data: {
          templateId,
          tableName: dto.tableName.toUpperCase(),
          alias: dto.alias.toLowerCase(),
          label: dto.label,
          tableOrder: dto.tableOrder ?? maxOrder + 1,
          relationType: dto.relationType || null,
          parentTableId: dto.parentTableId || null,
          foreignKeyConfig: dto.foreignKeyConfig as any || null,
          isActive: dto.isActive ?? true,
        },
      });

      // Update template to multi-table if not already
      if (!template.isMultiTable) {
        await tx.formTemplate.update({
          where: { id: templateId },
          data: { isMultiTable: true },
        });
      }

      // Get structure from SX3 and create fields
      try {
        const structure = await this.sx3Service.getTableStructure(dto.tableName);

        for (let fieldIndex = 0; fieldIndex < structure.fields.length; fieldIndex++) {
          const field = structure.fields[fieldIndex];
          await tx.formField.create({
            data: {
              templateId,
              tableId: newTable.id,
              fieldName: field.fieldName,
              sx3FieldName: field.fieldName,
              label: field.label,
              fieldType: field.fieldType,
              isRequired: field.isRequired,
              isVisible: field.isRequired,
              isEnabled: true,
              isCustomField: false,
              isSyncField: true,
              fieldOrder: fieldIndex,
              fieldGroup: null,
              labelPtBR: field.labelPtBR,
              labelEn: field.labelEn,
              labelEs: field.labelEs,
              descriptionPtBR: field.descriptionPtBR,
              descriptionEn: field.descriptionEn,
              descriptionEs: field.descriptionEs,
              validationRules: null,
              metadata: {
                size: field.size,
                decimals: field.decimals,
                mask: field.mask,
                lookup: field.lookup,
                validation: field.validation,
                when: field.when,
                defaultValue: field.defaultValue,
              },
            },
          });
        }
      } catch (error) {
        this.logger.warn(`Could not load SX3 structure for table ${dto.tableName}: ${error.message}`);
      }
    });

    this.logger.log(`Added table ${dto.tableName} to template ${templateId}`);

    return this.findOne(templateId);
  }

  /**
   * Update a template table
   */
  async updateTemplateTable(
    templateId: string,
    tableId: string,
    dto: UpdateTemplateTableDto,
  ) {
    this.logger.log(`Updating table ${tableId} in template ${templateId}`);

    const table = await this.prisma.templateTable.findFirst({
      where: { id: tableId, templateId },
    });

    if (!table) {
      throw new NotFoundException(`Table ${tableId} not found in template ${templateId}`);
    }

    const updated = await this.prisma.templateTable.update({
      where: { id: tableId },
      data: {
        alias: dto.alias?.toLowerCase(),
        label: dto.label,
        tableOrder: dto.tableOrder,
        relationType: dto.relationType,
        parentTableId: dto.parentTableId,
        foreignKeyConfig: dto.foreignKeyConfig as any,
        isActive: dto.isActive,
      },
    });

    this.logger.log(`Updated table ${tableId} in template ${templateId}`);

    return updated;
  }

  /**
   * Remove a table from template
   */
  async removeTableFromTemplate(templateId: string, tableId: string) {
    this.logger.log(`Removing table ${tableId} from template ${templateId}`);

    const table = await this.prisma.templateTable.findFirst({
      where: { id: tableId, templateId },
      include: {
        _count: { select: { childTables: true } },
      },
    });

    if (!table) {
      throw new NotFoundException(`Table ${tableId} not found in template ${templateId}`);
    }

    // Check for child tables
    if (table._count.childTables > 0) {
      throw new BadRequestException('Cannot delete table with child tables. Remove child tables first.');
    }

    // Delete table and its fields (cascade)
    await this.prisma.templateTable.delete({
      where: { id: tableId },
    });

    this.logger.log(`Removed table ${tableId} from template ${templateId}`);

    return { success: true };
  }

  /**
   * Sync a specific table with SX3
   */
  async syncTableWithSx3(templateId: string, tableId: string) {
    this.logger.log(`Syncing table ${tableId} with SX3`);

    const table = await this.prisma.templateTable.findFirst({
      where: { id: tableId, templateId },
      include: { fields: true },
    });

    if (!table) {
      throw new NotFoundException(`Table ${tableId} not found in template ${templateId}`);
    }

    const structure = await this.sx3Service.getTableStructure(table.tableName);

    // Create a map of SX3 fields for quick lookup
    const sx3FieldsMap = new Map(
      structure.fields.map((field) => [field.fieldName, field]),
    );

    // Update existing fields
    const updates = table.fields
      .filter((field) => !field.isCustomField)
      .map((field) => {
        const sx3Field = sx3FieldsMap.get(field.sx3FieldName || '');
        if (!sx3Field) return null;

        return this.prisma.formField.update({
          where: { id: field.id },
          data: {
            label: sx3Field.label,
            fieldType: sx3Field.fieldType,
            isRequired: sx3Field.isRequired,
            labelPtBR: sx3Field.labelPtBR,
            labelEn: sx3Field.labelEn,
            labelEs: sx3Field.labelEs,
            descriptionPtBR: sx3Field.descriptionPtBR,
            descriptionEn: sx3Field.descriptionEn,
            descriptionEs: sx3Field.descriptionEs,
            metadata: {
              ...(typeof field.metadata === 'object' && field.metadata !== null ? field.metadata : {}),
              size: sx3Field.size,
              decimals: sx3Field.decimals,
              mask: sx3Field.mask,
              lookup: sx3Field.lookup,
              validation: sx3Field.validation,
              when: sx3Field.when,
              defaultValue: sx3Field.defaultValue,
            },
          },
        });
      });

    await this.prisma.$transaction(updates.filter((u) => u !== null));

    this.logger.log(`Synced table ${tableId} with SX3`);

    return this.prisma.templateTable.findUnique({
      where: { id: tableId },
      include: { fields: { orderBy: { fieldOrder: 'asc' } } },
    });
  }

  /**
   * Get fields for a specific table
   */
  async getTableFields(templateId: string, tableId: string) {
    const table = await this.prisma.templateTable.findFirst({
      where: { id: tableId, templateId },
      include: {
        fields: { orderBy: { fieldOrder: 'asc' } },
      },
    });

    if (!table) {
      throw new NotFoundException(`Table ${tableId} not found in template ${templateId}`);
    }

    return table.fields;
  }

  /**
   * Find template by ID with tables
   * Override findOne to include tables for multi-table templates
   */
  async findOne(id: string) {
    const template = await this.prisma.formTemplate.findUnique({
      where: { id },
      include: {
        tables: {
          orderBy: { tableOrder: 'asc' },
          include: {
            fields: { orderBy: { fieldOrder: 'asc' } },
            parentTable: true,
          },
        },
        fields: {
          orderBy: { fieldOrder: 'asc' },
        },
        workflows: true,
      },
    });

    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    return template;
  }
}
