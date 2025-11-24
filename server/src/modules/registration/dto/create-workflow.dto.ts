import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsInt, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkflowLevelDto {
  @IsInt()
  levelOrder: number;

  @IsOptional()
  @IsString()
  levelName?: string; // "Gerente", "Diretor", etc.

  @IsArray()
  @IsString({ each: true })
  approverIds: string[]; // User IDs who can approve this level

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
