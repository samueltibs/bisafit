import { ReactNode, useEffect, useRef } from 'react';
import { forceUnlockBodyScroll, isIOS } from '@/hooks/useIOSScrollUnlock';

/**
 * Log diagnostic info for iOS scrolling debugging (dev mode only)
 */
function logScrollDiagnostics(containerRef: HTMLDivElement | null) {
  if (!import.meta.env.DEV) return;
  
  const htmlStyles = window.getComputedStyle(document.documentElement);
  const bodyStyles = window.getComputedStyle(document.body);
  
  console.log('[Onboarding iOS Scroll]', {
    html: {
      overflow: htmlStyles.overflow,
      height: htmlStyles.height,
    },
    body: {
      overflow: bodyStyles.overflow,
      position: bodyStyles.position,
      touchAction: bodyStyles.touchAction,
    },
    container: containerRef ? {
      overflow: window.getComputedStyle(containerRef).overflow,
      height: window.getComputedStyle(containerRef).height,
    } : 'not mounted',
  });
}

interface OnboardingScrollContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Scroll container for onboarding pages (before AppLayout is used).
 * Unlike authenticated pages, onboarding uses body scroll.
 */
export function OnboardingScrollContainer({ children, className = '' }: OnboardingScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Enable body scroll for onboarding (not using AppLayout)
    forceUnlockBodyScroll();

    // Log diagnostics on iOS
    if (isIOS() && import.meta.env.DEV) {
      const timeout = setTimeout(() => {
        logScrollDiagnostics(containerRef.current);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, []);

  // Re-run on visibility change (app coming back to foreground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        forceUnlockBodyScroll();
        
        if (isIOS() && import.meta.env.DEV) {
          logScrollDiagnostics(containerRef.current);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        minHeight: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        // Ensure pointer events are not blocked
        pointerEvents: 'auto',
      }}
    >
      {children}
    </div>
  );
}
