import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfWeek, endOfWeek, isAfter, parseISO } from 'date-fns';
import { getLocalToday } from '@/lib/dateUtils';
import type { 
  DailyProgress, 
  PersonalBest, 
  StreakInfo, 
  WeeklyAdherence, 
  ProgressSummary, 
  StrengthSignal,
  EnduranceSignals,
  EnergyLevel 
} from '@/types/progress';

import type { SessionLog as WorkoutSessionLog, SetLog as WorkoutSetLog } from '@/hooks/useWorkoutPlayer';

export function useProgressMetrics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([]);

  const fetchProgressData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const today = getLocalToday();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const lastWeekStart = subDays(weekStart, 7);
      const lastWeekEnd = subDays(weekStart, 1);

      // Fetch in parallel
      const [
        { data: dailyProgressData },
        { data: personalBestsData },
        { data: workoutSessionsData },
        { data: profileData },
      ] = await Promise.all([
        supabase
          .from('daily_progress')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', format(subDays(today, 30), 'yyyy-MM-dd'))
          .order('date', { ascending: false }),
        supabase
          .from('personal_bests')
          .select('*')
          .eq('user_id', user.id)
          .order('achieved_at', { ascending: false })
          .limit(10),
        supabase
          .from('workout_sessions')
          .select('*, workouts(scheduled_date)')
          .eq('user_id', user.id)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false }),
        supabase
          .from('users_profile')
          .select('longest_streak, workout_days')
          .eq('id', user.id)
          .maybeSingle(),
      ]);

      // Calculate streak
      const streak = calculateStreak(workoutSessionsData || [], profileData);

      // Calculate weekly adherence
      const weeklyAdherence = calculateWeeklyAdherence(
        workoutSessionsData || [],
        profileData?.workout_days as string[] || [],
        weekStart,
        weekEnd
      );

      // Get recent PRs (achieved in last 7 days)
      const recentPRs = (personalBestsData || []).filter(pb => {
        const achievedDate = parseISO(pb.achieved_at);
        return isAfter(achievedDate, subDays(today, 7));
      }) as PersonalBest[];

      // Get strength improvements from daily progress
      const strengthImprovements: StrengthSignal[] = [];
      (dailyProgressData || []).slice(0, 7).forEach(dp => {
        const signals = (dp.strength_signals as unknown as StrengthSignal[]) || [];
        strengthImprovements.push(...signals.filter(s => s.improvement_percent > 0));
      });

      // Get latest endurance signals
      const latestProgress = dailyProgressData?.[0];
      const enduranceImprovements: EnduranceSignals = 
        (latestProgress?.endurance_signals as unknown as EnduranceSignals) || {};

      // Get energy trend (last 7 days)
      const energyTrend = (dailyProgressData || [])
        .slice(0, 7)
        .filter(dp => dp.energy_level !== null)
        .map(dp => ({
          date: dp.date,
          level: dp.energy_level as EnergyLevel,
        }))
        .reverse();

      // Calculate active minutes
      const thisWeekSessions = (workoutSessionsData || []).filter(ws => {
        const sessionDate = parseISO(ws.completed_at!);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });
      const lastWeekSessions = (workoutSessionsData || []).filter(ws => {
        const sessionDate = parseISO(ws.completed_at!);
        return sessionDate >= lastWeekStart && sessionDate <= lastWeekEnd;
      });

      const activeMinutesThisWeek = thisWeekSessions.reduce((acc, ws) => {
        const log = ws.session_log_json as unknown as WorkoutSessionLog | null;
        return acc + Math.round((log?.total_duration_sec || 0) / 60);
      }, 0);

      const activeMinutesLastWeek = lastWeekSessions.reduce((acc, ws) => {
        const log = ws.session_log_json as unknown as WorkoutSessionLog | null;
        return acc + Math.round((log?.total_duration_sec || 0) / 60);
      }, 0);

      setSummary({
        streak,
        weeklyAdherence,
        recentPRs,
        strengthImprovements: strengthImprovements.slice(0, 5),
        enduranceImprovements,
        energyTrend,
        activeMinutesThisWeek,
        activeMinutesLastWeek,
      });

      setPersonalBests(personalBestsData as PersonalBest[] || []);
    } catch (error) {
      console.error('Error fetching progress metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProgressData();
  }, [fetchProgressData]);

  // Record energy level for today
  const recordEnergyLevel = useCallback(async (level: EnergyLevel) => {
    if (!user) return;

    const today = format(getLocalToday(), 'yyyy-MM-dd');

    try {
      const { error } = await supabase
        .from('daily_progress')
        .upsert(
          {
            user_id: user.id,
            date: today,
            energy_level: level,
          },
          { onConflict: 'user_id,date' }
        );

      if (error) throw error;
      await fetchProgressData();
    } catch (error) {
      console.error('Error recording energy level:', error);
    }
  }, [user, fetchProgressData]);

  // Update progress after workout completion
  const recordWorkoutCompletion = useCallback(async (
    sessionLog: WorkoutSessionLog,
    durationMinutes: number
  ) => {
    if (!user) return;

    const today = format(getLocalToday(), 'yyyy-MM-dd');

    try {
      // Get current daily progress
      const { data: existingProgress } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      // Calculate new streak
      const { data: recentSessions } = await supabase
        .from('workout_sessions')
        .select('completed_at')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(30);

      const currentStreak = calculateCurrentStreak(recentSessions || []);

      // Check for personal bests
      const newPRs = await checkAndUpdatePersonalBests(sessionLog, user.id);

      // Build strength signals
      const strengthSignals: StrengthSignal[] = newPRs.map(pr => ({
        exercise_name: pr.exercise_name,
        improvement_type: pr.type,
        previous_value: pr.previousValue,
        new_value: pr.newValue,
        improvement_percent: pr.improvementPercent,
        is_pr: true,
      }));

      // Upsert daily progress
      const { error } = await supabase
        .from('daily_progress')
        .upsert({
          user_id: user.id,
          date: today,
          workouts_completed: (existingProgress?.workouts_completed || 0) + 1,
          active_minutes: (existingProgress?.active_minutes || 0) + durationMinutes,
          current_streak: currentStreak,
          strength_signals: JSON.stringify([
            ...((existingProgress?.strength_signals as unknown as StrengthSignal[]) || []),
            ...strengthSignals,
          ]),
          energy_level: existingProgress?.energy_level || null,
        });

      if (error) throw error;

      // Update longest streak if needed
      const { data: profile } = await supabase
        .from('users_profile')
        .select('longest_streak')
        .eq('id', user.id)
        .maybeSingle();

      if (currentStreak > (profile?.longest_streak || 0)) {
        await supabase
          .from('users_profile')
          .update({ longest_streak: currentStreak })
          .eq('id', user.id);
      }

      await fetchProgressData();
      return { newPRs, currentStreak };
    } catch (error) {
      console.error('Error recording workout completion:', error);
      return null;
    }
  }, [user, fetchProgressData]);

  return {
    loading,
    summary,
    personalBests,
    recordEnergyLevel,
    recordWorkoutCompletion,
    refetch: fetchProgressData,
  };
}

// Helper functions
function calculateStreak(
  sessions: { completed_at: string | null }[],
  profile: { longest_streak: number | null } | null
): StreakInfo {
  const current = calculateCurrentStreak(sessions);
  const longest = Math.max(current, profile?.longest_streak || 0);
  const lastWorkoutDate = sessions[0]?.completed_at || null;

  return { current, longest, lastWorkoutDate };
}

function calculateCurrentStreak(sessions: { completed_at: string | null }[]): number {
  if (sessions.length === 0) return 0;

  const today = getLocalToday();
  let streak = 0;
  const workoutDates = new Set<string>();

  sessions.forEach(s => {
    if (s.completed_at) {
      workoutDates.add(format(parseISO(s.completed_at), 'yyyy-MM-dd'));
    }
  });

  // Count consecutive days with workouts (allowing today or yesterday as starting point)
  for (let i = 0; i <= 365; i++) {
    const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
    if (workoutDates.has(checkDate)) {
      streak++;
    } else if (i > 0) {
      // Break if we miss a day (except for today which might not have a workout yet)
      break;
    }
  }

  return streak;
}

function calculateWeeklyAdherence(
  sessions: { completed_at: string | null; workouts: { scheduled_date: string | null } | null }[],
  workoutDays: string[],
  weekStart: Date,
  weekEnd: Date
): WeeklyAdherence {
  const planned = workoutDays.length;
  const completed = sessions.filter(s => {
    if (!s.completed_at) return false;
    const completedDate = parseISO(s.completed_at);
    return completedDate >= weekStart && completedDate <= weekEnd;
  }).length;

  return {
    planned,
    completed,
    percentage: planned > 0 ? Math.round((completed / planned) * 100) : 0,
  };
}

interface PRUpdate {
  exercise_name: string;
  type: 'reps' | 'weight' | 'volume';
  previousValue: number;
  newValue: number;
  improvementPercent: number;
}

async function checkAndUpdatePersonalBests(
  sessionLog: WorkoutSessionLog,
  userId: string
): Promise<PRUpdate[]> {
  const prUpdates: PRUpdate[] = [];

  // Group sets by exercise
  const exerciseSets: Record<string, { reps: number; weight: number }[]> = {};
  sessionLog.sets.forEach(set => {
    const exerciseName = set.exercise;
    if (!exerciseSets[exerciseName]) {
      exerciseSets[exerciseName] = [];
    }
    exerciseSets[exerciseName].push({
      reps: set.reps,
      weight: set.weight || 0,
    });
  });

  // Check each exercise for PRs
  for (const [exerciseName, sets] of Object.entries(exerciseSets)) {
    const maxReps = Math.max(...sets.map(s => s.reps));
    const maxWeight = Math.max(...sets.map(s => s.weight));
    const totalVolume = sets.reduce((acc, s) => acc + s.reps * s.weight, 0);

    // Get existing PR
    const { data: existingPR } = await supabase
      .from('personal_bests')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_name', exerciseName)
      .maybeSingle();

    const updates: Partial<PersonalBest> = {};
    let isNewPR = false;

    if (!existingPR) {
      // First time doing this exercise
      await supabase.from('personal_bests').insert({
        user_id: userId,
        exercise_name: exerciseName,
        max_reps: maxReps,
        max_weight_kg: maxWeight > 0 ? maxWeight : null,
        max_sets: sets.length,
        best_volume: totalVolume > 0 ? totalVolume : null,
      });
      isNewPR = true;
    } else {
      // Check for improvements
      if (maxReps > (existingPR.max_reps || 0)) {
        updates.max_reps = maxReps;
        prUpdates.push({
          exercise_name: exerciseName,
          type: 'reps',
          previousValue: existingPR.max_reps || 0,
          newValue: maxReps,
          improvementPercent: existingPR.max_reps 
            ? Math.round(((maxReps - existingPR.max_reps) / existingPR.max_reps) * 100)
            : 100,
        });
        isNewPR = true;
      }

      if (maxWeight > (existingPR.max_weight_kg || 0)) {
        updates.max_weight_kg = maxWeight;
        prUpdates.push({
          exercise_name: exerciseName,
          type: 'weight',
          previousValue: existingPR.max_weight_kg || 0,
          newValue: maxWeight,
          improvementPercent: existingPR.max_weight_kg
            ? Math.round(((maxWeight - existingPR.max_weight_kg) / existingPR.max_weight_kg) * 100)
            : 100,
        });
        isNewPR = true;
      }

      if (totalVolume > (existingPR.best_volume || 0)) {
        updates.best_volume = totalVolume;
        if (!prUpdates.find(p => p.exercise_name === exerciseName)) {
          prUpdates.push({
            exercise_name: exerciseName,
            type: 'volume',
            previousValue: existingPR.best_volume || 0,
            newValue: totalVolume,
            improvementPercent: existingPR.best_volume
              ? Math.round(((totalVolume - existingPR.best_volume) / existingPR.best_volume) * 100)
              : 100,
          });
        }
        isNewPR = true;
      }

      if (sets.length > (existingPR.max_sets || 0)) {
        updates.max_sets = sets.length;
        isNewPR = true;
      }

      if (isNewPR && Object.keys(updates).length > 0) {
        updates.achieved_at = new Date().toISOString();
        await supabase
          .from('personal_bests')
          .update(updates)
          .eq('id', existingPR.id);
      }
    }
  }

  return prUpdates;
}
