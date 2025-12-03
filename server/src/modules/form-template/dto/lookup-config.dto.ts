import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==========================================
// LOOKUP SEARCH FIELD
// ==========================================

export class LookupSearchFieldDto {
  @IsString()
  field: string; // Column name in source table (e.g., A1_COD)

  @IsString()
  label: string; // Display label (e.g., "Código")

  @IsOptional()
  @IsNumber()
  width?: number; // Column width in pixels
}

// ==========================================
// LOOKUP RETURN FIELD
// ==========================================

export class LookupReturnFieldDto {
  @IsString()
  sourceField: string; // Field from lookup table (e.g., A1_NOME)

  @IsString()
  targetField: string; // Field to fill in form (e.g., CLIENTE_NOME)
}

// ==========================================
// LOOKUP FILTER
// ==========================================

export enum LookupFilterOperator {
  EQUALS = 'equals',
  LIKE = 'like',
  IN = 'in',
}

export class LookupFilterDto {
  @IsString()
  field: string;

  @IsEnum(LookupFilterOperator)
  operator: LookupFilterOperator;

  @IsString()
  value: string | string[];
}

// ==========================================
// LOOKUP MODAL CONFIG
// ==========================================

export enum LookupModalWidth {
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl',
}

export class LookupModalConfigDto {
  @IsOptional()
  @IsString()
  title?: string; // Modal title

  @IsOptional()
  @IsEnum(LookupModalWidth)
  width?: LookupModalWidth; // Modal width

  @IsOptional()
  showAdvancedFilters?: boolean; // Show advanced filter options
}

// ==========================================
// LOOKUP CONFIG (Main DTO)
// ==========================================

export class LookupConfigDto {
  @IsString()
  sourceTable: string; // Source table for lookup (e.g., SA1010)

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LookupSearchFieldDto)
  searchFields: LookupSearchFieldDto[]; // Fields displayed in search modal

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LookupReturnFieldDto)
  returnFields: LookupReturnFieldDto[]; // Fields to auto-fill on selection

  @IsString()
  valueField: string; // Field to store as value (e.g., A1_COD)

  @IsString()
  displayField: string; // Field to display in input (e.g., A1_NOME)

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LookupFilterDto)
  filters?: LookupFilterDto[]; // Fixed filters for the query

  @IsOptional()
  @IsString()
  customQuery?: string; // Custom SQL query (optional)

  @IsOptional()
  @ValidateNested()
  @Type(() => LookupModalConfigDto)
  modalConfig?: LookupModalConfigDto; // Modal configuration
}

// ==========================================
// LOOKUP SEARCH REQUEST/RESPONSE
// ==========================================

export class LookupSearchRequestDto {
  @IsOptional()
  filters?: Record<string, string>; // Dynamic filters from modal

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class LookupSearchResponseDto {
  data: Record<string, any>[];
  total: number;
  page: number;
  limit: number;
}

export class LookupRecordResponseDto {
  data: Record<string, any> | null;
  found: boolean;
}
