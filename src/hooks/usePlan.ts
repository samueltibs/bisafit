import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Plan, Workout } from '@/types/database';
import type { PlanJson, WorkoutJson, DisplayWorkout, PlanDay, normalizePlanDay } from '@/types/plan';
import { format, addDays } from 'date-fns';

interface UsePlanResult {
  plan: Plan | null;
  planJson: PlanJson | null;
  workouts: Workout[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getWorkoutsForWeek: (weekStart: Date) => DisplayWorkout[];
  getTodayWorkout: () => DisplayWorkout | null;
  currentWeekNumber: number;
  hasGenerationIssue: boolean;
}

export function usePlan(): UsePlanResult {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlan = useCallback(async () => {
    if (!user) {
      setPlan(null);
      setWorkouts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch latest plan
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planError) throw planError;

      if (!planData) {
        setPlan(null);
        setWorkouts([]);
        setLoading(false);
        return;
      }

      setPlan(planData);

      // Fetch all workouts for this plan
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('plan_id', planData.id)
        .order('scheduled_date', { ascending: true });

      if (workoutsError) throw workoutsError;

      setWorkouts(workoutsData || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load plan');
      console.error('usePlan error:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const planJson = plan?.plan_json as unknown as PlanJson | null;

  // Calculate current week number based on plan start date
  const currentWeekNumber = (() => {
    if (!plan?.start_date) return 1;
    const startDate = new Date(plan.start_date);
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekNum = Math.floor(diffDays / 7) + 1;
    return Math.max(1, Math.min(4, weekNum));
  })();

  // Check if any week has 0 workout days (generation issue)
  const hasGenerationIssue = (() => {
    if (!planJson?.weeks) return false;
    return planJson.weeks.some(week => {
      const workoutDays = week.days.filter(d => {
        const normalized = normalizePlanDayCompat(d);
        return normalized.type === 'workout';
      });
      return workoutDays.length === 0;
    });
  })();

  const getWorkoutsForWeek = useCallback((weekStart: Date): DisplayWorkout[] => {
    const weekDays: DisplayWorkout[] = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(weekStart, i);
      const dayName = dayNames[i];
      const dateStr = format(dayDate, 'yyyy-MM-dd');

      // Find workout for this date
      const workout = workouts.find(w => w.scheduled_date === dateStr);
      
      // Find plan day info for this day (checking current week context)
      const planDay = findPlanDayForDate(planJson, dayDate, plan?.start_date);
      const normalizedPlanDay = planDay ? normalizePlanDayCompat(planDay) : null;
      
      if (workout) {
        const workoutJson = workout.workout_json as unknown as WorkoutJson;
        weekDays.push({
          id: workout.id,
          day: dayName,
          dayDate,
          workout: workout.title || workoutJson?.title || 'Workout',
          duration: workoutJson?.total_estimated_minutes || 0,
          type: inferWorkoutTypeFromJson(workoutJson),
          completed: false, // Will be updated with session data
          workoutJson,
          isRest: false,
        });
      } else if (normalizedPlanDay?.type === 'rest') {
        // Explicit rest day from plan
        weekDays.push({
          id: `rest-${dateStr}`,
          day: dayName,
          dayDate,
          workout: normalizedPlanDay.label || 'Rest Day',
          duration: 0,
          type: 'rest',
          completed: false,
          isRest: true,
        });
      } else {
        // Day not in plan range or missing workout - treat as rest
        weekDays.push({
          id: `rest-${dateStr}`,
          day: dayName,
          dayDate,
          workout: 'Rest Day',
          duration: 0,
          type: 'rest',
          completed: false,
          isRest: true,
        });
      }
    }

    return weekDays;
  }, [workouts, planJson, plan?.start_date]);

  const getTodayWorkout = useCallback((): DisplayWorkout | null => {
    if (!plan?.start_date) return null;
    
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today.getDay()];
    
    // Check if there's a workout scheduled for today
    const workout = workouts.find(w => w.scheduled_date === todayStr);
    
    if (workout) {
      const workoutJson = workout.workout_json as unknown as WorkoutJson;
      return {
        id: workout.id,
        day: todayName,
        dayDate: today,
        workout: workout.title || workoutJson?.title || 'Workout',
        duration: workoutJson?.total_estimated_minutes || 0,
        type: inferWorkoutTypeFromJson(workoutJson),
        completed: false,
        workoutJson,
        isRest: false,
      };
    }
    
    // Check plan day for today
    const planDay = findPlanDayForDate(planJson, today, plan.start_date);
    const normalizedPlanDay = planDay ? normalizePlanDayCompat(planDay) : null;
    
    if (normalizedPlanDay?.type === 'rest') {
      return {
        id: `rest-${todayStr}`,
        day: todayName,
        dayDate: today,
        workout: normalizedPlanDay.label || 'Rest Day',
        duration: 0,
        type: 'rest',
        completed: false,
        isRest: true,
      };
    }
    
    return null;
  }, [workouts, planJson, plan?.start_date]);

  return {
    plan,
    planJson,
    workouts,
    loading,
    error,
    refetch: fetchPlan,
    getWorkoutsForWeek,
    getTodayWorkout,
    currentWeekNumber,
    hasGenerationIssue,
  };
}

/**
 * Find the plan day entry for a given date
 */
function findPlanDayForDate(
  planJson: PlanJson | null,
  date: Date,
  planStartDateStr: string | null | undefined
): PlanDay | null {
  if (!planJson?.weeks || !planStartDateStr) return null;
  
  const planStartDate = new Date(planStartDateStr);
  const diffTime = date.getTime() - planStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0 || diffDays >= 28) return null; // Outside 4-week plan
  
  const weekNumber = Math.floor(diffDays / 7) + 1;
  const dayOfWeek = diffDays % 7;
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const targetDayName = dayNames[dayOfWeek];
  
  const week = planJson.weeks.find(w => w.week_number === weekNumber);
  if (!week) return null;
  
  return week.days.find(d => d.day_name === targetDayName) || null;
}

/**
 * Normalize plan day for backward compatibility with legacy format
 */
function normalizePlanDayCompat(day: Partial<PlanDay> & { is_rest?: boolean; workout_id?: string }): PlanDay {
  // If type already exists, use it
  if (day.type) {
    return day as PlanDay;
  }
  
  // Infer type from legacy format
  if (day.is_rest || (!day.workout_id && day.focus?.toLowerCase().includes('rest'))) {
    return {
      day_name: day.day_name || '',
      type: 'rest',
      label: day.focus || 'Rest Day',
    };
  }
  
  return {
    day_name: day.day_name || '',
    type: 'workout',
    focus: day.focus || 'Workout',
    workout_id: day.workout_id,
  };
}

function inferWorkoutTypeFromJson(workoutJson: WorkoutJson | undefined): DisplayWorkout['type'] {
  if (!workoutJson) return 'strength';
  
  const hasConditioning = workoutJson.blocks.some(b => b.type === 'conditioning');
  const hasStrength = workoutJson.blocks.some(b => b.type === 'strength');
  
  if (hasConditioning && !hasStrength) return 'cardio';
  if (hasConditioning && hasStrength) return 'strength'; // Mixed
  
  const title = workoutJson.title.toLowerCase();
  if (title.includes('recovery') || title.includes('mobility')) return 'recovery';
  if (title.includes('core') || title.includes('abs')) return 'core';
  if (title.includes('cardio') || title.includes('hiit')) return 'cardio';
  
  return 'strength';
}
