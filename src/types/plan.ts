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

export interface PlanDay {
  day_name: string;
  focus: string;
  workout_id: string;
  is_rest: boolean;
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
}

export function inferWorkoutType(focus: string): WorkoutType {
  const lowerFocus = focus.toLowerCase();
  if (lowerFocus.includes("rest")) return "rest";
  if (lowerFocus.includes("recovery") || lowerFocus.includes("active recovery")) return "recovery";
  if (lowerFocus.includes("cardio") || lowerFocus.includes("hiit") || lowerFocus.includes("conditioning")) return "cardio";
  if (lowerFocus.includes("core") || lowerFocus.includes("abs")) return "core";
  return "strength";
}
