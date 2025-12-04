import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsObject,
} from 'class-validator';

export class TestConnectionDto {
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

  @IsOptional()
  @IsString()
  tableSuffix?: string = '010';
}

export class TestConnectionResultDto {
  success: boolean;
  message: string;
  details?: {
    serverVersion?: string;
    database?: string;
    testTableFound?: boolean;
  };
}
