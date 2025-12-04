import {
  IsBoolean,
  IsOptional,
  IsString,
  IsInt,
  IsObject,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DataSourceType, DataSourceConfigDto } from './data-source.dto';
import { ValidationRulesDto } from './validation-rules.dto';
import { AttachmentConfigDto } from './attachment-config.dto';
import { LookupConfigDto } from './lookup-config.dto';

// Supported field types
export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  TEXT = 'text',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  AUTOCOMPLETE = 'autocomplete',
  MULTISELECT = 'multiselect',
  ATTACHMENT = 'attachment',
  LOOKUP = 'lookup',
}

export class UpdateFormFieldDto {
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsInt()
  fieldOrder?: number;

  @IsOptional()
  @IsString()
  fieldGroup?: string;

  // Field type (can be changed for custom fields)
  @IsOptional()
  @IsEnum(FieldType)
  fieldType?: FieldType;

  // Data source configuration (for select, radio, autocomplete, multiselect)
  @IsOptional()
  @IsEnum(DataSourceType)
  dataSourceType?: DataSourceType;

  @IsOptional()
  @ValidateNested()
  @Type(() => DataSourceConfigDto)
  dataSourceConfig?: DataSourceConfigDto;

  // Validation rules
  @IsOptional()
  @ValidateNested()
  @Type(() => ValidationRulesDto)
  validationRules?: ValidationRulesDto;

  // Attachment configuration (for attachment type)
  @IsOptional()
  @ValidateNested()
  @Type(() => AttachmentConfigDto)
  attachmentConfig?: AttachmentConfigDto;

  // Lookup configuration (for lookup type)
  @IsOptional()
  @ValidateNested()
  @Type(() => LookupConfigDto)
  lookupConfig?: LookupConfigDto;

  // Other field properties
  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsString()
  helpText?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
