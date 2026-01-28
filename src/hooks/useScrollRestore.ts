import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to restore scroll behavior on route changes.
 * Ensures html/body don't get stuck with overflow:hidden or position:fixed
 * from modals/drawers that didn't clean up properly.
 * 
 * Uses overflow: visible (not auto) for iOS Safari compatibility.
 */
export function useScrollRestore() {
  const location = useLocation();

  useEffect(() => {
    // On every route change, restore normal scroll behavior
    const restoreScroll = () => {
      // Reset html element
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.position = '';
      document.documentElement.style.height = '';
      document.documentElement.style.touchAction = 'auto';
      
      // Reset body element - use 'auto' for scroll restoration
      document.body.style.overflow = 'auto';
      document.body.style.overflowY = '';
      document.body.style.overflowX = '';
      document.body.style.position = 'static';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = 'auto';
      document.body.style.height = 'auto';
      document.body.style.touchAction = 'auto';
      
      // Remove any lingering Radix/Vaul data attributes that might affect scrolling
      document.body.removeAttribute('data-scroll-locked');
      document.body.style.pointerEvents = '';
    };

    // Restore immediately on route change
    restoreScroll();

    // Also run on a small delay to catch any async cleanup issues
    const timeout = setTimeout(restoreScroll, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, [location.pathname]);

  // Also restore on unmount
  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.position = '';
      document.documentElement.style.touchAction = 'auto';
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
      document.body.style.touchAction = 'auto';
      document.body.removeAttribute('data-scroll-locked');
      document.body.style.pointerEvents = '';
    };
  }, []);
}

/**
 * Utility function to manually restore scroll - can be called after closing modals
 */
export function restoreBodyScroll() {
  // Small delay to let modal animation complete
  requestAnimationFrame(() => {
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.position = '';
    document.documentElement.style.height = '';
    document.documentElement.style.touchAction = 'auto';
    
    document.body.style.overflow = 'auto';
    document.body.style.overflowY = '';
    document.body.style.overflowX = '';
    document.body.style.position = 'static';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = 'auto';
    document.body.style.height = 'auto';
    document.body.style.touchAction = 'auto';
    document.body.removeAttribute('data-scroll-locked');
    document.body.style.pointerEvents = '';
  });
}
