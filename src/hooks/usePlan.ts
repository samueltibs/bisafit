import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Plan, Workout, UserProfile } from '@/types/database';
import type { PlanJson, WorkoutJson, DisplayWorkout, PlanDay } from '@/types/plan';
import { format, addDays } from 'date-fns';

// Helper to normalize workout days for comparison
export function normalizeWorkoutDays(days: unknown): string[] {
  const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const defaultDays = ["Monday", "Wednesday", "Thursday", "Friday"];
  
  if (!Array.isArray(days) || days.length === 0) {
    return defaultDays;
  }

  const normalizedSet = new Set<string>();
  
  for (const day of days) {
    if (typeof day !== "string") continue;
    const trimmed = day.trim();
    const normalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    if (ALL_DAYS.includes(normalized)) {
      normalizedSet.add(normalized);
    }
  }
  
  if (normalizedSet.size === 0) {
    return defaultDays;
  }
  
  return Array.from(normalizedSet).sort((a, b) => 
    ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b)
  );
}

interface SchedulingDebugInfo {
  profileWorkoutDays: string[];
  scheduledWorkoutDays: string[];
  hasMismatch: boolean;
}

export interface PlanSummary {
  id: string;
  blockNumber: number;
  startDate: string;
  createdAt: string;
  isActive: boolean;
}

interface UsePlanResult {
  plan: Plan | null;
  planJson: PlanJson | null;
  workouts: Workout[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getWorkoutsForWeek: (weekStart: Date) => DisplayWorkout[];
  getTodayWorkout: () => DisplayWorkout | null;
  getNextUpcomingWorkout: () => DisplayWorkout | null;
  currentWeekNumber: number;
  currentWeekIndex: number;
  getPlanWeekStart: () => Date | null;
  hasGenerationIssue: boolean;
  schedulingDebug: SchedulingDebugInfo | null;
  // Multi-plan support
  allPlans: PlanSummary[];
  selectedPlanId: string | null;
  setSelectedPlanId: (id: string | null) => void;
  activePlanId: string | null;
  isViewingActivePlan: boolean;
}

export function usePlan(): UsePlanResult {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Multi-plan state
  const [allPlans, setAllPlans] = useState<PlanSummary[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    if (!user) {
      setPlan(null);
      setWorkouts([]);
      setUserProfile(null);
      setAllPlans([]);
      setActivePlanId(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user profile for workout_days comparison
      const { data: profileData } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      setUserProfile(profileData);

      // Fetch ALL plans for this user
      const { data: allPlansData, error: allPlansError } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (allPlansError) throw allPlansError;

      if (!allPlansData || allPlansData.length === 0) {
        setPlan(null);
        setWorkouts([]);
        setAllPlans([]);
        setActivePlanId(null);
        setLoading(false);
        return;
      }

      // Build plan summaries and find active plan (highest block_number)
      const planSummaries: PlanSummary[] = [];
      let maxBlockNumber = 0;
      let activePlan: Plan | null = null;

      for (const p of allPlansData) {
        const pJson = p.plan_json as unknown as PlanJson;
        const blockNumber = pJson?.block_number || 1;
        
        planSummaries.push({
          id: p.id,
          blockNumber,
          startDate: p.start_date || '',
          createdAt: p.created_at || '',
          isActive: false, // Will update after finding max
        });

        if (blockNumber > maxBlockNumber) {
          maxBlockNumber = blockNumber;
          activePlan = p;
        }
      }

      // Mark active plan
      const activeId = activePlan?.id || allPlansData[0]?.id;
      for (const summary of planSummaries) {
        summary.isActive = summary.id === activeId;
      }

      // Sort by block number descending
      planSummaries.sort((a, b) => b.blockNumber - a.blockNumber);

      setAllPlans(planSummaries);
      setActivePlanId(activeId);

      // Use selected plan or default to active
      const targetPlanId = selectedPlanId || activeId;
      const targetPlan = allPlansData.find(p => p.id === targetPlanId) || activePlan;

      if (!targetPlan) {
        setPlan(null);
        setWorkouts([]);
        setLoading(false);
        return;
      }

      setPlan(targetPlan);
      if (!selectedPlanId) {
        setSelectedPlanId(activeId);
      }

      // Fetch all workouts for this plan
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('plan_id', targetPlan.id)
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
  }, [user, selectedPlanId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const planJson = plan?.plan_json as unknown as PlanJson | null;

  // Calculate current week number based on plan start date (0-indexed internally, 1-indexed for display)
  const getCurrentWeekIndex = (): number => {
    if (!plan?.start_date) return 0;
    const startDate = new Date(plan.start_date);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(diffDays / 7);
    return Math.max(0, Math.min(3, weekIndex)); // Clamp between 0-3
  };

  const currentWeekIndex = getCurrentWeekIndex();
  const currentWeekNumber = currentWeekIndex + 1;

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

  // Get next upcoming workout within 7 days
  const getNextUpcomingWorkout = useCallback((): DisplayWorkout | null => {
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const dayName = dayNames[checkDate.getDay()];
      
      const workout = workouts.find(w => w.scheduled_date === dateStr);
      
      if (workout) {
        const workoutJson = workout.workout_json as unknown as WorkoutJson;
        return {
          id: workout.id,
          day: dayName,
          dayDate: checkDate,
          workout: workout.title || workoutJson?.title || 'Workout',
          duration: workoutJson?.total_estimated_minutes || 0,
          type: inferWorkoutTypeFromJson(workoutJson),
          completed: false,
          workoutJson,
          isRest: false,
        };
      }
    }
    
    return null;
  }, [workouts]);

  // Get the start date for a specific plan week (0-indexed)
  const getPlanWeekStart = useCallback((): Date | null => {
    if (!plan?.start_date) return null;
    const startDate = new Date(plan.start_date);
    startDate.setHours(0, 0, 0, 0);
    // Find the Monday of the week containing the start date
    const dayOfWeek = startDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + daysToMonday);
    return weekStart;
  }, [plan?.start_date]);

  // Calculate scheduling debug info
  const schedulingDebug: SchedulingDebugInfo | null = (() => {
    if (!planJson?.weeks || !userProfile) return null;
    
    const profileWorkoutDays = normalizeWorkoutDays(userProfile.workout_days);
    
    // Get scheduled workout days from week 1 of the plan
    const week1 = planJson.weeks.find(w => w.week_number === 1);
    if (!week1) return null;
    
    const scheduledWorkoutDays = week1.days
      .filter(d => {
        const normalized = normalizePlanDayCompat(d);
        return normalized.type === 'workout';
      })
      .map(d => d.day_name);
    
    // Check for mismatch
    const hasMismatch = 
      profileWorkoutDays.length !== scheduledWorkoutDays.length ||
      !profileWorkoutDays.every(day => scheduledWorkoutDays.includes(day));
    
    return {
      profileWorkoutDays,
      scheduledWorkoutDays,
      hasMismatch,
    };
  })();

  const isViewingActivePlan = selectedPlanId === activePlanId;

  return {
    plan,
    planJson,
    workouts,
    loading,
    error,
    refetch: fetchPlan,
    getWorkoutsForWeek,
    getTodayWorkout,
    getNextUpcomingWorkout,
    currentWeekNumber,
    currentWeekIndex,
    getPlanWeekStart,
    hasGenerationIssue,
    schedulingDebug,
    // Multi-plan support
    allPlans,
    selectedPlanId,
    setSelectedPlanId,
    activePlanId,
    isViewingActivePlan,
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
