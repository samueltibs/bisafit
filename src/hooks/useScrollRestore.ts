import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { forceUnlockScroll } from './useIOSScrollUnlock';

/**
 * Hook to restore scroll behavior on route changes.
 * For authenticated app (AppLayout): cleans up modal/drawer scroll locks.
 * The scroll container is AppLayout's <main>, not body.
 */
export function useScrollRestore() {
  const location = useLocation();

  useEffect(() => {
    // On every route change, clean up any modal scroll locks
    forceUnlockScroll();

    // Also run on a small delay to catch any async cleanup issues
    const timeout = setTimeout(forceUnlockScroll, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, [location.pathname]);
}

/**
 * Utility function to manually restore scroll - called after closing modals.
 * For authenticated app, this just cleans up modal locks (scroll is in AppLayout).
 */
export function restoreBodyScroll() {
  // Small delay to let modal animation complete
  requestAnimationFrame(() => {
    forceUnlockScroll();
  });
}
