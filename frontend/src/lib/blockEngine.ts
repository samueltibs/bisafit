/**
 * Block Engine - Canonical source of truth for block numbering and dates
 * 
 * DEFINITIONS:
 * - A "Block" = exactly 28 days (4 weeks)
 * - Block counting starts at the user's FIRST generated plan with workouts
 * - Block numbers increment sequentially: 1, 2, 3... and never reset
 * - Block date range: start_date (earliest workout) to start_date + 27 days
 */

import { supabase } from '@/integrations/supabase/client';
import { addDays, format } from 'date-fns';
import { parseLocalDate, getLocalToday } from './dateUtils';

// Constants
export const BLOCK_DURATION_DAYS = 28;
export const BLOCK_WEEKS = 4;

/**
 * Timeline Position - Calculated from program_start_date
 * This is the canonical way to determine where a user is in their training program.
 */
export interface TimelinePosition {
  daysSinceStart: number;      // Total days since program_start_date
  currentBlockIndex: number;   // 0-indexed block (0 = Block 1)
  currentBlockNumber: number;  // 1-indexed block (1 = Block 1)
  dayInBlock: number;          // 1-indexed day within current block (1-28)
  weekInBlock: number;         // 1-indexed week within current block (1-4)
  dayInWeek: number;           // 1-indexed day within current week (1-7)
}

/**
 * Calculate the user's position in the training timeline based on program_start_date.
 * This is the CANONICAL source of truth for "current block", "current week", "current day".
 * 
 * @param programStartDate - The date the user completed onboarding (YYYY-MM-DD)
 * @param currentDate - The date to calculate position for (defaults to today)
 * @param blockLengthWeeks - Number of weeks per block (defaults to 4)
 * @returns TimelinePosition object with all position data
 */
export function calculateTimelinePosition(
  programStartDate: string,
  currentDate: Date = getLocalToday(),
  blockLengthWeeks: number = BLOCK_WEEKS
): TimelinePosition {
  // Parse program start date as local date to avoid timezone issues
  const start = parseLocalDate(programStartDate);
  
  // Normalize current date to local midnight
  const current = new Date(currentDate);
  current.setHours(0, 0, 0, 0);
  
  // Calculate days since start (Day 1 = 0 days since start)
  const diffTime = current.getTime() - start.getTime();
  const daysSinceStart = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  
  const blockLengthDays = blockLengthWeeks * 7;
  
  // Calculate block position (0-indexed)
  const currentBlockIndex = Math.floor(daysSinceStart / blockLengthDays);
  
  // Day within current block (1-indexed, 1-28)
  const dayInBlock = (daysSinceStart % blockLengthDays) + 1;
  
  // Week within current block (1-indexed, 1-4)
  const weekInBlock = Math.floor((dayInBlock - 1) / 7) + 1;
  
  // Day within current week (1-indexed, 1-7)
  const dayInWeek = ((dayInBlock - 1) % 7) + 1;
  
  return {
    daysSinceStart,
    currentBlockIndex,
    currentBlockNumber: currentBlockIndex + 1,
    dayInBlock,
    weekInBlock,
    dayInWeek,
  };
}

/**
 * Get the start date of a specific block based on program_start_date.
 * @param programStartDate - The anchor date (YYYY-MM-DD)
 * @param blockNumber - 1-indexed block number
 * @returns Date string in YYYY-MM-DD format
 */
export function getBlockStartDate(programStartDate: string, blockNumber: number): string {
  const start = new Date(programStartDate);
  const daysToAdd = (blockNumber - 1) * BLOCK_DURATION_DAYS;
  const blockStart = addDays(start, daysToAdd);
  return format(blockStart, 'yyyy-MM-dd');
}

export interface BlockInfo {
  planId: string;
  blockNumber: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD (start + 27 days)
  workoutCount: number;
  status: 'in_progress' | 'queued' | 'completed';
  needsRegeneration: boolean;
}

export interface RecomputeResult {
  updated: number;
  currentPlanChanged: boolean;
  blocks: BlockInfo[];
}

/**
 * Compute the start date for a plan based on its earliest workout.
 * Returns null if no workouts exist for the plan.
 */
export async function computePlanStartDate(planId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('workouts')
    .select('scheduled_date')
    .eq('plan_id', planId)
    .order('scheduled_date', { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0].scheduled_date;
}

/**
 * Compute the end date for a block (start_date + 27 days).
 */
export function computeBlockEndDate(startDate: string): string {
  const start = new Date(startDate);
  const end = addDays(start, BLOCK_DURATION_DAYS - 1);
  return format(end, 'yyyy-MM-dd');
}

/**
 * Get the week number (1-4) for a given date within a block.
 */
export function getWeekNumberInBlock(startDate: string, currentDate: Date): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const current = new Date(currentDate);
  current.setHours(0, 0, 0, 0);
  
  const diffTime = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekIndex = Math.floor(diffDays / 7);
  
  // Clamp to 1-4 (display is 1-indexed)
  return Math.max(1, Math.min(BLOCK_WEEKS, weekIndex + 1));
}

/**
 * Get the 0-indexed week for a given date within a block.
 */
export function getWeekIndexInBlock(startDate: string, currentDate: Date): number {
  const weekNumber = getWeekNumberInBlock(startDate, currentDate);
  return weekNumber - 1;
}

interface PlanData {
  id: string;
  start_date: string | null;
  created_at: string | null;
  plan_json: Record<string, unknown>;
  status: string;
}

interface WorkoutData {
  plan_id: string | null;
  scheduled_date: string | null;
}

/**
 * Recompute all block numbers and start dates for a user.
 * This is the canonical function that ensures data consistency.
 * 
 * Algorithm:
 * 1. Fetch all plans and workouts for the user
 * 2. Compute earliest workout date for each plan
 * 3. Filter out plans without workouts (mark as needs_regeneration)
 * 4. Sort valid plans by computed start_date
 * 5. Assign block_number sequentially (1, 2, 3...)
 * 6. Persist changes to database
 * 7. Fix current_plan_id if it points to an invalid plan
 */
export async function recomputeUserBlocks(userId: string): Promise<RecomputeResult> {
  const result: RecomputeResult = {
    updated: 0,
    currentPlanChanged: false,
    blocks: [],
  };

  try {
    // 1. Fetch all plans for user (note: block_number may not exist in DB, use plan_json instead)
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, start_date, created_at, plan_json, status')
      .eq('user_id', userId);

    if (plansError || !plans) {
      console.error('blockEngine: Failed to fetch plans:', plansError);
      return result;
    }

    // 2. Fetch all workouts to compute earliest dates
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('plan_id, scheduled_date')
      .eq('user_id', userId);

    if (workoutsError) {
      console.error('blockEngine: Failed to fetch workouts:', workoutsError);
      return result;
    }

    // 3. Group workouts by plan_id, find earliest date
    const earliestDateByPlan = new Map<string, string>();
    const workoutCountByPlan = new Map<string, number>();

    for (const w of (workouts as WorkoutData[]) || []) {
      if (!w.plan_id || !w.scheduled_date) continue;
      
      const count = (workoutCountByPlan.get(w.plan_id) || 0) + 1;
      workoutCountByPlan.set(w.plan_id, count);
      
      const current = earliestDateByPlan.get(w.plan_id);
      if (!current || w.scheduled_date < current) {
        earliestDateByPlan.set(w.plan_id, w.scheduled_date);
      }
    }

    // 4. Build list of plans with computed data
    interface ProcessedPlan {
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

    const processedPlans: ProcessedPlan[] = [];

    for (const p of plans as PlanData[]) {
      const earliestDate = earliestDateByPlan.get(p.id) || null;
      const workoutCount = workoutCountByPlan.get(p.id) || 0;
      const pJson = (p.plan_json || {}) as Record<string, unknown>;
      // Get block_number from plan_json (fallback - DB column may not exist)
      const currentBlockNumber = (pJson.block_number as number) || null;
      
      processedPlans.push({
        id: p.id,
        computedStartDate: earliestDate,
        hasWorkouts: workoutCount > 0,
        workoutCount,
        currentStartDate: p.start_date,
        currentBlockNumber,
        planJson: pJson,
        status: p.status || 'in_progress',
        createdAt: p.created_at || '',
      });
    }

    // 5. Separate valid plans (with workouts) from invalid
    const validPlans = processedPlans.filter(p => p.hasWorkouts && p.computedStartDate);
    const invalidPlans = processedPlans.filter(p => !p.hasWorkouts || !p.computedStartDate);

    // 6. Sort valid plans by computed start_date ascending (oldest first)
    validPlans.sort((a, b) => {
      if (!a.computedStartDate || !b.computedStartDate) return 0;
      return a.computedStartDate.localeCompare(b.computedStartDate);
    });

    // 7. Assign block_number sequentially: 1, 2, 3, ...
    const blockNumberMap = new Map<string, number>();

    for (let i = 0; i < validPlans.length; i++) {
      const plan = validPlans[i];
      const newBlockNumber = i + 1;
      blockNumberMap.set(plan.id, newBlockNumber);

      const needsStartDateUpdate = plan.currentStartDate !== plan.computedStartDate;
      const needsBlockNumberUpdate = plan.currentBlockNumber !== newBlockNumber;

      if (needsStartDateUpdate || needsBlockNumberUpdate) {
        // Update plan_json with new block_number (stored in JSON, not as DB column)
        const updatedPlanJson = {
          ...plan.planJson,
          block_number: newBlockNumber,
          needs_regeneration: undefined, // Clear flag for valid plans
        };
        // Remove undefined keys
        delete (updatedPlanJson as Record<string, unknown>).needs_regeneration;

        // Note: We only update start_date and plan_json - block_number column may not exist in DB
        const { error } = await supabase
          .from('plans')
          .update({
            start_date: plan.computedStartDate,
            plan_json: updatedPlanJson,
          })
          .eq('id', plan.id);

        if (!error) {
          result.updated++;
          console.log(`blockEngine: Reindexed plan ${plan.id}: block=${newBlockNumber}, start=${plan.computedStartDate}`);
        } else {
          console.error(`blockEngine: Failed to update plan ${plan.id}:`, error);
        }
      }

      // Add to result blocks
      result.blocks.push({
        planId: plan.id,
        blockNumber: newBlockNumber,
        startDate: plan.computedStartDate!,
        endDate: computeBlockEndDate(plan.computedStartDate!),
        workoutCount: plan.workoutCount,
        status: plan.status as 'in_progress' | 'queued' | 'completed',
        needsRegeneration: false,
      });
    }

    // 8. Mark invalid plans with needs_regeneration flag
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
          result.updated++;
          console.log(`blockEngine: Marked plan ${plan.id} as needs_regeneration (no workouts)`);
        }
      }

      // Add to result blocks as invalid
      result.blocks.push({
        planId: plan.id,
        blockNumber: 0,
        startDate: plan.currentStartDate || '',
        endDate: plan.currentStartDate ? computeBlockEndDate(plan.currentStartDate) : '',
        workoutCount: plan.workoutCount,
        status: plan.status as 'in_progress' | 'queued' | 'completed',
        needsRegeneration: true,
      });
    }

    // 9. Fix current_plan_id: should point to the highest block_number among valid in_progress plans
    if (validPlans.length > 0) {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('current_plan_id')
        .eq('id', userId)
        .single();

      const profileCurrentPlanId = profile?.current_plan_id;
      const currentPlanIsInvalid = profileCurrentPlanId && 
        invalidPlans.some(p => p.id === profileCurrentPlanId);
      const currentPlanMissing = !profileCurrentPlanId;

      if (currentPlanIsInvalid || currentPlanMissing) {
        // Find the highest block_number plan that is in_progress
        const inProgressPlans = validPlans.filter(p => p.status === 'in_progress');
        const targetPlan = inProgressPlans.length > 0 
          ? inProgressPlans[inProgressPlans.length - 1] // Highest block number
          : validPlans[validPlans.length - 1]; // Fallback to latest valid plan

        const { error } = await supabase
          .from('users_profile')
          .update({ current_plan_id: targetPlan.id })
          .eq('id', userId);

        if (!error) {
          result.currentPlanChanged = true;
          console.log(`blockEngine: Updated current_plan_id to ${targetPlan.id} (Block ${blockNumberMap.get(targetPlan.id)})`);
        }
      }
    }

    console.log(`blockEngine: Recompute complete: ${result.updated} plans updated, currentPlanChanged=${result.currentPlanChanged}`);
    return result;
  } catch (err) {
    console.error('blockEngine: Failed to recompute blocks:', err);
    return result;
  }
}

/**
 * Get the next block number for a new plan.
 * This should be MAX(block_number) + 1 for the user.
 * Note: block_number is stored in plan_json, not as a DB column.
 */
export async function getNextBlockNumber(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('plans')
    .select('plan_json')
    .eq('user_id', userId);

  if (error || !data || data.length === 0) {
    return 1;
  }

  // Extract block_number from plan_json for each plan
  let maxBlockNumber = 0;
  for (const plan of data) {
    const planJson = plan.plan_json as Record<string, unknown> | null;
    const blockNum = (planJson?.block_number as number) || 0;
    if (blockNum > maxBlockNumber) {
      maxBlockNumber = blockNum;
    }
  }
  
  return maxBlockNumber + 1;
}

/**
 * Format a block date range for display.
 * Returns "Jan 6 – Feb 2, 2025" format.
 */
export function formatBlockDateRange(startDate: string): string {
  const start = new Date(startDate);
  const end = addDays(start, BLOCK_DURATION_DAYS - 1);
  
  const startLabel = format(start, 'MMM d');
  const endLabel = format(end, 'MMM d, yyyy');
  
  return `${startLabel}–${endLabel}`;
}

/**
 * Check if a date falls within a block's date range.
 */
export function isDateInBlock(date: Date, blockStartDate: string): boolean {
  const start = new Date(blockStartDate);
  const end = addDays(start, BLOCK_DURATION_DAYS - 1);
  
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  const checkDate = new Date(date);
  checkDate.setHours(12, 0, 0, 0);
  
  return checkDate >= start && checkDate <= end;
}
