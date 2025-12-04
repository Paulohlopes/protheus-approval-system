import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
} from 'class-validator';

// ==========================================
// LOOKUP CONFIG (Simplified - SQL Based)
// ==========================================

export class LookupConfigDto {
  // SQL Query that returns data for the lookup
  // Example: "SELECT A1_COD, A1_NOME, A1_CGC FROM SA1010 WHERE D_E_L_E_T_ = '' AND A1_MSBLQL <> '1'"
  @IsOptional()
  @IsString()
  sqlQuery?: string;

  // Column name to use as stored value (e.g., A1_COD)
  @IsOptional()
  @IsString()
  valueField?: string;

  // Column name to display in the input field (e.g., A1_NOME)
  @IsOptional()
  @IsString()
  displayField?: string;

  // Optional: Columns to search when user types (defaults to all columns)
  // Example: ["A1_COD", "A1_NOME", "A1_CGC"]
  @IsOptional()
  @IsArray()
  searchableFields?: string[];

  // Optional: Auto-fill other form fields when a record is selected
  // Format: { "sourceColumn": "targetFieldName" }
  // Example: { "A1_NOME": "cliente_nome", "A1_CGC": "cliente_cnpj" }
  @IsOptional()
  returnFields?: Record<string, string>;

  // Optional: Modal title (defaults to field label)
  @IsOptional()
  @IsString()
  modalTitle?: string;

  // Optional: Show all columns in results or just valueField + displayField
  @IsOptional()
  @IsBoolean()
  showAllColumns?: boolean;
}

// ==========================================
// LOOKUP SEARCH REQUEST/RESPONSE
// ==========================================

export class LookupSearchRequestDto {
  @IsOptional()
  @IsString()
  search?: string; // User's search term

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
