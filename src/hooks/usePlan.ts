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
  const repairPlanDates = useCallback(async (): Promise<number> => {
    const result = await reindexPlansInternal();
    return result.updated;
  }, []);

  // Comprehensive re-indexing: compute start_date from workouts, assign block_number sequentially
  const reindexPlansInternal = useCallback(async (): Promise<{ updated: number; currentPlanChanged: boolean }> => {
    if (!user) return { updated: 0, currentPlanChanged: false };

    try {
      console.log('Starting plan reindex...');
      
      // Fetch all plans for user
      const { data: plans, error: plansError } = await supabase
        .from('plans')
        .select('id, start_date, created_at, block_number, plan_json, status')
        .eq('user_id', user.id);

      if (plansError || !plans) {
        console.error('Failed to fetch plans for reindex:', plansError);
        return { updated: 0, currentPlanChanged: false };
      }

      // Fetch all workouts for user to compute earliest dates
      const { data: allWorkouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('plan_id, scheduled_date')
        .eq('user_id', user.id);

      if (workoutsError) {
        console.error('Failed to fetch workouts for reindex:', workoutsError);
        return { updated: 0, currentPlanChanged: false };
      }

      // Group workouts by plan_id and find earliest date per plan
      const earliestDateByPlan = new Map<string, string>();
      const workoutCountByPlan = new Map<string, number>();
      
      for (const w of allWorkouts || []) {
        if (!w.plan_id || !w.scheduled_date) continue;
        
        const count = (workoutCountByPlan.get(w.plan_id) || 0) + 1;
        workoutCountByPlan.set(w.plan_id, count);
        
        const current = earliestDateByPlan.get(w.plan_id);
        if (!current || w.scheduled_date < current) {
          earliestDateByPlan.set(w.plan_id, w.scheduled_date);
        }
      }

      // Build list of plans with computed start_date
      interface PlanForReindex {
        id: string;
        computedStartDate: string | null;
        hasWorkouts: boolean;
        workoutCount: number;
        currentStartDate: string | null;
        currentBlockNumber: number | null;
        planJson: Record<string, unknown>;
        status: string;
        createdAt: string;
      }

      const plansToProcess: PlanForReindex[] = [];

      for (const p of plans) {
        const earliestDate = earliestDateByPlan.get(p.id) || null;
        const workoutCount = workoutCountByPlan.get(p.id) || 0;
        const pJson = (p.plan_json || {}) as Record<string, unknown>;
        
        plansToProcess.push({
          id: p.id,
          computedStartDate: earliestDate,
          hasWorkouts: workoutCount > 0,
          workoutCount,
          currentStartDate: p.start_date,
          currentBlockNumber: (p as { block_number?: number }).block_number || null,
          planJson: pJson,
          status: (p as { status?: string }).status || 'in_progress',
          createdAt: p.created_at || '',
        });
      }

      // Separate valid plans (with workouts) from invalid (needs regeneration)
      const validPlans = plansToProcess.filter(p => p.hasWorkouts && p.computedStartDate);
      const invalidPlans = plansToProcess.filter(p => !p.hasWorkouts || !p.computedStartDate);

      // Sort valid plans by computed start_date ascending (oldest first)
      validPlans.sort((a, b) => {
        if (!a.computedStartDate || !b.computedStartDate) return 0;
        return a.computedStartDate.localeCompare(b.computedStartDate);
      });

      // Assign block_number sequentially: 1, 2, 3, ...
      let updatedCount = 0;
      const blockNumberMap = new Map<string, number>();

      for (let i = 0; i < validPlans.length; i++) {
        const plan = validPlans[i];
        const newBlockNumber = i + 1;
        blockNumberMap.set(plan.id, newBlockNumber);

        const needsStartDateUpdate = plan.currentStartDate !== plan.computedStartDate;
        const needsBlockNumberUpdate = plan.currentBlockNumber !== newBlockNumber;

        if (needsStartDateUpdate || needsBlockNumberUpdate) {
          // Update plan_json with new block_number
          const updatedPlanJson = {
            ...plan.planJson,
            block_number: newBlockNumber,
          };

          const { error } = await supabase
            .from('plans')
            .update({
              start_date: plan.computedStartDate,
              block_number: newBlockNumber,
              plan_json: updatedPlanJson,
            })
            .eq('id', plan.id);

          if (!error) {
            updatedCount++;
            console.log(`Reindexed plan ${plan.id}: block=${newBlockNumber}, start=${plan.computedStartDate}`);
          } else {
            console.error(`Failed to update plan ${plan.id}:`, error);
          }
        }
      }

      // Mark invalid plans with needs_regeneration flag
      for (const plan of invalidPlans) {
        if (!plan.planJson.needs_regeneration) {
          const updatedPlanJson = {
            ...plan.planJson,
            needs_regeneration: true,
          };

          const { error } = await supabase
            .from('plans')
            .update({ plan_json: updatedPlanJson })
            .eq('id', plan.id);

          if (!error) {
            updatedCount++;
            console.log(`Marked plan ${plan.id} as needs_regeneration (no workouts)`);
          }
        }
      }

      // Fix current_plan_id: should point to the highest block_number among valid plans
      let currentPlanChanged = false;
      if (validPlans.length > 0) {
        const latestValidPlan = validPlans[validPlans.length - 1]; // Highest block number (last in sorted array)
        
        // Fetch current profile to check current_plan_id
        const { data: profile } = await supabase
          .from('users_profile')
          .select('current_plan_id')
          .eq('id', user.id)
          .single();

        const profileCurrentPlanId = profile?.current_plan_id;
        const currentPlanIsInvalid = profileCurrentPlanId && invalidPlans.some(p => p.id === profileCurrentPlanId);
        const currentPlanMissing = !profileCurrentPlanId;

        if (currentPlanIsInvalid || currentPlanMissing) {
          const { error } = await supabase
            .from('users_profile')
            .update({ current_plan_id: latestValidPlan.id })
            .eq('id', user.id);

          if (!error) {
            currentPlanChanged = true;
            console.log(`Updated current_plan_id to ${latestValidPlan.id} (Block ${blockNumberMap.get(latestValidPlan.id)})`);
          }
        }
      }

      // Refresh data after reindex
      if (updatedCount > 0 || currentPlanChanged) {
        await fetchPlan();
      }

      console.log(`Reindex complete: ${updatedCount} plans updated, currentPlanChanged=${currentPlanChanged}`);
      return { updated: updatedCount, currentPlanChanged };
    } catch (err) {
      console.error('Failed to reindex plans:', err);
      return { updated: 0, currentPlanChanged: false };
    }
  }, [user, fetchPlan]);

  // Public wrapper for reindexPlans
  const reindexPlans = useCallback(async (): Promise<{ updated: number; currentPlanChanged: boolean }> => {
    return reindexPlansInternal();
  }, [reindexPlansInternal]);

  const planJson = plan?.plan_json as unknown as PlanJson | null;

  // Calculate current week number based on plan start date (0-indexed internally, 1-indexed for display)
  // IMPORTANT: Only use today's date for the CURRENT plan, not for historical blocks
  const getCurrentWeekIndex = (): number => {
    if (!plan?.start_date) return 0;
    
    // For non-current plans, default to week 0 (Week 1)
    if (plan.id !== currentPlanId) return 0;
    
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

  // Get today's workout - ONLY from the current plan
  const getTodayWorkout = useCallback((): DisplayWorkout | null => {
    // Only return workouts for the current plan
    if (!plan?.start_date || plan.id !== currentPlanId) return null;
    
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
