/**
 * Apple Health Service
 * 
 * Capacitor-ready service for Apple Health (HealthKit) integration.
 * Provides placeholder methods that will be implemented by a native plugin.
 * 
 * Native plugin expected: window.Capacitor?.Plugins?.BisaHealth
 */

import type { ExternalWorkoutData } from '@/types/workoutLog';
import { normalizeAppleWorkoutType } from '@/lib/healthPlatforms';

export type AppleHealthPermissionStatus = 'not_determined' | 'authorized' | 'denied' | 'unavailable';

export interface AppleHealthConnectionStatus {
  available: boolean;
  connected: boolean;
  permissionStatus: AppleHealthPermissionStatus;
  lastSyncAt: Date | null;
  error?: string;
}

export interface AppleHealthPermissions {
  steps: boolean;
  workouts: boolean;
  activeEnergy: boolean;
  heartRate: boolean;
}

export interface DailyStepsData {
  date: string; // YYYY-MM-DD
  steps: number;
  source: 'apple_health';
}

export interface AppleHealthWorkout {
  externalId: string;
  workoutType: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  caloriesBurned?: number;
  heartRateAvg?: number;
  distanceMeters?: number;
}

export interface SyncProgress {
  phase: 'idle' | 'steps' | 'workouts' | 'complete' | 'error';
  message: string;
  imported: number;
  skipped: number;
}

export type SyncProgressCallback = (progress: SyncProgress) => void;

/**
 * Check if we're running in a native iOS context with Capacitor
 */
function isNativeIOS(): boolean {
  return typeof (window as any).Capacitor !== 'undefined' &&
    (window as any).Capacitor?.isNativePlatform?.() === true &&
    (window as any).Capacitor?.getPlatform?.() === 'ios';
}

/**
 * Get the BisaHealth plugin if available
 */
function getPlugin(): any {
  if (!isNativeIOS()) return null;
  return (window as any).Capacitor?.Plugins?.BisaHealth || null;
}

/**
 * Apple Health Service - Capacitor-ready
 */
export const AppleHealthService = {
  /**
   * Check if Apple Health is available on this device
   */
  async isAvailable(): Promise<boolean> {
    const plugin = getPlugin();
    
    if (plugin?.isAvailable) {
      try {
        const result = await plugin.isAvailable();
        return result?.available ?? false;
      } catch (error) {
        console.error('[AppleHealth] isAvailable error:', error);
        return false;
      }
    }
    
    // Not available on non-iOS platforms
    return false;
  },

  /**
   * Get the current permission status
   */
  async getPermissionStatus(): Promise<AppleHealthPermissions> {
    const plugin = getPlugin();
    
    if (plugin?.getPermissionStatus) {
      try {
        return await plugin.getPermissionStatus();
      } catch (error) {
        console.error('[AppleHealth] getPermissionStatus error:', error);
      }
    }
    
    // Default: no permissions
    return {
      steps: false,
      workouts: false,
      activeEnergy: false,
      heartRate: false,
    };
  },

  /**
   * Request permissions from the user
   * On iOS, this opens the native HealthKit permission dialog
   */
  async requestPermissions(permissions: AppleHealthPermissions): Promise<AppleHealthPermissions> {
    const plugin = getPlugin();
    
    if (plugin?.requestPermissions) {
      try {
        return await plugin.requestPermissions(permissions);
      } catch (error) {
        console.error('[AppleHealth] requestPermissions error:', error);
        throw new Error('Failed to request permissions');
      }
    }
    
    // Web fallback - show info message
    if (!isNativeIOS()) {
      console.info('[AppleHealth] Permissions only available on iOS app');
      throw new Error('Apple Health is only available on iOS devices. Install the BisaFit app to connect.');
    }
    
    throw new Error('Apple Health plugin not available');
  },

  /**
   * Fetch daily step counts for a date range
   */
  async fetchDailySteps(startDate: Date, endDate: Date): Promise<DailyStepsData[]> {
    const plugin = getPlugin();
    
    if (plugin?.fetchDailySteps) {
      try {
        const result = await plugin.fetchDailySteps({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        return result?.steps || [];
      } catch (error) {
        console.error('[AppleHealth] fetchDailySteps error:', error);
        throw error;
      }
    }
    
    // Web fallback
    console.warn('[AppleHealth] fetchDailySteps not available on web');
    return [];
  },

  /**
   * Fetch workouts for a date range
   */
  async fetchWorkouts(startDate: Date, endDate: Date): Promise<ExternalWorkoutData[]> {
    const plugin = getPlugin();
    
    if (plugin?.fetchWorkouts) {
      try {
        const result = await plugin.fetchWorkouts({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        
        // Normalize the workout data
        const workouts: ExternalWorkoutData[] = (result?.workouts || []).map((w: AppleHealthWorkout) => ({
          externalId: w.externalId,
          source: 'apple_health' as const,
          startTime: new Date(w.startTime),
          endTime: new Date(w.endTime),
          durationMinutes: w.durationMinutes,
          workoutType: normalizeAppleWorkoutType(w.workoutType),
          caloriesBurned: w.caloriesBurned,
          heartRateAvg: w.heartRateAvg,
          distanceMeters: w.distanceMeters,
        }));
        
        return workouts;
      } catch (error) {
        console.error('[AppleHealth] fetchWorkouts error:', error);
        throw error;
      }
    }
    
    // Web fallback
    console.warn('[AppleHealth] fetchWorkouts not available on web');
    return [];
  },

  /**
   * Full sync: fetch steps and workouts, report progress
   */
  async syncAll(
    startDate: Date,
    endDate: Date,
    onProgress?: SyncProgressCallback
  ): Promise<{ steps: DailyStepsData[]; workouts: ExternalWorkoutData[] }> {
    const progress: SyncProgress = {
      phase: 'idle',
      message: 'Starting sync...',
      imported: 0,
      skipped: 0,
    };
    
    try {
      // Phase 1: Steps
      progress.phase = 'steps';
      progress.message = 'Syncing steps...';
      onProgress?.(progress);
      
      const steps = await this.fetchDailySteps(startDate, endDate);
      progress.imported += steps.length;
      
      // Phase 2: Workouts
      progress.phase = 'workouts';
      progress.message = 'Syncing workouts...';
      onProgress?.(progress);
      
      const workouts = await this.fetchWorkouts(startDate, endDate);
      progress.imported += workouts.length;
      
      // Complete
      progress.phase = 'complete';
      progress.message = `Sync complete! ${steps.length} days of steps, ${workouts.length} workouts`;
      onProgress?.(progress);
      
      return { steps, workouts };
    } catch (error) {
      progress.phase = 'error';
      progress.message = error instanceof Error ? error.message : 'Sync failed';
      onProgress?.(progress);
      throw error;
    }
  },

  /**
   * Get full connection status
   */
  async getConnectionStatus(connected: boolean, lastSyncAt: string | null): Promise<AppleHealthConnectionStatus> {
    const available = await this.isAvailable();
    const permissions = await this.getPermissionStatus();
    
    let permissionStatus: AppleHealthPermissionStatus = 'not_determined';
    if (!available) {
      permissionStatus = 'unavailable';
    } else if (permissions.steps || permissions.workouts) {
      permissionStatus = 'authorized';
    } else if (connected) {
      // Connected but no permissions = denied or need to re-authorize
      permissionStatus = 'denied';
    }
    
    return {
      available,
      connected,
      permissionStatus,
      lastSyncAt: lastSyncAt ? new Date(lastSyncAt) : null,
    };
  },

  /**
   * Open Apple Health settings on iOS
   */
  async openHealthSettings(): Promise<void> {
    const plugin = getPlugin();
    
    if (plugin?.openHealthSettings) {
      try {
        await plugin.openHealthSettings();
      } catch (error) {
        console.error('[AppleHealth] openHealthSettings error:', error);
      }
    } else {
      console.info('[AppleHealth] Cannot open Health settings on this platform');
    }
  },
};

export default AppleHealthService;
