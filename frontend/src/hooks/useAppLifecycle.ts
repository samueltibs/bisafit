/**
 * App Lifecycle Hook
 * 
 * Handles app lifecycle events for Capacitor native apps.
 * Provides callbacks for app resume (foreground) and pause (background).
 */

import { useEffect, useCallback, useRef } from 'react';
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
  const listenerRef = useRef<any>(null);

  const handleStateChange = useCallback((state: { isActive: boolean }) => {
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

    // Set up Capacitor App listener using dynamic import
    const setupListener = async () => {
      try {
        const { App } = await import('@capacitor/app');
        listenerRef.current = await App.addListener('appStateChange', handleStateChange);
      } catch (err) {
        console.warn('[AppLifecycle] Failed to set up native listener:', err);
      }
    };

    setupListener();

    return () => {
      if (listenerRef.current) {
        listenerRef.current.remove?.();
      }
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
