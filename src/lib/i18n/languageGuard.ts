/**
 * Language Guard - Runtime detection and validation of string language
 * 
 * Detects if a string contains characters from unexpected languages
 * and logs violations in development mode.
 */

// Unicode ranges for script detection
const SCRIPT_PATTERNS = {
  // Latin script (English and most European languages)
  latin: /[\u0020-\u007F\u00A0-\u00FF\u0100-\u017F\u0180-\u024F]/,
  // Extended Latin (includes more accented chars)
  latinExtended: /[\u1E00-\u1EFF\u2C60-\u2C7F\uA720-\uA7FF]/,
  // Arabic script
  arabic: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/,
  // CJK (Chinese, Japanese, Korean)
  cjk: /[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/,
  // Cyrillic
  cyrillic: /[\u0400-\u04FF\u0500-\u052F]/,
  // Devanagari (Hindi)
  devanagari: /[\u0900-\u097F]/,
  // Bengali
  bengali: /[\u0980-\u09FF]/,
  // Common punctuation & symbols (allowed in all languages)
  common: /[\u0000-\u001F\u2000-\u206F\u2070-\u209F\u20A0-\u20CF\u2100-\u214F\u2190-\u21FF\u2200-\u22FF\u2300-\u23FF\u2600-\u26FF\u2700-\u27BF\uFE00-\uFE0F]/,
  // Numbers and basic punctuation (allowed everywhere)
  numbers: /[0-9.,!?:;'"()\[\]{}\-–—\/\\@#$%^&*+=<>|~`_]/,
};

// Map language codes to expected script patterns
const LANGUAGE_SCRIPTS: Record<string, RegExp[]> = {
  en: [SCRIPT_PATTERNS.latin, SCRIPT_PATTERNS.latinExtended],
  lg: [SCRIPT_PATTERNS.latin, SCRIPT_PATTERNS.latinExtended], // Luganda uses Latin script
  sw: [SCRIPT_PATTERNS.latin, SCRIPT_PATTERNS.latinExtended], // Swahili uses Latin script
};

// Characters that are universally allowed
const UNIVERSAL_PATTERNS = [
  SCRIPT_PATTERNS.common,
  SCRIPT_PATTERNS.numbers,
];

/**
 * Check if a character is allowed for a given language
 */
function isCharAllowedForLanguage(char: string, language: string): boolean {
  // Check universal patterns first
  for (const pattern of UNIVERSAL_PATTERNS) {
    if (pattern.test(char)) return true;
  }
  
  // Check language-specific patterns
  const allowedPatterns = LANGUAGE_SCRIPTS[language] || LANGUAGE_SCRIPTS.en;
  for (const pattern of allowedPatterns) {
    if (pattern.test(char)) return true;
  }
  
  return false;
}

/**
 * Detect which scripts are present in a string
 */
function detectScripts(text: string): Set<string> {
  const detectedScripts = new Set<string>();
  
  for (const char of text) {
    for (const [scriptName, pattern] of Object.entries(SCRIPT_PATTERNS)) {
      if (pattern.test(char)) {
        detectedScripts.add(scriptName);
      }
    }
  }
  
  return detectedScripts;
}

/**
 * Check if a string contains characters that violate the expected language
 */
export function detectLanguageViolation(
  text: string,
  expectedLanguage: string
): { hasViolation: boolean; violatingChars: string[]; detectedScripts: string[] } {
  if (!text || typeof text !== 'string') {
    return { hasViolation: false, violatingChars: [], detectedScripts: [] };
  }
  
  const violatingChars: string[] = [];
  
  for (const char of text) {
    if (!isCharAllowedForLanguage(char, expectedLanguage)) {
      violatingChars.push(char);
    }
  }
  
  const detectedScripts = Array.from(detectScripts(text));
  
  return {
    hasViolation: violatingChars.length > 0,
    violatingChars: [...new Set(violatingChars)], // Unique chars only
    detectedScripts,
  };
}

/**
 * Log a language violation warning in development mode
 */
export function logLanguageViolation(
  context: {
    recordId?: string;
    field?: string;
    component?: string;
    expectedLanguage: string;
    text: string;
  }
): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const { hasViolation, violatingChars, detectedScripts } = detectLanguageViolation(
    context.text,
    context.expectedLanguage
  );
  
  if (!hasViolation) return;
  
  const location = [
    context.component && `component="${context.component}"`,
    context.recordId && `id="${context.recordId}"`,
    context.field && `field="${context.field}"`,
  ].filter(Boolean).join(' ');
  
  console.warn(
    `[i18n] Language violation detected ${location}:\n` +
    `  Expected: ${context.expectedLanguage}\n` +
    `  Detected scripts: ${detectedScripts.join(', ')}\n` +
    `  Violating chars: ${violatingChars.join('')}\n` +
    `  Text preview: "${context.text.substring(0, 100)}${context.text.length > 100 ? '...' : ''}"`
  );
}

/**
 * Sanitize a string by returning a fallback if it violates language rules
 * @param text The text to check
 * @param expectedLanguage The expected language code
 * @param fallback The fallback to use if violation detected
 * @param context Optional context for logging
 */
export function sanitizeForLanguage(
  text: string | null | undefined,
  expectedLanguage: string,
  fallback: string,
  context?: { recordId?: string; field?: string; component?: string }
): string {
  if (!text) return fallback;
  
  const { hasViolation } = detectLanguageViolation(text, expectedLanguage);
  
  if (hasViolation) {
    if (context) {
      logLanguageViolation({
        ...context,
        expectedLanguage,
        text,
      });
    }
    return fallback;
  }
  
  return text;
}

/**
 * Check if text is safe for the given language
 */
export function isTextSafeForLanguage(text: string, language: string): boolean {
  const { hasViolation } = detectLanguageViolation(text, language);
  return !hasViolation;
}
