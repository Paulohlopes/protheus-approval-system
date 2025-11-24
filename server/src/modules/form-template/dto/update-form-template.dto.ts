import { IsString, IsOptional, IsBoolean } from 'class-validator';

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
}
