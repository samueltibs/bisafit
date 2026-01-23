import type { Database } from '@/integrations/supabase/types';

// Table row types
export type UserProfile = Database['public']['Tables']['users_profile']['Row'];
export type UserProfileInsert = Database['public']['Tables']['users_profile']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['users_profile']['Update'];

export type Plan = Database['public']['Tables']['plans']['Row'];
export type PlanInsert = Database['public']['Tables']['plans']['Insert'];
export type PlanUpdate = Database['public']['Tables']['plans']['Update'];

export type Workout = Database['public']['Tables']['workouts']['Row'];
export type WorkoutInsert = Database['public']['Tables']['workouts']['Insert'];
export type WorkoutUpdate = Database['public']['Tables']['workouts']['Update'];

export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row'];
export type WorkoutSessionInsert = Database['public']['Tables']['workout_sessions']['Insert'];
export type WorkoutSessionUpdate = Database['public']['Tables']['workout_sessions']['Update'];

export type NutritionProfile = Database['public']['Tables']['nutrition_profiles']['Row'];
export type NutritionProfileInsert = Database['public']['Tables']['nutrition_profiles']['Insert'];
export type NutritionProfileUpdate = Database['public']['Tables']['nutrition_profiles']['Update'];

export type MealPlan = Database['public']['Tables']['meal_plans']['Row'];
export type MealPlanInsert = Database['public']['Tables']['meal_plans']['Insert'];
export type MealPlanUpdate = Database['public']['Tables']['meal_plans']['Update'];

export type ProgressEntry = Database['public']['Tables']['progress_entries']['Row'];
export type ProgressEntryInsert = Database['public']['Tables']['progress_entries']['Insert'];
export type ProgressEntryUpdate = Database['public']['Tables']['progress_entries']['Update'];

export type ProgressPhoto = Database['public']['Tables']['progress_photos']['Row'];
export type ProgressPhotoInsert = Database['public']['Tables']['progress_photos']['Insert'];
export type ProgressPhotoUpdate = Database['public']['Tables']['progress_photos']['Update'];

export type HealthUpload = Database['public']['Tables']['health_uploads']['Row'];
export type HealthUploadInsert = Database['public']['Tables']['health_uploads']['Insert'];
export type HealthUploadUpdate = Database['public']['Tables']['health_uploads']['Update'];

// JSON types used in tables
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
