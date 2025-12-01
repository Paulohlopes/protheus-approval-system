import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DataSourceType {
  FIXED = 'fixed',
  SQL = 'sql',
  SX5 = 'sx5',
}

export class FixedOptionDto {
  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsNotEmpty()
  label: string;
}

export class DataSourceConfigDto {
  @IsOptional()
  @IsEnum(DataSourceType)
  type?: DataSourceType;

  // For 'fixed' type - list of options
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FixedOptionDto)
  fixedOptions?: FixedOptionDto[];

  // For 'sql' type - SQL query configuration
  @IsOptional()
  @IsString()
  sqlQuery?: string; // e.g., "SELECT A1_COD, A1_NOME FROM SA1010 WHERE D_E_L_E_T_ = ''"

  @IsOptional()
  @IsString()
  keyField?: string; // Field to use as unique key for React rendering (e.g., "R_E_C_N_O_")

  @IsOptional()
  @IsString()
  valueField?: string; // Field to use as value (e.g., "A1_COD")

  @IsOptional()
  @IsString()
  labelField?: string; // Field to use as label (e.g., "A1_NOME")

  // For 'sx5' type - SX5 table code
  @IsOptional()
  @IsString()
  sx5Table?: string; // e.g., "00" for UF table, "12" for status, etc.
}

// Response DTO for options
export class DataSourceOptionDto {
  key?: string; // Unique key for React rendering (optional, defaults to value)
  value: string;
  label: string;
}

// Response DTO for options with metadata
export class DataSourceResponseDto {
  options: DataSourceOptionDto[];
  warning?: string; // Warning message (e.g., duplicate values detected)
  duplicateCount?: number; // Number of duplicate values found
}
