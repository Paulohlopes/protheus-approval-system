import { Entity, Column } from 'typeorm';

/**
 * SX3 Entity - Protheus Data Dictionary
 * This entity maps to the SX3010 table in Protheus SQL Server database
 * It contains metadata about all tables and fields in Protheus
 */
@Entity('SX3010')
export class Sx3 {
  @Column({ primary: true, name: 'R_E_C_N_O_' })
  recno: number;

  @Column({ name: 'X3_ARQUIVO' })
  x3Arquivo: string; // Table name (SB1, SA1, SA2, etc)

  @Column({ name: 'X3_CAMPO' })
  x3Campo: string; // Field name (B1_COD, B1_DESC, etc)

  // Portuguese labels (default)
  @Column({ name: 'X3_TITULO' })
  x3Titulo: string; // Field label/title (Portuguese)

  @Column({ name: 'X3_DESCRIC' })
  x3Descric: string; // Field description (Portuguese)

  // Spanish labels
  @Column({ name: 'X3_TITSPA', nullable: true })
  x3TitSpa: string; // Field label/title (Spanish)

  @Column({ name: 'X3_DESCSPA', nullable: true })
  x3DescSpa: string; // Field description (Spanish)

  // English labels
  @Column({ name: 'X3_TITENG', nullable: true })
  x3TitEng: string; // Field label/title (English)

  @Column({ name: 'X3_DESCENG', nullable: true })
  x3DescEng: string; // Field description (English)

  @Column({ name: 'X3_TIPO' })
  x3Tipo: string; // Field type: C=Character, N=Numeric, D=Date, L=Logical

  @Column({ name: 'X3_TAMANHO' })
  x3Tamanho: number; // Field size

  @Column({ name: 'X3_DECIMAL' })
  x3Decimal: number; // Decimal places (for numeric fields)

  @Column({ name: 'X3_OBRIGAT' })
  x3Obrigat: string; // Required field: S=Yes, N=No

  @Column({ name: 'X3_PICTURE' })
  x3Picture: string; // Field mask/picture

  @Column({ name: 'X3_F3' })
  x3F3: string; // F3 lookup/consultation

  @Column({ name: 'X3_ORDEM' })
  x3Ordem: string; // Field order

  @Column({ name: 'X3_VALID' })
  x3Valid: string; // Validation expression

  @Column({ name: 'X3_WHEN' })
  x3When: string; // When to enable field

  @Column({ name: 'X3_CONTEXT' })
  x3Context: string; // Field context

  @Column({ name: 'X3_RELACAO' })
  x3Relacao: string; // Default value expression

  @Column({ name: 'D_E_L_E_T_' })
  deleted: string; // Soft delete flag: '' or '*'
}
