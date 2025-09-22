import { ptBR } from './pt-BR';
import { en } from './en';
import { es } from './es';

// Type definitions
export type Language = 'pt-BR' | 'en' | 'es';
export type TranslationKeys = typeof ptBR;

// Data exports
export const translations: Record<Language, TranslationKeys> = {
  'pt-BR': ptBR,
  'en': en,
  'es': es,
};

export const languages: Array<{ code: Language; name: string; flag: string }> = [
  { code: 'pt-BR', name: 'Português (BR)', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export const defaultLanguage: Language = 'pt-BR';

// Re-export translations
export { ptBR, en, es };

// Re-export types from types file
export type { Language as LanguageType } from './types';