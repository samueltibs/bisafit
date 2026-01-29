/**
 * Quick Win Workout Generator
 * Creates reduced-duration workouts while maintaining movement patterns
 */

import type { WorkoutJson, WorkoutBlock, WorkoutItem } from '@/types/plan';

export interface QuickWinConfig {
  targetDurationMinutes: number;
  preserveWarmup: boolean;
  preserveCooldown: boolean;
}

const DEFAULT_CONFIG: QuickWinConfig = {
  targetDurationMinutes: 15,
  preserveWarmup: true,
  preserveCooldown: true,
};

/**
 * Generate a Quick Win version of a full workout
 * Reduces sets, removes some exercises, but keeps movement patterns
 */
export function generateQuickWinWorkout(
  originalWorkout: WorkoutJson,
  config: Partial<QuickWinConfig> = {}
): WorkoutJson {
  const { targetDurationMinutes, preserveWarmup, preserveCooldown } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const quickWinBlocks: WorkoutBlock[] = [];
  let estimatedMinutes = 0;

  // Process each block
  for (const block of originalWorkout.blocks) {
    switch (block.type) {
      case 'warmup':
        if (preserveWarmup) {
          // Keep warmup but reduce to 2-3 min
          const reducedWarmup = reduceWarmup(block);
          quickWinBlocks.push(reducedWarmup);
          estimatedMinutes += 2;
        }
        break;

      case 'strength':
        // Reduce strength block significantly
        const reducedStrength = reduceStrengthBlock(block, targetDurationMinutes);
        if (reducedStrength.items.length > 0) {
          quickWinBlocks.push(reducedStrength);
          estimatedMinutes += estimateBlockDuration(reducedStrength);
        }
        break;

      case 'conditioning':
        // Reduce conditioning rounds
        const reducedConditioning = reduceConditioningBlock(block);
        if (reducedConditioning.items.length > 0) {
          quickWinBlocks.push(reducedConditioning);
          estimatedMinutes += estimateBlockDuration(reducedConditioning);
        }
        break;

      case 'cooldown':
        if (preserveCooldown) {
          // Keep brief cooldown
          const reducedCooldown = reduceCooldown(block);
          quickWinBlocks.push(reducedCooldown);
          estimatedMinutes += 2;
        }
        break;
    }

    // Stop if we've reached target duration
    if (estimatedMinutes >= targetDurationMinutes - 2) {
      break;
    }
  }

  return {
    ...originalWorkout,
    title: `Quick Win: ${originalWorkout.title}`,
    total_estimated_minutes: Math.min(targetDurationMinutes, estimatedMinutes + 2),
    blocks: quickWinBlocks,
  };
}

function reduceWarmup(block: WorkoutBlock): WorkoutBlock {
  // Take first 2-3 exercises, reduce duration
  const reducedItems = block.items.slice(0, 3).map(item => ({
    ...item,
    duration_sec: item.duration_sec ? Math.min(item.duration_sec, 30) : 30,
    sets: 1,
  }));

  return {
    ...block,
    items: reducedItems,
  };
}

function reduceStrengthBlock(block: WorkoutBlock, targetMinutes: number): WorkoutBlock {
  // For quick win, pick 2-3 compound movements and reduce sets
  const compoundKeywords = ['squat', 'press', 'row', 'deadlift', 'lunge', 'push-up', 'pullup'];
  
  // Prioritize compound movements
  const sortedItems = [...block.items].sort((a, b) => {
    const aIsCompound = compoundKeywords.some(k => a.name.toLowerCase().includes(k));
    const bIsCompound = compoundKeywords.some(k => b.name.toLowerCase().includes(k));
    if (aIsCompound && !bIsCompound) return -1;
    if (!aIsCompound && bIsCompound) return 1;
    return 0;
  });

  // Take top 2-3 exercises
  const maxExercises = targetMinutes <= 10 ? 2 : 3;
  const selectedItems = sortedItems.slice(0, maxExercises).map(item => ({
    ...item,
    sets: Math.max(2, Math.floor((item.sets || 3) / 2)), // Reduce sets by half, min 2
    rest_sec: Math.min(item.rest_sec || 60, 45), // Reduce rest to 45s max
  }));

  return {
    ...block,
    items: selectedItems,
  };
}

function reduceConditioningBlock(block: WorkoutBlock): WorkoutBlock {
  // Reduce conditioning to 1-2 rounds
  const reducedItems = block.items.slice(0, 4).map(item => ({
    ...item,
    duration_sec: item.duration_sec ? Math.min(item.duration_sec, 30) : 30,
    sets: 1,
  }));

  const reducedProtocol = block.protocol ? {
    ...block.protocol,
    rounds: Math.max(1, Math.floor(block.protocol.rounds / 2)),
  } : undefined;

  return {
    ...block,
    items: reducedItems,
    protocol: reducedProtocol,
  };
}

function reduceCooldown(block: WorkoutBlock): WorkoutBlock {
  // Quick cooldown - just 2 stretches
  const reducedItems = block.items.slice(0, 2).map(item => ({
    ...item,
    duration_sec: 30,
    sets: 1,
  }));

  return {
    ...block,
    items: reducedItems,
  };
}

function estimateBlockDuration(block: WorkoutBlock): number {
  let totalSec = 0;

  for (const item of block.items) {
    const sets = item.sets || 1;
    const durationPerSet = item.duration_sec || 45;
    const rest = item.rest_sec || 30;
    
    totalSec += sets * durationPerSet + (sets - 1) * rest;
  }

  // Add protocol rounds if conditioning
  if (block.protocol) {
    totalSec *= block.protocol.rounds;
  }

  return Math.ceil(totalSec / 60);
}

/**
 * Check if a workout qualifies as a Quick Win (short duration)
 */
export function isQuickWinWorkout(workout: WorkoutJson): boolean {
  return (
    workout.title.toLowerCase().includes('quick win') ||
    workout.total_estimated_minutes <= 20
  );
}

/**
 * Get Quick Win workout label for UI
 */
export function getQuickWinLabel(durationMinutes: number): string {
  if (durationMinutes <= 10) return '10-min Quick Win';
  if (durationMinutes <= 15) return '15-min Quick Win';
  return `${durationMinutes}-min Quick Win`;
}
