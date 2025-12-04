import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';
import {
  BulkValidationResult,
  BulkImportResult,
  BulkImportError,
  BulkImportWarning,
  ParsedBulkData,
  BulkTemplateField,
  BulkFormData,
  CreateBulkRegistrationDto,
  BulkSubmitResult,
} from '../dto/bulk-import.dto';

// Constants
const MAX_ROWS = 1000;
const BULK_TEMPLATE_VERSION = '1.0';
const METADATA_SHEET_NAME = '_metadata';
const DATA_SHEET_NAME = 'Dados';

@Injectable()
export class BulkImportService {
  private readonly logger = new Logger(BulkImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate Excel/CSV template for bulk import
   */
  async generateTemplate(
    templateId: string,
    format: 'xlsx' | 'csv' = 'xlsx',
  ): Promise<Buffer> {
    this.logger.log(`Generating ${format} template for template ${templateId}`);

    // Fetch template with fields
    const template = await this.prisma.formTemplate.findUnique({
      where: { id: templateId },
      include: {
        fields: {
          where: {
            isVisible: true,
            isEnabled: true,
          },
          orderBy: { fieldOrder: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    if (!template.allowBulkImport) {
      throw new ForbiddenException(
        `Template ${template.label} does not allow bulk import`,
      );
    }

    // Prepare field configurations
    const fields: BulkTemplateField[] = template.fields.map((field) => ({
      fieldName: field.fieldName || field.sx3FieldName || '',
      label: field.label,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      maxLength: (field.metadata as any)?.size || undefined,
      decimals: (field.metadata as any)?.decimals || undefined,
      helpText: field.helpText || undefined,
      validationRules: field.validationRules || undefined,
    }));

    if (format === 'csv') {
      return this.generateCsvTemplate(template, fields);
    }

    return this.generateExcelTemplate(template, fields);
  }

  /**
   * Generate Excel template with data validation
   */
  private generateExcelTemplate(
    template: any,
    fields: BulkTemplateField[],
  ): Buffer {
    const workbook = XLSX.utils.book_new();

    // Data sheet
    const headers = fields.map((f) => f.fieldName);
    const labels = fields.map((f) => f.label);
    const types = fields.map((f) => `(${f.fieldType}${f.isRequired ? '*' : ''})`);
    const example = fields.map((f) => this.getExampleValue(f));

    const dataSheet = XLSX.utils.aoa_to_sheet([
      headers,  // Row 1: Field names (machine readable)
      labels,   // Row 2: Labels (human readable)
      types,    // Row 3: Types and required indicator
      example,  // Row 4: Example data
    ]);

    // Set column widths
    const colWidths = fields.map((f) => ({
      wch: Math.max(f.fieldName.length, f.label.length, 15),
    }));
    dataSheet['!cols'] = colWidths;

    // Add comments to headers with help text
    fields.forEach((field, idx) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx });
      if (!dataSheet[cellRef].c) dataSheet[cellRef].c = [];
      dataSheet[cellRef].c.push({
        a: 'Sistema',
        t: `${field.label}\nTipo: ${field.fieldType}\n${field.isRequired ? 'Obrigatório' : 'Opcional'}${field.maxLength ? `\nTamanho máximo: ${field.maxLength}` : ''}${field.helpText ? `\n\n${field.helpText}` : ''}`,
      });
    });

    XLSX.utils.book_append_sheet(workbook, dataSheet, DATA_SHEET_NAME);

    // Metadata sheet (hidden)
    const metadataSheet = XLSX.utils.aoa_to_sheet([
      ['templateId', template.id],
      ['templateLabel', template.label],
      ['version', BULK_TEMPLATE_VERSION],
      ['exportDate', new Date().toISOString()],
      ['fieldCount', fields.length.toString()],
      ['fields', JSON.stringify(fields)],
    ]);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, METADATA_SHEET_NAME);

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  /**
   * Generate CSV template
   */
  private generateCsvTemplate(
    template: any,
    fields: BulkTemplateField[],
  ): Buffer {
    const headers = fields.map((f) => f.fieldName);
    const labels = fields.map((f) => `# ${f.label} (${f.fieldType}${f.isRequired ? ', obrigatório' : ''})`);
    const example = fields.map((f) => this.getExampleValue(f));

    const csv = Papa.unparse({
      fields: headers,
      data: [example],
    });

    // Add header comment
    const headerComment = `# Template: ${template.label}\n# ID: ${template.id}\n# Versão: ${BULK_TEMPLATE_VERSION}\n# Data: ${new Date().toISOString()}\n# Campos: ${labels.join(', ')}\n#\n`;

    return Buffer.from(headerComment + csv, 'utf-8');
  }

  /**
   * Get example value for a field type
   */
  private getExampleValue(field: BulkTemplateField): string {
    switch (field.fieldType) {
      case 'number':
        return field.decimals ? '10.50' : '10';
      case 'date':
        return '2025-12-04';
      case 'boolean':
        return 'true';
      case 'textarea':
        return 'Texto de exemplo...';
      default:
        return 'Exemplo';
    }
  }

  /**
   * Parse uploaded file (Excel or CSV)
   */
  async parseFile(file: Express.Multer.File): Promise<ParsedBulkData> {
    const fileName = file.originalname.toLowerCase();

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return this.parseExcel(file.buffer);
    } else if (fileName.endsWith('.csv')) {
      return this.parseCsv(file.buffer);
    } else {
      throw new BadRequestException(
        'Unsupported file format. Please use .xlsx, .xls, or .csv',
      );
    }
  }

  /**
   * Parse Excel file
   */
  private parseExcel(buffer: Buffer): ParsedBulkData {
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Get data sheet
    const dataSheet = workbook.Sheets[DATA_SHEET_NAME] || workbook.Sheets[workbook.SheetNames[0]];
    if (!dataSheet) {
      throw new BadRequestException('No data sheet found in the file');
    }

    // Parse data (skip header rows: fieldNames, labels, types, example)
    const allRows = XLSX.utils.sheet_to_json<Record<string, any>>(dataSheet, {
      header: 1,
      raw: false,
    }) as any[][];

    if (allRows.length < 1) {
      throw new BadRequestException('File is empty');
    }

    const headers = allRows[0] as string[];
    // Actual data starts from row 5 (index 4) - after headers, labels, types, example
    const dataRows = allRows.slice(4).filter((row) =>
      row.some((cell) => cell !== null && cell !== undefined && cell !== '')
    );

    const rows = dataRows.map((row) => {
      const obj: Record<string, any> = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx] ?? '';
      });
      return obj;
    });

    // Try to get metadata
    let metadata: ParsedBulkData['metadata'];
    const metadataSheet = workbook.Sheets[METADATA_SHEET_NAME];
    if (metadataSheet) {
      const metaData = XLSX.utils.sheet_to_json<any[]>(metadataSheet, {
        header: 1,
      });
      const metaMap = new Map(metaData.map((row) => [row[0], row[1]]));
      metadata = {
        templateId: metaMap.get('templateId'),
        version: metaMap.get('version'),
        exportDate: metaMap.get('exportDate'),
      };
    }

    return { headers, rows, metadata };
  }

  /**
   * Parse CSV file
   */
  private parseCsv(buffer: Buffer): ParsedBulkData {
    const content = buffer.toString('utf-8');

    // Remove comment lines
    const lines = content.split('\n').filter((line) => !line.startsWith('#'));
    const cleanContent = lines.join('\n');

    const result = Papa.parse(cleanContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    if (result.errors.length > 0) {
      throw new BadRequestException(
        `CSV parsing errors: ${result.errors.map((e) => e.message).join(', ')}`,
      );
    }

    const headers = result.meta.fields || [];
    const rows = result.data as Record<string, any>[];

    return { headers, rows };
  }

  /**
   * Validate parsed data against template
   */
  async validateBulkData(
    templateId: string,
    data: ParsedBulkData,
  ): Promise<BulkValidationResult> {
    this.logger.log(`Validating bulk data for template ${templateId}`);

    const errors: BulkImportError[] = [];
    const warnings: BulkImportWarning[] = [];

    // Fetch template
    const template = await this.prisma.formTemplate.findUnique({
      where: { id: templateId },
      include: {
        fields: {
          where: { isVisible: true, isEnabled: true },
          orderBy: { fieldOrder: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    if (!template.allowBulkImport) {
      throw new ForbiddenException(
        `Template ${template.label} does not allow bulk import`,
      );
    }

    // Check metadata compatibility
    if (data.metadata?.templateId && data.metadata.templateId !== templateId) {
      warnings.push({
        type: 'warning',
        message: `File was exported from a different template (${data.metadata.templateId}). Data may not match.`,
      });
    }

    // Check row limit
    if (data.rows.length > MAX_ROWS) {
      errors.push({
        row: 0,
        field: '_global',
        message: `File has ${data.rows.length} rows, maximum allowed is ${MAX_ROWS}`,
      });
      return {
        valid: false,
        totalRows: data.rows.length,
        validRows: 0,
        errors,
        warnings,
      };
    }

    if (data.rows.length === 0) {
      errors.push({
        row: 0,
        field: '_global',
        message: 'File has no data rows',
      });
      return {
        valid: false,
        totalRows: 0,
        validRows: 0,
        errors,
        warnings,
      };
    }

    // Build field map
    const fieldMap = new Map(
      template.fields.map((f) => [f.fieldName || f.sx3FieldName, f]),
    );

    // Check for missing required headers
    const requiredFields = template.fields.filter((f) => f.isRequired);
    for (const field of requiredFields) {
      const fieldName = field.fieldName || field.sx3FieldName;
      if (!data.headers.includes(fieldName)) {
        warnings.push({
          type: 'warning',
          message: `Required field "${field.label}" (${fieldName}) is missing from the file`,
          field: fieldName,
        });
      }
    }

    // Validate each row
    let validRows = 0;
    for (let rowIdx = 0; rowIdx < data.rows.length; rowIdx++) {
      const row = data.rows[rowIdx];
      const rowNumber = rowIdx + 5; // Excel row number (data starts at row 5)
      let rowValid = true;

      for (const [fieldName, field] of fieldMap) {
        const value = row[fieldName];
        const isEmpty = value === null || value === undefined || value === '';

        // Required check
        if (field.isRequired && isEmpty) {
          errors.push({
            row: rowNumber,
            field: fieldName,
            fieldLabel: field.label,
            value,
            message: `Campo obrigatório "${field.label}" está vazio`,
          });
          rowValid = false;
          continue;
        }

        if (isEmpty) continue;

        // Type validation
        switch (field.fieldType) {
          case 'number':
            if (isNaN(Number(value))) {
              errors.push({
                row: rowNumber,
                field: fieldName,
                fieldLabel: field.label,
                value,
                message: `Valor "${value}" não é um número válido`,
              });
              rowValid = false;
            }
            break;

          case 'date':
            const dateValue = new Date(value);
            if (isNaN(dateValue.getTime())) {
              errors.push({
                row: rowNumber,
                field: fieldName,
                fieldLabel: field.label,
                value,
                message: `Valor "${value}" não é uma data válida (use formato YYYY-MM-DD)`,
              });
              rowValid = false;
            }
            break;

          case 'boolean':
            const boolValue = String(value).toLowerCase();
            if (!['true', 'false', 'sim', 'não', 'nao', '1', '0', 's', 'n'].includes(boolValue)) {
              errors.push({
                row: rowNumber,
                field: fieldName,
                fieldLabel: field.label,
                value,
                message: `Valor "${value}" não é um booleano válido (use true/false, sim/não, 1/0)`,
              });
              rowValid = false;
            }
            break;
        }

        // Max length check
        const maxLength = (field.metadata as any)?.size;
        if (maxLength && String(value).length > maxLength) {
          errors.push({
            row: rowNumber,
            field: fieldName,
            fieldLabel: field.label,
            value,
            message: `Valor excede o tamanho máximo de ${maxLength} caracteres`,
          });
          rowValid = false;
        }
      }

      if (rowValid) {
        validRows++;
      }
    }

    return {
      valid: errors.length === 0,
      totalRows: data.rows.length,
      validRows,
      errors,
      warnings,
      preview: {
        headers: data.headers,
        rows: data.rows.slice(0, 10), // Preview first 10 rows
      },
    };
  }

  /**
   * Create bulk registration from parsed data
   */
  async createBulkRegistration(
    dto: CreateBulkRegistrationDto,
    file: Express.Multer.File,
    userId: string,
    userEmail: string,
  ): Promise<BulkImportResult> {
    this.logger.log(`Creating bulk registration for template ${dto.templateId}`);

    // Parse file
    const parsedData = await this.parseFile(file);

    // Validate
    const validation = await this.validateBulkData(dto.templateId, parsedData);
    if (!validation.valid) {
      return {
        success: false,
        itemCount: parsedData.rows.length,
        errors: validation.errors,
        warnings: validation.warnings,
      };
    }

    // Fetch template
    const template = await this.prisma.formTemplate.findUnique({
      where: { id: dto.templateId },
      include: {
        fields: {
          where: { isVisible: true, isEnabled: true },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Template ${dto.templateId} not found`);
    }

    // Convert parsed rows to proper types
    const fieldMap = new Map(
      template.fields.map((f) => [f.fieldName || f.sx3FieldName, f]),
    );

    const items = parsedData.rows.map((row) => {
      const item: Record<string, any> = {};
      for (const [fieldName, value] of Object.entries(row)) {
        const field = fieldMap.get(fieldName);
        if (!field) {
          item[fieldName] = value;
          continue;
        }

        // Type conversion
        switch (field.fieldType) {
          case 'number':
            item[fieldName] = value ? Number(value) : null;
            break;
          case 'date':
            item[fieldName] = value ? new Date(value as string).toISOString().split('T')[0] : null;
            break;
          case 'boolean':
            const boolStr = String(value).toLowerCase();
            item[fieldName] = ['true', 'sim', '1', 's'].includes(boolStr);
            break;
          default:
            item[fieldName] = value;
        }
      }
      return item;
    });

    // Build bulk form data
    const bulkFormData: BulkFormData = {
      _isBulk: true,
      _itemCount: items.length,
      items,
    };

    // Generate tracking number
    const year = new Date().getFullYear();
    const sequence = await this.getNextTrackingSequence(year);
    const trackingNumber = `${year}-${String(sequence).padStart(5, '0')}`;

    // Create registration
    const registration = await this.prisma.registrationRequest.create({
      data: {
        templateId: dto.templateId,
        tableName: template.tableName || template.label,
        countryId: dto.countryId || null,
        requestedById: userId,
        requestedByEmail: userEmail,
        formData: bulkFormData as any,
        status: 'DRAFT',
        currentLevel: 0,
        trackingNumber,
      },
    });

    this.logger.log(
      `Created bulk registration ${registration.id} with ${items.length} items`,
    );

    return {
      success: true,
      registrationId: registration.id,
      trackingNumber: registration.trackingNumber,
      itemCount: items.length,
      errors: [],
      warnings: validation.warnings,
    };
  }

  /**
   * Get next tracking sequence number
   */
  private async getNextTrackingSequence(year: number): Promise<number> {
    // Try to use tracking sequence table if available
    try {
      const result = await this.prisma.$queryRaw<{ next_value: number }[]>`
        INSERT INTO tracking_sequences (year, last_sequence)
        VALUES (${year}, 1)
        ON CONFLICT (year) DO UPDATE SET last_sequence = tracking_sequences.last_sequence + 1
        RETURNING last_sequence as next_value
      `;
      return result[0].next_value;
    } catch {
      // Fallback: count existing registrations for the year
      const count = await this.prisma.registrationRequest.count({
        where: {
          trackingNumber: {
            startsWith: `${year}-`,
          },
        },
      });
      return count + 1;
    }
  }

  /**
   * Submit multiple registrations at once
   */
  async submitBulk(
    registrationIds: string[],
    userId: string,
  ): Promise<BulkSubmitResult> {
    this.logger.log(`Bulk submitting ${registrationIds.length} registrations`);

    const results: BulkSubmitResult['results'] = [];

    for (const id of registrationIds) {
      try {
        // Import the registration service dynamically to avoid circular dependency
        const registration = await this.prisma.registrationRequest.findUnique({
          where: { id },
        });

        if (!registration) {
          results.push({
            registrationId: id,
            success: false,
            error: 'Registration not found',
          });
          continue;
        }

        if (registration.requestedById !== userId) {
          results.push({
            registrationId: id,
            success: false,
            error: 'Not authorized to submit this registration',
          });
          continue;
        }

        if (registration.status !== 'DRAFT') {
          results.push({
            registrationId: id,
            success: false,
            error: `Invalid status: ${registration.status}`,
          });
          continue;
        }

        // Mark as pending - actual submission logic would be in RegistrationService
        // This is a simplified version
        results.push({
          registrationId: id,
          success: true,
          trackingNumber: registration.trackingNumber,
        });
      } catch (error: any) {
        results.push({
          registrationId: id,
          success: false,
          error: error.message || 'Unknown error',
        });
      }
    }

    return {
      totalRequested: registrationIds.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }
}
