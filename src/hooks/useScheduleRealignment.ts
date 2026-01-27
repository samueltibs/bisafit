/**
 * Hook to realign workout schedules when user preferences change.
 * 
 * This hook handles the automatic rescheduling of future workouts
 * when a user changes their preferred workout days in Settings.
 */

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, startOfDay, isBefore, isAfter } from 'date-fns';
import { getLocalToday, getLocalDayName, parseLocalDate } from '@/lib/dateUtils';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface RealignmentResult {
  success: boolean;
  workoutsRescheduled: number;
  workoutsCouldNotFit: number;
  error?: string;
}

interface FutureWorkout {
  id: string;
  scheduled_date: string;
  title: string | null;
  plan_id: string | null;
}

export function useScheduleRealignment() {
  const { user } = useAuth();
  const [isRealigning, setIsRealigning] = useState(false);

  /**
   * Check if a day name is in the user's preferred workout days
   */
  const isWorkoutDay = useCallback((dayName: string, workoutDays: string[]): boolean => {
    return workoutDays.includes(dayName);
  }, []);

  /**
   * Find the next valid workout day on or after a given date
   */
  const findNextWorkoutDay = useCallback((
    fromDate: Date,
    workoutDays: string[],
    usedDates: Set<string>
  ): Date | null => {
    const maxDaysToSearch = 14; // Don't search more than 2 weeks ahead
    
    for (let i = 0; i <= maxDaysToSearch; i++) {
      const checkDate = addDays(fromDate, i);
      const dayName = getLocalDayName(checkDate);
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      
      // Must be a workout day and not already used
      if (isWorkoutDay(dayName, workoutDays) && !usedDates.has(dateStr)) {
        return checkDate;
      }
    }
    
    return null;
  }, [isWorkoutDay]);

  /**
   * Realign future workouts to match the new workout day preferences.
   * 
   * Rules:
   * 1. Only reschedule workouts scheduled in the future (not past or today)
   * 2. Only reschedule workouts on days that are now rest days
   * 3. Move them to the nearest upcoming preferred workout day
   * 4. Preserve workout order within the same week
   * 5. Never double-book
   * 6. Don't touch completed workouts
   */
  const realignSchedule = useCallback(async (
    newWorkoutDays: string[],
    currentPlanId: string | null
  ): Promise<RealignmentResult> => {
    if (!user) {
      return { success: false, workoutsRescheduled: 0, workoutsCouldNotFit: 0, error: 'Not authenticated' };
    }

    if (!newWorkoutDays || newWorkoutDays.length === 0) {
      return { success: false, workoutsRescheduled: 0, workoutsCouldNotFit: 0, error: 'No workout days specified' };
    }

    setIsRealigning(true);

    try {
      const today = getLocalToday();
      const todayStr = format(today, 'yyyy-MM-dd');
      
      // Calculate the end date for realignment (4 weeks from today)
      const endDate = addDays(today, 28);
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // 1. Fetch all future workouts (after today) within the window
      const { data: futureWorkouts, error: fetchError } = await supabase
        .from('workouts')
        .select('id, scheduled_date, title, plan_id')
        .eq('user_id', user.id)
        .gt('scheduled_date', todayStr)
        .lte('scheduled_date', endDateStr)
        .order('scheduled_date', { ascending: true });

      if (fetchError) {
        throw new Error(`Failed to fetch workouts: ${fetchError.message}`);
      }

      if (!futureWorkouts || futureWorkouts.length === 0) {
        return { success: true, workoutsRescheduled: 0, workoutsCouldNotFit: 0 };
      }

      // 2. Check which workouts have been completed (don't move those)
      const workoutIds = futureWorkouts.map(w => w.id);
      const { data: completedSessions } = await supabase
        .from('workout_sessions')
        .select('workout_id')
        .in('workout_id', workoutIds)
        .not('completed_at', 'is', null);

      const completedWorkoutIds = new Set(completedSessions?.map(s => s.workout_id) || []);

      // 3. Filter to only workouts that need realignment
      // A workout needs realignment if:
      // - It's not completed
      // - Its current day is NOT in the new workout days
      const workoutsToRealign: FutureWorkout[] = [];
      const workoutsAlreadyCorrect: FutureWorkout[] = [];

      for (const workout of futureWorkouts) {
        if (completedWorkoutIds.has(workout.id)) {
          continue; // Skip completed workouts
        }

        const workoutDate = parseLocalDate(workout.scheduled_date);
        const dayName = getLocalDayName(workoutDate);

        if (isWorkoutDay(dayName, newWorkoutDays)) {
          workoutsAlreadyCorrect.push(workout);
        } else {
          workoutsToRealign.push(workout);
        }
      }

      if (workoutsToRealign.length === 0) {
        return { success: true, workoutsRescheduled: 0, workoutsCouldNotFit: 0 };
      }

      // 4. Build a set of already-used dates (from correct workouts)
      const usedDates = new Set<string>();
      for (const w of workoutsAlreadyCorrect) {
        usedDates.add(w.scheduled_date);
      }

      // 5. Realign each workout that needs to be moved
      const updates: { id: string; newDate: string }[] = [];
      const couldNotFit: FutureWorkout[] = [];
      let searchStartDate = addDays(today, 1); // Start searching from tomorrow

      for (const workout of workoutsToRealign) {
        // Find the next available workout day
        const originalDate = parseLocalDate(workout.scheduled_date);
        
        // Start searching from the original date or tomorrow (whichever is later)
        const searchFrom = isAfter(originalDate, searchStartDate) 
          ? originalDate 
          : searchStartDate;

        const newDate = findNextWorkoutDay(searchFrom, newWorkoutDays, usedDates);

        if (newDate) {
          const newDateStr = format(newDate, 'yyyy-MM-dd');
          updates.push({ id: workout.id, newDate: newDateStr });
          usedDates.add(newDateStr);
          
          // Move the search start to maintain ordering
          searchStartDate = addDays(newDate, 1);
        } else {
          // No valid slot found within the window - track for feedback
          couldNotFit.push(workout);
          console.warn(`Could not find valid slot for workout ${workout.id} (${workout.title})`);
        }
      }

      // 6. Apply all updates in a batch
      if (updates.length > 0) {
        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('workouts')
            .update({ scheduled_date: update.newDate })
            .eq('id', update.id)
            .eq('user_id', user.id);

          if (updateError) {
            console.error(`Failed to update workout ${update.id}:`, updateError);
          }
        }

        // 7. Update plan_json to reflect new schedule (if we have a current plan)
        if (currentPlanId) {
          await updatePlanJson(currentPlanId, newWorkoutDays);
        }

        // 8. Trigger notification refresh
        try {
          await supabase.functions.invoke('schedule-notifications');
        } catch (e) {
          console.warn('Failed to refresh notifications after realignment:', e);
        }
      }

      return { 
        success: true, 
        workoutsRescheduled: updates.length,
        workoutsCouldNotFit: couldNotFit.length
      };
    } catch (error) {
      console.error('Schedule realignment error:', error);
      return { 
        success: false, 
        workoutsRescheduled: 0, 
        workoutsCouldNotFit: 0,
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      setIsRealigning(false);
    }
  }, [user, isWorkoutDay, findNextWorkoutDay]);

  /**
   * Update the plan_json to reflect new workout days configuration
   */
  const updatePlanJson = async (planId: string, newWorkoutDays: string[]) => {
    try {
      const { data: plan, error: fetchError } = await supabase
        .from('plans')
        .select('plan_json')
        .eq('id', planId)
        .single();

      if (fetchError || !plan) {
        console.warn('Could not fetch plan for JSON update:', fetchError);
        return;
      }

      const planJson = plan.plan_json as any;
      if (!planJson || !planJson.weeks) {
        return;
      }

      // Update each week's days to reflect new workout/rest configuration
      const updatedWeeks = planJson.weeks.map((week: any) => {
        const updatedDays = ALL_DAYS.map((dayName) => {
          // Find existing day entry
          const existingDay = week.days?.find((d: any) => d.day_name === dayName);
          
          if (newWorkoutDays.includes(dayName)) {
            // This is now a workout day
            if (existingDay && existingDay.type === 'workout') {
              return existingDay; // Keep existing workout
            }
            // If it was a rest day but should now be a workout day,
            // we don't create a new workout here - that's handled by workouts table
            return existingDay || { day_name: dayName, type: 'rest', label: 'Rest Day' };
          } else {
            // This is now a rest day
            return { day_name: dayName, type: 'rest', label: 'Rest Day' };
          }
        });

        return { ...week, days: updatedDays };
      });

      const updatedPlanJson = { ...planJson, weeks: updatedWeeks };

      await supabase
        .from('plans')
        .update({ plan_json: updatedPlanJson })
        .eq('id', planId);
    } catch (error) {
      console.warn('Failed to update plan JSON:', error);
    }
  };

  /**
   * Check if workout days have changed
   */
  const haveWorkoutDaysChanged = useCallback((
    oldDays: string[],
    newDays: string[]
  ): boolean => {
    if (oldDays.length !== newDays.length) return true;
    
    const sortedOld = [...oldDays].sort();
    const sortedNew = [...newDays].sort();
    
    return !sortedOld.every((day, i) => day === sortedNew[i]);
  }, []);

  return {
    realignSchedule,
    haveWorkoutDaysChanged,
    isRealigning,
  };
}
