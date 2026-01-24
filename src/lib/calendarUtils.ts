/**
 * Calendar utilities for generating ICS files and event data
 */

export interface WorkoutTimePreferences {
  default_time: string; // HH:MM 24h format
  fallback_duration_minutes: number;
  buffer_minutes: number;
}

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
}

export interface WorkoutForCalendar {
  id: string;
  title: string | null;
  scheduled_date: string | null;
  workout_json: {
    focus?: string;
    type?: string;
    total_estimated_minutes?: number;
    blocks?: Array<{ exercises?: Array<unknown> }>;
  };
  calendar_event_id?: string | null;
}

export interface PlanForCalendar {
  id: string;
  block_number: number | null;
  name: string | null;
}

/**
 * Get workout duration in minutes
 */
export function getWorkoutDuration(
  workout: WorkoutForCalendar,
  preferences: WorkoutTimePreferences
): number {
  const baseDuration = workout.workout_json?.total_estimated_minutes 
    || preferences.fallback_duration_minutes;
  return baseDuration + preferences.buffer_minutes;
}

/**
 * Create a calendar event object from a workout
 */
export function createCalendarEvent(
  workout: WorkoutForCalendar,
  plan: PlanForCalendar,
  preferences: WorkoutTimePreferences
): CalendarEvent | null {
  if (!workout.scheduled_date) return null;

  const focus = workout.workout_json?.focus || workout.title || 'Workout';
  const blockNumber = plan.block_number || 1;
  const workoutTitle = workout.title || focus;
  const estimatedMinutes = workout.workout_json?.total_estimated_minutes;
  const totalDuration = getWorkoutDuration(workout, preferences);

  // Parse scheduled date and time
  const [hours, minutes] = preferences.default_time.split(':').map(Number);
  const startDate = new Date(workout.scheduled_date);
  startDate.setHours(hours, minutes, 0, 0);

  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + totalDuration);

  const durationLabel = estimatedMinutes 
    ? `${estimatedMinutes} min workout` 
    : `Estimated ${preferences.fallback_duration_minutes} min`;

  const description = [
    `Block ${blockNumber}: ${workoutTitle}`,
    '',
    durationLabel,
    preferences.buffer_minutes > 0 ? `+ ${preferences.buffer_minutes} min buffer` : '',
    '',
    'This is your scheduled training time.',
    'Show up for yourself.',
    '',
    '— BisaFit'
  ].filter(Boolean).join('\n');

  return {
    title: `BisaFit Workout – ${focus}`,
    description,
    startDate,
    endDate,
    location: 'Home / Gym / BisaFit',
  };
}

/**
 * Escape special characters for ICS format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Format date for ICS (YYYYMMDDTHHMMSS format)
 */
function formatICSDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/**
 * Generate a unique ID for ICS events
 */
function generateUID(workoutId: string): string {
  return `${workoutId}@bisafit.com`;
}

/**
 * Generate ICS file content for multiple events
 */
export function generateICSContent(events: Array<CalendarEvent & { workoutId: string }>): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BisaFit//Training Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:BisaFit Training',
  ];

  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${generateUID(event.workoutId)}`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(event.startDate)}`,
      `DTEND:${formatICSDate(event.endDate)}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `DESCRIPTION:${escapeICS(event.description)}`,
      `LOCATION:${escapeICS(event.location)}`,
      'STATUS:CONFIRMED',
      'TRANSP:BUSY',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Workout starts in 30 minutes',
      'TRIGGER:-PT30M',
      'END:VALARM',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Generate and download ICS file
 */
export function downloadICSFile(
  workouts: WorkoutForCalendar[],
  plan: PlanForCalendar,
  preferences: WorkoutTimePreferences
): void {
  const events = workouts
    .map(workout => {
      const event = createCalendarEvent(workout, plan, preferences);
      if (!event) return null;
      return { ...event, workoutId: workout.id };
    })
    .filter((e): e is CalendarEvent & { workoutId: string } => e !== null);

  if (events.length === 0) {
    throw new Error('No workouts with scheduled dates found');
  }

  const icsContent = generateICSContent(events);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `bisafit-block-${plan.block_number || 1}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get default workout time preferences
 */
export function getDefaultTimePreferences(): WorkoutTimePreferences {
  return {
    default_time: '06:00',
    fallback_duration_minutes: 60,
    buffer_minutes: 5,
  };
}

/**
 * Parse stored preferences or return defaults
 */
export function parseTimePreferences(stored: unknown): WorkoutTimePreferences {
  const defaults = getDefaultTimePreferences();
  if (!stored || typeof stored !== 'object') return defaults;
  
  const obj = stored as Record<string, unknown>;
  return {
    default_time: typeof obj.default_time === 'string' ? obj.default_time : defaults.default_time,
    fallback_duration_minutes: typeof obj.fallback_duration_minutes === 'number' 
      ? obj.fallback_duration_minutes 
      : defaults.fallback_duration_minutes,
    buffer_minutes: typeof obj.buffer_minutes === 'number' 
      ? obj.buffer_minutes 
      : defaults.buffer_minutes,
  };
}

/**
 * Format time for display (HH:MM to 12-hour format)
 */
export function formatTimeDisplay(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}
