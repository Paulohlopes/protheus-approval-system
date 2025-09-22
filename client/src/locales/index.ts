import { ptBR } from './pt-BR';
import { en } from './en';
import { es } from './es';

export type Language = 'pt-BR' | 'en' | 'es';

export type TranslationKeys = typeof ptBR;

export const translations: Record<Language, TranslationKeys> = {
  'pt-BR': ptBR,
  'en': en,
  'es': es,
};

export const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'pt-BR', name: 'Português (BR)', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export const defaultLanguage: Language = 'pt-BR';