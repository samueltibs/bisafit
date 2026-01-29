/**
 * Language Context Provider
 * 
 * Provides the current language and translation functions to the entire app.
 * Resolves 'auto' setting to device language, persists selection.
 */

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { translations, type TranslationKey, en } from './translations';
import { resolveLanguage } from '@/lib/languageUtils';
import { logLanguageViolation, sanitizeForLanguage } from './languageGuard';

interface LanguageContextValue {
  /** Current resolved language code (never 'auto') */
  language: string;
  /** Raw stored preference (may be 'auto') */
  storedLanguage: string | null;
  /** Get translated string by key */
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  /** Safely display dynamic text, falling back if language violation detected */
  safeText: (
    text: string | null | undefined,
    fallbackKey: TranslationKey,
    context?: { recordId?: string; field?: string; component?: string }
  ) => string;
  /** Check if current language is English */
  isEnglish: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
  children: React.ReactNode;
  /** Stored language preference from user profile (may be 'auto') */
  storedLanguage: string | null;
}

export function LanguageProvider({ children, storedLanguage }: LanguageProviderProps) {
  // Resolve the actual language to use
  const language = useMemo(() => resolveLanguage(storedLanguage), [storedLanguage]);
  const isEnglish = language === 'en';
  
  // Get translation for a key
  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    const langTranslations = translations[language] || translations.en;
    let text = langTranslations[key];
    
    // Fallback to English if translation missing
    if (!text) {
      text = en[key];
      
      // Log missing translation in dev mode
      if (process.env.NODE_ENV === 'development' && language !== 'en') {
        console.warn(`[i18n] Missing translation for key "${key}" in language "${language}"`);
      }
    }
    
    // Substitute parameters if provided
    if (params && text) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      }
    }
    
    return text || key;
  }, [language]);
  
  // Safely display dynamic text with language guard
  const safeText = useCallback((
    text: string | null | undefined,
    fallbackKey: TranslationKey,
    context?: { recordId?: string; field?: string; component?: string }
  ): string => {
    const fallback = t(fallbackKey);
    
    if (!text) return fallback;
    
    return sanitizeForLanguage(text, language, fallback, context);
  }, [language, t]);
  
  const value = useMemo(() => ({
    language,
    storedLanguage,
    t,
    safeText,
    isEnglish,
  }), [language, storedLanguage, t, safeText, isEnglish]);
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access language context
 */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  
  if (!context) {
    // Return a fallback for when used outside provider (shouldn't happen in prod)
    return {
      language: 'en',
      storedLanguage: null,
      t: (key) => en[key] || key,
      safeText: (text, fallbackKey) => text || en[fallbackKey] || fallbackKey,
      isEnglish: true,
    };
  }
  
  return context;
}

/**
 * Simplified hook just for translations
 */
export function useTranslation() {
  const { t, safeText, language } = useLanguage();
  return { t, safeText, language };
}
