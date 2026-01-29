/**
 * Apple Health Service
 * 
 * Complete HealthKit integration for reading and writing health data.
 * Requires @perfood/capacitor-healthkit plugin (install when building iOS).
 */

// Type definitions for HealthKit plugin
interface HealthKitPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  requestAuthorization(options: {
    read: string[];
    write: string[];
  }): Promise<{ granted: boolean }>;
  queryHKitSampleType(options: {
    sampleName: string;
    startDate: string;
    endDate: string;
    limit?: number;
  }): Promise<{ data: any[] }>;
  multipleQueryHKitSampleType(options: {
    sampleNames: string[];
    startDate: string;
    endDate: string;
  }): Promise<{ data: Record<string, any[]> }>;
  saveWorkout(options: {
    activityType: string;
    startDate: string;
    endDate: string;
    energyBurned?: number;
    distance?: number;
  }): Promise<{ success: boolean }>;
}

// Get plugin instance
function getHealthKitPlugin(): HealthKitPlugin | null {
  if (typeof window === 'undefined') return null;
  
  // Check if Capacitor and plugin are available
  const capacitor = (window as any).Capacitor;
  if (!capacitor?.Plugins?.CapacitorHealthkit) {
    console.log('[AppleHealth] Plugin not available (web or not installed)');
    return null;
  }
  
  return capacitor.Plugins.CapacitorHealthkit as HealthKitPlugin;
}

export interface AppleHealthPermissions {
  read: string[];
  write: string[];
}

export interface HealthKitData {
  steps: number;
  activeCalories: number;
  restingHeartRate: number | null;
  weight: number | null;
  sleep: number | null; // hours
}

export interface WorkoutData {
  id: string;
  name: string;
  type: string;
  startDate: Date;
  endDate: Date;
  duration: number; // minutes
  calories: number;
  distance?: number; // meters
  source: string;
}

export class AppleHealthService {
  private static plugin: HealthKitPlugin | null = null;
  
  /**
   * Initialize plugin
   */
  private static getPlugin(): HealthKitPlugin | null {
    if (!this.plugin) {
      this.plugin = getHealthKitPlugin();
    }
    return this.plugin;
  }
  
  /**
   * Check if Apple Health is available on this device
   */
  static async isAvailable(): Promise<boolean> {
    const plugin = this.getPlugin();
    if (!plugin) return false;
    
    try {
      const result = await plugin.isAvailable();
      return result.available;
    } catch (error) {
      console.error('[AppleHealth] Error checking availability:', error);
      return false;
    }
  }
  
  /**
   * Request permissions for health data
   */
  static async requestPermissions(): Promise<boolean> {
    const plugin = this.getPlugin();
    if (!plugin) {
      console.warn('[AppleHealth] Plugin not available');
      return false;
    }
    
    try {
      const result = await plugin.requestAuthorization({
        read: [
          'HKQuantityTypeIdentifierStepCount',
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          'HKQuantityTypeIdentifierRestingHeartRate',
          'HKQuantityTypeIdentifierBodyMass',
          'HKCategoryTypeIdentifierSleepAnalysis',
          'HKWorkoutTypeIdentifier',
        ],
        write: [
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          'HKWorkoutTypeIdentifier',
        ],
      });
      
      console.log('[AppleHealth] Permissions result:', result.granted);
      return result.granted;
    } catch (error) {
      console.error('[AppleHealth] Error requesting permissions:', error);
      return false;
    }
  }
  
  /**
   * Get today's health data
   */
  static async getTodayData(): Promise<HealthKitData> {
    const plugin = this.getPlugin();
    if (!plugin) {
      return {
        steps: 0,
        activeCalories: 0,
        restingHeartRate: null,
        weight: null,
        sleep: null,
      };
    }
    
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Query multiple data types
      const result = await plugin.multipleQueryHKitSampleType({
        sampleNames: [
          'HKQuantityTypeIdentifierStepCount',
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          'HKQuantityTypeIdentifierRestingHeartRate',
          'HKQuantityTypeIdentifierBodyMass',
        ],
        startDate: startOfDay.toISOString(),
        endDate: now.toISOString(),
      });
      
      // Parse results
      const data = result.data || {};
      
      return {
        steps: this.sumQuantity(data['HKQuantityTypeIdentifierStepCount']),
        activeCalories: this.sumQuantity(data['HKQuantityTypeIdentifierActiveEnergyBurned']),
        restingHeartRate: this.getLatestValue(data['HKQuantityTypeIdentifierRestingHeartRate']),
        weight: this.getLatestValue(data['HKQuantityTypeIdentifierBodyMass']),
        sleep: null, // Sleep requires special handling
      };
    } catch (error) {
      console.error('[AppleHealth] Error getting today data:', error);
      return {
        steps: 0,
        activeCalories: 0,
        restingHeartRate: null,
        weight: null,
        sleep: null,
      };
    }
  }
  
  /**
   * Get workouts from the last 7 days
   */
  static async getRecentWorkouts(days: number = 7): Promise<WorkoutData[]> {
    const plugin = this.getPlugin();
    if (!plugin) return [];
    
    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      const result = await plugin.queryHKitSampleType({
        sampleName: 'HKWorkoutTypeIdentifier',
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        limit: 100,
      });
      
      const workouts: WorkoutData[] = [];
      
      if (result.data) {
        for (const workout of result.data) {
          workouts.push({
            id: workout.uuid || `workout_${Date.now()}_${Math.random()}`,
            name: this.getWorkoutName(workout.workoutActivityType),
            type: this.normalizeWorkoutType(workout.workoutActivityType),
            startDate: new Date(workout.startDate),
            endDate: new Date(workout.endDate),
            duration: Math.round((new Date(workout.endDate).getTime() - new Date(workout.startDate).getTime()) / 60000),
            calories: workout.totalEnergyBurned || 0,
            distance: workout.totalDistance,
            source: workout.sourceName || 'Apple Health',
          });
        }
      }
      
      return workouts;
    } catch (error) {
      console.error('[AppleHealth] Error getting workouts:', error);
      return [];
    }
  }
  
  /**
   * Save a workout to Apple Health
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
      const result = await plugin.saveWorkout({
        activityType: this.getHealthKitWorkoutType(workout.type),
        startDate: workout.startDate.toISOString(),
        endDate: workout.endDate.toISOString(),
        energyBurned: workout.calories,
        distance: workout.distance,
      });
      
      console.log('[AppleHealth] Workout saved:', result.success);
      return result.success;
    } catch (error) {
      console.error('[AppleHealth] Error saving workout:', error);
      return false;
    }
  }
  
  /**
   * Helper: Sum quantity values
   */
  private static sumQuantity(data: any[]): number {
    if (!data || !Array.isArray(data)) return 0;
    return data.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
  }
  
  /**
   * Helper: Get latest value
   */
  private static getLatestValue(data: any[]): number | null {
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    const sorted = data.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    return parseFloat(sorted[0].value) || null;
  }
  
  /**
   * Helper: Get workout display name
   */
  private static getWorkoutName(activityType: string): string {
    const map: Record<string, string> = {
      'HKWorkoutActivityTypeTraditionalStrengthTraining': 'Strength Training',
      'HKWorkoutActivityTypeRunning': 'Running',
      'HKWorkoutActivityTypeCycling': 'Cycling',
      'HKWorkoutActivityTypeWalking': 'Walking',
      'HKWorkoutActivityTypeHighIntensityIntervalTraining': 'HIIT',
      'HKWorkoutActivityTypeYoga': 'Yoga',
      'HKWorkoutActivityTypeSwimming': 'Swimming',
      'HKWorkoutActivityTypeFunctionalStrengthTraining': 'Functional Training',
    };
    return map[activityType] || 'Workout';
  }
  
  /**
   * Helper: Normalize workout type
   */
  private static normalizeWorkoutType(activityType: string): string {
    const map: Record<string, string> = {
      'HKWorkoutActivityTypeTraditionalStrengthTraining': 'strength',
      'HKWorkoutActivityTypeRunning': 'running',
      'HKWorkoutActivityTypeCycling': 'cycling',
      'HKWorkoutActivityTypeWalking': 'walking',
      'HKWorkoutActivityTypeHighIntensityIntervalTraining': 'hiit',
      'HKWorkoutActivityTypeYoga': 'yoga',
      'HKWorkoutActivityTypeSwimming': 'swimming',
    };
    return map[activityType] || 'other';
  }
  
  /**
   * Helper: Get HealthKit workout type
   */
  private static getHealthKitWorkoutType(type: string): string {
    const map: Record<string, string> = {
      'strength': 'HKWorkoutActivityTypeTraditionalStrengthTraining',
      'running': 'HKWorkoutActivityTypeRunning',
      'cycling': 'HKWorkoutActivityTypeCycling',
      'walking': 'HKWorkoutActivityTypeWalking',
      'hiit': 'HKWorkoutActivityTypeHighIntensityIntervalTraining',
      'yoga': 'HKWorkoutActivityTypeYoga',
      'swimming': 'HKWorkoutActivityTypeSwimming',
    };
    return map[type] || 'HKWorkoutActivityTypeTraditionalStrengthTraining';
  }
}
