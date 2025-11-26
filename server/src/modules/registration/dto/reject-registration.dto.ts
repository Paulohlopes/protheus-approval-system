import { IsString, IsNotEmpty } from 'class-validator';

export class RejectRegistrationDto {
  @IsString()
  @IsNotEmpty()
  reason: string; // Required reason for rejection
  // Note: approverId is intentionally NOT included here for security
  // It must come from the authenticated user (JWT) in the controller
}
