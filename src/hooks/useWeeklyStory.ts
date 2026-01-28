import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';

export interface WeeklyStoryStats {
  workoutsCompleted: number;
  workoutsPlanned: number;
  currentStreak: number;
  longestStreak: number;
  activeMinutesThisWeek: number;
  activeMinutesLastWeek: number;
  strengthWins: Array<{ exercise: string; type: string; improvement: string }>;
  personalBests: Array<{ exercise: string; metric: string }>;
  avgEnergyLevel: number | null;
  energyTrend: 'up' | 'down' | 'steady' | null;
  stepsThisWeek: number | null;
  bestStepDay: { day: string; steps: number } | null;
}

export interface WeeklySummary {
  id: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  generated_at: string;
  headline: string;
  bullets: string[];
  badge_line: string | null;
  next_suggestion: string | null;
  stats_snapshot: WeeklyStoryStats;
}

// Helper to get Monday of current week
function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// Check if today is near end of week (Friday-Sunday)
export function isWeekendPeriod(): boolean {
  const day = new Date().getDay();
  return day === 0 || day >= 5; // Sunday = 0, Friday = 5, Saturday = 6
}

export function useWeeklyStory() {
  const { user } = useAuth();
  const [story, setStory] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekStartDate = getWeekStart();

  // Fetch existing story for current week
  const fetchStory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('weekly_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start_date', weekStartDate)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching weekly story:', fetchError);
        setError('Failed to load weekly story');
      } else if (data) {
        // Parse the bullets from JSON if needed
        const parsedBullets = Array.isArray(data.bullets) 
          ? data.bullets as string[]
          : typeof data.bullets === 'string' 
            ? JSON.parse(data.bullets) 
            : [];
        
        // Parse stats_snapshot
        const statsSnapshot = typeof data.stats_snapshot === 'object' 
          ? data.stats_snapshot as unknown as WeeklyStoryStats
          : {} as WeeklyStoryStats;

        setStory({
          ...data,
          bullets: parsedBullets,
          stats_snapshot: statsSnapshot,
        });
      }
    } catch (err) {
      console.error('Error in fetchStory:', err);
      setError('Failed to load weekly story');
    } finally {
      setLoading(false);
    }
  }, [user, weekStartDate]);

  // Generate or regenerate story
  const generateStory = useCallback(async () => {
    if (!user) return;

    setGenerating(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('generate-weekly-story', {
        body: { weekDate: new Date().toISOString() },
      });

      if (invokeError) {
        throw invokeError;
      }

      if (data?.summary) {
        const summary = data.summary;
        const parsedBullets = Array.isArray(summary.bullets) 
          ? summary.bullets as string[]
          : typeof summary.bullets === 'string' 
            ? JSON.parse(summary.bullets) 
            : [];
        
        const statsSnapshot = typeof summary.stats_snapshot === 'object' 
          ? summary.stats_snapshot as WeeklyStoryStats
          : {} as WeeklyStoryStats;

        setStory({
          ...summary,
          bullets: parsedBullets,
          stats_snapshot: statsSnapshot,
        });
      }
    } catch (err) {
      console.error('Error generating weekly story:', err);
      setError('Failed to generate weekly story');
    } finally {
      setGenerating(false);
    }
  }, [user]);

  // Fetch story on mount
  useEffect(() => {
    fetchStory();
  }, [fetchStory]);

  // Get the most recent story (may be from previous week if current week not generated)
  const fetchLatestStory = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error: fetchError } = await supabase
        .from('weekly_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError || !data) return null;

      const parsedBullets = Array.isArray(data.bullets) 
        ? data.bullets as string[]
        : typeof data.bullets === 'string' 
          ? JSON.parse(data.bullets) 
          : [];
      
      const statsSnapshot = typeof data.stats_snapshot === 'object' 
        ? data.stats_snapshot as unknown as WeeklyStoryStats
        : {} as WeeklyStoryStats;

      return {
        ...data,
        bullets: parsedBullets,
        stats_snapshot: statsSnapshot,
      } as WeeklySummary;
    } catch {
      return null;
    }
  }, [user]);

  return {
    story,
    loading,
    generating,
    error,
    generateStory,
    fetchStory,
    fetchLatestStory,
    isCurrentWeek: story?.week_start_date === weekStartDate,
    weekStartDate,
  };
}
