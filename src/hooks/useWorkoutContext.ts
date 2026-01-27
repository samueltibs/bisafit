import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { usePlan } from './usePlan';
import { supabase } from '@/integrations/supabase/client';
import type { DisplayWorkout, WorkoutJson } from '@/types/plan';
import { format, subDays } from 'date-fns';
import { getLocalToday, getLocalDayName } from '@/lib/dateUtils';

export type WorkoutContextType = 
  | 'today_workout'      // Today is a workout day with a scheduled workout
  | 'rest_day'           // Today is a rest day, no missed workouts
  | 'missed_workout'     // Today is rest day but there's a missed workout
  | 'no_plan'            // User has no active plan
  | 'loading';           // Still loading

export interface MissedWorkoutInfo {
  workout: DisplayWorkout;
  missedDate: Date;
  daysAgo: number;
}

export interface WorkoutContextResult {
  contextType: WorkoutContextType;
  todayWorkout: DisplayWorkout | null;
  missedWorkout: MissedWorkoutInfo | null;
  nextWorkout: DisplayWorkout | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook to determine what workout context to show the user
 * Handles: today's workout, rest days, and missed workouts
 */
export function useWorkoutContext(): WorkoutContextResult {
  const { user } = useAuth();
  const { 
    getTodayWorkout, 
    getNextUpcomingWorkout, 
    workouts, 
    plan, 
    loading: planLoading,
    refetch: refetchPlan 
  } = usePlan();
  
  const [missedWorkout, setMissedWorkout] = useState<MissedWorkoutInfo | null>(null);
  const [checkingMissed, setCheckingMissed] = useState(true);

  // Check for missed workouts in the past 3 days
  const checkMissedWorkouts = useCallback(async () => {
    if (!user || !plan) {
      setMissedWorkout(null);
      setCheckingMissed(false);
      return;
    }

    try {
      setCheckingMissed(true);
      // Use timezone-safe local date for "today"
      const today = getLocalToday();
      
      // Check past 3 days for missed workouts
      for (let daysAgo = 1; daysAgo <= 3; daysAgo++) {
        const checkDate = subDays(today, daysAgo);
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        
        // Find workout scheduled for this date
        const scheduledWorkout = workouts.find(w => w.scheduled_date === dateStr);
        
        if (scheduledWorkout) {
          // Check if there's a completed session for this workout
          const { data: sessions } = await supabase
            .from('workout_sessions')
            .select('id, completed_at')
            .eq('workout_id', scheduledWorkout.id)
            .eq('user_id', user.id);
          
          const hasCompletedSession = sessions?.some(s => s.completed_at !== null);
          
          if (!hasCompletedSession) {
            // Found a missed workout
            const workoutJson = scheduledWorkout.workout_json as unknown as WorkoutJson;
            // Use timezone-safe day name from local date
            const dayName = getLocalDayName(checkDate);
            
            setMissedWorkout({
              workout: {
                id: scheduledWorkout.id,
                day: dayName,
                dayDate: checkDate,
                workout: scheduledWorkout.title || workoutJson?.title || 'Workout',
                duration: workoutJson?.total_estimated_minutes || 0,
                type: 'strength', // Default type
                completed: false,
                workoutJson,
                isRest: false,
              },
              missedDate: checkDate,
              daysAgo,
            });
            setCheckingMissed(false);
            return;
          }
        }
      }
      
      // No missed workouts found
      setMissedWorkout(null);
    } catch (error) {
      console.error('Error checking missed workouts:', error);
      setMissedWorkout(null);
    } finally {
      setCheckingMissed(false);
    }
  }, [user, plan, workouts]);

  useEffect(() => {
    if (!planLoading) {
      checkMissedWorkouts();
    }
  }, [planLoading, checkMissedWorkouts]);

  const todayWorkout = getTodayWorkout();
  const nextWorkout = getNextUpcomingWorkout();
  const loading = planLoading || checkingMissed;

  // Determine context type
  let contextType: WorkoutContextType = 'loading';
  
  if (loading) {
    contextType = 'loading';
  } else if (!plan) {
    contextType = 'no_plan';
  } else if (todayWorkout && !todayWorkout.isRest) {
    contextType = 'today_workout';
  } else if (missedWorkout) {
    contextType = 'missed_workout';
  } else {
    contextType = 'rest_day';
  }

  const refetch = useCallback(async () => {
    await refetchPlan();
    await checkMissedWorkouts();
  }, [refetchPlan, checkMissedWorkouts]);

  return {
    contextType,
    todayWorkout,
    missedWorkout,
    nextWorkout,
    loading,
    refetch,
  };
}
