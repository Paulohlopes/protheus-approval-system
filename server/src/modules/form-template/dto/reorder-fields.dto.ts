import { IsArray, IsString } from 'class-validator';

export class ReorderFieldsDto {
  @IsArray()
  @IsString({ each: true })
  fieldIds: string[]; // Array of field IDs in desired order
}
