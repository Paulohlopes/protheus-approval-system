import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { translations, defaultLanguage } from '../locales';
import type { Language, TranslationKeys } from '../locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
  formatMessage: (key: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
      return savedLanguage && translations[savedLanguage] ? savedLanguage : defaultLanguage;
    } catch (error) {
      console.warn('Failed to access localStorage for language preference:', error);
      return defaultLanguage;
    }
  });

  const setLanguage = useCallback((lang: Language) => {
    if (!translations[lang]) {
      console.warn(`Language '${lang}' not available, using default`);
      return;
    }

    setLanguageState(lang);

    try {
      localStorage.setItem('preferredLanguage', lang);
    } catch (error) {
      console.warn('Failed to save language preference to localStorage:', error);
    }
  }, []);

  const formatMessage = useCallback((key: string, params?: Record<string, any>): string => {
    let message = key;
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        message = message.replace(`{{${param}}}`, String(value));
      });
    }
    return message;
  }, []);

  const t = useMemo(() => {
    const currentTranslations = translations[language];
    if (!currentTranslations) {
      console.warn(`Translations for language '${language}' not found, using default`);
      return translations[defaultLanguage];
    }
    return currentTranslations;
  }, [language]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
    formatMessage
  }), [language, setLanguage, t, formatMessage]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};