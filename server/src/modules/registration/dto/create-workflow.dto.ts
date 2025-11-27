import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsInt, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkflowLevelDto {
  @IsInt()
  levelOrder: number;

  @IsOptional()
  @IsString()
  levelName?: string; // "Gerente", "Diretor", etc.

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  approverIds?: string[]; // User IDs who can approve this level

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  approverGroupIds?: string[]; // Approval Group IDs (any member can approve)

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  editableFields?: string[]; // Field names that can be edited at this level

  @IsOptional()
  @IsBoolean()
  isParallel?: boolean; // All must approve or just one?

  @IsOptional()
  @IsObject()
  conditions?: any; // Conditional rules
}

export class CreateWorkflowDto {
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowLevelDto)
  levels: WorkflowLevelDto[];

  @IsOptional()
  @IsObject()
  routingRules?: any; // Advanced routing rules
}
