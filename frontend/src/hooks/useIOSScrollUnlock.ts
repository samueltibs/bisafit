import { useEffect, useCallback } from 'react';

/**
 * Detects if current device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Clean up any modal/drawer scroll locks.
 * For app-shell scrolling, html/body stay locked - we just clean up modal artifacts.
 */
export function forceUnlockScroll() {
  document.body.removeAttribute('data-scroll-locked');
  document.body.style.pointerEvents = '';
}

/**
 * Force-reset for pages that need body scroll (like onboarding)
 * Call this when NOT using AppLayout
 */
export function forceUnlockBodyScroll() {
  document.documentElement.style.overflow = 'auto';
  document.documentElement.style.height = '100%';
  
  document.body.style.overflow = 'auto';
  document.body.style.height = '100%';
  document.body.removeAttribute('data-scroll-locked');
  document.body.style.pointerEvents = '';
}

/**
 * Hook to handle scroll cleanup on page mount.
 * Primarily cleans up any leftover modal scroll locks.
 * 
 * @param pageName - Name of the page for debug logging (optional)
 * @param useBodyScroll - If true, enables body scroll (for pages without AppLayout)
 */
export function useIOSScrollUnlock(pageName?: string, useBodyScroll = false) {
  const runUnlockSequence = useCallback(() => {
    if (useBodyScroll) {
      forceUnlockBodyScroll();
    } else {
      forceUnlockScroll();
    }
  }, [useBodyScroll]);

  useEffect(() => {
    // Run cleanup on mount
    runUnlockSequence();
    
    // Also run on visibility change (app coming back to foreground)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runUnlockSequence();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [runUnlockSequence]);

  return { forceUnlock: runUnlockSequence };
}
