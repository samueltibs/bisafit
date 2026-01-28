/**
 * Workout title utilities for structured naming and localization
 * 
 * This module provides:
 * 1. Structured workout metadata (programKey, dayNumber, focusKey)
 * 2. Title localization based on user language
 * 3. Parsing of legacy mixed-language titles
 * 4. Fallback to English for missing translations
 */

import type { TranslationKey } from './i18n/translations';

// Supported program keys
export type ProgramKey = 
  | 'foundation'
  | 'progression'
  | 'peak'
  | 'deload'
  | 'strength'
  | 'conditioning'
  | 'mobility'
  | 'custom';

// Supported focus keys  
export type FocusKey =
  | 'balance'
  | 'strength'
  | 'stability'
  | 'power'
  | 'endurance'
  | 'recovery'
  | 'mobility'
  | 'core'
  | 'upper_body'
  | 'lower_body'
  | 'full_body'
  | 'hiit'
  | 'cardio';

// Structured workout metadata stored in workout_json
export interface WorkoutMetadata {
  programKey: ProgramKey;
  dayNumber?: number;
  variant?: string; // A, B, etc.
  focusKey?: FocusKey;
  titleKey?: string; // e.g., "workout.title.foundation_day"
  // Legacy field - kept for backward compatibility but not used for display
  title?: string;
}

// Chinese to focusKey mapping for legacy data cleanup
const CHINESE_FOCUS_MAP: Record<string, FocusKey> = {
  '均衡': 'balance',
  '强化': 'strength', 
  '稳定': 'stability',
  '力量': 'power',
  '耐力': 'endurance',
  '恢复': 'recovery',
  '灵活': 'mobility',
  '核心': 'core',
};

// Pattern to extract structured info from legacy titles
// Examples: "Foundation Day 2均衡" -> programKey=foundation, dayNumber=2, focusKey=balance
const LEGACY_TITLE_PATTERN = /^(Foundation|Progression|Peak|Deload|Strength|Conditioning|Mobility)\s*(?:Day\s*)?(\d+)?([AB])?\s*(.*)$/i;

/**
 * Parse a legacy title string into structured metadata
 */
export function parseLegacyTitle(title: string): Partial<WorkoutMetadata> {
  const match = title.match(LEGACY_TITLE_PATTERN);
  
  if (!match) {
    // Try to extract any Chinese characters for focus
    const chineseMatch = title.match(/[\u4e00-\u9fff]+/);
    if (chineseMatch) {
      const focusKey = CHINESE_FOCUS_MAP[chineseMatch[0]];
      const cleanTitle = title.replace(/[\u4e00-\u9fff]+/, '').trim();
      return {
        programKey: 'custom',
        focusKey,
        title: cleanTitle || title,
      };
    }
    return { programKey: 'custom', title };
  }

  const [, program, dayNum, variant, rest] = match;
  const programKey = program.toLowerCase() as ProgramKey;
  const dayNumber = dayNum ? parseInt(dayNum, 10) : undefined;
  
  // Check for Chinese focus in the rest
  let focusKey: FocusKey | undefined;
  let remainingText = rest?.trim() || '';
  
  for (const [chinese, key] of Object.entries(CHINESE_FOCUS_MAP)) {
    if (remainingText.includes(chinese)) {
      focusKey = key;
      remainingText = remainingText.replace(chinese, '').trim();
      break;
    }
  }
  
  // Also check for English focus keywords
  if (!focusKey && remainingText) {
    const lowerRest = remainingText.toLowerCase();
    if (lowerRest.includes('balance')) focusKey = 'balance';
    else if (lowerRest.includes('strength')) focusKey = 'strength';
    else if (lowerRest.includes('stability')) focusKey = 'stability';
    else if (lowerRest.includes('power')) focusKey = 'power';
    else if (lowerRest.includes('recovery')) focusKey = 'recovery';
    else if (lowerRest.includes('mobility')) focusKey = 'mobility';
    else if (lowerRest.includes('upper body') || lowerRest.includes('upper')) focusKey = 'upper_body';
    else if (lowerRest.includes('lower body') || lowerRest.includes('lower')) focusKey = 'lower_body';
    else if (lowerRest.includes('full body') || lowerRest.includes('full')) focusKey = 'full_body';
    else if (lowerRest.includes('hiit')) focusKey = 'hiit';
    else if (lowerRest.includes('cardio')) focusKey = 'cardio';
    else if (lowerRest.includes('core')) focusKey = 'core';
    else if (lowerRest.includes('endurance')) focusKey = 'endurance';
  }

  return {
    programKey,
    dayNumber,
    variant: variant || undefined,
    focusKey,
    titleKey: `workout.title.${programKey}`,
  };
}

/**
 * Check if a string contains non-Latin characters that indicate mixed language
 */
export function hasMixedLanguageCharacters(text: string): boolean {
  // Check for Chinese characters
  if (/[\u4e00-\u9fff]/.test(text)) return true;
  // Check for Japanese characters (Hiragana, Katakana)
  if (/[\u3040-\u30ff]/.test(text)) return true;
  // Check for Arabic characters
  if (/[\u0600-\u06ff]/.test(text)) return true;
  // Check for Cyrillic characters
  if (/[\u0400-\u04ff]/.test(text)) return true;
  return false;
}

/**
 * Clean a workout title by removing mixed-language characters
 * Returns a clean English-only title
 */
export function cleanWorkoutTitle(title: string): string {
  // Remove Chinese characters and their surrounding whitespace
  let cleaned = title.replace(/[\u4e00-\u9fff]+/g, '').trim();
  // Remove Japanese characters
  cleaned = cleaned.replace(/[\u3040-\u30ff]+/g, '').trim();
  // Remove Arabic characters
  cleaned = cleaned.replace(/[\u0600-\u06ff]+/g, '').trim();
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned || title;
}

// Translation keys for program names
const PROGRAM_TRANSLATION_KEYS: Record<ProgramKey, TranslationKey> = {
  'foundation': 'workout.program.foundation',
  'progression': 'workout.program.progression',
  'peak': 'workout.program.peak',
  'deload': 'workout.program.deload',
  'strength': 'workout.program.strength',
  'conditioning': 'workout.program.conditioning',
  'mobility': 'workout.program.mobility',
  'custom': 'workout.program.custom',
};

// Translation keys for focus labels
const FOCUS_TRANSLATION_KEYS: Record<FocusKey, TranslationKey> = {
  'balance': 'workout.focus.balance',
  'strength': 'workout.focus.strength',
  'stability': 'workout.focus.stability',
  'power': 'workout.focus.power',
  'endurance': 'workout.focus.endurance',
  'recovery': 'workout.focus.recovery',
  'mobility': 'workout.focus.mobility',
  'core': 'workout.focus.core',
  'upper_body': 'workout.focus.upper_body',
  'lower_body': 'workout.focus.lower_body',
  'full_body': 'workout.focus.full_body',
  'hiit': 'workout.focus.hiit',
  'cardio': 'workout.focus.cardio',
};

/**
 * Get the translation key for a program
 */
export function getProgramTranslationKey(programKey: ProgramKey): TranslationKey {
  return PROGRAM_TRANSLATION_KEYS[programKey] || 'workout.program.custom';
}

/**
 * Get the translation key for a focus
 */
export function getFocusTranslationKey(focusKey: FocusKey): TranslationKey {
  return FOCUS_TRANSLATION_KEYS[focusKey] || 'workout.focus.strength';
}

/**
 * Build a localized workout title from structured metadata
 * 
 * @param metadata Structured workout metadata
 * @param t Translation function
 * @returns Localized workout title
 */
export function buildLocalizedTitle(
  metadata: Partial<WorkoutMetadata>,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): string {
  const { programKey, dayNumber, variant, focusKey } = metadata;
  
  if (!programKey || programKey === 'custom') {
    // For custom workouts, use cleaned legacy title or generic
    return metadata.title ? cleanWorkoutTitle(metadata.title) : t('workout.generic');
  }
  
  // Get localized program name
  const programName = t(getProgramTranslationKey(programKey));
  
  // Build title parts
  const parts: string[] = [programName];
  
  if (dayNumber) {
    parts.push(`${t('workout.day')} ${dayNumber}`);
  }
  
  if (variant) {
    parts.push(variant);
  }
  
  // Add focus if present (don't duplicate strength/etc if already in program name)
  if (focusKey && programKey !== focusKey) {
    parts.push(`- ${t(getFocusTranslationKey(focusKey))}`);
  }
  
  return parts.join(' ');
}

/**
 * Get a display-safe workout title
 * Handles legacy titles, mixed-language cleanup, and localization
 * 
 * @param workoutJson The workout JSON containing title and metadata
 * @param t Translation function
 * @returns Safe localized title
 */
export function getDisplayWorkoutTitle(
  workoutJson: { title?: string; metadata?: Partial<WorkoutMetadata> } | null | undefined,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): string {
  if (!workoutJson) {
    return t('workout.generic');
  }
  
  // If structured metadata exists, use it for localization
  if (workoutJson.metadata?.programKey) {
    return buildLocalizedTitle(workoutJson.metadata, t);
  }
  
  // If title exists, check for mixed language
  if (workoutJson.title) {
    if (hasMixedLanguageCharacters(workoutJson.title)) {
      // Parse and clean the legacy title
      const parsed = parseLegacyTitle(workoutJson.title);
      if (parsed.programKey && parsed.programKey !== 'custom') {
        return buildLocalizedTitle(parsed, t);
      }
      // Fallback: just clean the title
      return cleanWorkoutTitle(workoutJson.title);
    }
    // Clean title, return as-is
    return workoutJson.title;
  }
  
  return t('workout.generic');
}

/**
 * Extract metadata from a workout JSON for database update
 * Use this to migrate legacy titles to structured format
 */
export function extractMetadataFromTitle(title: string): WorkoutMetadata {
  const parsed = parseLegacyTitle(title);
  return {
    programKey: parsed.programKey || 'custom',
    dayNumber: parsed.dayNumber,
    variant: parsed.variant,
    focusKey: parsed.focusKey,
    titleKey: parsed.titleKey,
    title: cleanWorkoutTitle(title),
  };
}
