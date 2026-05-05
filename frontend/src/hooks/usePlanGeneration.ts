import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

interface GeneratePlanResult {
  success: boolean;
  plan_id?: string;
  message?: string;
  error?: string;
  ai_powered?: boolean;
}

// Store for tracking background generation
let backgroundGenerationPromise: Promise<GeneratePlanResult> | null = null;

export function usePlanGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate a workout plan in the background
   * Shows a toast notification when complete
   */
  const generatePlanInBackground = useCallback(async (): Promise<void> => {
    setIsGenerating(true);
    setError(null);

    // Show initial toast
    const toastId = toast.loading('Generating your personalized workout plan...', {
      description: 'This takes about 30 seconds. You can continue using the app and we\'ll notify you when it\'s ready!',
    });

    try {
      const result = await generatePlanCore();
      
      if (result.success) {
        toast.success('Your workout plan is ready! 🎉', {
          id: toastId,
          description: 'Tap to view your new personalized week',
          action: {
            label: 'View Plan',
            onClick: () => {
              window.location.href = '/plan';
            },
          },
          duration: 10000, // Show for 10 seconds
        });
      } else {
        toast.error('Failed to generate plan', {
          id: toastId,
          description: result.error || 'Please try again',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Failed to generate plan', {
        id: toastId,
        description: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
      backgroundGenerationPromise = null;
    }
  }, []);

  /**
   * Generate a workout plan (blocks until complete)
   * Use generatePlanInBackground for non-blocking generation
   */
  const generatePlan = useCallback(async (): Promise<GeneratePlanResult> => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generatePlanCore();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generatePlan,
    generatePlanInBackground,
    isGenerating,
    error,
  };
}

/**
 * Core plan generation logic - extracted for reuse
 */
async function generatePlanCore(): Promise<GeneratePlanResult> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token || !session.user) {
    throw new Error('Not authenticated');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    throw new Error('User profile not found. Please complete onboarding first.');
  }

  console.log('[PlanGeneration] Generating single week plan...');

  // Call the single week endpoint
  const response = await fetch(`${BACKEND_URL}/api/generate-week`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    throw new Error(data.detail || data.error || 'Failed to generate plan');
  }

  const generatedWeek = data.week;
  
  console.log('[PlanGeneration] Received week:', {
    id: generatedWeek.id,
    theme: generatedWeek.theme,
    workouts: generatedWeek.total_workouts,
  });

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
              return { day_name: dayName, type: 'workout', focus: workout.name };
            }
            return { day_name: dayName, type: 'rest', label: 'Rest Day' };
          }),
        }],
      },
      status: 'in_progress',
    })
    .select()
    .single();

  if (planError) {
    throw new Error('Failed to save plan: ' + planError.message);
  }
  
  console.log('[PlanGeneration] Plan saved with ID:', savedPlan.id);

  // Note: Images are fetched on-demand from cache when workout is displayed
  // This avoids huge payloads (base64 images are ~2.5MB each)

  // Transform exercises to WorkoutItem format (images fetched on-demand, not stored)
  const transformExercise = (e: any) => {
    return {
      name: e.name,
      sets: e.sets || 3,
      reps: String(e.reps || '10'),
      rest_sec: e.rest_seconds || 60,
      instructions: `Focus on ${e.muscle_group || 'proper form'}. Perform ${e.sets || 3} sets of ${e.reps || '10'} reps.`,
      // Note: image_url NOT stored here - too large. Fetched on-demand from cache.
    };
  };

  // Insert workouts
  const workoutsToInsert = generatedWeek.workouts.map((workout: any) => {
    const warmupExercises = (workout.exercises || []).filter((e: any) => e.is_warmup);
    const mainExercises = (workout.exercises || []).filter((e: any) => !e.is_warmup && !e.is_cooldown);
    const cooldownExercises = (workout.exercises || []).filter((e: any) => e.is_cooldown);

    const blocks = [];
    
    if (warmupExercises.length > 0) {
      blocks.push({ type: 'warmup' as const, items: warmupExercises.map(transformExercise) });
    }
    
    if (mainExercises.length > 0) {
      blocks.push({ type: 'strength' as const, items: mainExercises.map(transformExercise) });
    }
    
    if (cooldownExercises.length > 0) {
      blocks.push({ type: 'cooldown' as const, items: cooldownExercises.map(transformExercise) });
    }

    // Fallback if no categorization
    if (blocks.length === 0 && workout.exercises?.length > 0) {
      console.log(`[PlanGeneration] No warmup/cooldown flags, using fallback for ${workout.name}`);
      blocks.push({ type: 'strength' as const, items: workout.exercises.map(transformExercise) });
    }

    // Extra safety check - if still no blocks, create a placeholder
    if (blocks.length === 0) {
      console.warn(`[PlanGeneration] WARNING: No exercises for workout ${workout.name}!`);
    }

    const workoutJson = {
      title: workout.name,
      week_number: 1,
      total_estimated_minutes: workout.duration_minutes || 45,
      blocks,
    };

    console.log(`[PlanGeneration] Workout "${workout.name}" has ${blocks.length} blocks with items:`, 
      blocks.map(b => `${b.type}: ${b.items.length} items`).join(', '));

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
    const { error: workoutsError } = await supabase
      .from('workouts')
      .insert(workoutsToInsert)
      .select();

    if (workoutsError) {
      console.error('[PlanGeneration] Error inserting workouts:', workoutsError);
    }
  }

  // Update user profile
  await supabase
    .from('users_profile')
    .update({ current_plan_id: savedPlan.id })
    .eq('id', session.user.id);

  // Trigger background image pre-generation
  try {
    const allExercises: Array<{exercise_name: string, muscle_group: string}> = [];
    const seenExercises = new Set<string>();
    
    for (const workout of workoutsToInsert) {
      const blocks = (workout.workout_json as any).blocks || [];
      for (const block of blocks) {
        for (const item of block.items || []) {
          if (!seenExercises.has(item.name)) {
            seenExercises.add(item.name);
            allExercises.push({
              exercise_name: item.name,
              muscle_group: block.type || 'full body',
            });
          }
        }
      }
    }

    if (allExercises.length > 0) {
      fetch(`${BACKEND_URL}/api/pregenerate-workout-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: savedPlan.id,
          exercises: allExercises,
          gender: profile.gender || 'male',
        }),
      }).catch(() => {});
    }
  } catch {
    // Ignore image pre-generation errors
  }

  return {
    success: true,
    plan_id: savedPlan.id,
    message: data.message || 'Your personalized workout week is ready!',
    ai_powered: true,
  };
}
