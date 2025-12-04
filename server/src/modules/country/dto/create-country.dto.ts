import {
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  Max,
  Length,
  IsUrl,
  IsObject,
} from 'class-validator';

export class CreateCountryDto {
  @IsString()
  @Length(2, 5)
  code: string; // "BR", "AR", "PE", "CL"

  @IsString()
  @Length(1, 100)
  name: string; // "Brasil", "Argentina"

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;

  // Table Suffix Configuration
  @IsString()
  @Length(1, 10)
  tableSuffix: string; // "010", "030", "020"

  // Database Connection (SQL Server)
  @IsString()
  dbHost: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  dbPort?: number = 1433;

  @IsString()
  dbDatabase: string;

  @IsString()
  dbUsername: string;

  @IsString()
  dbPassword: string;

  @IsOptional()
  @IsObject()
  dbOptions?: Record<string, any>;

  // API Configuration (REST Protheus)
  @IsOptional()
  @IsString()
  apiBaseUrl?: string;

  @IsOptional()
  @IsString()
  apiUsername?: string;

  @IsOptional()
  @IsString()
  apiPassword?: string;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(300000)
  apiTimeout?: number = 30000;

  @IsOptional()
  @IsString()
  oauthUrl?: string;
}
