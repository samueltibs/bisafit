import { useEffect, useRef, useCallback } from 'react';

/**
 * Detects if current device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Force-reset scroll-lock styles for authenticated app layout.
 * In the authenticated app, html/body should be locked and scroll
 * happens in AppLayout's main container. This cleans up any leftover
 * modal/drawer scroll locks.
 */
export function forceUnlockScroll() {
  // For authenticated app: html/body stay locked, 
  // we just clean up modal-related locks
  document.documentElement.style.touchAction = 'manipulation';
  document.body.style.touchAction = 'manipulation';
  
  // Remove any Radix/Vaul data attributes that might affect scrolling
  document.body.removeAttribute('data-scroll-locked');
  document.body.style.pointerEvents = '';
  
  // Ensure body isn't stuck in fixed position from modals
  // (AppLayout will set position: fixed, but modals might have changed it)
  if (document.body.style.top && document.body.style.top !== '0px') {
    document.body.style.top = '0';
  }
}

/**
 * Force-reset for pages that need body scroll (like onboarding)
 * Call this when NOT using AppLayout
 */
export function forceUnlockBodyScroll() {
  document.documentElement.style.overflow = 'auto';
  document.documentElement.style.position = '';
  document.documentElement.style.height = '100%';
  document.documentElement.style.touchAction = 'auto';
  
  document.body.style.overflow = 'auto';
  document.body.style.overflowY = 'auto';
  document.body.style.position = 'static';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.width = 'auto';
  document.body.style.height = '100%';
  document.body.style.touchAction = 'auto';
  
  document.body.removeAttribute('data-scroll-locked');
  document.body.style.pointerEvents = '';
}

/**
 * Remove any invisible overlay blockers that might be blocking touch
 */
export function removeInvisibleOverlays() {
  // Find all fixed/absolute elements covering the viewport
  const potentialBlockers = document.querySelectorAll('[style*="position: fixed"], [style*="position: absolute"]');
  
  potentialBlockers.forEach((el) => {
    const element = el as HTMLElement;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    // Check if it's a full-screen overlay
    const isFullScreen = 
      rect.width >= window.innerWidth * 0.9 && 
      rect.height >= window.innerHeight * 0.9;
    
    // Check if it's invisible (opacity 0 or visibility hidden)
    const isInvisible = 
      style.opacity === '0' || 
      style.visibility === 'hidden' ||
      (style.backgroundColor === 'transparent' && !element.textContent?.trim());
    
    // Check if it has pointer-events that could block
    const hasBlockingPointerEvents = style.pointerEvents !== 'none';
    
    if (isFullScreen && isInvisible && hasBlockingPointerEvents) {
      if (import.meta.env.DEV) {
        console.warn('[iOS Scroll Unlock] Removing invisible overlay blocker:', {
          element: element.tagName,
          className: element.className,
          id: element.id,
        });
      }
      // Set pointer-events to none rather than removing the element
      element.style.pointerEvents = 'none';
    }
  });
  
  // Also check for Radix portals that might be stuck
  const radixPortals = document.querySelectorAll('[data-radix-portal]');
  radixPortals.forEach((portal) => {
    const portalEl = portal as HTMLElement;
    const overlays = portalEl.querySelectorAll('[data-state="closed"]');
    overlays.forEach((overlay) => {
      const overlayEl = overlay as HTMLElement;
      overlayEl.style.pointerEvents = 'none';
    });
  });
}

/**
 * Get current computed styles for debugging
 */
function getScrollDebugInfo() {
  return {
    html: {
      overflow: window.getComputedStyle(document.documentElement).overflow,
      position: window.getComputedStyle(document.documentElement).position,
      touchAction: window.getComputedStyle(document.documentElement).touchAction,
    },
    body: {
      overflow: window.getComputedStyle(document.body).overflow,
      position: window.getComputedStyle(document.body).position,
      touchAction: window.getComputedStyle(document.body).touchAction,
      pointerEvents: window.getComputedStyle(document.body).pointerEvents,
      dataScrollLocked: document.body.getAttribute('data-scroll-locked'),
    },
  };
}

/**
 * Hook to handle iOS scroll unlock on page mount and route changes.
 * For authenticated app (AppLayout): cleans up modal scroll locks.
 * Includes a failsafe that re-runs unlock logic if scrolling fails within 1500ms.
 * 
 * @param pageName - Name of the page for debug logging
 * @param useBodyScroll - If true, enables body scroll (for pages without AppLayout)
 */
export function useIOSScrollUnlock(pageName?: string, useBodyScroll = false) {
  const scrollCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasScrolledRef = useRef(false);

  const runUnlockSequence = useCallback(() => {
    if (useBodyScroll) {
      forceUnlockBodyScroll();
    } else {
      forceUnlockScroll();
    }
    removeInvisibleOverlays();
  }, [useBodyScroll]);

  // Track if user has scrolled/tapped
  const markScrollSuccess = useCallback(() => {
    hasScrolledRef.current = true;
    if (scrollCheckTimeoutRef.current) {
      clearTimeout(scrollCheckTimeoutRef.current);
      scrollCheckTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Run unlock immediately on mount
    runUnlockSequence();

    // Run again after a short delay to catch async issues
    const immediateTimeout = setTimeout(runUnlockSequence, 50);
    const delayedTimeout = setTimeout(runUnlockSequence, 200);

    // iOS failsafe: check if user can interact within 1500ms
    if (isIOS()) {
      hasScrolledRef.current = false;

      // Add listeners to detect successful interaction
      const handleInteraction = () => markScrollSuccess();
      
      document.addEventListener('touchstart', handleInteraction, { passive: true, once: true });
      document.addEventListener('touchmove', handleInteraction, { passive: true, once: true });
      document.addEventListener('scroll', handleInteraction, { passive: true, once: true });

      // Failsafe timeout
      scrollCheckTimeoutRef.current = setTimeout(() => {
        if (!hasScrolledRef.current) {
          const debugInfo = getScrollDebugInfo();
          
          if (import.meta.env.DEV) {
            console.warn(`[iOS Scroll Unlock] Failsafe triggered for ${pageName || 'unknown page'}`, debugInfo);
          }

          // Re-run unlock sequence
          runUnlockSequence();
          
          // Force a layout recalculation
          document.body.offsetHeight;
          
          // Remove any lingering overlays more aggressively
          const allFixed = document.querySelectorAll('*');
          allFixed.forEach((el) => {
            const element = el as HTMLElement;
            const style = window.getComputedStyle(element);
            if (style.position === 'fixed' && style.zIndex !== 'auto') {
              const zIndex = parseInt(style.zIndex, 10);
              // Only touch high z-index overlays that aren't navigation
              if (zIndex > 40 && !element.closest('nav') && !element.closest('[role="navigation"]')) {
                const rect = element.getBoundingClientRect();
                if (rect.width >= window.innerWidth * 0.8 && rect.height >= window.innerHeight * 0.5) {
                  if (style.opacity === '0' || !element.textContent?.trim()) {
                    element.style.display = 'none';
                  }
                }
              }
            }
          });
        }
      }, 1500);

      return () => {
        clearTimeout(immediateTimeout);
        clearTimeout(delayedTimeout);
        if (scrollCheckTimeoutRef.current) {
          clearTimeout(scrollCheckTimeoutRef.current);
        }
        document.removeEventListener('touchstart', handleInteraction);
        document.removeEventListener('touchmove', handleInteraction);
        document.removeEventListener('scroll', handleInteraction);
      };
    }

    return () => {
      clearTimeout(immediateTimeout);
      clearTimeout(delayedTimeout);
    };
  }, [runUnlockSequence, markScrollSuccess, pageName]);

  // Also run on visibility change (app coming back to foreground)
  useEffect(() => {
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
