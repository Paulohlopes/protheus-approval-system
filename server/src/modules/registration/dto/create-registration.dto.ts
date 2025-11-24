import { IsString, IsObject, IsOptional } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  templateId: string;

  @IsObject()
  formData: Record<string, any>; // Form field values

  @IsOptional()
  @IsString()
  requestedById?: string; // Will be set from JWT if not provided
}
