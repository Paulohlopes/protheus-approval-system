export class Sx3FieldDto {
  fieldName: string; // X3_CAMPO
  label: string; // X3_TITULO (Portuguese - default/fallback)
  description: string; // X3_DESCRIC (Portuguese - default/fallback)

  // Multi-language labels
  labelPtBR: string; // X3_TITULO (Portuguese)
  labelEn: string; // X3_TITENG (English)
  labelEs: string; // X3_TITSPA (Spanish)

  // Multi-language descriptions
  descriptionPtBR: string; // X3_DESCRIC (Portuguese)
  descriptionEn: string; // X3_DESCENG (English)
  descriptionEs: string; // X3_DESCSPA (Spanish)

  fieldType: 'string' | 'number' | 'date' | 'boolean' | 'text'; // Mapped from X3_TIPO
  size: number; // X3_TAMANHO
  decimals: number; // X3_DECIMAL
  isRequired: boolean; // X3_OBRIGAT == 'S'
  mask: string; // X3_PICTURE
  lookup: string; // X3_F3
  order: string; // X3_ORDEM
  validation: string; // X3_VALID
  when: string; // X3_WHEN
  defaultValue: string; // X3_RELACAO
}

export class TableStructureDto {
  tableName: string;
  fields: Sx3FieldDto[];
}
