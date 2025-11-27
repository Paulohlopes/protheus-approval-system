import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Sx3Service } from '../sx3/sx3.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { UpdateFormFieldDto } from './dto/update-form-field.dto';
import { ReorderFieldsDto } from './dto/reorder-fields.dto';

@Injectable()
export class FormTemplateService {
  private readonly logger = new Logger(FormTemplateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sx3Service: Sx3Service,
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
   * Find template by ID
   */
  async findOne(id: string) {
    const template = await this.prisma.formTemplate.findUnique({
      where: { id },
      include: {
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
    // Check if exists
    await this.findOne(id);

    return this.prisma.formTemplate.update({
      where: { id },
      data: dto,
      include: {
        fields: {
          orderBy: { fieldOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Delete template
   */
  async remove(id: string) {
    // Check if exists
    await this.findOne(id);

    // Check if has workflows or requests
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
    // Check if template exists
    await this.findOne(templateId);

    // Check if field exists and belongs to template
    const field = await this.prisma.formField.findUnique({
      where: { id: fieldId },
    });

    if (!field || field.templateId !== templateId) {
      throw new NotFoundException(`Field ${fieldId} not found in template ${templateId}`);
    }

    return this.prisma.formField.update({
      where: { id: fieldId },
      data: dto,
    });
  }

  /**
   * Reorder fields
   */
  async reorderFields(templateId: string, dto: ReorderFieldsDto) {
    this.logger.log(`Reordering ${dto.fieldIds.length} fields for template ${templateId}`);

    // Check if template exists
    await this.findOne(templateId);

    // Update field order
    const updates = dto.fieldIds.map((fieldId, index) =>
      this.prisma.formField.update({
        where: { id: fieldId },
        data: { fieldOrder: index },
      }),
    );

    await this.prisma.$transaction(updates);

    this.logger.log(`Reordered ${dto.fieldIds.length} fields`);

    // Return updated template
    return this.findOne(templateId);
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
  async createCustomField(
    templateId: string,
    dto: {
      fieldName: string;
      label: string;
      fieldType: string;
      isRequired?: boolean;
      fieldGroup?: string;
      placeholder?: string;
      helpText?: string;
      metadata?: any;
    },
  ) {
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

    // Create the custom field
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
}
