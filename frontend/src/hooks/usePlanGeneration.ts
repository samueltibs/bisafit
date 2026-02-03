import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

interface GeneratePlanResult {
  success: boolean;
  plan_id?: string;
  message?: string;
  error?: string;
  ai_powered?: boolean;
}

export function usePlanGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate a workout plan using the new single-week approach
   * 
   * Benefits:
   * - Much faster (~30 seconds vs 3+ minutes)
   * - Lower cost (~$0.001 per week)
   * - Plans start THIS week, not next week
   * - More reliable (less data = less chance of errors)
   */
  const generatePlan = async (): Promise<GeneratePlanResult> => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token || !session.user) {
        throw new Error('Not authenticated');
      }

      // Get user profile to get workout preferences
      const { data: profile } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        throw new Error('User profile not found. Please complete onboarding first.');
      }

      console.log('[PlanGeneration] Generating single week plan...');
      console.log('[PlanGeneration] Workout days:', (profile as any).workout_days);

      // Call the single week endpoint (much faster!)
      const response = await fetch(`${BACKEND_URL}/api/generate-week`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: session.user.id,
          goal_primary: profile.goal_primary || 'maintenance',
          experience_level: profile.experience_level || 'intermediate',
          workout_days: (profile as any).workout_days || ['Monday', 'Wednesday', 'Thursday', 'Friday'],
          equipment: profile.equipment_json || ['bodyweight'],
          session_minutes: profile.session_minutes || 45,
          week_number: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.detail || data.error || 'Failed to generate plan';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      const generatedWeek = data.week;
      
      console.log('[PlanGeneration] Received week:', {
        id: generatedWeek.id,
        theme: generatedWeek.theme,
        workouts: generatedWeek.total_workouts,
        startDate: generatedWeek.start_date,
        endDate: generatedWeek.end_date,
      });

      // Log each workout for debugging
      for (const w of generatedWeek.workouts || []) {
        console.log(`[PlanGeneration] Workout: ${w.day_name} (${w.scheduled_date}) - ${w.name}`);
      }

      if (!generatedWeek.workouts || generatedWeek.workouts.length === 0) {
        throw new Error('No workouts were generated. Please try again.');
      }

      // Create plan in Supabase
      const { data: savedPlan, error: planError } = await supabase
        .from('plans')
        .insert({
          user_id: session.user.id,
          start_date: generatedWeek.start_date,
          plan_json: {
            name: `${generatedWeek.theme} Plan`,
            coach_message: generatedWeek.coach_tip || "Let's crush this week!",
            goal: profile.goal_primary,
            experience_level: profile.experience_level,
            total_weeks: 1,
            current_week: 1,
            weeks: [{
              week_number: 1,
              theme: generatedWeek.theme,
              coach_tip: generatedWeek.coach_tip,
              start_date: generatedWeek.start_date,
              end_date: generatedWeek.end_date,
              days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(dayName => {
                const workout = generatedWeek.workouts.find((w: any) => w.day_name === dayName);
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
        console.error('[PlanGeneration] Error saving plan:', planError);
        throw new Error('Failed to save plan: ' + planError.message);
      }
      
      console.log('[PlanGeneration] Plan saved with ID:', savedPlan.id);

      // Build workouts to insert - must match WorkoutJson interface
      const workoutsToInsert = generatedWeek.workouts.map((workout: any) => {
        // Separate exercises by type
        const warmupExercises = (workout.exercises || []).filter((e: any) => e.is_warmup);
        const mainExercises = (workout.exercises || []).filter((e: any) => !e.is_warmup && !e.is_cooldown);
        const cooldownExercises = (workout.exercises || []).filter((e: any) => e.is_cooldown);

        // Transform exercises to WorkoutItem format (uses 'items' not 'exercises')
        const transformExercise = (e: any) => ({
          name: e.name,
          sets: e.sets || 3,
          reps: String(e.reps || '10'),
          rest_sec: e.rest_seconds || 60,
          instructions: `Focus on ${e.muscle_group || 'proper form'}. Perform ${e.sets || 3} sets of ${e.reps || '10'} reps.`,
        });

        const blocks = [];
        
        if (warmupExercises.length > 0) {
          blocks.push({
            type: 'warmup' as const,
            items: warmupExercises.map(transformExercise),
          });
        }
        
        // Main exercises should be 'strength' type for the player to work correctly
        if (mainExercises.length > 0) {
          blocks.push({
            type: 'strength' as const,
            items: mainExercises.map(transformExercise),
          });
        }
        
        if (cooldownExercises.length > 0) {
          blocks.push({
            type: 'cooldown' as const,
            items: cooldownExercises.map(transformExercise),
          });
        }

        // If no blocks were created (AI didn't use warmup/cooldown flags), put all in strength
        if (blocks.length === 0 && workout.exercises && workout.exercises.length > 0) {
          blocks.push({
            type: 'strength' as const,
            items: workout.exercises.map(transformExercise),
          });
        }

        // Create the workout_json in the correct format
        const workoutJson = {
          title: workout.name,
          week_number: 1,
          total_estimated_minutes: workout.duration_minutes || 45,
          blocks,
        };

        return {
          plan_id: savedPlan.id,
          user_id: session.user.id,
          title: workout.name,
          scheduled_date: workout.scheduled_date,
          workout_json: workoutJson,
        };
      });

      console.log(`[PlanGeneration] Inserting ${workoutsToInsert.length} workouts...`);

      if (workoutsToInsert.length > 0) {
        const { data: insertedWorkouts, error: workoutsError } = await supabase
          .from('workouts')
          .insert(workoutsToInsert)
          .select();

        if (workoutsError) {
          console.error('[PlanGeneration] Error inserting workouts:', workoutsError);
          // Show detailed error for debugging
          console.error('[PlanGeneration] First workout attempted:', JSON.stringify(workoutsToInsert[0], null, 2));
        } else {
          console.log(`[PlanGeneration] Successfully inserted ${insertedWorkouts?.length || 0} workouts`);
        }
      }

      // Update user profile with current_plan_id
      await supabase
        .from('users_profile')
        .update({ current_plan_id: savedPlan.id })
        .eq('id', session.user.id);

      return {
        success: true,
        plan_id: savedPlan.id,
        message: data.message || 'Your personalized workout week is ready!',
        ai_powered: true,
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[PlanGeneration] Error:', errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePlan,
    isGenerating,
    error,
  };
}
