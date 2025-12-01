import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsObject,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FieldType } from './update-form-field.dto';
import { DataSourceType, DataSourceConfigDto } from './data-source.dto';
import { ValidationRulesDto } from './validation-rules.dto';
import { AttachmentConfigDto } from './attachment-config.dto';

export class CreateCustomFieldDto {
  @IsString()
  @IsNotEmpty()
  fieldName: string; // Unique field name

  @IsString()
  @IsNotEmpty()
  label: string; // Display label

  @IsEnum(FieldType)
  fieldType: FieldType;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsString()
  fieldGroup?: string; // Default: "Campos Customizados"

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsString()
  helpText?: string;

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

  // Additional metadata
  @IsOptional()
  @IsObject()
  metadata?: any;
}
