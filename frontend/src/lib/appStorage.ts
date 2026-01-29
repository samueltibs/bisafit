/**
 * App Storage Utilities
 * 
 * Provides Capacitor-safe storage abstraction.
 * Uses localStorage which works in both web and Capacitor WebView.
 * Does not rely on cookies for auth/session persistence.
 */

const STORAGE_PREFIX = 'bisafit_';

/**
 * Get a value from storage
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Failed to get storage item ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Set a value in storage
 */
export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set storage item ${key}:`, error);
  }
}

/**
 * Remove a value from storage
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch (error) {
    console.error(`Failed to remove storage item ${key}:`, error);
  }
}

/**
 * Clear all app storage
 */
export function clearAppStorage(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear app storage:', error);
  }
}

/**
 * Storage keys used in the app
 */
export const STORAGE_KEYS = {
  // Workout resume state
  WORKOUT_PROGRESS: 'workout_progress',
  LAST_WORKOUT_ID: 'last_workout_id',
  
  // User preferences (cached)
  PREFERRED_UNIT: 'preferred_unit',
  
  // Analytics
  ANALYTICS_QUEUE: 'analytics_queue',
  
  // Onboarding
  ONBOARDING_STEP: 'onboarding_step',
  
  // Version tracking
  LAST_SEEN_VERSION: 'last_seen_version',
} as const;
