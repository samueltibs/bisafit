/**
 * Health Platform Integration Utilities
 * 
 * This module provides utilities for connecting to Apple Health (via HealthKit)
 * and Google Fit (via Health Connect) on native platforms.
 * 
 * Note: These integrations require native Capacitor plugins and will only work
 * on actual iOS/Android devices, not in the web browser.
 */

import type { ExternalWorkoutData } from '@/types/workoutLog';

// Platform detection
export function isNativePlatform(): boolean {
  return typeof (window as any).Capacitor !== 'undefined' && 
         (window as any).Capacitor.isNativePlatform === true;
}

export function isIOSPlatform(): boolean {
  return isNativePlatform() && (window as any).Capacitor?.getPlatform?.() === 'ios';
}

export function isAndroidPlatform(): boolean {
  return isNativePlatform() && (window as any).Capacitor?.getPlatform?.() === 'android';
}

// Map external workout types to normalized types
const APPLE_WORKOUT_TYPE_MAP: Record<string, string> = {
  'HKWorkoutActivityTypeTraditionalStrengthTraining': 'strength',
  'HKWorkoutActivityTypeRunning': 'running',
  'HKWorkoutActivityTypeCycling': 'cycling',
  'HKWorkoutActivityTypeWalking': 'walking',
  'HKWorkoutActivityTypeHighIntensityIntervalTraining': 'hiit',
  'HKWorkoutActivityTypeYoga': 'yoga',
  'HKWorkoutActivityTypeSwimming': 'swimming',
  'HKWorkoutActivityTypeElliptical': 'elliptical',
  'HKWorkoutActivityTypeRowing': 'rowing',
  'HKWorkoutActivityTypeStairClimbing': 'stair_stepper',
};

const GOOGLE_WORKOUT_TYPE_MAP: Record<string, string> = {
  'strength_training': 'strength',
  'running': 'running',
  'biking': 'cycling',
  'walking': 'walking',
  'interval_training': 'hiit',
  'yoga': 'yoga',
  'swimming': 'swimming',
  'elliptical': 'elliptical',
  'rowing': 'rowing',
  'stair_climbing': 'stair_stepper',
};

export function normalizeAppleWorkoutType(appleType: string): string {
  return APPLE_WORKOUT_TYPE_MAP[appleType] || 'other';
}

export function normalizeGoogleWorkoutType(googleType: string): string {
  return GOOGLE_WORKOUT_TYPE_MAP[googleType] || 'other';
}

// Apple Health / HealthKit integration
export interface AppleHealthAuthStatus {
  authorized: boolean;
  workoutsRead: boolean;
}

export async function requestAppleHealthPermissions(): Promise<AppleHealthAuthStatus> {
  if (!isIOSPlatform()) {
    console.warn('Apple Health is only available on iOS devices');
    return { authorized: false, workoutsRead: false };
  }

  // In a real implementation, this would use a Capacitor plugin like:
  // @nickmanning/capacitor-healthkit or a similar plugin
  // For now, we return a mock response for the UI to work
  console.log('[HealthPlatforms] Apple Health permissions requested');
  
  // This is a placeholder - actual implementation needs native plugin
  return { authorized: false, workoutsRead: false };
}

export async function fetchAppleHealthWorkouts(
  startDate: Date,
  endDate: Date
): Promise<ExternalWorkoutData[]> {
  if (!isIOSPlatform()) {
    console.warn('Apple Health is only available on iOS devices');
    return [];
  }

  // Placeholder for actual HealthKit integration
  // Would use a Capacitor plugin to query HKWorkout samples
  console.log('[HealthPlatforms] Fetching Apple Health workouts:', { startDate, endDate });
  
  return [];
}

// Google Fit / Health Connect integration
export interface GoogleFitAuthStatus {
  authorized: boolean;
  sessionsRead: boolean;
}

export async function requestGoogleFitPermissions(): Promise<GoogleFitAuthStatus> {
  if (!isAndroidPlatform()) {
    console.warn('Google Fit is only available on Android devices');
    return { authorized: false, sessionsRead: false };
  }

  // In a real implementation, this would use a Capacitor plugin like:
  // @nickmanning/capacitor-health or Health Connect API
  console.log('[HealthPlatforms] Google Fit permissions requested');
  
  // This is a placeholder - actual implementation needs native plugin
  return { authorized: false, sessionsRead: false };
}

export async function fetchGoogleFitWorkouts(
  startDate: Date,
  endDate: Date
): Promise<ExternalWorkoutData[]> {
  if (!isAndroidPlatform()) {
    console.warn('Google Fit is only available on Android devices');
    return [];
  }

  // Placeholder for actual Google Fit / Health Connect integration
  console.log('[HealthPlatforms] Fetching Google Fit workouts:', { startDate, endDate });
  
  return [];
}

// Combined sync function
export async function syncExternalWorkouts(
  startDate: Date,
  endDate: Date
): Promise<ExternalWorkoutData[]> {
  const workouts: ExternalWorkoutData[] = [];

  if (isIOSPlatform()) {
    const appleWorkouts = await fetchAppleHealthWorkouts(startDate, endDate);
    workouts.push(...appleWorkouts);
  }

  if (isAndroidPlatform()) {
    const googleWorkouts = await fetchGoogleFitWorkouts(startDate, endDate);
    workouts.push(...googleWorkouts);
  }

  return workouts;
}

// Check connection status
export async function getHealthPlatformStatus(): Promise<{
  appleHealthAvailable: boolean;
  appleHealthConnected: boolean;
  googleFitAvailable: boolean;
  googleFitConnected: boolean;
}> {
  return {
    appleHealthAvailable: isIOSPlatform(),
    appleHealthConnected: false, // Would be populated from saved state or permission check
    googleFitAvailable: isAndroidPlatform(),
    googleFitConnected: false,
  };
}
