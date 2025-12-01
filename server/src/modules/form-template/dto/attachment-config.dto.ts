import { IsArray, IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';

// Default values
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const DEFAULT_MAX_FILES = 5;
export const DEFAULT_ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export class AttachmentConfigDto {
  @IsArray()
  @IsString({ each: true })
  allowedTypes: string[]; // MIME types: ['application/pdf', 'image/jpeg', ...]

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100 * 1024 * 1024) // Max 100MB
  maxSize?: number; // Max file size in bytes (default: 10MB)

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxFiles?: number; // Max number of files (default: 5)
}

// Helper to get config with defaults
export function getAttachmentConfigWithDefaults(
  config?: AttachmentConfigDto,
): Required<AttachmentConfigDto> {
  return {
    allowedTypes: config?.allowedTypes ?? DEFAULT_ALLOWED_TYPES,
    maxSize: config?.maxSize ?? DEFAULT_MAX_FILE_SIZE,
    maxFiles: config?.maxFiles ?? DEFAULT_MAX_FILES,
  };
}
