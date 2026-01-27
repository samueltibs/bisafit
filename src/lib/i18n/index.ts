/**
 * Internationalization (i18n) module
 * 
 * Provides translation functions, language context, and runtime guards
 * for strict language enforcement.
 */

export { translations, en, lg, sw, type TranslationKey } from './translations';
export { 
  detectLanguageViolation, 
  logLanguageViolation, 
  sanitizeForLanguage,
  isTextSafeForLanguage,
} from './languageGuard';
export { LanguageProvider, useLanguage, useTranslation } from './LanguageContext';
export { 
  getDayTranslationKey, 
  translateDay, 
  translateDays, 
  translateWorkoutType,
  translateGoal,
  translateExperience,
} from './dayTranslations';
export { useContentValidation } from './useContentValidation';
