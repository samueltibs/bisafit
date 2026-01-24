/**
 * Date utilities for timezone-safe date handling.
 * 
 * CRITICAL: All "today" logic must use the user's device local timezone.
 * Date strings from the database (e.g., "2026-01-22") are date-only and should
 * be interpreted as local dates, NOT UTC.
 */

import { format, isToday as dateFnsIsToday, startOfDay } from 'date-fns';

/**
 * Parse a date string (YYYY-MM-DD) as a local date at midnight.
 * This prevents timezone offset issues where "2026-01-22" parsed as UTC
 * becomes "2026-01-21 19:00" in EST timezone.
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date object at local midnight
 */
export function parseLocalDate(dateStr: string): Date {
  // Split the date string and create date using local timezone
  const [year, month, day] = dateStr.split('-').map(Number);
  // Month is 0-indexed in JavaScript Date
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Get today's date in the user's local timezone at midnight.
 * @returns Date object representing local midnight today
 */
export function getLocalToday(): Date {
  return startOfDay(new Date());
}

/**
 * Get today's date as a YYYY-MM-DD string in local timezone.
 * @returns String in YYYY-MM-DD format
 */
export function getLocalTodayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Check if a date (or date string) is today in the user's local timezone.
 * 
 * @param date - Date object or YYYY-MM-DD string
 * @returns true if the date matches today in local timezone
 */
export function isLocalToday(date: Date | string): boolean {
  const checkDate = typeof date === 'string' ? parseLocalDate(date) : date;
  return dateFnsIsToday(checkDate);
}

/**
 * Format a date string (YYYY-MM-DD) for display, interpreting it as local date.
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param formatStr - date-fns format string
 * @returns Formatted string
 */
export function formatLocalDate(dateStr: string, formatStr: string): string {
  return format(parseLocalDate(dateStr), formatStr);
}

/**
 * Compare two dates by their local date (ignoring time).
 * 
 * @param date1 - First date or date string
 * @param date2 - Second date or date string
 * @returns true if both represent the same local date
 */
export function isSameLocalDate(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseLocalDate(date1) : startOfDay(date1);
  const d2 = typeof date2 === 'string' ? parseLocalDate(date2) : startOfDay(date2);
  return d1.getTime() === d2.getTime();
}

/**
 * Get the day name for a date in local timezone.
 * @param date - Date object
 * @returns Day name (e.g., "Monday", "Tuesday")
 */
export function getLocalDayName(date: Date): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[date.getDay()];
}
