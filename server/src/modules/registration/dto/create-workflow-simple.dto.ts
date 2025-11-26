import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsInt, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class ApprovalStepDto {
  @IsInt()
  stepOrder: number;

  @IsEmail()
  approverEmail: string;

  @IsOptional()
  @IsString()
  approverName?: string;

  @IsOptional()
  @IsString()
  approverRole?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class CreateWorkflowSimpleDto {
  @IsString()
  templateId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresSequentialApproval?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalStepDto)
  steps: ApprovalStepDto[];
}
