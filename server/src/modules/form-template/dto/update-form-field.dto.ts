import { IsBoolean, IsOptional, IsString, IsInt, IsObject } from 'class-validator';

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

  @IsOptional()
  @IsObject()
  validationRules?: any;
}
