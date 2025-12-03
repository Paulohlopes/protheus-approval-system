import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==========================================
// ENUMS
// ==========================================

export enum TableRelationType {
  PARENT = 'parent',
  CHILD = 'child',
  INDEPENDENT = 'independent',
}

// ==========================================
// FOREIGN KEY CONFIG
// ==========================================

export class ForeignKeyConfigDto {
  @IsString()
  parentField: string; // Field in parent table (e.g., DA0_CODTAB)

  @IsString()
  childField: string; // Field in child table (e.g., DA1_CODTAB)
}

// ==========================================
// TEMPLATE TABLE DTOs
// ==========================================

export class CreateTemplateTableDto {
  @IsString()
  tableName: string; // DA0, DA1, SA1, etc.

  @IsString()
  alias: string; // "header", "items", "main"

  @IsString()
  label: string; // "Cabeçalho", "Itens"

  @IsOptional()
  @IsNumber()
  tableOrder?: number;

  @IsOptional()
  @IsEnum(TableRelationType)
  relationType?: TableRelationType;

  @IsOptional()
  @IsString()
  parentTableId?: string; // ID of parent TemplateTable (when relationType = 'child')

  @IsOptional()
  @ValidateNested()
  @Type(() => ForeignKeyConfigDto)
  foreignKeyConfig?: ForeignKeyConfigDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTemplateTableDto {
  @IsOptional()
  @IsString()
  alias?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsNumber()
  tableOrder?: number;

  @IsOptional()
  @IsEnum(TableRelationType)
  relationType?: TableRelationType;

  @IsOptional()
  @IsString()
  parentTableId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ForeignKeyConfigDto)
  foreignKeyConfig?: ForeignKeyConfigDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==========================================
// MULTI-TABLE TEMPLATE DTOs
// ==========================================

export class CreateMultiTableTemplateDto {
  @IsString()
  label: string; // "Tabela de Preços"

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateTableDto)
  tables: CreateTemplateTableDto[];
}

// ==========================================
// RESPONSE DTOs
// ==========================================

export class TemplateTableResponseDto {
  id: string;
  templateId: string;
  tableName: string;
  alias: string;
  label: string;
  tableOrder: number;
  relationType?: string;
  parentTableId?: string;
  foreignKeyConfig?: ForeignKeyConfigDto;
  isActive: boolean;
  fieldsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
