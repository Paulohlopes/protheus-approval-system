import { IsObject } from 'class-validator';

export class UpdateRegistrationDto {
  @IsObject()
  formData: Record<string, any>; // Updated form field values
}
