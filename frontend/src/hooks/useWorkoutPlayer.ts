import { useState, useEffect, useCallback, useRef } from 'react';
import { WorkoutJson, WorkoutBlock, WorkoutItem } from '@/types/plan';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/types/database';

export type PlayerState = 'idle' | 'active' | 'paused' | 'rest' | 'completed';
export type BlockType = 'warmup' | 'strength' | 'conditioning' | 'cooldown';

export interface SetLog {
  exercise: string;
  set: number;
  reps: number;
  weight?: number;
  timestamp: string;
}

export interface SessionLog {
  started_at: string;
  completed_at?: string;
  sets: SetLog[];
  skipped_exercises: string[];
  total_duration_sec: number;
}

interface WorkoutPlayerState {
  // Current position
  currentBlockIndex: number;
  currentItemIndex: number;
  currentSet: number;
  currentRound: number;
  
  // Timer
  timerSeconds: number;
  timerType: 'duration' | 'rest' | 'work' | null;
  
  // State
  playerState: PlayerState;
  
  // Session
  sessionId: string | null;
  sessionLog: SessionLog;
  
  // Workout data
  workout: WorkoutJson | null;
}

const initialSessionLog: SessionLog = {
  started_at: '',
  sets: [],
  skipped_exercises: [],
  total_duration_sec: 0,
};

const initialState: WorkoutPlayerState = {
  currentBlockIndex: 0,
  currentItemIndex: 0,
  currentSet: 1,
  currentRound: 1,
  timerSeconds: 0,
  timerType: null,
  playerState: 'idle',
  sessionId: null,
  sessionLog: initialSessionLog,
  workout: null,
};

export function useWorkoutPlayer(workoutId: string | undefined) {
  const { user } = useAuth();
  const [state, setState] = useState<WorkoutPlayerState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Fetch workout data
  useEffect(() => {
    async function fetchWorkout() {
      if (!workoutId) return;
      
      setIsLoading(true);
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single();

      if (error) {
        console.error('Error fetching workout:', error);
        setIsLoading(false);
        return;
      }

      if (data?.workout_json) {
        const workoutJson = data.workout_json as unknown as WorkoutJson;
        console.log('[WorkoutPlayer] Loaded workout:', {
          id: data.id,
          title: workoutJson.title,
          blocksCount: workoutJson.blocks?.length,
          blocks: workoutJson.blocks?.map(b => ({
            type: b.type,
            itemsCount: b.items?.length
          }))
        });
        
        // Validate that blocks have items
        if (!workoutJson.blocks || workoutJson.blocks.length === 0) {
          console.error('[WorkoutPlayer] ERROR: Workout has no blocks!', workoutJson);
        } else if (workoutJson.blocks.some(b => !b.items || b.items.length === 0)) {
          console.error('[WorkoutPlayer] ERROR: Some blocks have no items!', workoutJson.blocks);
        }
        
        setState(prev => ({
          ...prev,
          workout: workoutJson,
        }));
      } else {
        console.error('[WorkoutPlayer] No workout_json in data:', data);
      }
      setIsLoading(false);
    }

    fetchWorkout();
  }, [workoutId]);

  // Timer effect
  useEffect(() => {
    if (state.playerState === 'active' && state.timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setState(prev => {
          const newSeconds = prev.timerSeconds - 1;
          if (newSeconds <= 0) {
            // Timer finished - auto advance
            return handleTimerComplete(prev);
          }
          return { ...prev, timerSeconds: newSeconds };
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.playerState, state.timerSeconds > 0]);

  // Handle timer completion
  const handleTimerComplete = (prev: WorkoutPlayerState): WorkoutPlayerState => {
    const { workout, currentBlockIndex, currentItemIndex, timerType } = prev;
    if (!workout) return prev;

    const currentBlock = workout.blocks[currentBlockIndex];
    const currentItem = currentBlock?.items[currentItemIndex];

    // Warmup/Cooldown duration timer finished - advance to next item
    if (timerType === 'duration') {
      return advanceToNextItem(prev);
    }

    // Rest timer finished - ready for next set or exercise
    if (timerType === 'rest') {
      const totalSets = currentItem?.sets || 1;
      if (prev.currentSet < totalSets) {
        // More sets remaining - ready for next set
        return {
          ...prev,
          timerSeconds: 0,
          timerType: null,
        };
      } else {
        // All sets done - advance to next item
        return advanceToNextItem(prev);
      }
    }

    // Conditioning work timer finished - start rest
    if (timerType === 'work' && currentBlock?.protocol) {
      return {
        ...prev,
        timerSeconds: currentBlock.protocol.rest_sec,
        timerType: 'rest',
      };
    }

    return prev;
  };

  // Advance to next item/block
  const advanceToNextItem = (prev: WorkoutPlayerState): WorkoutPlayerState => {
    const { workout, currentBlockIndex, currentItemIndex, currentRound } = prev;
    if (!workout) return prev;

    const currentBlock = workout.blocks[currentBlockIndex];
    
    // For conditioning blocks with rounds
    if (currentBlock?.protocol && currentRound < currentBlock.protocol.rounds) {
      return {
        ...prev,
        currentRound: currentRound + 1,
        currentItemIndex: 0,
        timerSeconds: currentBlock.protocol.work_sec,
        timerType: 'work',
      };
    }

    // Check if there are more items in current block
    if (currentItemIndex < currentBlock.items.length - 1) {
      const nextItem = currentBlock.items[currentItemIndex + 1];
      return {
        ...prev,
        currentItemIndex: currentItemIndex + 1,
        currentSet: 1,
        currentRound: 1,
        ...getInitialTimerState(currentBlock, nextItem),
      };
    }

    // Check if there are more blocks
    if (currentBlockIndex < workout.blocks.length - 1) {
      const nextBlock = workout.blocks[currentBlockIndex + 1];
      const nextItem = nextBlock.items[0];
      return {
        ...prev,
        currentBlockIndex: currentBlockIndex + 1,
        currentItemIndex: 0,
        currentSet: 1,
        currentRound: 1,
        ...getInitialTimerState(nextBlock, nextItem),
      };
    }

    // Workout complete
    return {
      ...prev,
      playerState: 'completed',
      timerSeconds: 0,
      timerType: null,
    };
  };

  // Get initial timer state for an item
  const getInitialTimerState = (block: WorkoutBlock, item: WorkoutItem): Partial<WorkoutPlayerState> => {
    if (block.type === 'warmup' || block.type === 'cooldown') {
      return {
        timerSeconds: item.duration_sec || 30,
        timerType: 'duration',
      };
    }
    if (block.type === 'conditioning' && block.protocol) {
      return {
        timerSeconds: block.protocol.work_sec,
        timerType: 'work',
      };
    }
    // Strength - no auto timer, user controls
    return {
      timerSeconds: 0,
      timerType: null,
    };
  };

  // Start workout
  const startWorkout = useCallback(async () => {
    if (!workoutId || !user || !state.workout) return;

    const now = new Date();
    startTimeRef.current = now;

    // Create session in database
    const { data: session, error } = await supabase
      .from('workout_sessions')
      .insert({
        workout_id: workoutId,
        user_id: user.id,
        started_at: now.toISOString(),
        session_log_json: { started_at: now.toISOString(), sets: [], skipped_exercises: [] },
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return;
    }

    const firstBlock = state.workout.blocks[0];
    const firstItem = firstBlock?.items[0];

    setState(prev => ({
      ...prev,
      playerState: 'active',
      sessionId: session?.id || null,
      sessionLog: {
        started_at: now.toISOString(),
        sets: [],
        skipped_exercises: [],
        total_duration_sec: 0,
      },
      currentBlockIndex: 0,
      currentItemIndex: 0,
      currentSet: 1,
      currentRound: 1,
      ...getInitialTimerState(firstBlock, firstItem),
    }));
  }, [workoutId, user, state.workout]);

  // Pause/Resume
  const togglePause = useCallback(() => {
    setState(prev => ({
      ...prev,
      playerState: prev.playerState === 'active' ? 'paused' : 'active',
    }));
  }, []);

  // Complete set (for strength exercises)
  const completeSet = useCallback((weight?: number, repsCompleted?: number) => {
    setState(prev => {
      if (!prev.workout) return prev;

      const currentBlock = prev.workout.blocks[prev.currentBlockIndex];
      const currentItem = currentBlock?.items[prev.currentItemIndex];
      if (!currentItem) return prev;

      const prescribedReps = parseInt(currentItem.reps || '0') || 10;
      const setLog: SetLog = {
        exercise: currentItem.name,
        set: prev.currentSet,
        reps: repsCompleted ?? prescribedReps,
        weight,
        timestamp: new Date().toISOString(),
      };

      const newSessionLog = {
        ...prev.sessionLog,
        sets: [...prev.sessionLog.sets, setLog],
      };

      const totalSets = currentItem.sets || 1;

      // If more sets remaining, start rest timer
      if (prev.currentSet < totalSets) {
        return {
          ...prev,
          currentSet: prev.currentSet + 1,
          timerSeconds: currentItem.rest_sec || 60,
          timerType: 'rest',
          sessionLog: newSessionLog,
        };
      }

      // All sets done - advance to next item
      return advanceToNextItem({
        ...prev,
        sessionLog: newSessionLog,
      });
    });
  }, []);

  // Skip exercise
  const skipExercise = useCallback(() => {
    setState(prev => {
      if (!prev.workout) return prev;

      const currentBlock = prev.workout.blocks[prev.currentBlockIndex];
      const currentItem = currentBlock?.items[prev.currentItemIndex];

      const newSessionLog = {
        ...prev.sessionLog,
        skipped_exercises: [...prev.sessionLog.skipped_exercises, currentItem?.name || 'Unknown'],
      };

      return advanceToNextItem({
        ...prev,
        sessionLog: newSessionLog,
      });
    });
  }, []);

  // Skip rest timer
  const skipRest = useCallback(() => {
    setState(prev => ({
      ...prev,
      timerSeconds: 0,
      timerType: null,
    }));
  }, []);

  // Complete workout
  const completeWorkout = useCallback(async () => {
    if (!state.sessionId || !startTimeRef.current) return;

    const endTime = new Date();
    const totalDuration = Math.floor((endTime.getTime() - startTimeRef.current.getTime()) / 1000);

    const finalLog: SessionLog = {
      ...state.sessionLog,
      completed_at: endTime.toISOString(),
      total_duration_sec: totalDuration,
    };

    await supabase
      .from('workout_sessions')
      .update({
        completed_at: endTime.toISOString(),
        session_log_json: finalLog as unknown as Json,
      })
      .eq('id', state.sessionId);

    setState(prev => ({
      ...prev,
      playerState: 'completed',
      sessionLog: finalLog,
    }));
  }, [state.sessionId, state.sessionLog]);

  // Get current exercise info
  const getCurrentExercise = useCallback(() => {
    if (!state.workout) return null;
    const block = state.workout.blocks[state.currentBlockIndex];
    return block?.items[state.currentItemIndex] || null;
  }, [state.workout, state.currentBlockIndex, state.currentItemIndex]);

  const getCurrentBlock = useCallback(() => {
    if (!state.workout) return null;
    return state.workout.blocks[state.currentBlockIndex] || null;
  }, [state.workout, state.currentBlockIndex]);

  // Calculate progress
  const getProgress = useCallback(() => {
    if (!state.workout) return { current: 0, total: 0, percentage: 0 };

    let totalItems = 0;
    let completedItems = 0;

    state.workout.blocks.forEach((block, blockIndex) => {
      block.items.forEach((item, itemIndex) => {
        const itemCount = item.sets || 1;
        totalItems += itemCount;

        if (blockIndex < state.currentBlockIndex) {
          completedItems += itemCount;
        } else if (blockIndex === state.currentBlockIndex && itemIndex < state.currentItemIndex) {
          completedItems += itemCount;
        } else if (blockIndex === state.currentBlockIndex && itemIndex === state.currentItemIndex) {
          completedItems += state.currentSet - 1;
        }
      });
    });

    return {
      current: completedItems,
      total: totalItems,
      percentage: totalItems > 0 ? (completedItems / totalItems) * 100 : 0,
    };
  }, [state.workout, state.currentBlockIndex, state.currentItemIndex, state.currentSet]);

  return {
    ...state,
    isLoading,
    currentBlockIndex: state.currentBlockIndex,
    currentItemIndex: state.currentItemIndex,
    getCurrentExercise,
    getCurrentBlock,
    getProgress,
    startWorkout,
    togglePause,
    completeSet,
    skipExercise,
    skipRest,
    completeWorkout,
  };
}
