import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to restore scroll behavior on route changes.
 * Ensures html/body don't get stuck with overflow:hidden or position:fixed
 * from modals/drawers that didn't clean up properly.
 */
export function useScrollRestore() {
  const location = useLocation();

  useEffect(() => {
    // On every route change, restore normal scroll behavior
    const restoreScroll = () => {
      document.documentElement.style.overflow = '';
      document.documentElement.style.position = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.height = '';
      
      // Remove any lingering Radix/Vaul data attributes that might affect scrolling
      document.body.removeAttribute('data-scroll-locked');
    };

    // Restore immediately on route change
    restoreScroll();

    // Also run on a small delay to catch any async cleanup issues
    const timeout = setTimeout(restoreScroll, 50);

    return () => {
      clearTimeout(timeout);
    };
  }, [location.pathname]);

  // Also restore on unmount (e.g., if navigating away from app entirely)
  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = '';
      document.documentElement.style.position = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.removeAttribute('data-scroll-locked');
    };
  }, []);
}

/**
 * Utility function to manually restore scroll - can be called after closing modals
 */
export function restoreBodyScroll() {
  document.documentElement.style.overflow = '';
  document.documentElement.style.position = '';
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  document.body.style.height = '';
  document.body.removeAttribute('data-scroll-locked');
}
