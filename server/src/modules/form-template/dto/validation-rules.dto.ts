import {
  IsBoolean,
  IsOptional,
  IsNumber,
  IsString,
  IsObject,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SqlValidationDto {
  @IsString()
  query: string; // e.g., "SELECT COUNT(*) FROM SA1010 WHERE A1_COD = :value"

  @IsString()
  errorMessage: string; // e.g., "Cliente não encontrado"
}

export enum DependsOnCondition {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  CONTAINS = 'contains',
  IS_NOT_EMPTY = 'isNotEmpty',
}

export class DependsOnDto {
  @IsString()
  fieldName: string; // Field that this field depends on

  @IsEnum(DependsOnCondition)
  condition: DependsOnCondition;

  @IsOptional()
  @IsString()
  value?: string; // Value to compare (for equals, notEquals, contains)

  @IsOptional()
  @IsString()
  filterField?: string; // Field to use for filtering data source (for cascading selects)
}

export class ValidationRulesDto {
  // Basic validations
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsNumber()
  minLength?: number;

  @IsOptional()
  @IsNumber()
  maxLength?: number;

  @IsOptional()
  @IsString()
  regex?: string; // Regex pattern for validation

  @IsOptional()
  @IsString()
  mask?: string; // Input mask (e.g., "000.000.000-00" for CPF)

  @IsOptional()
  @IsNumber()
  min?: number; // Minimum value (for numbers)

  @IsOptional()
  @IsNumber()
  max?: number; // Maximum value (for numbers)

  // SQL Validation - validates value against database
  @IsOptional()
  @ValidateNested()
  @Type(() => SqlValidationDto)
  sqlValidation?: SqlValidationDto;

  // Field dependency - field depends on another field's value
  @IsOptional()
  @ValidateNested()
  @Type(() => DependsOnDto)
  dependsOn?: DependsOnDto;
}
