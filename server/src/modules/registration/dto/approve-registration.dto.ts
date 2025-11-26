import { IsOptional, IsString } from 'class-validator';

export class ApproveRegistrationDto {
  @IsOptional()
  @IsString()
  comments?: string;
  // Note: approverId is intentionally NOT included here for security
  // It must come from the authenticated user (JWT) in the controller
}
