import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  WorkoutTimePreferences, 
  parseTimePreferences,
  getDefaultTimePreferences,
  WorkoutForCalendar,
  PlanForCalendar,
} from '@/lib/calendarUtils';

interface UseCalendarSyncResult {
  preferences: WorkoutTimePreferences;
  calendarSyncEnabled: boolean;
  calendarProvider: 'google' | 'ics' | null;
  setPreferences: (prefs: WorkoutTimePreferences) => void;
  setCalendarSyncEnabled: (enabled: boolean) => void;
  setCalendarProvider: (provider: 'google' | 'ics' | null) => void;
  saveSettings: () => Promise<boolean>;
  loadSettings: (profile: unknown) => void;
  currentPlanWorkouts: WorkoutForCalendar[];
  currentPlan: PlanForCalendar | null;
  loadCurrentPlanWorkouts: (userId: string, currentPlanId: string | null) => Promise<void>;
  isSaving: boolean;
}

export function useCalendarSync(): UseCalendarSyncResult {
  const [preferences, setPreferences] = useState<WorkoutTimePreferences>(getDefaultTimePreferences());
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(false);
  const [calendarProvider, setCalendarProvider] = useState<'google' | 'ics' | null>(null);
  const [currentPlanWorkouts, setCurrentPlanWorkouts] = useState<WorkoutForCalendar[]>([]);
  const [currentPlan, setCurrentPlan] = useState<PlanForCalendar | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback((profile: unknown) => {
    if (!profile || typeof profile !== 'object') return;
    
    const p = profile as Record<string, unknown>;
    
    // Load time preferences
    setPreferences(parseTimePreferences(p.workout_time_preferences_json));
    
    // Load calendar sync settings
    setCalendarSyncEnabled(Boolean(p.calendar_sync_enabled));
    
    // Load calendar provider
    const provider = p.calendar_provider as string | null;
    if (provider === 'google' || provider === 'ics') {
      setCalendarProvider(provider);
    } else {
      setCalendarProvider(calendarSyncEnabled ? 'ics' : null);
    }
  }, []);

  const loadCurrentPlanWorkouts = useCallback(async (userId: string, currentPlanId: string | null) => {
    if (!currentPlanId) {
      setCurrentPlanWorkouts([]);
      setCurrentPlan(null);
      return;
    }

    try {
      // Fetch current plan
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('id, block_number, name')
        .eq('id', currentPlanId)
        .single();

      if (planError) {
        console.error('Error fetching current plan:', planError);
        return;
      }

      setCurrentPlan(planData);

      // Fetch workouts for current plan
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('id, title, scheduled_date, workout_json, calendar_event_id')
        .eq('plan_id', currentPlanId)
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: true });

      if (workoutsError) {
        console.error('Error fetching workouts:', workoutsError);
        return;
      }

      // Transform to WorkoutForCalendar format
      const workouts: WorkoutForCalendar[] = (workoutsData || []).map(w => ({
        id: w.id,
        title: w.title,
        scheduled_date: w.scheduled_date,
        workout_json: w.workout_json as WorkoutForCalendar['workout_json'],
        calendar_event_id: w.calendar_event_id,
      }));

      setCurrentPlanWorkouts(workouts);
    } catch (error) {
      console.error('Error loading current plan workouts:', error);
    }
  }, []);

  const saveSettings = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return false;
      }

      const { error } = await supabase
        .from('users_profile')
        .update({
          workout_time_preferences_json: JSON.parse(JSON.stringify(preferences)),
          calendar_sync_enabled: calendarSyncEnabled,
          calendar_provider: calendarSyncEnabled ? (calendarProvider || 'ics') : null,
        } as Record<string, unknown>)
        .eq('id', user.id);

      if (error) {
        console.error('Error saving calendar settings:', error);
        toast.error('Failed to save settings');
        return false;
      }

      toast.success('Schedule settings saved');
      return true;
    } catch (error) {
      console.error('Error saving calendar settings:', error);
      toast.error('Failed to save settings');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [preferences, calendarSyncEnabled, calendarProvider]);

  return {
    preferences,
    calendarSyncEnabled,
    calendarProvider,
    setPreferences,
    setCalendarSyncEnabled,
    setCalendarProvider,
    saveSettings,
    loadSettings,
    currentPlanWorkouts,
    currentPlan,
    loadCurrentPlanWorkouts,
    isSaving,
  };
}
