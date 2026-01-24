import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Plan, Workout, UserProfile } from '@/types/database';
import type { PlanJson, WorkoutJson, DisplayWorkout, PlanDay } from '@/types/plan';
import { format, addDays } from 'date-fns';
import { 
  recomputeUserBlocks, 
  getWeekIndexInBlock,
  calculateTimelinePosition,
  BLOCK_WEEKS,
  TimelinePosition,
} from '@/lib/blockEngine';
import { parseLocalDate, getLocalToday, getLocalTodayStr, getLocalDayName } from '@/lib/dateUtils';

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
  mismatchDismissed: boolean;
}

export type PlanStatus = 'in_progress' | 'queued' | 'completed';

export interface PlanSummary {
  id: string;
  blockNumber: number;
  startDate: string;
  createdAt: string;
  isActive: boolean; // true for current_plan_id
  status: PlanStatus;
  needsRegeneration: boolean; // true if no workouts exist
  workoutCount: number;
}

interface UsePlanResult {
  plan: Plan | null;
  planJson: PlanJson | null;
  workouts: Workout[];
  userProfile: UserProfile | null;
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
  dismissMismatch: () => void;
  // Multi-plan support
  allPlans: PlanSummary[];
  selectedPlanId: string | null;
  setSelectedPlanId: (id: string | null) => void;
  currentPlanId: string | null; // users_profile.current_plan_id
  isViewingCurrentPlan: boolean;
  // Lifecycle actions
  startBlock: (planId: string) => Promise<boolean>;
  markBlockComplete: (planId: string) => Promise<boolean>;
  // Date repair and reindexing
  repairPlanDates: () => Promise<number>;
  reindexPlans: () => Promise<{ updated: number; currentPlanChanged: boolean }>;
  // Timeline position (anchored to program_start_date)
  timelinePosition: TimelinePosition | null;
  programStartDate: string | null;
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
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  
  // Mismatch dismissal tracking (keyed by plan ID)
  const [dismissedMismatches, setDismissedMismatches] = useState<Set<string>>(new Set());

  const fetchPlan = useCallback(async () => {
    if (!user) {
      setPlan(null);
      setWorkouts([]);
      setUserProfile(null);
      setAllPlans([]);
      setCurrentPlanId(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user profile for current_plan_id and workout_days
      const { data: profileData } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      setUserProfile(profileData);
      
      // Get current_plan_id from profile (cast to access new column)
      const profileCurrentPlanId = (profileData as UserProfile & { current_plan_id?: string })?.current_plan_id || null;
      setCurrentPlanId(profileCurrentPlanId);

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
        setLoading(false);
        return;
      }

      // Fetch workout counts per plan to determine needsRegeneration
      const { data: workoutCounts } = await supabase
        .from('workouts')
        .select('plan_id')
        .eq('user_id', user.id);

      const workoutCountByPlan = new Map<string, number>();
      for (const w of workoutCounts || []) {
        if (w.plan_id) {
          workoutCountByPlan.set(w.plan_id, (workoutCountByPlan.get(w.plan_id) || 0) + 1);
        }
      }

      // Build plan summaries with status
      const planSummaries: PlanSummary[] = [];

      for (const p of allPlansData) {
        const pJson = p.plan_json as unknown as PlanJson;
        const blockNumber = (p as Plan & { block_number?: number }).block_number || pJson?.block_number || 1;
        const status = ((p as Plan & { status?: string }).status || 'in_progress') as PlanStatus;
        const workoutCount = workoutCountByPlan.get(p.id) || 0;
        const needsRegeneration = workoutCount === 0 || !!(pJson as unknown as Record<string, unknown>)?.needs_regeneration;
        
        // Track if this matches current_plan_id (will be updated after effective ID is determined)
        const isActive = p.id === profileCurrentPlanId;
        
        planSummaries.push({
          id: p.id,
          blockNumber,
          startDate: p.start_date || '',
          createdAt: p.created_at || '',
          isActive,
          status,
          needsRegeneration,
          workoutCount,
        });
      }

      // Sort by block number descending
      planSummaries.sort((a, b) => b.blockNumber - a.blockNumber);

      setAllPlans(planSummaries);

      // Determine effective current plan
      // Priority: profileCurrentPlanId > newest in_progress plan > newest plan
      let effectiveCurrentId = profileCurrentPlanId;
      
      if (!effectiveCurrentId) {
        // Find newest in_progress plan
        const inProgressPlans = allPlansData.filter(p => 
          ((p as Plan & { status?: string }).status || 'in_progress') === 'in_progress'
        );
        
        if (inProgressPlans.length > 0) {
          // Sort by created_at descending
          inProgressPlans.sort((a, b) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
          effectiveCurrentId = inProgressPlans[0].id;
        } else {
          // Fallback to newest plan
          effectiveCurrentId = allPlansData[0]?.id;
        }
        
        // Persist the effective current_plan_id to the database
        if (effectiveCurrentId) {
          supabase
            .from('users_profile')
            .update({ current_plan_id: effectiveCurrentId })
            .eq('id', user.id)
            .then(() => {
              console.log('Set current_plan_id to:', effectiveCurrentId);
            });
        }
      }
      
      // Update currentPlanId state with the effective value
      setCurrentPlanId(effectiveCurrentId);
      
      // Update isActive flag on plan summaries
      for (const summary of planSummaries) {
        summary.isActive = summary.id === effectiveCurrentId;
      }

      // Use selected plan or default to current
      const targetPlanId = selectedPlanId || effectiveCurrentId;
      const targetPlan = allPlansData.find(p => p.id === targetPlanId) 
        || allPlansData.find(p => p.id === effectiveCurrentId)
        || allPlansData[0];

      if (!targetPlan) {
        setPlan(null);
        setWorkouts([]);
        setLoading(false);
        return;
      }

      setPlan(targetPlan);
      if (!selectedPlanId) {
        setSelectedPlanId(effectiveCurrentId);
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

  // Start a queued block (set it as current and in_progress)
  const startBlock = useCallback(async (planId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Update plan status to in_progress
      const { error: planError } = await supabase
        .from('plans')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', planId);

      if (planError) throw planError;

      // Set as current plan in profile
      const { error: profileError } = await supabase
        .from('users_profile')
        .update({ current_plan_id: planId })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Refresh data
      await fetchPlan();
      return true;
    } catch (err) {
      console.error('Failed to start block:', err);
      return false;
    }
  }, [user, fetchPlan]);

  // Mark a block as completed
  const markBlockComplete = useCallback(async (planId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('plans')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', planId);

      if (error) throw error;

      // Refresh data
      await fetchPlan();
      return true;
    } catch (err) {
      console.error('Failed to mark block complete:', err);
      return false;
    }
  }, [user, fetchPlan]);

  // Repair plan start_dates based on earliest workout scheduled_date
  // Uses the canonical blockEngine service
  const repairPlanDates = useCallback(async (): Promise<number> => {
    if (!user) return 0;
    const result = await recomputeUserBlocks(user.id);
    if (result.updated > 0 || result.currentPlanChanged) {
      await fetchPlan();
    }
    return result.updated;
  }, [user, fetchPlan]);

  // Comprehensive re-indexing using blockEngine
  const reindexPlans = useCallback(async (): Promise<{ updated: number; currentPlanChanged: boolean }> => {
    if (!user) return { updated: 0, currentPlanChanged: false };
    const result = await recomputeUserBlocks(user.id);
    if (result.updated > 0 || result.currentPlanChanged) {
      await fetchPlan();
    }
    return { updated: result.updated, currentPlanChanged: result.currentPlanChanged };
  }, [user, fetchPlan]);

  const planJson = plan?.plan_json as unknown as PlanJson | null;

  // Get program_start_date from profile for timeline calculations
  const programStartDate = (userProfile as UserProfile & { program_start_date?: string })?.program_start_date;

  // Calculate timeline position using program_start_date (canonical source of truth)
  const getTimelinePosition = (): TimelinePosition | null => {
    // Use program_start_date if available, otherwise fall back to plan.start_date
    const anchorDate = programStartDate || plan?.start_date;
    if (!anchorDate) return null;
    
    // Use getLocalToday() for timezone-safe current date
    return calculateTimelinePosition(anchorDate, getLocalToday());
  };

  const timelinePosition = getTimelinePosition();

  // Calculate current week index
  // IMPORTANT: Only use timeline position for the CURRENT plan, not for historical blocks
  const getCurrentWeekIndex = (): number => {
    // For non-current plans, default to week 0 (Week 1)
    if (plan?.id !== currentPlanId) return 0;
    
    // Use timeline position if we have program_start_date
    if (timelinePosition) {
      // Get the week within the CURRENT block based on timeline
      return Math.max(0, Math.min(BLOCK_WEEKS - 1, timelinePosition.weekInBlock - 1));
    }
    
    // Fallback to plan.start_date calculation
    if (!plan?.start_date) return 0;
    // Use getLocalToday() for timezone-safe calculation
    const weekIndex = getWeekIndexInBlock(plan.start_date, getLocalToday());
    return Math.max(0, Math.min(BLOCK_WEEKS - 1, weekIndex));
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

  // Get today's workout - ONLY from the current plan
  const getTodayWorkout = useCallback((): DisplayWorkout | null => {
    // Only return workouts for the current plan
    if (!plan?.start_date || plan.id !== currentPlanId) return null;
    
    // Use timezone-safe local date utilities
    const today = getLocalToday();
    const todayStr = getLocalTodayStr();
    const todayName = getLocalDayName(today);
    
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
  }, [workouts, planJson, plan?.start_date, plan?.id, currentPlanId]);

  // Get next upcoming workout within 7 days - ONLY from current plan
  const getNextUpcomingWorkout = useCallback((): DisplayWorkout | null => {
    // Only return workouts for the current plan
    if (plan?.id !== currentPlanId) return null;
    
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
  }, [workouts, plan?.id, currentPlanId]);

  // Get the start date for plan Week 1 (anchored to program_start_date)
  // CRITICAL: Do NOT use calendar week logic - program_start_date IS the anchor
  const getPlanWeekStart = useCallback((): Date | null => {
    // Use program_start_date as the single source of truth for week anchoring
    const anchorDate = programStartDate || plan?.start_date;
    if (!anchorDate) return null;
    
    // Parse date as local date to avoid timezone issues
    const startDate = parseLocalDate(anchorDate);
    // Return the actual program start date - NO calendar week adjustment
    // Week 1 starts on program_start_date, not the Monday of that calendar week
    return startDate;
  }, [programStartDate, plan?.start_date]);

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
    
    // Check if user dismissed this mismatch
    const mismatchDismissed = plan?.id ? dismissedMismatches.has(plan.id) : false;
    
    return {
      profileWorkoutDays,
      scheduledWorkoutDays,
      hasMismatch,
      mismatchDismissed,
    };
  })();

  // Dismiss mismatch for current plan
  const dismissMismatch = useCallback(() => {
    if (plan?.id) {
      setDismissedMismatches(prev => new Set([...prev, plan.id]));
    }
  }, [plan?.id]);

  const isViewingCurrentPlan = selectedPlanId === currentPlanId;

  return {
    plan,
    planJson,
    workouts,
    userProfile,
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
    dismissMismatch,
    // Multi-plan support
    allPlans,
    selectedPlanId,
    setSelectedPlanId,
    currentPlanId,
    isViewingCurrentPlan,
    // Lifecycle actions
    startBlock,
    markBlockComplete,
    // Date repair and reindexing
    repairPlanDates,
    reindexPlans,
    // Timeline position (anchored to program_start_date)
    timelinePosition,
    programStartDate: programStartDate || null,
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
  if (title.includes('cardio') || title.includes('hiit') || title.includes('conditioning')) {
    return 'cardio';
  }
  if (title.includes('recovery') || title.includes('mobility')) {
    return 'recovery';
  }
  if (title.includes('core') || title.includes('abs')) {
    return 'core';
  }
  
  return 'strength';
}
