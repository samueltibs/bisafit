import { Platform } from 'react-native';
import * as HealthKit from './healthKit';
import * as HealthConnect from './healthConnect';

export interface HealthData {
  steps: number;
  calories?: number;
  heartRate?: { time: string; value: number }[];
  workouts: {
    id: string;
    startTime: string;
    endTime: string;
    type: string;
    duration?: number;
    distance?: number;
    calories?: number;
  }[];
}

/**
 * Check if health tracking is available on this device
 */
export async function isHealthAvailable(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return HealthKit.isHealthKitAvailable();
  } else if (Platform.OS === 'android') {
    return HealthConnect.isHealthConnectAvailable();
  }
  return false;
}

/**
 * Request health tracking permissions
 */
export async function requestHealthPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return HealthKit.requestHealthKitPermissions();
  } else if (Platform.OS === 'android') {
    return HealthConnect.requestHealthConnectPermissions();
  }
  throw new Error('Health tracking not available on this platform');
}

/**
 * Get health data for a date range
 */
export async function getHealthData(startDate: Date, endDate: Date): Promise<HealthData> {
  if (Platform.OS === 'ios') {
    const [steps, calories, heartRateSamples, workouts] = await Promise.all([
      HealthKit.getSteps(startDate, endDate),
      HealthKit.getActiveCalories(startDate, endDate),
      HealthKit.getHeartRateSamples(startDate, endDate, 100),
      HealthKit.getWorkouts(startDate, endDate),
    ]);
    
    return {
      steps,
      calories,
      heartRate: heartRateSamples.map(s => ({
        time: s.startDate,
        value: s.value,
      })),
      workouts: workouts.map(w => ({
        id: w.id,
        startTime: w.startDate,
        endTime: w.endDate,
        type: w.activityType,
        duration: w.duration,
        distance: w.distance,
        calories: w.calories,
      })),
    };
  } else if (Platform.OS === 'android') {
    const [steps, heartRateSamples, workouts] = await Promise.all([
      HealthConnect.getSteps(startDate, endDate),
      HealthConnect.getHeartRateSamples(startDate, endDate, 100),
      HealthConnect.getWorkouts(startDate, endDate),
    ]);
    
    return {
      steps,
      heartRate: heartRateSamples.map(s => ({
        time: s.startTime,
        value: s.value,
      })),
      workouts: workouts.map(w => ({
        id: w.id,
        startTime: w.startTime,
        endTime: w.endTime,
        type: String(w.exerciseType),
        duration: undefined,
        distance: undefined,
        calories: undefined,
      })),
    };
  }
  
  return { steps: 0, workouts: [] };
}

/**
 * Get today's health summary
 */
export async function getTodayHealthSummary(): Promise<HealthData> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  
  return getHealthData(startOfDay, now);
}

/**
 * Save a workout to the health platform
 */
export async function saveWorkoutToHealth(workout: {
  startTime: Date;
  endTime: Date;
  type: string;
  duration: number; // seconds
  distance?: number; // meters
  calories?: number; // kcal
}): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return HealthKit.saveWorkout({
      startDate: workout.startTime,
      endDate: workout.endTime,
      activityType: workout.type,
      duration: workout.duration,
      distance: workout.distance,
      calories: workout.calories,
    });
  } else if (Platform.OS === 'android') {
    // Map common activity types to Health Connect exercise types
    const exerciseTypeMap: Record<string, number> = {
      running: HealthConnect.ExerciseTypes.RUNNING,
      walking: HealthConnect.ExerciseTypes.WALKING,
      cycling: HealthConnect.ExerciseTypes.BIKING,
      swimming: HealthConnect.ExerciseTypes.SWIMMING,
      yoga: HealthConnect.ExerciseTypes.YOGA,
      strength: HealthConnect.ExerciseTypes.STRENGTH_TRAINING,
      hiit: HealthConnect.ExerciseTypes.EXERCISE_CLASS,
    };
    
    return HealthConnect.saveWorkout({
      startTime: workout.startTime,
      endTime: workout.endTime,
      exerciseType: exerciseTypeMap[workout.type.toLowerCase()] || HealthConnect.ExerciseTypes.OTHER,
      title: `BisaFit ${workout.type} Workout`,
    });
  }
  
  throw new Error('Health tracking not available on this platform');
}

/**
 * Get the platform-specific health app name
 */
export function getHealthAppName(): string {
  if (Platform.OS === 'ios') {
    return 'Apple Health';
  } else if (Platform.OS === 'android') {
    return 'Health Connect';
  }
  return 'Health App';
}
