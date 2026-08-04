import { Platform } from 'react-native';

// HealthKit types - these will be dynamically imported on iOS only
let HK: any = null;

// Initialize HealthKit module only on iOS
async function getHealthKit() {
  if (Platform.OS !== 'ios') {
    throw new Error('HealthKit is only available on iOS');
  }
  
  if (!HK) {
    try {
      HK = await import('@kayzmann/expo-healthkit');
    } catch (error) {
      console.error('Failed to load HealthKit module:', error);
      throw new Error('HealthKit module not available');
    }
  }
  
  return HK;
}

export interface HealthKitSample {
  startDate: string;
  endDate: string;
  value: number;
  unit?: string;
}

export interface WorkoutData {
  id: string;
  startDate: string;
  endDate: string;
  duration: number;
  distance?: number;
  calories?: number;
  activityType: string;
}

/**
 * Check if HealthKit is available on this device
 */
export async function isHealthKitAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  
  try {
    const healthKit = await getHealthKit();
    return healthKit.isAvailable();
  } catch {
    return false;
  }
}

/**
 * Request HealthKit permissions
 */
export async function requestHealthKitPermissions(): Promise<boolean> {
  const healthKit = await getHealthKit();
  
  if (!healthKit.isAvailable()) {
    throw new Error('HealthKit is not available on this device');
  }
  
  try {
    await healthKit.requestAuthorization(
      ['Steps', 'HeartRate', 'Workout', 'ActiveEnergyBurned'], // read
      ['Workout'] // write
    );
    return true;
  } catch (error) {
    console.error('HealthKit authorization error:', error);
    throw error;
  }
}

/**
 * Get steps count for a date range
 */
export async function getSteps(startDate: Date, endDate: Date): Promise<number> {
  const healthKit = await getHealthKit();
  
  try {
    const steps = await healthKit.getSteps(startDate, endDate);
    return Math.round(steps || 0);
  } catch (error) {
    console.error('Error reading steps:', error);
    return 0;
  }
}

/**
 * Get heart rate samples for a date range
 */
export async function getHeartRateSamples(
  startDate: Date,
  endDate: Date,
  limit: number = 100
): Promise<HealthKitSample[]> {
  const healthKit = await getHealthKit();
  
  try {
    const samples = await healthKit.getHeartRateSamples(startDate, endDate, limit);
    return samples.map((sample: any) => ({
      startDate: sample.startDate || sample.date,
      endDate: sample.endDate || sample.date,
      value: sample.value,
      unit: 'bpm',
    }));
  } catch (error) {
    console.error('Error reading heart rate:', error);
    return [];
  }
}

/**
 * Get workout sessions for a date range
 */
export async function getWorkouts(
  startDate: Date,
  endDate: Date,
  limit: number = 50
): Promise<WorkoutData[]> {
  const healthKit = await getHealthKit();
  
  try {
    const workouts = await healthKit.queryWorkouts({
      startDate,
      endDate,
      limit,
    });
    
    return workouts.map((workout: any) => ({
      id: workout.id || workout.uuid,
      startDate: workout.startDate,
      endDate: workout.endDate,
      duration: workout.duration,
      distance: workout.distance,
      calories: workout.calories || workout.energyBurned,
      activityType: workout.activityType || 'other',
    }));
  } catch (error) {
    console.error('Error reading workouts:', error);
    return [];
  }
}

/**
 * Get active calories burned for a date range
 */
export async function getActiveCalories(startDate: Date, endDate: Date): Promise<number> {
  const healthKit = await getHealthKit();
  
  try {
    const calories = await healthKit.getActiveEnergyBurned(startDate, endDate);
    return Math.round(calories || 0);
  } catch (error) {
    console.error('Error reading active calories:', error);
    return 0;
  }
}

/**
 * Save a workout to HealthKit
 */
export async function saveWorkout(workout: {
  startDate: Date;
  endDate: Date;
  activityType: string;
  duration: number; // seconds
  distance?: number; // meters
  calories?: number; // kcal
}): Promise<boolean> {
  const healthKit = await getHealthKit();
  
  try {
    await healthKit.saveWorkout({
      startDate: workout.startDate.getTime() / 1000, // Unix timestamp
      endDate: workout.endDate.getTime() / 1000,
      duration: workout.duration,
      distance: workout.distance || 0,
      calories: workout.calories || 0,
      activityType: workout.activityType,
      metadata: { createdBy: 'BisaFit' },
    });
    return true;
  } catch (error) {
    console.error('Error saving workout:', error);
    throw error;
  }
}

/**
 * Get a summary of today's health data
 */
export async function getTodaySummary(): Promise<{
  steps: number;
  calories: number;
  workouts: WorkoutData[];
}> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  
  const [steps, calories, workouts] = await Promise.all([
    getSteps(startOfDay, now),
    getActiveCalories(startOfDay, now),
    getWorkouts(startOfDay, now),
  ]);
  
  return { steps, calories, workouts };
}
