/**
 * Analytics Hook
 * 
 * Provides easy access to analytics tracking in React components.
 * Automatically tracks page views when the route changes.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, startSession, endSession, trackFeatureUsage } from '@/lib/analytics';

/**
 * Hook to automatically track page views on route changes
 * Add this to your main App component or AppLayout
 */
export function usePageTracking() {
  const location = useLocation();
  const previousPath = useRef<string>('');

  useEffect(() => {
    // Extract page name from path
    const pageName = location.pathname === '/' 
      ? 'index' 
      : location.pathname.replace(/^\//, '').replace(/\//g, '_');
    
    // Track the page view
    trackPageView(pageName, previousPath.current || undefined);
    
    // Update previous path for next navigation
    previousPath.current = pageName;
  }, [location.pathname]);
}

/**
 * Hook to track session duration
 * Add this to your main App component
 */
export function useSessionTracking() {
  useEffect(() => {
    // Start session when component mounts
    startSession();
    
    // End session when component unmounts or page closes
    const handleBeforeUnload = () => {
      endSession();
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        endSession();
      } else if (document.visibilityState === 'visible') {
        startSession();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      endSession();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}

/**
 * Hook to track a specific feature usage
 * Returns a function to call when the feature is used
 */
export function useFeatureTracking(featureName: string) {
  return (additionalProps?: Record<string, string | number | boolean>) => {
    trackFeatureUsage(featureName, additionalProps);
  };
}
