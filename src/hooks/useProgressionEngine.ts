import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type BlockFeedback = 'too_easy' | 'just_right' | 'too_hard';

interface BlockAnalysis {
  adherenceRate: number;
  completedWorkouts: number;
  plannedWorkouts: number;
  isEligibleForNextBlock: boolean;
  currentWeek: number;
  blockNumber: number;
}

interface GenerateNextBlockResult {
  success: boolean;
  plan_id?: string;
  block_number?: number;
  start_date?: string;
  message?: string;
  error?: string;
  analysis?: {
    adherence_rate: number;
    progression_applied: string;
  };
}

interface UseProgressionEngineProps {
  planId?: string;
  planJson?: {
    block_number: number;
    weeks: Array<{
      week_number: number;
      days: Array<{
        day_name: string;
        type: 'workout' | 'rest';
        workout_id?: string;
      }>;
    }>;
  } | null;
  currentWeekIndex: number;
}

export function useProgressionEngine({
  planId,
  planJson,
  currentWeekIndex,
}: UseProgressionEngineProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerateNextBlockResult | null>(null);

  // Calculate block analysis
  const blockAnalysis = useMemo((): BlockAnalysis | null => {
    if (!planJson) return null;

    // Count planned workouts
    let plannedWorkouts = 0;
    const workoutIds: string[] = [];

    for (const week of planJson.weeks) {
      for (const day of week.days) {
        if (day.type === 'workout' && day.workout_id) {
          plannedWorkouts++;
          workoutIds.push(day.workout_id);
        }
      }
    }

    return {
      adherenceRate: 0, // Will be updated async
      completedWorkouts: 0,
      plannedWorkouts,
      isEligibleForNextBlock: false,
      currentWeek: currentWeekIndex + 1,
      blockNumber: planJson.block_number || 1,
    };
  }, [planJson, currentWeekIndex]);

  // Check eligibility for next block (async)
  const checkEligibility = useCallback(async (): Promise<{
    isEligible: boolean;
    adherenceRate: number;
    completedWorkouts: number;
    plannedWorkouts: number;
  }> => {
    if (!planJson || !planId) {
      return { isEligible: false, adherenceRate: 0, completedWorkouts: 0, plannedWorkouts: 0 };
    }

    // Get all workout IDs from plan
    const workoutIds: string[] = [];
    for (const week of planJson.weeks) {
      for (const day of week.days) {
        if (day.type === 'workout' && day.workout_id) {
          workoutIds.push(day.workout_id);
        }
      }
    }

    const plannedWorkouts = workoutIds.length;

    if (plannedWorkouts === 0) {
      return { isEligible: false, adherenceRate: 0, completedWorkouts: 0, plannedWorkouts: 0 };
    }

    // Count completed sessions
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('id, completed_at')
      .in('workout_id', workoutIds)
      .not('completed_at', 'is', null);

    const completedWorkouts = sessions?.length || 0;
    const adherenceRate = completedWorkouts / plannedWorkouts;

    // Eligible if: Week 4 OR >= 70% completion
    const isWeek4 = currentWeekIndex >= 3;
    const hasHighAdherence = adherenceRate >= 0.7;
    const isEligible = isWeek4 || hasHighAdherence;

    return {
      isEligible,
      adherenceRate,
      completedWorkouts,
      plannedWorkouts,
    };
  }, [planJson, planId, currentWeekIndex]);

  // Generate next block
  const generateNextBlock = useCallback(async (
    feedback?: BlockFeedback
  ): Promise<GenerateNextBlockResult> => {
    setIsGenerating(true);
    setError(null);
    setGenerationResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-next-block`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            feedback: feedback || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to generate next block';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      const result: GenerateNextBlockResult = {
        success: true,
        plan_id: data.plan_id,
        block_number: data.block_number,
        start_date: data.start_date,
        message: data.message,
        analysis: data.analysis,
      };

      setGenerationResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate next block';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    blockAnalysis,
    checkEligibility,
    generateNextBlock,
    isGenerating,
    error,
    generationResult,
  };
}
