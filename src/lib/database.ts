import { supabase } from '@/integrations/supabase/client';
import type {
  UserProfile,
  UserProfileUpdate,
  Plan,
  Workout,
  WorkoutSession,
  WorkoutSessionInsert,
  NutritionProfile,
  NutritionProfileInsert,
  ProgressEntry,
  Json,
} from '@/types/database';

/**
 * Get or create a user profile for the current authenticated user
 */
export async function getOrCreateUserProfile(userId: string): Promise<UserProfile | null> {
  // First, try to get existing profile using maybeSingle to avoid errors when no row exists
  const { data: existingProfile, error: fetchError } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching user profile:', fetchError);
    throw new Error(`Failed to fetch profile: ${fetchError.code} - ${fetchError.message}`);
  }

  if (existingProfile) {
    return existingProfile;
  }

  // Profile doesn't exist, create one with minimal defaults
  const { data: newProfile, error: insertError } = await supabase
    .from('users_profile')
    .insert({
      id: userId,
      full_name: null,
      goal_primary: 'maintenance',
      experience_level: 'beginner',
      days_per_week: 4,
      session_minutes: 45,
      rest_day: 'Tuesday',
      constraints_json: {},
      equipment_json: [],
      is_pro: false,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating user profile:', insertError);
    throw new Error(`Failed to create profile: ${insertError.code} - ${insertError.message}`);
  }

  return newProfile;
}

/**
 * Update a user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: UserProfileUpdate
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users_profile')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }

  return data;
}

/**
 * Get the latest plan for a user
 */
export async function getLatestPlan(userId: string): Promise<Plan | null> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching latest plan:', error);
  }

  return data || null;
}

/**
 * Get a workout by ID
 */
export async function getWorkoutById(workoutId: string): Promise<Workout | null> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workoutId)
    .single();

  if (error) {
    console.error('Error fetching workout:', error);
    return null;
  }

  return data;
}

/**
 * Get workouts for a specific date
 */
export async function getWorkoutsForDate(
  userId: string,
  date: string
): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .eq('scheduled_date', date)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching workouts:', error);
    return [];
  }

  return data || [];
}

/**
 * Get workouts for a date range
 */
export async function getWorkoutsForDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate)
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Error fetching workouts:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a workout session
 */
export async function createWorkoutSession(
  session: WorkoutSessionInsert
): Promise<WorkoutSession | null> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert(session)
    .select()
    .single();

  if (error) {
    console.error('Error creating workout session:', error);
    return null;
  }

  return data;
}

/**
 * Complete a workout session
 */
export async function completeWorkoutSession(
  sessionId: string,
  sessionLog: Json
): Promise<WorkoutSession | null> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .update({
      completed_at: new Date().toISOString(),
      session_log_json: sessionLog,
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('Error completing workout session:', error);
    return null;
  }

  return data;
}

/**
 * Upsert nutrition profile
 */
export async function upsertNutritionProfile(
  profile: NutritionProfileInsert
): Promise<NutritionProfile | null> {
  const { data, error } = await supabase
    .from('nutrition_profiles')
    .upsert(profile, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting nutrition profile:', error);
    return null;
  }

  return data;
}

/**
 * Get nutrition profile for a user
 */
export async function getNutritionProfile(
  userId: string
): Promise<NutritionProfile | null> {
  const { data, error } = await supabase
    .from('nutrition_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching nutrition profile:', error);
  }

  return data || null;
}

/**
 * List progress entries for a user
 */
export async function listProgressEntries(
  userId: string,
  limit = 30
): Promise<ProgressEntry[]> {
  const { data, error } = await supabase
    .from('progress_entries')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching progress entries:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a progress entry
 */
export async function createProgressEntry(
  userId: string,
  entryDate: string,
  entryData: { weight_kg?: number; waist_cm?: number; notes?: string }
): Promise<ProgressEntry | null> {
  const { data, error } = await supabase
    .from('progress_entries')
    .insert({
      user_id: userId,
      entry_date: entryDate,
      ...entryData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating progress entry:', error);
    return null;
  }

  return data;
}
