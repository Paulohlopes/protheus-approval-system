import { IsOptional, IsString } from 'class-validator';

export class ApproveRegistrationDto {
  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  approverId?: string; // Will be set from JWT if not provided
}
