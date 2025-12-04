import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class UpdateFormTemplateDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  allowBulkImport?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bulkKeyFields?: string[];
}
