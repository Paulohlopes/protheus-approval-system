import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCountryDto } from './create-country.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCountryDto extends PartialType(
  OmitType(CreateCountryDto, ['code'] as const), // code cannot be changed
) {
  // Password fields are optional on update - only update if provided
  @IsOptional()
  @IsString()
  dbPassword?: string;

  @IsOptional()
  @IsString()
  apiPassword?: string;
}
