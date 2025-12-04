import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateFormTemplateDto {
  @IsString()
  tableName: string; // SB1, SA1, SA2, DA0, DA1

  @IsString()
  label: string; // "Cadastro de Produtos"

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  countryId?: string; // Country ID for SX3 lookup (uses default if not provided)
}
