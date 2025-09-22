import { TranslationKeys } from '../locales';

/**
 * Safely get nested translation value with fallback
 */
export const getTranslation = (
  translations: TranslationKeys | undefined,
  path: string,
  fallback: string = ''
): string => {
  if (!translations) {
    console.warn(`Translations not loaded, using fallback for path: ${path}`);
    return fallback || path;
  }

  try {
    const keys = path.split('.');
    let current: any = translations;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        console.warn(`Translation path not found: ${path}, using fallback: ${fallback || path}`);
        return fallback || path;
      }
    }

    return typeof current === 'string' ? current : fallback || path;
  } catch (error) {
    console.error(`Error getting translation for path: ${path}`, error);
    return fallback || path;
  }
};

/**
 * Check if translation path exists
 */
export const hasTranslation = (
  translations: TranslationKeys | undefined,
  path: string
): boolean => {
  if (!translations) return false;

  try {
    const keys = path.split('.');
    let current: any = translations;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return false;
      }
    }

    return typeof current === 'string';
  } catch {
    return false;
  }
};

/**
 * Get all missing translation keys by comparing with reference
 */
export const getMissingTranslations = (
  referenceTranslations: TranslationKeys,
  targetTranslations: TranslationKeys
): string[] => {
  const missing: string[] = [];

  const traverse = (ref: any, target: any, prefix = ''): void => {
    for (const key in ref) {
      const currentPath = prefix ? `${prefix}.${key}` : key;

      if (typeof ref[key] === 'object' && ref[key] !== null) {
        if (!target[key] || typeof target[key] !== 'object') {
          missing.push(currentPath);
        } else {
          traverse(ref[key], target[key], currentPath);
        }
      } else {
        if (!(key in target) || typeof target[key] !== 'string') {
          missing.push(currentPath);
        }
      }
    }
  };

  traverse(referenceTranslations, targetTranslations);
  return missing;
};

/**
 * Validate translation completeness
 */
export const validateTranslations = (
  translations: Record<string, TranslationKeys>,
  referenceLanguage: keyof typeof translations = 'pt-BR'
): { isValid: boolean; errors: Array<{ language: string; missingKeys: string[] }> } => {
  const reference = translations[referenceLanguage];
  const errors: Array<{ language: string; missingKeys: string[] }> = [];

  if (!reference) {
    return {
      isValid: false,
      errors: [{ language: String(referenceLanguage), missingKeys: ['Reference language not found'] }]
    };
  }

  for (const [language, translationData] of Object.entries(translations)) {
    if (language === referenceLanguage) continue;

    const missingKeys = getMissingTranslations(reference, translationData);
    if (missingKeys.length > 0) {
      errors.push({
        language,
        missingKeys
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format message with interpolation, with error handling
 */
export const formatMessage = (
  template: string,
  params?: Record<string, any>
): string => {
  if (!params) return template;

  try {
    let result = template;
    for (const [key, value] of Object.entries(params)) {
      const placeholder = `{{${key}}}`;
      const replacement = value != null ? String(value) : '';
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacement);
    }
    return result;
  } catch (error) {
    console.error('Error formatting message:', error);
    return template;
  }
};

/**
 * Hook for safe translation access
 */
export const useSafeTranslation = (translations: TranslationKeys | undefined) => {
  const t = (path: string, fallback?: string): string => {
    return getTranslation(translations, path, fallback);
  };

  const hasT = (path: string): boolean => {
    return hasTranslation(translations, path);
  };

  const formatT = (path: string, params?: Record<string, any>, fallback?: string): string => {
    const template = getTranslation(translations, path, fallback);
    return formatMessage(template, params);
  };

  return { t, hasT, formatT };
};