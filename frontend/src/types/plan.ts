// Types for workout and plan JSON structures

export interface WorkoutItem {
  name: string;
  duration_sec?: number;
  sets?: number;
  reps?: string;
  rest_sec?: number;
  tempo?: string;
  instructions: string;
  video_url_optional?: string;
  image_url?: string;
  coaching_cues?: string[];
}

export interface WorkoutBlock {
  type: "warmup" | "strength" | "conditioning" | "cooldown";
  items: WorkoutItem[];
  protocol?: {
    work_sec: number;
    rest_sec: number;
    rounds: number;
  };
}

export interface WorkoutJson {
  title: string;
  week_number: number;
  total_estimated_minutes: number;
  blocks: WorkoutBlock[];
}

// Day type for plan_json - explicit workout or rest
export type PlanDayType = "workout" | "rest";

export interface PlanDay {
  day_name: string;
  type: PlanDayType;
  // For workout days
  focus?: string;
  workout_id?: string;
  // For rest days
  label?: string;
}

export interface PlanWeek {
  week_number: number;
  days: PlanDay[];
}

export interface PlanJson {
  block_number: number;
  weeks: PlanWeek[];
  progression_strategy: string;
  progression_notes: string;
  coach_notes: string;
}

// Helper to normalize legacy plan days (backward compatibility)
export function normalizePlanDay(day: Partial<PlanDay> & { is_rest?: boolean }): PlanDay {
  // If type already exists, use it
  if (day.type) {
    return day as PlanDay;
  }
  
  // Infer type from legacy format
  if (day.is_rest || !day.workout_id) {
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

// Display helpers
export type WorkoutType = "strength" | "cardio" | "recovery" | "core" | "rest" | "conditioning";

export interface DisplayWorkout {
  id: string;
  day: string;
  dayDate: Date;
  workout: string;
  duration: number;
  type: WorkoutType;
  completed: boolean;
  workoutJson?: WorkoutJson;
  isRest: boolean;
}

export function inferWorkoutType(focus: string): WorkoutType {
  const lowerFocus = focus.toLowerCase();
  if (lowerFocus.includes("rest")) return "rest";
  if (lowerFocus.includes("recovery") || lowerFocus.includes("active recovery")) return "recovery";
  if (lowerFocus.includes("cardio") || lowerFocus.includes("hiit") || lowerFocus.includes("conditioning")) return "cardio";
  if (lowerFocus.includes("core") || lowerFocus.includes("abs")) return "core";
  return "strength";
}
