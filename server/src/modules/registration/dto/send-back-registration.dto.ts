import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class SendBackRegistrationDto {
  @IsString()
  @IsNotEmpty()
  reason: string; // Required reason for sending back

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetLevel?: number; // Optional: specific level to return to (0 = draft, 1 = level 1, etc.)
  // If not provided, returns to previous level (currentLevel - 1)
  // Note: approverId is intentionally NOT included here for security
  // It must come from the authenticated user (JWT) in the controller
}
