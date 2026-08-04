import { Platform } from 'react-native';

// Health Connect types - dynamically imported on Android only
let HealthConnect: any = null;

// Initialize Health Connect module only on Android
async function getHealthConnect() {
  if (Platform.OS !== 'android') {
    throw new Error('Health Connect is only available on Android');
  }
  
  if (!HealthConnect) {
    try {
      HealthConnect = await import('react-native-health-connect');
    } catch (error) {
      console.error('Failed to load Health Connect module:', error);
      throw new Error('Health Connect module not available');
    }
  }
  
  return HealthConnect;
}

export interface HealthConnectSample {
  startTime: string;
  endTime: string;
  value: number;
  unit?: string;
}

export interface WorkoutData {
  id: string;
  startTime: string;
  endTime: string;
  exerciseType: number;
  title?: string;
}

/**
 * Check if Health Connect is available
 */
export async function isHealthConnectAvailable(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  
  try {
    const hc = await getHealthConnect();
    const ready = await hc.initialize();
    return ready;
  } catch {
    return false;
  }
}

/**
 * Request Health Connect permissions
 */
export async function requestHealthConnectPermissions(): Promise<boolean> {
  const hc = await getHealthConnect();
  
  try {
    await hc.initialize();
    
    const permissions = [
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'ExerciseSession' },
      { accessType: 'write', recordType: 'Steps' },
      { accessType: 'write', recordType: 'HeartRate' },
      { accessType: 'write', recordType: 'ExerciseSession' },
    ];
    
    await hc.requestPermission(permissions);
    return true;
  } catch (error) {
    console.error('Health Connect permission error:', error);
    throw error;
  }
}

/**
 * Get aggregated steps for a date range
 */
export async function getSteps(startDate: Date, endDate: Date): Promise<number> {
  const hc = await getHealthConnect();
  
  try {
    const result = await hc.aggregateRecord({
      recordType: 'Steps',
      timeRangeFilter: {
        operator: 'between',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });
    
    return result.COUNT_TOTAL ?? 0;
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
): Promise<HealthConnectSample[]> {
  const hc = await getHealthConnect();
  
  try {
    const result = await hc.readRecords('HeartRate', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });
    
    // Flatten samples from all records
    const samples: HealthConnectSample[] = [];
    for (const record of result.records || []) {
      for (const sample of record.samples || []) {
        samples.push({
          startTime: sample.time,
          endTime: sample.time,
          value: sample.beatsPerMinute,
          unit: 'bpm',
        });
      }
    }
    
    return samples.slice(0, limit);
  } catch (error) {
    console.error('Error reading heart rate:', error);
    return [];
  }
}

/**
 * Get exercise sessions for a date range
 */
export async function getWorkouts(
  startDate: Date,
  endDate: Date,
  limit: number = 50
): Promise<WorkoutData[]> {
  const hc = await getHealthConnect();
  
  try {
    const result = await hc.readRecords('ExerciseSession', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });
    
    return (result.records || []).slice(0, limit).map((session: any) => ({
      id: session.metadata?.id || session.metadata?.clientRecordId || `workout-${session.startTime}`,
      startTime: session.startTime,
      endTime: session.endTime,
      exerciseType: session.exerciseType,
      title: session.title,
    }));
  } catch (error) {
    console.error('Error reading workouts:', error);
    return [];
  }
}

/**
 * Save a workout to Health Connect
 */
export async function saveWorkout(workout: {
  startTime: Date;
  endTime: Date;
  exerciseType: number; // 8 = Running, 79 = Walking, etc.
  title?: string;
}): Promise<boolean> {
  const hc = await getHealthConnect();
  
  try {
    const clientRecordId = `bisafit-workout-${workout.startTime.getTime()}`;
    
    await hc.insertRecords([{
      recordType: 'ExerciseSession',
      startTime: workout.startTime.toISOString(),
      endTime: workout.endTime.toISOString(),
      exerciseType: workout.exerciseType,
      title: workout.title || 'BisaFit Workout',
      metadata: { clientRecordId },
    }]);
    
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
  heartRate: HealthConnectSample[];
  workouts: WorkoutData[];
}> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  
  const [steps, heartRate, workouts] = await Promise.all([
    getSteps(startOfDay, now),
    getHeartRateSamples(startOfDay, now, 50),
    getWorkouts(startOfDay, now),
  ]);
  
  return { steps, heartRate, workouts };
}

// Exercise type constants for Health Connect
export const ExerciseTypes = {
  BADMINTON: 2,
  BASEBALL: 4,
  BASKETBALL: 5,
  BIKING: 8,
  BOXING: 10,
  CALISTHENICS: 14,
  CRICKET: 15,
  DANCING: 17,
  ELLIPTICAL: 25,
  EXERCISE_CLASS: 26,
  FENCING: 27,
  FOOTBALL: 29,
  GOLF: 32,
  GYMNASTICS: 34,
  HANDBALL: 35,
  HIKING: 37,
  ICE_HOCKEY: 38,
  ICE_SKATING: 39,
  MARTIAL_ARTS: 44,
  PADDLING: 46,
  PILATES: 48,
  RACQUETBALL: 50,
  ROCK_CLIMBING: 51,
  ROLLER_HOCKEY: 52,
  ROWING: 53,
  RUGBY: 54,
  RUNNING: 56,
  RUNNING_TREADMILL: 57,
  SAILING: 58,
  SKATING: 60,
  SKIING: 61,
  SNOWBOARDING: 62,
  SOCCER: 64,
  SOFTBALL: 65,
  SQUASH: 66,
  STAIR_CLIMBING: 68,
  STAIR_CLIMBING_MACHINE: 69,
  STRENGTH_TRAINING: 70,
  STRETCHING: 71,
  SURFING: 72,
  SWIMMING: 74,
  TABLE_TENNIS: 76,
  TENNIS: 78,
  VOLLEYBALL: 80,
  WALKING: 79,
  WATER_POLO: 81,
  WEIGHTLIFTING: 82,
  WHEELCHAIR: 83,
  YOGA: 84,
  OTHER: 0,
};
