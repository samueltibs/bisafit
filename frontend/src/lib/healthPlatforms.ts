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
import { AppleHealthService } from './appleHealthService';
import { GoogleFitService } from './googleFitService';

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

  try {
    const granted = await AppleHealthService.requestPermissions();
    return { authorized: granted, workoutsRead: granted };
  } catch (error) {
    console.error('[HealthPlatforms] Apple Health permission error:', error);
    return { authorized: false, workoutsRead: false };
  }
}

export async function fetchAppleHealthWorkouts(
  startDate: Date,
  endDate: Date
): Promise<ExternalWorkoutData[]> {
  if (!isIOSPlatform()) {
    console.warn('Apple Health is only available on iOS devices');
    return [];
  }

  try {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const workouts = await AppleHealthService.getRecentWorkouts(days);
    
    return workouts.map(w => ({
      id: w.id,
      source: 'apple_health' as const,
      type: w.type,
      startTime: w.startDate,
      endTime: w.endDate,
      duration: w.duration,
      caloriesBurned: w.calories,
      distance: w.distance,
    }));
  } catch (error) {
    console.error('[HealthPlatforms] Error fetching Apple Health workouts:', error);
    return [];
  }
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

  try {
    const granted = await GoogleFitService.requestPermissions();
    return { authorized: granted, sessionsRead: granted };
  } catch (error) {
    console.error('[HealthPlatforms] Google Fit permission error:', error);
    return { authorized: false, sessionsRead: false };
  }
}

export async function fetchGoogleFitWorkouts(
  startDate: Date,
  endDate: Date
): Promise<ExternalWorkoutData[]> {
  if (!isAndroidPlatform()) {
    console.warn('Google Fit is only available on Android devices');
    return [];
  }

  try {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const workouts = await GoogleFitService.getRecentWorkouts(days);
    
    return workouts.map(w => ({
      id: w.id,
      source: 'google_fit' as const,
      type: w.type,
      startTime: w.startDate,
      endTime: w.endDate,
      duration: w.duration,
      caloriesBurned: w.calories,
      distance: w.distance,
    }));
  } catch (error) {
    console.error('[HealthPlatforms] Error fetching Google Fit workouts:', error);
    return [];
  }
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
  let appleHealthConnected = false;
  let googleFitConnected = false;
  
  if (isIOSPlatform()) {
    appleHealthConnected = await AppleHealthService.isAvailable();
  }
  
  if (isAndroidPlatform()) {
    googleFitConnected = await GoogleFitService.isAvailable();
  }
  
  return {
    appleHealthAvailable: isIOSPlatform(),
    appleHealthConnected,
    googleFitAvailable: isAndroidPlatform(),
    googleFitConnected,
  };
}

// Get today's health summary from connected platforms
export async function getTodayHealthSummary(): Promise<{
  steps: number;
  calories: number;
  distance: number | null;
  source: 'apple_health' | 'google_fit' | null;
}> {
  if (isIOSPlatform()) {
    try {
      const data = await AppleHealthService.getTodayData();
      return {
        steps: data.steps,
        calories: data.activeCalories,
        distance: null,
        source: 'apple_health',
      };
    } catch (error) {
      console.error('[HealthPlatforms] Error getting Apple Health data:', error);
    }
  }
  
  if (isAndroidPlatform()) {
    try {
      const data = await GoogleFitService.getTodayData();
      return {
        steps: data.steps,
        calories: data.activeCalories,
        distance: data.distance,
        source: 'google_fit',
      };
    } catch (error) {
      console.error('[HealthPlatforms] Error getting Google Fit data:', error);
    }
  }
  
  return {
    steps: 0,
    calories: 0,
    distance: null,
    source: null,
  };
}

// Write workout to connected platform
export async function writeWorkoutToPlatform(workout: {
  name: string;
  type: string;
  startDate: Date;
  endDate: Date;
  calories?: number;
  distance?: number;
}): Promise<boolean> {
  if (isIOSPlatform()) {
    return await AppleHealthService.saveWorkout(workout);
  }
  
  if (isAndroidPlatform()) {
    return await GoogleFitService.saveWorkout(workout);
  }
  
  return false;
}
