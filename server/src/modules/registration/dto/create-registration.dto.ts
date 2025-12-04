import { IsString, IsObject, IsOptional } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  templateId: string;

  @IsObject()
  formData: Record<string, any>; // Form field values

  @IsString()
  @IsOptional()
  countryId?: string; // Country ID - can be passed from header or body
  // Note: requestedById is intentionally NOT included here for security
  // It must come from the authenticated user (JWT) in the controller
}
