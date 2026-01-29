/**
 * Smart Reminders System
 * Generates intelligent, tone-aware reminders based on user context
 */

import { type CoachTone, normalizeCoachTone } from './coachTone';
import { format, isToday, subDays, parseISO } from 'date-fns';

// Reminder categories
export type ReminderType = 
  | 'time_based'        // Scheduled workout time approaching
  | 'adaptive_missed'   // User missed a workout
  | 'adaptive_streak'   // Multiple days skipped
  | 'context_late'      // It's late, suggest short workout
  | 'celebration';      // Streak/PR celebration

export interface SmartReminder {
  type: ReminderType;
  title: string;
  body: string;
  actionLabel?: string;
  actionType?: 'start_workout' | 'quick_win' | 'view_progress';
}

// Tone-specific message templates
const REMINDER_MESSAGES: Record<ReminderType, Record<CoachTone, { title: string; body: string }>> = {
  time_based: {
    gentle: {
      title: "Your workout time is coming up 💪",
      body: "You mentioned you like working out around now — ready whenever you are.",
    },
    balanced: {
      title: "Workout time! 💪",
      body: "You said you work out at {time} — ready?",
    },
    direct: {
      title: "Time to train 💪",
      body: "Workout scheduled for {time}. Let's go.",
    },
  },
  adaptive_missed: {
    gentle: {
      title: "Still time today ✨",
      body: "No pressure — I adjusted your workout to fit a tighter schedule if you need.",
    },
    balanced: {
      title: "Short on time? 🕐",
      body: "I can give you a Quick Win workout that takes half the time.",
    },
    direct: {
      title: "Quick Win available",
      body: "Missed the full session? 15-minute version ready.",
    },
  },
  adaptive_streak: {
    gentle: {
      title: "Checking in 🌟",
      body: "No pressure — let's just get one win today. Even 10 minutes counts.",
    },
    balanced: {
      title: "Let's get a win today",
      body: "Even a short session keeps your streak alive.",
    },
    direct: {
      title: "Get one in today",
      body: "10 minutes is all you need. Streak protection on.",
    },
  },
  context_late: {
    gentle: {
      title: "Late night? No problem 🌙",
      body: "Even 10 minutes counts today. Want a quick stretch routine?",
    },
    balanced: {
      title: "Still time for a quick session",
      body: "Even 10 minutes counts today.",
    },
    direct: {
      title: "10 minutes left in the day",
      body: "Quick session available. Streak saver.",
    },
  },
  celebration: {
    gentle: {
      title: "Look at you! 🎉",
      body: "You're building something amazing. Keep showing up for yourself.",
    },
    balanced: {
      title: "You're on fire! 🔥",
      body: "{streak}-day streak! That's discipline.",
    },
    direct: {
      title: "🔥 {streak}-day streak",
      body: "Solid consistency. Keep pushing.",
    },
  },
};

// Celebration messages for different milestones
const CELEBRATION_MESSAGES: Record<CoachTone, string[]> = {
  gentle: [
    "You're building something amazing.",
    "Every workout is a gift to yourself.",
    "You showed up again — that counts.",
    "Progress isn't always visible, but you're making it.",
  ],
  balanced: [
    "That's discipline.",
    "Keep the momentum going.",
    "You're stronger than last week — literally.",
    "Consistency beats perfection.",
  ],
  direct: [
    "Strong work.",
    "You didn't quit. You adjusted. That's progress.",
    "Solid.",
    "Keep pushing.",
  ],
};

/**
 * Generate a smart reminder based on context
 */
export function generateSmartReminder(
  type: ReminderType,
  tone: CoachTone | string | null,
  context?: {
    preferredTime?: string;
    currentStreak?: number;
    daysMissed?: number;
  }
): SmartReminder {
  const normalizedTone = normalizeCoachTone(tone);
  const template = REMINDER_MESSAGES[type][normalizedTone];
  
  let title = template.title;
  let body = template.body;

  // Replace placeholders
  if (context?.preferredTime) {
    body = body.replace('{time}', context.preferredTime);
    title = title.replace('{time}', context.preferredTime);
  }
  if (context?.currentStreak) {
    body = body.replace('{streak}', context.currentStreak.toString());
    title = title.replace('{streak}', context.currentStreak.toString());
  }

  // Add action based on type
  let actionLabel: string | undefined;
  let actionType: SmartReminder['actionType'] | undefined;

  switch (type) {
    case 'time_based':
      actionLabel = normalizedTone === 'direct' ? "Let's Go" : "Start Workout";
      actionType = 'start_workout';
      break;
    case 'adaptive_missed':
    case 'adaptive_streak':
    case 'context_late':
      actionLabel = "Quick Win";
      actionType = 'quick_win';
      break;
    case 'celebration':
      actionLabel = "View Progress";
      actionType = 'view_progress';
      break;
  }

  return {
    type,
    title,
    body,
    actionLabel,
    actionType,
  };
}

/**
 * Get a random celebration message for streak milestones
 */
export function getCelebrationMessage(
  streak: number,
  tone: CoachTone | string | null
): { title: string; body: string } {
  const normalizedTone = normalizeCoachTone(tone);
  const messages = CELEBRATION_MESSAGES[normalizedTone];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  // Milestone-specific titles
  let title: string;
  if (streak >= 100) {
    title = normalizedTone === 'gentle' 
      ? `100+ days! You're incredible! 🏆`
      : normalizedTone === 'balanced'
        ? `🏆 ${streak}-day streak! Legendary.`
        : `${streak} days. Legend status.`;
  } else if (streak >= 30) {
    title = normalizedTone === 'gentle'
      ? `A whole month! So proud of you! 🎉`
      : normalizedTone === 'balanced'
        ? `🔥 ${streak}-day streak! One month strong!`
        : `${streak} days. One month in.`;
  } else if (streak >= 7) {
    title = normalizedTone === 'gentle'
      ? `A full week! Amazing! 🌟`
      : normalizedTone === 'balanced'
        ? `🔥 ${streak}-day streak! One week down!`
        : `${streak} days. Week complete.`;
  } else {
    title = normalizedTone === 'gentle'
      ? `${streak} days and counting! 🌟`
      : normalizedTone === 'balanced'
        ? `🔥 ${streak}-day streak!`
        : `${streak}-day streak.`;
  }

  return { title, body: randomMessage };
}

/**
 * Determine which reminder type to show based on user context
 */
export function determineReminderType(context: {
  hasWorkoutToday: boolean;
  completedToday: boolean;
  preferredTime: string | null;
  currentHour: number;
  daysSinceLastWorkout: number;
  currentStreak: number;
}): ReminderType | null {
  const { 
    hasWorkoutToday, 
    completedToday, 
    preferredTime, 
    currentHour, 
    daysSinceLastWorkout,
    currentStreak 
  } = context;

  // Already completed today - maybe celebration
  if (completedToday && currentStreak > 0 && [7, 14, 21, 30, 50, 100].includes(currentStreak)) {
    return 'celebration';
  }

  // If already completed, no need for workout reminders
  if (completedToday) {
    return null;
  }

  // Time-based reminder (within 30 min of preferred time)
  if (hasWorkoutToday && preferredTime) {
    const [prefHour] = preferredTime.split(':').map(Number);
    if (Math.abs(currentHour - prefHour) <= 1) {
      return 'time_based';
    }
  }

  // It's late in the day (after 9 PM) and workout not done
  if (hasWorkoutToday && currentHour >= 21) {
    return 'context_late';
  }

  // Multiple days missed
  if (daysSinceLastWorkout >= 3) {
    return 'adaptive_streak';
  }

  // One workout day missed
  if (daysSinceLastWorkout >= 1 && hasWorkoutToday) {
    return 'adaptive_missed';
  }

  return null;
}

/**
 * Check if streak should be saved based on workout duration
 */
export function shouldSaveStreak(
  durationMinutes: number,
  isQuickWin: boolean,
  streakSaveEnabled: boolean = true
): boolean {
  if (!streakSaveEnabled) return durationMinutes >= 15;
  
  // Quick Win workouts always count
  if (isQuickWin) return true;
  
  // Any workout 10+ minutes saves streak
  return durationMinutes >= 10;
}
