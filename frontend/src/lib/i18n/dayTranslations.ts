/**
 * Day name translation utilities
 * 
 * Maps English day names to translation keys and provides
 * functions for translating day names in the selected language.
 */

import { type TranslationKey } from './translations';

// Map full day names to translation keys
const DAY_NAME_KEYS: Record<string, TranslationKey> = {
  'monday': 'day.monday',
  'tuesday': 'day.tuesday',
  'wednesday': 'day.wednesday',
  'thursday': 'day.thursday',
  'friday': 'day.friday',
  'saturday': 'day.saturday',
  'sunday': 'day.sunday',
};

// Map short day names to translation keys
const SHORT_DAY_KEYS: Record<string, TranslationKey> = {
  'mon': 'day.mon',
  'tue': 'day.tue',
  'wed': 'day.wed',
  'thu': 'day.thu',
  'fri': 'day.fri',
  'sat': 'day.sat',
  'sun': 'day.sun',
};

/**
 * Get translation key for a day name
 * Handles both full and short day names
 */
export function getDayTranslationKey(dayName: string): TranslationKey | null {
  const normalized = dayName.toLowerCase().trim();
  return DAY_NAME_KEYS[normalized] || SHORT_DAY_KEYS[normalized] || null;
}

/**
 * Translate a day name using the provided translation function
 */
export function translateDay(
  dayName: string,
  t: (key: TranslationKey) => string
): string {
  const key = getDayTranslationKey(dayName);
  if (key) {
    return t(key);
  }
  // Return original if no translation key found (shouldn't happen)
  return dayName;
}

/**
 * Translate an array of day names
 */
export function translateDays(
  dayNames: string[],
  t: (key: TranslationKey) => string
): string[] {
  return dayNames.map(day => translateDay(day, t));
}

// Workout type translation keys
const WORKOUT_TYPE_KEYS: Record<string, TranslationKey> = {
  'strength': 'workout.type.strength',
  'cardio': 'workout.type.cardio',
  'recovery': 'workout.type.recovery',
  'core': 'workout.type.core',
  'rest': 'workout.type.rest',
  'conditioning': 'workout.type.conditioning',
};

/**
 * Translate a workout type
 */
export function translateWorkoutType(
  type: string,
  t: (key: TranslationKey) => string
): string {
  const normalized = type.toLowerCase().trim();
  const key = WORKOUT_TYPE_KEYS[normalized];
  if (key) {
    return t(key);
  }
  // Return original with first letter capitalized if no translation
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

// Goal translation keys
const GOAL_KEYS: Record<string, TranslationKey> = {
  'fat_loss': 'goal.fatLoss',
  'muscle_gain': 'goal.muscleGain',
  'endurance': 'goal.endurance',
  'maintenance': 'goal.maintenance',
};

/**
 * Translate a goal value
 */
export function translateGoal(
  goal: string,
  t: (key: TranslationKey) => string
): string {
  const key = GOAL_KEYS[goal];
  if (key) {
    return t(key);
  }
  // Return formatted goal name if no translation
  return goal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Experience level translation keys  
const EXPERIENCE_KEYS: Record<string, TranslationKey> = {
  'beginner': 'experience.beginner',
  'intermediate': 'experience.intermediate',
  'advanced': 'experience.advanced',
};

/**
 * Translate an experience level
 */
export function translateExperience(
  level: string,
  t: (key: TranslationKey) => string
): string {
  const key = EXPERIENCE_KEYS[level];
  if (key) {
    return t(key);
  }
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}
