import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { 
  WorkoutLog, 
  WorkoutLogInsert, 
  WorkoutLogUpdate, 
  ExternalWorkoutData,
  WorkoutSourceFilter 
} from '@/types/workoutLog';
import { format, parseISO, differenceInMinutes, subDays } from 'date-fns';

interface UseWorkoutLogsOptions {
  filter?: WorkoutSourceFilter;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}

interface UseWorkoutLogsReturn {
  logs: WorkoutLog[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  addLog: (log: Omit<WorkoutLogInsert, 'user_id'>) => Promise<WorkoutLog | null>;
  updateLog: (id: string, updates: WorkoutLogUpdate) => Promise<boolean>;
  deleteLog: (id: string) => Promise<boolean>;
  importExternalWorkouts: (workouts: ExternalWorkoutData[]) => Promise<{ imported: number; skipped: number }>;
  checkDuplicate: (workout: ExternalWorkoutData) => Promise<boolean>;
  // Analytics
  getTotalMinutes: (days?: number) => number;
  getTotalCalories: (days?: number) => number;
  getWorkoutCount: (days?: number) => number;
  getStreak: () => number;
}

export function useWorkoutLogs(options: UseWorkoutLogsOptions = {}): UseWorkoutLogsReturn {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { filter = 'all', limit = 100, startDate, endDate } = options;

  const fetchLogs = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(limit);

      if (filter !== 'all') {
        query = query.eq('source', filter);
      }

      if (startDate) {
        query = query.gte('start_time', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('start_time', endDate.toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      
      // Cast the data to WorkoutLog[] since we know the shape
      setLogs((data || []) as WorkoutLog[]);
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Failed to fetch workout logs');
      setError(e);
      console.error('useWorkoutLogs fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [user, filter, limit, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const addLog = async (log: Omit<WorkoutLogInsert, 'user_id'>): Promise<WorkoutLog | null> => {
    if (!user) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('workout_logs')
        .insert([{
          ...log,
          user_id: user.id,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      const newLog = data as WorkoutLog;
      setLogs(prev => [newLog, ...prev]);
      return newLog;
    } catch (err) {
      console.error('Failed to add workout log:', err);
      return null;
    }
  };

  const updateLog = async (id: string, updates: WorkoutLogUpdate): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: updateError } = await supabase
        .from('workout_logs')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setLogs(prev => prev.map(log => 
        log.id === id ? { ...log, ...updates } : log
      ));
      return true;
    } catch (err) {
      console.error('Failed to update workout log:', err);
      return false;
    }
  };

  const deleteLog = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: deleteError } = await supabase
        .from('workout_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setLogs(prev => prev.filter(log => log.id !== id));
      return true;
    } catch (err) {
      console.error('Failed to delete workout log:', err);
      return false;
    }
  };

  // Check if a workout already exists (for de-duplication)
  const checkDuplicate = async (workout: ExternalWorkoutData): Promise<boolean> => {
    if (!user) return false;

    // First check by externalId if available
    if (workout.externalId) {
      const { data } = await supabase
        .from('workout_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('source', workout.source)
        .eq('external_id', workout.externalId)
        .maybeSingle();

      if (data) return true;
    }

    // Fallback: check by time proximity and duration
    const startTimeStr = workout.startTime.toISOString();
    const toleranceMinutes = 5;
    
    const { data: similarWorkouts } = await supabase
      .from('workout_logs')
      .select('start_time, duration_minutes')
      .eq('user_id', user.id)
      .eq('source', workout.source)
      .gte('start_time', new Date(workout.startTime.getTime() - toleranceMinutes * 60000).toISOString())
      .lte('start_time', new Date(workout.startTime.getTime() + toleranceMinutes * 60000).toISOString());

    if (similarWorkouts && similarWorkouts.length > 0) {
      // Check if any have similar duration (within 10% tolerance)
      return similarWorkouts.some(existing => {
        const durationDiff = Math.abs(existing.duration_minutes - workout.durationMinutes);
        const tolerance = workout.durationMinutes * 0.1; // 10% tolerance
        return durationDiff <= Math.max(tolerance, 2); // At least 2 min tolerance
      });
    }

    return false;
  };

  // Import workouts from external source with de-duplication
  const importExternalWorkouts = async (
    workouts: ExternalWorkoutData[]
  ): Promise<{ imported: number; skipped: number }> => {
    if (!user) return { imported: 0, skipped: 0 };

    let imported = 0;
    let skipped = 0;

    for (const workout of workouts) {
      const isDuplicate = await checkDuplicate(workout);
      
      if (isDuplicate) {
        skipped++;
        continue;
      }

      const logData = {
        source: workout.source,
        external_id: workout.externalId,
        start_time: workout.startTime.toISOString(),
        end_time: workout.endTime.toISOString(),
        duration_minutes: workout.durationMinutes,
        workout_type: workout.workoutType,
        calories_burned: workout.caloriesBurned,
        heart_rate_avg: workout.heartRateAvg,
        steps: workout.steps,
        distance_meters: workout.distanceMeters,
        metadata: workout.rawData || {},
      };

      const result = await addLog(logData);
      if (result) {
        imported++;
      }
    }

    // Refetch to ensure correct order
    if (imported > 0) {
      await fetchLogs();
    }

    return { imported, skipped };
  };

  // Analytics helpers
  const getTotalMinutes = (days = 7): number => {
    const cutoff = subDays(new Date(), days);
    return logs
      .filter(log => parseISO(log.start_time) >= cutoff)
      .reduce((sum, log) => sum + log.duration_minutes, 0);
  };

  const getTotalCalories = (days = 7): number => {
    const cutoff = subDays(new Date(), days);
    return logs
      .filter(log => parseISO(log.start_time) >= cutoff)
      .reduce((sum, log) => sum + (log.calories_burned || 0), 0);
  };

  const getWorkoutCount = (days = 7): number => {
    const cutoff = subDays(new Date(), days);
    return logs.filter(log => parseISO(log.start_time) >= cutoff).length;
  };

  const getStreak = (): number => {
    if (logs.length === 0) return 0;

    // Group workouts by date
    const workoutDates = new Set(
      logs.map(log => format(parseISO(log.start_time), 'yyyy-MM-dd'))
    );

    let streak = 0;
    let currentDate = new Date();

    // Check if today has a workout, otherwise start from yesterday
    const todayStr = format(currentDate, 'yyyy-MM-dd');
    if (!workoutDates.has(todayStr)) {
      currentDate = subDays(currentDate, 1);
    }

    // Count consecutive days with workouts
    while (workoutDates.has(format(currentDate, 'yyyy-MM-dd'))) {
      streak++;
      currentDate = subDays(currentDate, 1);
    }

    return streak;
  };

  return {
    logs,
    loading,
    error,
    refetch: fetchLogs,
    addLog,
    updateLog,
    deleteLog,
    importExternalWorkouts,
    checkDuplicate,
    getTotalMinutes,
    getTotalCalories,
    getWorkoutCount,
    getStreak,
  };
}
