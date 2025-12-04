import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateAlterationDto {
  @ApiProperty({
    description: 'ID do template de formulário',
    example: 'uuid-do-template',
  })
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @ApiProperty({
    description: 'R_E_C_N_O_ do registro original no Protheus',
    example: '12345',
  })
  @IsString()
  @IsNotEmpty()
  originalRecno: string;

  @ApiPropertyOptional({
    description: 'Dados do formulário (se não fornecido, usa os dados originais)',
    example: { B1_COD: 'PROD001', B1_DESC: 'Produto Alterado' },
  })
  @IsOptional()
  @IsObject()
  formData?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'ID do país (pode vir do header X-Country-Id)',
    example: 'uuid-do-pais',
  })
  @IsOptional()
  @IsString()
  countryId?: string;
}
