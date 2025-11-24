import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RejectRegistrationDto {
  @IsString()
  @IsNotEmpty()
  reason: string; // Required reason for rejection

  @IsOptional()
  @IsString()
  approverId?: string; // Will be set from JWT if not provided
}
