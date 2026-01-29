/**
 * Hook for getting localized workout titles
 * 
 * Provides a function to safely get display titles for workouts,
 * handling mixed-language cleanup and localization automatically.
 */

import { useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { 
  getDisplayWorkoutTitle, 
  hasMixedLanguageCharacters,
  cleanWorkoutTitle,
  type WorkoutMetadata,
} from '@/lib/workoutTitleUtils';
import type { WorkoutJson } from '@/types/plan';

interface UseWorkoutTitleResult {
  /**
   * Get a localized, safe display title for a workout
   */
  getTitle: (workoutJson: WorkoutJson | null | undefined, fallbackTitle?: string) => string;
  
  /**
   * Check if a title needs cleaning (has mixed language characters)
   */
  needsCleaning: (title: string) => boolean;
  
  /**
   * Clean a title by removing non-Latin characters
   */
  cleanTitle: (title: string) => string;
}

/**
 * Hook for working with localized workout titles
 */
export function useWorkoutTitle(): UseWorkoutTitleResult {
  const { t } = useTranslation();
  
  const getTitle = useCallback((
    workoutJson: WorkoutJson | null | undefined,
    fallbackTitle?: string
  ): string => {
    if (!workoutJson) {
      return fallbackTitle || t('workout.generic');
    }
    
    // Cast to include potential metadata
    const jsonWithMeta = workoutJson as WorkoutJson & { metadata?: Partial<WorkoutMetadata> };
    
    // Use getDisplayWorkoutTitle which handles all cases
    const title = getDisplayWorkoutTitle(
      { title: workoutJson.title, metadata: jsonWithMeta.metadata },
      t
    );
    
    return title || fallbackTitle || t('workout.generic');
  }, [t]);
  
  const needsCleaning = useCallback((title: string): boolean => {
    return hasMixedLanguageCharacters(title);
  }, []);
  
  const cleanTitle = useCallback((title: string): string => {
    return cleanWorkoutTitle(title);
  }, []);
  
  return {
    getTitle,
    needsCleaning,
    cleanTitle,
  };
}
