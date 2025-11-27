import { IsOptional, IsString, IsObject } from 'class-validator';

export class ApproveRegistrationDto {
  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsObject()
  fieldChanges?: Record<string, any>; // Field changes to apply during approval

  // Note: approverId is intentionally NOT included here for security
  // It must come from the authenticated user (JWT) in the controller
}
