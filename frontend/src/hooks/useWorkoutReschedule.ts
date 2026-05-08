import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, isBefore, startOfDay, isSameDay } from 'date-fns';
import type { DisplayWorkout } from '@/types/plan';
import { toast } from 'sonner';

export interface RescheduleValidation {
  isValid: boolean;
  warning?: string;
  error?: string;
}

export interface RescheduleResult {
  success: boolean;
  error?: string;
}

export function useWorkoutReschedule() {
  const { user } = useAuth();
  const [isRescheduling, setIsRescheduling] = useState(false);

  /**
   * Validate a proposed reschedule date/time
   */
  const validateReschedule = useCallback(async (
    workoutId: string,
    newDate: Date,
    newTime: string,
    workoutDays?: string[]
  ): Promise<RescheduleValidation> => {
    if (!user) {
      return { isValid: false, error: 'Not authenticated' };
    }

    const today = startOfDay(new Date());
    const proposedDate = startOfDay(newDate);

    // Rule 1: Cannot schedule in the past
    if (isBefore(proposedDate, today)) {
      return { isValid: false, error: 'Cannot schedule workouts in the past' };
    }

    // Rule 2: Check for overlapping workouts on the same day
    const dateStr = format(newDate, 'yyyy-MM-dd');
    const { data: existingWorkouts } = await supabase
      .from('workouts')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('scheduled_date', dateStr)
      .neq('id', workoutId);

    if (existingWorkouts && existingWorkouts.length > 0) {
      return { 
        isValid: false, 
        error: `You already have "${existingWorkouts[0].title || 'a workout'}" scheduled for this day` 
      };
    }

    // Rule 3: Check rest day (warning only - user can override via explicit reschedule)
    // SCHEDULER RULE: The system never auto-places workouts on rest days.
    // Manual rescheduling is the ONLY way to put a workout on a rest day.
    if (workoutDays && workoutDays.length > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const proposedDayName = dayNames[newDate.getDay()];
      
      if (!workoutDays.includes(proposedDayName)) {
        return { 
          isValid: true, 
          warning: `${proposedDayName} is normally a rest day. You can still schedule, but consider your recovery.` 
        };
      }
    }

    return { isValid: true };
  }, [user]);

  /**
   * Reschedule a workout to a new date/time
   */
  const rescheduleWorkout = useCallback(async (
    workoutId: string,
    newDate: Date,
    newTime: string
  ): Promise<RescheduleResult> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsRescheduling(true);

    try {
      const dateStr = format(newDate, 'yyyy-MM-dd');

      // 1. Update the workout's scheduled date
      const { error: updateError } = await supabase
        .from('workouts')
        .update({ scheduled_date: dateStr })
        .eq('id', workoutId)
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Failed to update workout: ${updateError.message}`);
      }

      // 2. Update user's workout time preference if different from current
      const { data: profile } = await supabase
        .from('users_profile')
        .select('workout_time_preferences_json')
        .eq('id', user.id)
        .single();

      const currentPrefs = profile?.workout_time_preferences_json as { default_time?: string } | null;
      
      // Only update the time preference if user explicitly changed it for this workout
      // For now, we'll update the user's default time if they pick a different time
      if (currentPrefs?.default_time !== newTime) {
        await supabase
          .from('users_profile')
          .update({
            workout_time_preferences_json: {
              ...currentPrefs,
              default_time: newTime,
            }
          })
          .eq('id', user.id);
      }

      // 3. Trigger notification reschedule by calling the edge function
      try {
        await supabase.functions.invoke('schedule-notifications');
      } catch (notifError) {
        console.warn('Failed to reschedule notifications:', notifError);
        // Don't fail the whole operation for notification issues
      }

      // 4. Clear any existing notifications for the old date
      // (The schedule-notifications function will create new ones)
      
      // Toast is handled in the dialog after showing calendar download option
      return { success: true };
    } catch (error) {
      console.error('Reschedule error:', error);
      const message = error instanceof Error ? error.message : 'Failed to reschedule workout';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsRescheduling(false);
    }
  }, [user]);

  /**
   * Generate ICS file for a single rescheduled workout
   */
  const generateSingleWorkoutICS = useCallback(async (
    workoutId: string,
    newDate: Date,
    newTime: string
  ): Promise<string | null> => {
    if (!user) return null;

    const { data: workout } = await supabase
      .from('workouts')
      .select('id, title, workout_json, plan_id')
      .eq('id', workoutId)
      .single();

    if (!workout) return null;

    const { data: plan } = await supabase
      .from('plans')
      .select('id, plan_json')
      .eq('id', workout.plan_id)
      .single();

    if (!plan) return null;

    // Get block_number from plan_json (not DB column)
    const planJson = plan.plan_json as Record<string, unknown> | null;
    const blockNumber = (planJson?.block_number as number) || 1;

    const workoutJson = workout.workout_json as { 
      title?: string;
      focus?: string;
      total_estimated_minutes?: number 
    };
    
    const [hours, minutes] = newTime.split(':').map(Number);
    const startDate = new Date(newDate);
    startDate.setHours(hours, minutes, 0, 0);

    const duration = workoutJson?.total_estimated_minutes || 60;
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + duration + 5); // Add 5 min buffer

    const title = workout.title || workoutJson?.focus || 'Workout';
    const description = [
      `Block ${blockNumber}: ${title}`,
      '',
      `${duration} min workout`,
      '',
      'This is your rescheduled training time.',
      '',
      '— BisaFit'
    ].join('\\n');

    const formatICSDate = (date: Date): string => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BisaFit//Rescheduled Workout//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${workoutId}-reschedule@bisafit.com`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:BisaFit Workout – ${title}`,
      `DESCRIPTION:${description}`,
      'LOCATION:Home / Gym / BisaFit',
      'STATUS:CONFIRMED',
      'TRANSP:BUSY',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Workout starts in 30 minutes',
      'TRIGGER:-PT30M',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  }, [user]);

  /**
   * Download ICS file for a rescheduled workout
   */
  const downloadRescheduledICS = useCallback(async (
    workoutId: string,
    newDate: Date,
    newTime: string
  ): Promise<void> => {
    const icsContent = await generateSingleWorkoutICS(workoutId, newDate, newTime);
    if (!icsContent) {
      toast.error('Failed to generate calendar event');
      return;
    }

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `bisafit-rescheduled-workout.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Calendar event downloaded');
  }, [generateSingleWorkoutICS]);

  return {
    validateReschedule,
    rescheduleWorkout,
    downloadRescheduledICS,
    isRescheduling,
  };
}
