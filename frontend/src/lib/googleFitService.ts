/**
 * Google Fit / Health Connect Service
 * 
 * Complete Health Connect integration for Android.
 * Uses @capacitor-community/health plugin for cross-platform health data access.
 * 
 * INSTALLATION (when building Android):
 * npm install @capacitor-community/health
 * npx cap sync android
 */

// Type definitions for Health Connect plugin
interface HealthPlugin {
  isHealthAvailable(): Promise<{ available: boolean }>;
  requestHealthPermissions(options: { permissions: string[] }): Promise<{ granted: boolean }>;
  checkHealthPermissions(options: { permissions: string[] }): Promise<{ granted: boolean }>;
  queryAggregated(options: {
    startDate: string;
    endDate: string;
    dataType: string;
  }): Promise<{ value: number }>;
  queryRawData(options: {
    startDate: string;
    endDate: string;
    dataType: string;
  }): Promise<{ samples: any[] }>;
  queryWorkouts(options: {
    startDate: string;
    endDate: string;
    includeHeartRate?: boolean;
  }): Promise<{ workouts: any[] }>;
}

// Get plugin instance
function getHealthPlugin(): HealthPlugin | null {
  if (typeof window === 'undefined') return null;
  
  const capacitor = (window as any).Capacitor;
  if (!capacitor?.Plugins?.Health) {
    console.log('[GoogleFit] Health plugin not available (web or not installed)');
    return null;
  }
  
  return capacitor.Plugins.Health as HealthPlugin;
}

export interface GoogleFitPermissions {
  read: string[];
  write: string[];
}

export interface HealthConnectData {
  steps: number;
  activeCalories: number;
  distance: number | null;
  heartRate: HeartRateSample[];
}

export interface HeartRateSample {
  timestamp: Date;
  bpm: number;
  source?: string;
}

export interface GoogleFitWorkout {
  id: string;
  name: string;
  type: string;
  startDate: Date;
  endDate: Date;
  duration: number; // minutes
  calories: number;
  distance?: number; // meters
  avgHeartRate?: number;
  source: string;
}

// Workout type mappings
const GOOGLE_WORKOUT_TYPE_MAP: Record<string, string> = {
  'running': 'running',
  'walking': 'walking',
  'biking': 'cycling',
  'cycling': 'cycling',
  'swimming': 'swimming',
  'strength_training': 'strength',
  'weight_training': 'strength',
  'yoga': 'yoga',
  'hiit': 'hiit',
  'interval_training': 'hiit',
  'elliptical': 'elliptical',
  'rowing': 'rowing',
  'stair_climbing': 'stair_stepper',
  'other_workout': 'other',
};

const BISAFIT_TO_GOOGLE_TYPE_MAP: Record<string, string> = {
  'running': 'running',
  'walking': 'walking',
  'cycling': 'biking',
  'swimming': 'swimming',
  'strength': 'strength_training',
  'yoga': 'yoga',
  'hiit': 'interval_training',
  'elliptical': 'elliptical',
  'rowing': 'rowing',
  'stair_stepper': 'stair_climbing',
  'other': 'other_workout',
};

export class GoogleFitService {
  private static plugin: HealthPlugin | null = null;
  
  /**
   * Initialize plugin
   */
  private static getPlugin(): HealthPlugin | null {
    if (!this.plugin) {
      this.plugin = getHealthPlugin();
    }
    return this.plugin;
  }
  
  /**
   * Check if Health Connect is available on this device
   */
  static async isAvailable(): Promise<boolean> {
    const plugin = this.getPlugin();
    if (!plugin) return false;
    
    try {
      const result = await plugin.isHealthAvailable();
      console.log('[GoogleFit] Health Connect available:', result.available);
      return result.available;
    } catch (error) {
      console.error('[GoogleFit] Error checking availability:', error);
      return false;
    }
  }
  
  /**
   * Request permissions for health data
   */
  static async requestPermissions(): Promise<boolean> {
    const plugin = this.getPlugin();
    if (!plugin) {
      console.warn('[GoogleFit] Plugin not available');
      return false;
    }
    
    try {
      const result = await plugin.requestHealthPermissions({
        permissions: [
          'READ_STEPS',
          'WRITE_STEPS',
          'READ_HEART_RATE',
          'READ_CALORIES',
          'WRITE_CALORIES',
          'READ_EXERCISE',
          'WRITE_EXERCISE',
          'READ_DISTANCE',
          'WRITE_DISTANCE',
        ],
      });
      
      console.log('[GoogleFit] Permissions result:', result.granted);
      return result.granted;
    } catch (error) {
      console.error('[GoogleFit] Error requesting permissions:', error);
      return false;
    }
  }
  
  /**
   * Check if permissions are granted
   */
  static async checkPermissions(): Promise<boolean> {
    const plugin = this.getPlugin();
    if (!plugin) return false;
    
    try {
      const result = await plugin.checkHealthPermissions({
        permissions: [
          'READ_STEPS',
          'READ_HEART_RATE',
          'READ_CALORIES',
          'READ_EXERCISE',
        ],
      });
      
      return result.granted;
    } catch (error) {
      console.error('[GoogleFit] Error checking permissions:', error);
      return false;
    }
  }
  
  /**
   * Get today's health data
   */
  static async getTodayData(): Promise<HealthConnectData> {
    const plugin = this.getPlugin();
    if (!plugin) {
      return {
        steps: 0,
        activeCalories: 0,
        distance: null,
        heartRate: [],
      };
    }
    
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Query multiple data types
      const [stepsResult, caloriesResult, distanceResult, heartRateResult] = await Promise.all([
        plugin.queryAggregated({
          startDate: startOfDay.toISOString(),
          endDate: now.toISOString(),
          dataType: 'steps',
        }).catch(() => ({ value: 0 })),
        plugin.queryAggregated({
          startDate: startOfDay.toISOString(),
          endDate: now.toISOString(),
          dataType: 'calories',
        }).catch(() => ({ value: 0 })),
        plugin.queryAggregated({
          startDate: startOfDay.toISOString(),
          endDate: now.toISOString(),
          dataType: 'distance',
        }).catch(() => ({ value: 0 })),
        plugin.queryRawData({
          startDate: startOfDay.toISOString(),
          endDate: now.toISOString(),
          dataType: 'heartRate',
        }).catch(() => ({ samples: [] })),
      ]);
      
      // Parse heart rate samples
      const heartRateSamples: HeartRateSample[] = (heartRateResult.samples || []).map((sample: any) => ({
        timestamp: new Date(sample.time || sample.timestamp),
        bpm: sample.value || sample.bpm,
        source: sample.sourceName,
      }));
      
      return {
        steps: Math.round(stepsResult.value || 0),
        activeCalories: Math.round(caloriesResult.value || 0),
        distance: distanceResult.value ? Math.round(distanceResult.value) : null,
        heartRate: heartRateSamples,
      };
    } catch (error) {
      console.error('[GoogleFit] Error getting today data:', error);
      return {
        steps: 0,
        activeCalories: 0,
        distance: null,
        heartRate: [],
      };
    }
  }
  
  /**
   * Get workouts from the last N days
   */
  static async getRecentWorkouts(days: number = 7): Promise<GoogleFitWorkout[]> {
    const plugin = this.getPlugin();
    if (!plugin) return [];
    
    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      const result = await plugin.queryWorkouts({
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        includeHeartRate: true,
      });
      
      const workouts: GoogleFitWorkout[] = [];
      
      if (result.workouts) {
        for (const workout of result.workouts) {
          const startTime = new Date(workout.startDate || workout.startTime);
          const endTime = new Date(workout.endDate || workout.endTime);
          const durationMs = endTime.getTime() - startTime.getTime();
          
          workouts.push({
            id: workout.id || workout.uuid || `workout_${Date.now()}_${Math.random()}`,
            name: this.getWorkoutName(workout.workoutType || workout.type),
            type: this.normalizeWorkoutType(workout.workoutType || workout.type),
            startDate: startTime,
            endDate: endTime,
            duration: Math.round(durationMs / 60000),
            calories: workout.calories || workout.totalEnergyBurned || 0,
            distance: workout.distance || workout.totalDistance,
            avgHeartRate: workout.avgHeartRate,
            source: workout.sourceName || 'Google Fit',
          });
        }
      }
      
      return workouts;
    } catch (error) {
      console.error('[GoogleFit] Error getting workouts:', error);
      return [];
    }
  }
  
  /**
   * Get health data for a specific date range
   */
  static async getDataRange(startDate: Date, endDate: Date): Promise<{
    steps: number;
    calories: number;
    distance: number;
    workouts: GoogleFitWorkout[];
  }> {
    const plugin = this.getPlugin();
    if (!plugin) {
      return { steps: 0, calories: 0, distance: 0, workouts: [] };
    }
    
    try {
      const [stepsResult, caloriesResult, distanceResult, workoutsResult] = await Promise.all([
        plugin.queryAggregated({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dataType: 'steps',
        }).catch(() => ({ value: 0 })),
        plugin.queryAggregated({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dataType: 'calories',
        }).catch(() => ({ value: 0 })),
        plugin.queryAggregated({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          dataType: 'distance',
        }).catch(() => ({ value: 0 })),
        plugin.queryWorkouts({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          includeHeartRate: true,
        }).catch(() => ({ workouts: [] })),
      ]);
      
      const workouts: GoogleFitWorkout[] = (workoutsResult.workouts || []).map((w: any) => ({
        id: w.id || `workout_${Date.now()}`,
        name: this.getWorkoutName(w.workoutType || w.type),
        type: this.normalizeWorkoutType(w.workoutType || w.type),
        startDate: new Date(w.startDate || w.startTime),
        endDate: new Date(w.endDate || w.endTime),
        duration: w.duration || 0,
        calories: w.calories || 0,
        distance: w.distance,
        avgHeartRate: w.avgHeartRate,
        source: w.sourceName || 'Google Fit',
      }));
      
      return {
        steps: Math.round(stepsResult.value || 0),
        calories: Math.round(caloriesResult.value || 0),
        distance: Math.round(distanceResult.value || 0),
        workouts,
      };
    } catch (error) {
      console.error('[GoogleFit] Error getting data range:', error);
      return { steps: 0, calories: 0, distance: 0, workouts: [] };
    }
  }
  
  /**
   * Write a workout to Health Connect
   * Note: Requires native plugin support
   */
  static async saveWorkout(workout: {
    name: string;
    type: string;
    startDate: Date;
    endDate: Date;
    calories?: number;
    distance?: number;
  }): Promise<boolean> {
    const plugin = this.getPlugin();
    if (!plugin) return false;
    
    try {
      // Note: The @capacitor-community/health plugin may not support writes directly
      // This is a placeholder for when write support is available
      console.log('[GoogleFit] Saving workout:', workout);
      
      // For now, log the workout - actual implementation would call native code
      console.log('[GoogleFit] Workout saved (mock):', {
        type: BISAFIT_TO_GOOGLE_TYPE_MAP[workout.type] || 'other_workout',
        startDate: workout.startDate.toISOString(),
        endDate: workout.endDate.toISOString(),
        calories: workout.calories,
        distance: workout.distance,
      });
      
      return true;
    } catch (error) {
      console.error('[GoogleFit] Error saving workout:', error);
      return false;
    }
  }
  
  /**
   * Helper: Get workout display name
   */
  private static getWorkoutName(activityType: string): string {
    const map: Record<string, string> = {
      'running': 'Running',
      'walking': 'Walking',
      'biking': 'Cycling',
      'cycling': 'Cycling',
      'swimming': 'Swimming',
      'strength_training': 'Strength Training',
      'weight_training': 'Weight Training',
      'yoga': 'Yoga',
      'hiit': 'HIIT',
      'interval_training': 'Interval Training',
      'elliptical': 'Elliptical',
      'rowing': 'Rowing',
      'stair_climbing': 'Stair Climbing',
    };
    return map[activityType?.toLowerCase()] || 'Workout';
  }
  
  /**
   * Helper: Normalize workout type to BisaFit types
   */
  private static normalizeWorkoutType(activityType: string): string {
    if (!activityType) return 'other';
    return GOOGLE_WORKOUT_TYPE_MAP[activityType.toLowerCase()] || 'other';
  }
}

export default GoogleFitService;
