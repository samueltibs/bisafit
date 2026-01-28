// Types for "Progress Without the Scale" tracking

export interface DailyProgress {
  id: string;
  user_id: string;
  date: string;
  workouts_completed: number;
  workouts_planned: number;
  current_streak: number;
  active_minutes: number;
  strength_signals: StrengthSignal[];
  endurance_signals: EnduranceSignals;
  energy_level: EnergyLevel | null;
  created_at: string;
  updated_at: string;
}

export interface StrengthSignal {
  exercise_name: string;
  improvement_type: 'reps' | 'sets' | 'weight' | 'volume';
  previous_value: number;
  new_value: number;
  improvement_percent: number;
  is_pr: boolean;
}

export interface EnduranceSignals {
  session_duration_increase?: number; // minutes increase vs last week
  rest_time_reduction?: number; // seconds reduction vs last week
  active_minutes_increase?: number; // weekly active minutes increase
  volume_increase_percent?: number; // total work volume increase
}

// 1 = Very Low, 2 = Low, 3 = Normal, 4 = High, 5 = Very High
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export const ENERGY_LABELS: Record<EnergyLevel, { label: string; emoji: string; color: string }> = {
  1: { label: 'Very Low', emoji: '😴', color: 'text-destructive' },
  2: { label: 'Low', emoji: '😔', color: 'text-orange-500' },
  3: { label: 'Normal', emoji: '😊', color: 'text-muted-foreground' },
  4: { label: 'High', emoji: '😄', color: 'text-primary' },
  5: { label: 'Very High', emoji: '🔥', color: 'text-energy' },
};

export interface PersonalBest {
  id: string;
  user_id: string;
  exercise_name: string;
  max_weight_kg: number | null;
  max_reps: number | null;
  max_sets: number | null;
  best_volume: number | null;
  achieved_at: string;
  workout_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastWorkoutDate: string | null;
}

export interface WeeklyAdherence {
  planned: number;
  completed: number;
  percentage: number;
}

export interface ProgressSummary {
  streak: StreakInfo;
  weeklyAdherence: WeeklyAdherence;
  recentPRs: PersonalBest[];
  strengthImprovements: StrengthSignal[];
  enduranceImprovements: EnduranceSignals;
  energyTrend: { date: string; level: EnergyLevel }[];
  activeMinutesThisWeek: number;
  activeMinutesLastWeek: number;
}
