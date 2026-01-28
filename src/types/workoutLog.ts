/**
 * Workout Log Types for imported workouts from external sources
 */

import type { Json } from '@/integrations/supabase/types';

export type WorkoutSource = 'bisafit' | 'apple_health' | 'google_fit';

export type WorkoutType = 
  | 'strength'
  | 'running'
  | 'cycling'
  | 'walking'
  | 'hiit'
  | 'yoga'
  | 'swimming'
  | 'elliptical'
  | 'rowing'
  | 'stair_stepper'
  | 'other';

export interface WorkoutLog {
  id: string;
  user_id: string;
  source: WorkoutSource;
  external_id?: string | null;
  start_time: string;
  end_time?: string | null;
  duration_minutes: number;
  workout_type: string;
  calories_burned?: number | null;
  heart_rate_avg?: number | null;
  steps?: number | null;
  distance_meters?: number | null;
  metadata?: Json | null;
  user_notes?: string | null;
  linked_workout_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutLogInsert {
  source: WorkoutSource;
  external_id?: string | null;
  start_time: string;
  end_time?: string | null;
  duration_minutes: number;
  workout_type: string;
  calories_burned?: number | null;
  heart_rate_avg?: number | null;
  steps?: number | null;
  distance_meters?: number | null;
  metadata?: Json | null;
  user_notes?: string | null;
  linked_workout_id?: string | null;
}

export interface WorkoutLogUpdate {
  user_notes?: string | null;
  linked_workout_id?: string | null;
}

// External health data types (normalized from Apple Health / Google Fit)
export interface ExternalWorkoutData {
  externalId: string;
  source: 'apple_health' | 'google_fit';
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  workoutType: string;
  caloriesBurned?: number;
  heartRateAvg?: number;
  steps?: number;
  distanceMeters?: number;
  rawData?: Json;
}

// Filter options for workout history
export type WorkoutSourceFilter = 'all' | WorkoutSource;

// Helper to get display label for source
export function getSourceDisplayName(source: WorkoutSource): string {
  switch (source) {
    case 'bisafit':
      return 'BisaFit';
    case 'apple_health':
      return 'Apple Watch';
    case 'google_fit':
      return 'Google Fit';
    default:
      return source;
  }
}

// Helper to get source badge color
export function getSourceBadgeColor(source: WorkoutSource): string {
  switch (source) {
    case 'apple_health':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
    case 'google_fit':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'bisafit':
    default:
      return 'bg-primary/10 text-primary';
  }
}

// Helper to format workout type for display
export function formatWorkoutType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
