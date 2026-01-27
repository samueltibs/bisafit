/**
 * App Lifecycle Hook
 * 
 * Handles app lifecycle events for Capacitor native apps.
 * Provides callbacks for app resume (foreground) and pause (background).
 */

import { useEffect, useCallback } from 'react';
import { App, type AppState } from '@capacitor/app';
import { isNativePlatform } from '@/hooks/usePlatform';

interface AppLifecycleOptions {
  onResume?: () => void;
  onPause?: () => void;
}

/**
 * Hook to handle app lifecycle events
 * 
 * @param options - Callbacks for resume and pause events
 */
export function useAppLifecycle(options: AppLifecycleOptions = {}) {
  const { onResume, onPause } = options;

  const handleStateChange = useCallback((state: AppState) => {
    if (state.isActive) {
      onResume?.();
    } else {
      onPause?.();
    }
  }, [onResume, onPause]);

  useEffect(() => {
    // Only set up listeners on native platforms
    if (!isNativePlatform()) {
      // On web, use visibility change API as fallback
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          onResume?.();
        } else {
          onPause?.();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    // Set up Capacitor App listener
    const listener = App.addListener('appStateChange', handleStateChange);

    return () => {
      listener.then(l => l.remove());
    };
  }, [handleStateChange, onResume, onPause]);
}

/**
 * Hook specifically for refreshing data on app resume
 * 
 * @param refreshCallback - Function to call when app resumes
 */
export function useRefreshOnResume(refreshCallback: () => void) {
  useAppLifecycle({
    onResume: refreshCallback,
  });
}
