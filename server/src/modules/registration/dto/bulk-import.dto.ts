import { IsString, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a bulk registration request
 */
export class CreateBulkRegistrationDto {
  @ApiProperty({ description: 'Template ID to use for bulk import' })
  @IsString()
  templateId: string;

  @ApiPropertyOptional({ description: 'Country ID for the registration' })
  @IsString()
  @IsOptional()
  countryId?: string;
}

/**
 * Error detail for a specific row in bulk import
 */
export interface BulkImportError {
  row: number;
  field: string;
  fieldLabel?: string;
  value?: any;
  message: string;
}

/**
 * Warning for bulk import (non-blocking)
 */
export interface BulkImportWarning {
  type: 'info' | 'warning';
  message: string;
  row?: number;
  field?: string;
}

/**
 * Result of bulk import validation
 */
export interface BulkValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  errors: BulkImportError[];
  warnings: BulkImportWarning[];
  preview?: {
    headers: string[];
    rows: Record<string, any>[];
  };
}

/**
 * Result of bulk import creation
 */
export interface BulkImportResult {
  success: boolean;
  registrationId?: string;
  trackingNumber?: string;
  itemCount: number;
  errors: BulkImportError[];
  warnings: BulkImportWarning[];
}

/**
 * Result of bulk submit
 */
export interface BulkSubmitResult {
  totalRequested: number;
  successful: number;
  failed: number;
  results: {
    registrationId: string;
    success: boolean;
    trackingNumber?: string;
    error?: string;
  }[];
}

/**
 * Parsed data from Excel/CSV file
 */
export interface ParsedBulkData {
  headers: string[];
  rows: Record<string, any>[];
  metadata?: {
    templateId?: string;
    version?: string;
    exportDate?: string;
  };
}

/**
 * Form data structure for bulk registration
 */
export interface BulkFormData {
  _isBulk: true;
  _itemCount: number;
  items: Record<string, any>[];
}

/**
 * Field configuration for template export
 */
export interface BulkTemplateField {
  fieldName: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
  maxLength?: number;
  decimals?: number;
  helpText?: string;
  validationRules?: any;
}

/**
 * DTO for bulk submit request
 */
export class BulkSubmitDto {
  @ApiProperty({ description: 'Array of registration IDs to submit' })
  @IsArray()
  @IsString({ each: true })
  registrationIds: string[];
}
