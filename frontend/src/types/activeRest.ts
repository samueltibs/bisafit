/**
 * Active Rest Day Types
 * 
 * Types for configuring active rest days - light activities
 * the user wants to do on their non-workout days.
 */

export type ActiveRestActivityType = 
  | 'light_walk'
  | 'easy_run'
  | 'yoga_stretch'
  | 'light_bodyweight'
  | 'light_cycling'
  | 'swimming';

export interface ActiveRestActivity {
  id: string;
  day: string; // e.g., "Wednesday", "Sunday"
  activityType: ActiveRestActivityType;
  // For run/walk activities
  distanceMiles?: number;
  // For duration-based activities (bodyweight, yoga, cycling, swimming)
  durationMinutes?: number;
  // AI-suggested description
  description?: string;
  // Whether this is enabled
  enabled: boolean;
}

export interface ActiveRestConfig {
  enabled: boolean;
  activities: ActiveRestActivity[];
}

// Activity metadata for UI
export interface ActivityMeta {
  type: ActiveRestActivityType;
  label: string;
  icon: string;
  emoji: string;
  usesDistance: boolean; // true for walk/run
  usesDuration: boolean; // true for bodyweight/yoga/cycling/swimming
  defaultDuration: number;
  defaultDistance: number;
  description: string;
  benefits: string[];
}

export const ACTIVE_REST_ACTIVITIES: ActivityMeta[] = [
  {
    type: 'light_walk',
    label: 'Light Walk',
    icon: 'walking',
    emoji: '🚶',
    usesDistance: true,
    usesDuration: true,
    defaultDuration: 30,
    defaultDistance: 1.5,
    description: 'Easy-paced outdoor or treadmill walk',
    benefits: ['Improves circulation', 'Low impact recovery', 'Mental clarity'],
  },
  {
    type: 'easy_run',
    label: 'Easy Jog/Run',
    icon: 'running',
    emoji: '🏃',
    usesDistance: true,
    usesDuration: true,
    defaultDuration: 20,
    defaultDistance: 2,
    description: 'Low-intensity jogging at conversational pace',
    benefits: ['Active recovery', 'Maintains cardio base', 'Endorphin boost'],
  },
  {
    type: 'yoga_stretch',
    label: 'Yoga & Stretching',
    icon: 'yoga',
    emoji: '🧘',
    usesDistance: false,
    usesDuration: true,
    defaultDuration: 25,
    defaultDistance: 0,
    description: 'Flexibility and mobility work',
    benefits: ['Improves flexibility', 'Reduces muscle tension', 'Mind-body connection'],
  },
  {
    type: 'light_bodyweight',
    label: 'Light Bodyweight',
    icon: 'dumbbell',
    emoji: '💪',
    usesDistance: false,
    usesDuration: true,
    defaultDuration: 20,
    defaultDistance: 0,
    description: 'Easy bodyweight exercises, no equipment needed',
    benefits: ['Maintains movement patterns', 'Low intensity strength', 'No equipment needed'],
  },
  {
    type: 'light_cycling',
    label: 'Light Cycling',
    icon: 'bike',
    emoji: '🚴',
    usesDistance: true,
    usesDuration: true,
    defaultDuration: 30,
    defaultDistance: 5,
    description: 'Easy-paced cycling outdoors or stationary',
    benefits: ['Joint-friendly cardio', 'Leg recovery', 'Outdoor enjoyment'],
  },
  {
    type: 'swimming',
    label: 'Swimming',
    icon: 'waves',
    emoji: '🏊',
    usesDistance: false,
    usesDuration: true,
    defaultDuration: 30,
    defaultDistance: 0,
    description: 'Leisurely swimming at relaxed pace',
    benefits: ['Zero impact', 'Full body movement', 'Great for recovery'],
  },
];

export function getActivityMeta(type: ActiveRestActivityType): ActivityMeta {
  return ACTIVE_REST_ACTIVITIES.find(a => a.type === type) || ACTIVE_REST_ACTIVITIES[0];
}

export function getDefaultActiveRestConfig(): ActiveRestConfig {
  return {
    enabled: false,
    activities: [],
  };
}

// Generate a unique ID for activities
export function generateActivityId(): string {
  return `ar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
