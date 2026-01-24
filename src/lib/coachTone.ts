/**
 * Coach Tone Personalization System
 * Generates tone-specific messages while maintaining the same intent
 */

export type CoachTone = 'gentle' | 'balanced' | 'direct';

export const TONE_OPTIONS: { value: CoachTone; label: string; description: string }[] = [
  {
    value: 'gentle',
    label: 'Gentle & Encouraging',
    description: 'Soft motivation with positive reinforcement',
  },
  {
    value: 'balanced',
    label: 'Balanced & Supportive',
    description: 'A mix of encouragement and clear direction',
  },
  {
    value: 'direct',
    label: 'Direct & Motivational',
    description: 'Straight-to-the-point with energizing language',
  },
];

export type MessageKey =
  | 'workout_ready'
  | 'workout_start_cta'
  | 'missed_workout'
  | 'missed_workout_action'
  | 'rest_day'
  | 'rest_day_recovery'
  | 'workout_complete'
  | 'workout_complete_subtitle'
  | 'next_workout_preview'
  | 'no_plan'
  | 'keep_going'
  | 'great_job'
  | 'skip_confirmation'
  | 'reschedule_prompt';

interface MessageVariants {
  gentle: string;
  balanced: string;
  direct: string;
}

const MESSAGES: Record<MessageKey, MessageVariants> = {
  workout_ready: {
    gentle: "Your workout is waiting for you whenever you're ready.",
    balanced: "Today's workout is ready. Let's make it count.",
    direct: "Workout ready. Time to get after it.",
  },
  workout_start_cta: {
    gentle: "Begin when you're ready",
    balanced: "Start Workout",
    direct: "Let's Go",
  },
  missed_workout: {
    gentle: "You missed yesterday's workout — no worries, you can still do it today.",
    balanced: "You missed yesterday's workout. Want to do it now?",
    direct: "Yesterday's workout is still waiting. Let's get it done.",
  },
  missed_workout_action: {
    gentle: "Would you like to start it now?",
    balanced: "You can start now, skip, or reschedule.",
    direct: "Start now, skip, or reschedule.",
  },
  rest_day: {
    gentle: "Today is your rest day. Take it easy and let your body recover.",
    balanced: "Today is a rest day. Recovery is part of the process.",
    direct: "Rest day. Use it wisely — recovery builds strength.",
  },
  rest_day_recovery: {
    gentle: "Consider some light stretching or a short walk if you feel like moving.",
    balanced: "Light stretching or mobility work can help your recovery.",
    direct: "Active recovery: stretching or mobility work.",
  },
  workout_complete: {
    gentle: "Amazing work! You should feel proud of yourself.",
    balanced: "Great job! Workout complete.",
    direct: "Done. Strong work today.",
  },
  workout_complete_subtitle: {
    gentle: "Every workout brings you closer to your goals.",
    balanced: "Keep the momentum going.",
    direct: "One step closer. Keep pushing.",
  },
  next_workout_preview: {
    gentle: "Here's a preview of your next workout.",
    balanced: "Next up on your schedule:",
    direct: "Next workout:",
  },
  no_plan: {
    gentle: "It looks like you don't have a plan yet. Let's create one together.",
    balanced: "No workout plan found. Generate one to get started.",
    direct: "No plan yet. Create one now.",
  },
  keep_going: {
    gentle: "You're doing wonderfully. Keep it up!",
    balanced: "Good progress. Keep going.",
    direct: "Stay focused. Keep moving.",
  },
  great_job: {
    gentle: "That was fantastic! Well done.",
    balanced: "Great job!",
    direct: "Solid.",
  },
  skip_confirmation: {
    gentle: "It's okay to skip sometimes. Your body knows best.",
    balanced: "Are you sure you want to skip this workout?",
    direct: "Skip this workout?",
  },
  reschedule_prompt: {
    gentle: "No problem! Let's find a better time that works for you.",
    balanced: "Pick a new date and time for this workout.",
    direct: "Select new date and time.",
  },
};

/**
 * Get a tone-specific message
 */
export function getCoachMessage(key: MessageKey, tone: CoachTone = 'balanced'): string {
  const variants = MESSAGES[key];
  return variants?.[tone] || variants?.balanced || '';
}

/**
 * Get personalized greeting based on time of day and tone
 */
export function getGreeting(name: string, tone: CoachTone = 'balanced'): string {
  const hour = new Date().getHours();
  const firstName = name?.split(' ')[0] || 'there';
  
  let timeGreeting: string;
  if (hour < 12) {
    timeGreeting = 'Good morning';
  } else if (hour < 17) {
    timeGreeting = 'Good afternoon';
  } else {
    timeGreeting = 'Good evening';
  }

  switch (tone) {
    case 'gentle':
      return `${timeGreeting}, ${firstName}. Hope you're feeling good today.`;
    case 'direct':
      return `${timeGreeting}, ${firstName}.`;
    case 'balanced':
    default:
      return `${timeGreeting}, ${firstName}!`;
  }
}

/**
 * Get encouragement message for completing exercises/sets
 */
export function getExerciseEncouragement(
  setsCompleted: number,
  totalSets: number,
  tone: CoachTone = 'balanced'
): string {
  const remaining = totalSets - setsCompleted;
  
  if (remaining === 0) {
    return getCoachMessage('great_job', tone);
  }
  
  if (remaining === 1) {
    switch (tone) {
      case 'gentle':
        return "Almost there! Just one more set.";
      case 'direct':
        return "Final set. Finish strong.";
      case 'balanced':
      default:
        return "One more set to go!";
    }
  }
  
  switch (tone) {
    case 'gentle':
      return `${remaining} sets remaining. You've got this!`;
    case 'direct':
      return `${remaining} sets left.`;
    case 'balanced':
    default:
      return `${remaining} sets to go. Keep it up!`;
  }
}

/**
 * Get rest timer message
 */
export function getRestMessage(seconds: number, tone: CoachTone = 'balanced'): string {
  if (seconds <= 5) {
    switch (tone) {
      case 'gentle':
        return "Get ready for your next set when you feel prepared.";
      case 'direct':
        return "Get ready.";
      case 'balanced':
      default:
        return "Almost time — get ready!";
    }
  }
  
  switch (tone) {
    case 'gentle':
      return "Take your time to recover.";
    case 'direct':
      return "Rest.";
    case 'balanced':
    default:
      return "Rest and recover.";
  }
}

/**
 * Validate and normalize coach tone
 */
export function normalizeCoachTone(tone: string | null | undefined): CoachTone {
  if (tone === 'gentle' || tone === 'balanced' || tone === 'direct') {
    return tone;
  }
  return 'balanced';
}
