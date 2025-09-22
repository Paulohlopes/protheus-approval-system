import type { ptBR } from './pt-BR';

export type Language = 'pt-BR' | 'en' | 'es';

export type TranslationKeys = typeof ptBR;

export interface LanguageInfo {
  code: Language;
  name: string;
  flag: string;
}