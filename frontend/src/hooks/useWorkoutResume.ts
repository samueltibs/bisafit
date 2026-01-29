import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { SessionLog } from '@/hooks/useWorkoutPlayer';
import type { Json } from '@/integrations/supabase/types';

export interface IncompleteSession {
  id: string;
  workout_id: string;
  started_at: string;
  session_log_json: SessionLog | null;
}

export interface ResumeState {
  currentBlockIndex: number;
  currentItemIndex: number;
  currentSet: number;
  currentRound: number;
  sessionLog: SessionLog;
}

const RESUME_STATE_KEY = 'workout_resume_state';

export function useWorkoutResume(workoutId: string | undefined) {
  const { user } = useAuth();
  const [incompleteSession, setIncompleteSession] = useState<IncompleteSession | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Check for incomplete session on mount
  useEffect(() => {
    async function checkIncompleteSession() {
      if (!workoutId || !user) {
        setIsChecking(false);
        return;
      }

      const { data, error } = await supabase
        .from('workout_sessions')
        .select('id, workout_id, started_at, session_log_json')
        .eq('workout_id', workoutId)
        .eq('user_id', user.id)
        .is('completed_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking for incomplete session:', error);
        setIsChecking(false);
        return;
      }

      if (data) {
        setIncompleteSession({
          id: data.id,
          workout_id: data.workout_id,
          started_at: data.started_at || '',
          session_log_json: data.session_log_json as unknown as SessionLog | null,
        });
        setShowResumeModal(true);
      }

      setIsChecking(false);
    }

    checkIncompleteSession();
  }, [workoutId, user]);

  // Save resume state to localStorage
  const saveResumeState = useCallback((state: ResumeState) => {
    if (!workoutId) return;
    
    const key = `${RESUME_STATE_KEY}_${workoutId}`;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save resume state:', e);
    }
  }, [workoutId]);

  // Load resume state from localStorage
  const loadResumeState = useCallback((): ResumeState | null => {
    if (!workoutId) return null;
    
    const key = `${RESUME_STATE_KEY}_${workoutId}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved) as ResumeState;
      }
    } catch (e) {
      console.error('Failed to load resume state:', e);
    }
    return null;
  }, [workoutId]);

  // Clear resume state
  const clearResumeState = useCallback(() => {
    if (!workoutId) return;
    
    const key = `${RESUME_STATE_KEY}_${workoutId}`;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to clear resume state:', e);
    }
  }, [workoutId]);

  // Discard incomplete session
  const discardSession = useCallback(async () => {
    if (!incompleteSession) return;

    // Mark session as abandoned by setting a completed_at with a note
    const abandonedLog = {
      ...incompleteSession.session_log_json,
      abandoned: true,
      abandoned_at: new Date().toISOString(),
    } as unknown as Json;
    
    await supabase
      .from('workout_sessions')
      .update({
        completed_at: new Date().toISOString(),
        session_log_json: abandonedLog,
      })
      .eq('id', incompleteSession.id);

    clearResumeState();
    setIncompleteSession(null);
    setShowResumeModal(false);
  }, [incompleteSession, clearResumeState]);

  // Get resume data
  const getResumeData = useCallback((): { sessionId: string; state: ResumeState } | null => {
    if (!incompleteSession) return null;

    const savedState = loadResumeState();
    if (!savedState) {
      // If no local state, try to infer from session log
      const sessionLog = incompleteSession.session_log_json;
      if (sessionLog && sessionLog.sets && sessionLog.sets.length > 0) {
        // We have some progress - but we can't perfectly restore position
        // So we'll start from the beginning with the existing log
        return {
          sessionId: incompleteSession.id,
          state: {
            currentBlockIndex: 0,
            currentItemIndex: 0,
            currentSet: 1,
            currentRound: 1,
            sessionLog: sessionLog,
          },
        };
      }
      return null;
    }

    return {
      sessionId: incompleteSession.id,
      state: savedState,
    };
  }, [incompleteSession, loadResumeState]);

  const confirmResume = useCallback(() => {
    setShowResumeModal(false);
  }, []);

  return {
    incompleteSession,
    isChecking,
    showResumeModal,
    setShowResumeModal,
    saveResumeState,
    loadResumeState,
    clearResumeState,
    discardSession,
    getResumeData,
    confirmResume,
  };
}
