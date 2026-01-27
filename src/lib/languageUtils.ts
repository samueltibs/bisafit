/**
 * Language utilities for BisaFit
 * 
 * Manages language detection, selection, and persistence.
 * Language is stored as ISO 639-1 code (e.g., 'en', 'lg', 'sw') or 'auto' for device language.
 */

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'auto', name: 'Auto (device language)', nativeName: 'Auto' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'lg', name: 'Luganda', nativeName: 'Oluganda' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
];

/**
 * Get language by code
 */
export function getLanguageByCode(code: string | null): Language | undefined {
  if (!code) return undefined;
  return SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase() === code.toLowerCase());
}

/**
 * Get display name for a language code
 */
export function getLanguageName(code: string | null): string {
  const lang = getLanguageByCode(code);
  return lang?.name || 'Not set';
}

/**
 * Detect language from browser/device settings
 * Returns ISO 639-1 language code or 'en' as fallback
 */
export function detectLanguageFromDevice(): string {
  try {
    const locale = navigator.language || navigator.languages?.[0];
    if (!locale) return 'en';

    // Extract language code from locale (e.g., 'en-US' -> 'en')
    const langCode = locale.split('-')[0].toLowerCase();
    
    // Check if it's a supported language (excluding 'auto')
    const supportedLang = SUPPORTED_LANGUAGES.find(
      (l) => l.code !== 'auto' && l.code.toLowerCase() === langCode
    );
    
    return supportedLang?.code || 'en';
  } catch {
    return 'en';
  }
}

/**
 * Resolve the actual language to use
 * If 'auto', returns detected device language
 * Otherwise returns the stored preference
 */
export function resolveLanguage(storedLanguage: string | null): string {
  if (!storedLanguage || storedLanguage === 'auto') {
    return detectLanguageFromDevice();
  }
  
  // Validate stored language is still supported
  const lang = getLanguageByCode(storedLanguage);
  if (lang && lang.code !== 'auto') {
    return lang.code;
  }
  
  return detectLanguageFromDevice();
}

/**
 * Get the language options for display in selectors
 * Returns all supported languages including 'auto'
 */
export function getLanguageOptions(): Language[] {
  return SUPPORTED_LANGUAGES;
}
