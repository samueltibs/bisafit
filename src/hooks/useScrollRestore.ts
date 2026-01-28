import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to handle cleanup after modal/drawer closes.
 * For app-shell scrolling, we just need to clean up any modal-related attributes.
 */
export function useScrollRestore() {
  const location = useLocation();

  useEffect(() => {
    // On route change, clean up any lingering modal attributes
    document.body.removeAttribute('data-scroll-locked');
    document.body.style.pointerEvents = '';
  }, [location.pathname]);
}

/**
 * Utility function to manually restore scroll - called after closing modals.
 * Cleans up any modal-related scroll locks.
 */
export function restoreBodyScroll() {
  requestAnimationFrame(() => {
    document.body.removeAttribute('data-scroll-locked');
    document.body.style.pointerEvents = '';
  });
}
