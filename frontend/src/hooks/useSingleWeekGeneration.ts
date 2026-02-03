import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

interface GeneratedWeek {
  id: string;
  week_number: number;
  theme: string;
  coach_tip: string;
  start_date: string;
  end_date: string;
  total_workouts: number;
  workouts: Array<{
    id: string;
    name: string;
    day_name: string;
    day_of_week: number;
    scheduled_date: string;
    duration_minutes: number;
    focus_areas: string[];
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      rest_seconds: number;
      muscle_group: string;
      is_warmup?: boolean;
      is_cooldown?: boolean;
    }>;
  }>;
  _meta?: {
    model: string;
    estimated_cost_usd: number;
    tokens_used?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
}

interface GenerateWeekResult {
  success: boolean;
  plan_id?: string;
  week_number?: number;
  message?: string;
  error?: string;
}

interface UserProfileForWeek {
  goal_primary: string;
  experience_level: string;
  workout_days: string[];
  equipment: string[];
  session_minutes: number;
}

export function useSingleWeekGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate a single week workout plan
   * 
   * @param profile User's fitness profile
   * @param weekNumber Which week to generate (1, 2, 3, etc.)
   * @param existingPlanId If adding to existing plan, provide the plan ID
   */
  const generateWeek = async (
    profile: UserProfileForWeek,
    weekNumber: number = 1,
    existingPlanId?: string
  ): Promise<GenerateWeekResult> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Please sign in to generate a workout plan');
      }

      console.log(`[WeekGeneration] Generating week ${weekNumber} for user: ${session.user.id}`);

      // Call backend to generate single week
      const response = await fetch(`${BACKEND_URL}/api/generate-week`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.id,
          goal_primary: profile.goal_primary,
          experience_level: profile.experience_level,
          workout_days: profile.workout_days,
          equipment: profile.equipment,
          session_minutes: profile.session_minutes,
          week_number: weekNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate week');
      }

      const generatedWeek = data.week as GeneratedWeek;
      console.log('[WeekGeneration] Received week:', {
        id: generatedWeek.id,
        theme: generatedWeek.theme,
        workouts: generatedWeek.total_workouts,
        startDate: generatedWeek.start_date,
      });

      let planId = existingPlanId;

      // If no existing plan, create a new one
      if (!planId) {
        const { data: newPlan, error: planError } = await supabase
          .from('plans')
          .insert({
            user_id: session.user.id,
            start_date: generatedWeek.start_date,
            plan_json: {
              name: `Week ${weekNumber} Plan`,
              current_week: weekNumber,
              total_weeks: weekNumber, // Will grow as more weeks are added
              weeks: [{
                week_number: weekNumber,
                theme: generatedWeek.theme,
                coach_tip: generatedWeek.coach_tip,
                start_date: generatedWeek.start_date,
                end_date: generatedWeek.end_date,
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(dayName => {
                  const workout = generatedWeek.workouts.find(w => w.day_name === dayName);
                  if (workout) {
                    return {
                      day_name: dayName,
                      type: 'workout',
                      focus: workout.name,
                    };
                  }
                  return {
                    day_name: dayName,
                    type: 'rest',
                    label: 'Rest Day',
                  };
                }),
              }],
            },
            status: 'in_progress',
          })
          .select()
          .single();

        if (planError) {
          console.error('[WeekGeneration] Error creating plan:', planError);
          throw new Error('Failed to save plan: ' + planError.message);
        }

        planId = newPlan.id;
        console.log('[WeekGeneration] Created new plan:', planId);

        // Update user profile with current plan
        await supabase
          .from('users_profile')
          .update({ current_plan_id: planId })
          .eq('id', session.user.id);
      } else {
        // Update existing plan with new week data
        const { data: existingPlan } = await supabase
          .from('plans')
          .select('plan_json')
          .eq('id', planId)
          .single();

        if (existingPlan?.plan_json) {
          const planJson = existingPlan.plan_json as Record<string, unknown>;
          const weeks = (planJson.weeks as Array<Record<string, unknown>>) || [];
          
          // Add or replace the week
          const existingWeekIndex = weeks.findIndex((w) => w.week_number === weekNumber);
          const newWeekData = {
            week_number: weekNumber,
            theme: generatedWeek.theme,
            coach_tip: generatedWeek.coach_tip,
            start_date: generatedWeek.start_date,
            end_date: generatedWeek.end_date,
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(dayName => {
              const workout = generatedWeek.workouts.find(w => w.day_name === dayName);
              if (workout) {
                return { day_name: dayName, type: 'workout', focus: workout.name };
              }
              return { day_name: dayName, type: 'rest', label: 'Rest Day' };
            }),
          };

          if (existingWeekIndex >= 0) {
            weeks[existingWeekIndex] = newWeekData;
          } else {
            weeks.push(newWeekData);
          }

          await supabase
            .from('plans')
            .update({
              plan_json: {
                ...planJson,
                weeks,
                total_weeks: weeks.length,
                current_week: weekNumber,
              },
            })
            .eq('id', planId);
        }
      }

      // Insert workouts into database
      // IMPORTANT: workout_json.blocks must use 'items' not 'exercises' (matches WorkoutBlock type)
      const workoutsToInsert = generatedWeek.workouts.map(workout => ({
        plan_id: planId,
        user_id: session.user.id,
        title: workout.name,
        scheduled_date: workout.scheduled_date,
        workout_json: {
          title: workout.name,
          week_number: weekNumber,
          duration_minutes: workout.duration_minutes,
          focus_areas: workout.focus_areas,
          total_estimated_minutes: workout.duration_minutes,
          blocks: [
            {
              type: 'warmup' as const,
              items: workout.exercises.filter(e => e.is_warmup).map(e => ({
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                rest_sec: e.rest_seconds,
                duration_sec: 30, // Default for warmup
                instructions: `Perform ${e.name} to warm up`,
                muscle_group: e.muscle_group,
              })),
            },
            {
              type: 'strength' as const,
              items: workout.exercises.filter(e => !e.is_warmup && !e.is_cooldown).map(e => ({
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                rest_sec: e.rest_seconds,
                instructions: `Complete ${e.sets} sets of ${e.reps} ${e.name}`,
                muscle_group: e.muscle_group,
              })),
            },
            {
              type: 'cooldown' as const,
              items: workout.exercises.filter(e => e.is_cooldown).map(e => ({
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                rest_sec: e.rest_seconds,
                duration_sec: 30, // Default for cooldown
                instructions: `${e.name} to cool down`,
                muscle_group: e.muscle_group,
              })),
            },
          ].filter(block => block.items.length > 0),
        },
      }));

      console.log(`[WeekGeneration] Inserting ${workoutsToInsert.length} workouts...`);

      const { data: insertedWorkouts, error: workoutsError } = await supabase
        .from('workouts')
        .insert(workoutsToInsert)
        .select();

      if (workoutsError) {
        console.error('[WeekGeneration] Error inserting workouts:', workoutsError);
        throw new Error('Failed to save workouts: ' + workoutsError.message);
      }

      console.log(`[WeekGeneration] Successfully inserted ${insertedWorkouts?.length || 0} workouts`);

      return {
        success: true,
        plan_id: planId,
        week_number: weekNumber,
        message: data.message || `Week ${weekNumber} is ready!`,
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[WeekGeneration] Error:', errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Check if the current week is ending and generate next week if needed
   */
  const checkAndGenerateNextWeek = async (
    currentPlanId: string,
    currentWeekNumber: number,
    profile: UserProfileForWeek
  ): Promise<boolean> => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

    // If it's Saturday or Sunday, generate next week
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log('[WeekGeneration] Weekend detected, generating next week...');
      const result = await generateWeek(profile, currentWeekNumber + 1, currentPlanId);
      return result.success;
    }

    return false;
  };

  return {
    generateWeek,
    checkAndGenerateNextWeek,
    isGenerating,
    error,
  };
}
