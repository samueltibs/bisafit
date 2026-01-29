/**
 * Hook for validating and sanitizing dynamic content
 * 
 * Use this hook to safely display AI-generated or database content
 * while enforcing language rules.
 */

import { useCallback } from 'react';
import { useLanguage } from './LanguageContext';
import { logLanguageViolation, detectLanguageViolation } from './languageGuard';

interface ContentValidationResult {
  /** Whether the content is safe to display */
  isValid: boolean;
  /** The sanitized content (original if valid, fallback if not) */
  content: string;
  /** Whether a fallback was used */
  usedFallback: boolean;
}

/**
 * Hook for validating dynamic content against language rules
 */
export function useContentValidation() {
  const { language } = useLanguage();

  /**
   * Validate and sanitize a string for display
   * @param text The text to validate
   * @param fallback Fallback to use if validation fails
   * @param context Optional context for logging
   */
  const validate = useCallback((
    text: string | null | undefined,
    fallback: string,
    context?: { recordId?: string; field?: string; component?: string }
  ): ContentValidationResult => {
    if (!text) {
      return { isValid: false, content: fallback, usedFallback: true };
    }

    const { hasViolation } = detectLanguageViolation(text, language);

    if (hasViolation) {
      // Log violation in dev mode
      if (context) {
        logLanguageViolation({
          ...context,
          expectedLanguage: language,
          text,
        });
      }

      return { isValid: false, content: fallback, usedFallback: true };
    }

    return { isValid: true, content: text, usedFallback: false };
  }, [language]);

  /**
   * Validate an array of strings
   */
  const validateArray = useCallback((
    items: (string | null | undefined)[],
    fallback: string,
    context?: { recordId?: string; field?: string; component?: string }
  ): string[] => {
    return items.map((item, index) => 
      validate(item, fallback, context ? { ...context, field: `${context.field}[${index}]` } : undefined).content
    );
  }, [validate]);

  /**
   * Check if text is valid for the current language
   */
  const isValid = useCallback((text: string | null | undefined): boolean => {
    if (!text) return true;
    const { hasViolation } = detectLanguageViolation(text, language);
    return !hasViolation;
  }, [language]);

  return {
    validate,
    validateArray,
    isValid,
    language,
  };
}
