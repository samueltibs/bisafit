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

interface GeneratedPlan {
  id: string;
  name: string;
  coach_message?: string;
  weeks: Array<{
    id: string;
    week_number: number;
    theme?: string;
    coach_note?: string;
    start_date: string;
    end_date: string;
    workouts: Array<{
      id: string;
      name: string;
      day_number: number;
      day_name: string;
      day_of_week: number;
      duration_minutes: number;
      exercises: Array<{
        name: string;
        sets: number;
        reps: string;
        rest_seconds: number;
        muscle_group: string;
        notes?: string;
        is_warmup?: boolean;
        is_cooldown?: boolean;
      }>;
      focus_areas: string[];
      is_active_rest?: boolean;
      activity_type?: string;
      distance_miles?: number;
    }>;
    total_workouts: number;
  }>;
  total_weeks: number;
  user_id: string;
  created_at: string;
  goal: string;
  experience_level: string;
}

export function usePlanGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      console.log('[PlanGeneration] Using SINGLE WEEK generation for faster results');

      // Call the new single week endpoint (much faster!)
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

      // The backend returns a single week
      const generatedWeek = data.week;
      
      console.log('[PlanGeneration] Received week:', {
        id: generatedWeek.id,
        theme: generatedWeek.theme,
        workouts: generatedWeek.total_workouts,
        startDate: generatedWeek.start_date,
      });

      if (!generatedWeek.workouts || generatedWeek.workouts.length === 0) {
        throw new Error('No workouts were generated for this week');
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
            total_weeks: 1, // Start with 1 week, auto-generates more
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

      // Insert workouts into database
      const workoutsToInsert = generatedWeek.workouts.map((workout: any) => ({
        plan_id: savedPlan.id,
        user_id: session.user.id,
        title: workout.name,
        scheduled_date: workout.scheduled_date,
        workout_json: {
          title: workout.name,
          duration_minutes: workout.duration_minutes,
          focus_areas: workout.focus_areas || [],
          total_estimated_minutes: workout.duration_minutes,
          blocks: [
            {
              type: 'warmup',
              name: 'Warm Up',
              exercises: (workout.exercises || []).filter((e: any) => e.is_warmup).map((e: any) => ({
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                rest_seconds: e.rest_seconds,
                muscle_group: e.muscle_group,
              })),
            },
            {
              type: 'main',
              name: 'Main Workout',
              exercises: (workout.exercises || []).filter((e: any) => !e.is_warmup && !e.is_cooldown).map((e: any) => ({
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                rest_seconds: e.rest_seconds,
                muscle_group: e.muscle_group,
              })),
            },
            {
              type: 'cooldown',
              name: 'Cool Down',
              exercises: (workout.exercises || []).filter((e: any) => e.is_cooldown).map((e: any) => ({
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                rest_seconds: e.rest_seconds,
                muscle_group: e.muscle_group,
              })),
            },
          ].filter(block => block.exercises.length > 0),
        },
      }));

      console.log(`[PlanGeneration] Inserting ${workoutsToInsert.length} workouts...`);
      if (workoutsToInsert.length > 0) {
        console.log('[PlanGeneration] Sample workout:', JSON.stringify(workoutsToInsert[0], null, 2));
      }

      const { data: insertedWorkouts, error: workoutsError } = await supabase
        .from('workouts')
        .insert(workoutsToInsert)
        .select();

      if (workoutsError) {
        console.error('[PlanGeneration] Error inserting workouts:', workoutsError);
        // Don't fail completely - the plan was created
        console.error('[PlanGeneration] Workout insert failed but plan exists');
      } else {
        console.log(`[PlanGeneration] Successfully inserted ${insertedWorkouts?.length || 0} workouts`);
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
            coach_tone: (profile as any).coach_tone || 'balanced',
            active_rest_config: (profile as any).active_rest_config || null,
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.detail || data.error || 'Failed to generate plan';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Save the generated plan to Supabase
      const generatedPlan = data.plan as GeneratedPlan;
      
      // Debug logging
      console.log('[PlanGeneration] Received plan from backend:', {
        id: generatedPlan.id,
        name: generatedPlan.name,
        totalWeeks: generatedPlan.weeks?.length,
        week1Workouts: generatedPlan.weeks?.[0]?.workouts?.length,
      });
      
      if (!generatedPlan.weeks || generatedPlan.weeks.length === 0) {
        throw new Error('Backend returned plan with no weeks');
      }
      
      // Create plan in Supabase
      const { data: savedPlan, error: planError } = await supabase
        .from('plans')
        .insert({
          id: generatedPlan.id,
          user_id: session.user.id,
          start_date: generatedPlan.weeks[0]?.start_date || new Date().toISOString().split('T')[0],
          plan_json: {
            name: generatedPlan.name,
            coach_message: generatedPlan.coach_message,
            goal: generatedPlan.goal,
            experience_level: generatedPlan.experience_level,
            total_weeks: generatedPlan.total_weeks,
            block_number: 1,
            weeks: generatedPlan.weeks.map(week => ({
              week_number: week.week_number,
              theme: week.theme,
              coach_note: week.coach_note,
              days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(dayName => {
                const workout = week.workouts.find(w => w.day_name === dayName);
                if (workout) {
                  return {
                    day_name: dayName,
                    type: 'workout',
                    focus: workout.name,
                    // Don't store workout_id - workouts are found by scheduled_date
                  };
                }
                return {
                  day_name: dayName,
                  type: 'rest',
                  label: 'Rest Day',
                };
              }),
            })),
          },
          status: 'in_progress',
        })
        .select()
        .single();

      if (planError) {
        console.error('Error saving plan:', planError);
        throw new Error('Failed to save plan: ' + planError.message);
      }
      
      console.log('[PlanGeneration] Plan saved successfully with ID:', savedPlan.id);

      // Create individual workouts in Supabase
      // Use savedPlan.id to ensure we're referencing the correct plan
      const workoutsToInsert: Array<{
        plan_id: string;
        user_id: string;
        title: string;
        scheduled_date: string;
        workout_json: Record<string, unknown>;
      }> = [];
      
      console.log('[PlanGeneration] Processing weeks:', generatedPlan.weeks.length);
      
      for (const week of generatedPlan.weeks) {
        console.log(`[PlanGeneration] Week ${week.week_number}: ${week.workouts?.length || 0} workouts, start_date: ${week.start_date}`);
        
        if (!week.workouts || week.workouts.length === 0) {
          console.warn(`[PlanGeneration] Week ${week.week_number} has no workouts!`);
          continue;
        }
        
        for (const workout of week.workouts) {
          // Calculate scheduled date
          const weekStart = new Date(week.start_date);
          const scheduledDate = new Date(weekStart);
          scheduledDate.setDate(weekStart.getDate() + workout.day_of_week);
          
          // Handle active rest vs regular workouts differently
          const isActiveRest = workout.is_active_rest === true;
          
          const workoutJson = isActiveRest ? {
            title: workout.name,
            duration_minutes: workout.duration_minutes,
            focus_areas: workout.focus_areas,
            total_estimated_minutes: workout.duration_minutes,
            is_active_rest: true,
            activity_type: workout.activity_type,
            distance_miles: workout.distance_miles,
            blocks: [
              {
                type: 'active_rest',
                name: 'Active Recovery',
                exercises: workout.exercises.map(e => ({
                  name: e.name,
                  sets: e.sets,
                  reps: e.reps,
                  rest_seconds: e.rest_seconds,
                  muscle_group: e.muscle_group,
                  notes: e.notes,
                })),
              },
            ],
          } : {
            title: workout.name,
            duration_minutes: workout.duration_minutes,
            focus_areas: workout.focus_areas,
            total_estimated_minutes: workout.duration_minutes,
            blocks: [
              {
                type: 'warmup',
                name: 'Warm Up',
                exercises: workout.exercises
                  .filter(e => e.is_warmup)
                  .map(e => ({
                    name: e.name,
                    sets: e.sets,
                    reps: e.reps,
                    rest_seconds: e.rest_seconds,
                    muscle_group: e.muscle_group,
                    notes: e.notes,
                  })),
              },
              {
                type: 'strength',
                name: 'Main Workout',
                exercises: workout.exercises
                  .filter(e => !e.is_warmup && !e.is_cooldown)
                  .map(e => ({
                    name: e.name,
                    sets: e.sets,
                    reps: e.reps,
                    rest_seconds: e.rest_seconds,
                    muscle_group: e.muscle_group,
                    notes: e.notes,
                  })),
              },
              {
                type: 'cooldown',
                name: 'Cool Down',
                exercises: workout.exercises
                  .filter(e => e.is_cooldown)
                  .map(e => ({
                    name: e.name,
                    sets: e.sets,
                    reps: e.reps,
                    rest_seconds: e.rest_seconds,
                    muscle_group: e.muscle_group,
                    notes: e.notes,
                  })),
              },
            ],
          };
          
          workoutsToInsert.push({
            // Let Supabase generate the ID to avoid any UUID conflicts
            plan_id: savedPlan.id, // Use the saved plan's ID from Supabase
            user_id: session.user.id,
            title: workout.name,
            scheduled_date: scheduledDate.toISOString().split('T')[0],
            workout_json: workoutJson,
          });
        }
      }

      if (workoutsToInsert.length > 0) {
        console.log(`[PlanGeneration] Inserting ${workoutsToInsert.length} workouts...`);
        console.log('[PlanGeneration] Sample workout:', JSON.stringify(workoutsToInsert[0], null, 2));
        
        const { data: insertedWorkouts, error: workoutsError } = await supabase
          .from('workouts')
          .insert(workoutsToInsert)
          .select();

        if (workoutsError) {
          console.error('[PlanGeneration] Error saving workouts:', workoutsError);
          console.error('[PlanGeneration] Error details:', JSON.stringify(workoutsError, null, 2));
          // Show error to user instead of silently failing
          throw new Error(`Failed to save workouts: ${workoutsError.message}`);
        } else {
          console.log(`[PlanGeneration] Successfully inserted ${insertedWorkouts?.length || 0} workouts`);
        }
      } else {
        console.warn('[PlanGeneration] No workouts to insert!');
      }

      // Update user profile with current_plan_id
      await supabase
        .from('users_profile')
        .update({ current_plan_id: generatedPlan.id })
        .eq('id', session.user.id);

      return {
        success: true,
        plan_id: generatedPlan.id,
        message: data.message || 'Your personalized AI workout plan is ready!',
        ai_powered: data.ai_powered,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate plan';
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
