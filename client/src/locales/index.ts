import { ptBR } from './pt-BR';
import { en } from './en';
import { es } from './es';

// Exportar como const e inferir o tipo
export const LANGUAGES = {
  'pt-BR': 'pt-BR',
  'en': 'en',
  'es': 'es'
} as const;

export type Language = keyof typeof LANGUAGES;
export type TranslationKeys = typeof ptBR;

// Data exports
export const translations: Record<Language, TranslationKeys> = {
  'pt-BR': ptBR,
  'en': en,
  'es': es,
};

export const languages = [
  { code: 'pt-BR' as const, name: 'Português (BR)', flag: '🇧🇷' },
  { code: 'en' as const, name: 'English', flag: '🇺🇸' },
  { code: 'es' as const, name: 'Español', flag: '🇪🇸' },
];

export const defaultLanguage: Language = 'pt-BR';

// Re-export translations
export { ptBR, en, es };