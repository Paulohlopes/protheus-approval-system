import { IsString, IsObject } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  templateId: string;

  @IsObject()
  formData: Record<string, any>; // Form field values
  // Note: requestedById is intentionally NOT included here for security
  // It must come from the authenticated user (JWT) in the controller
}
