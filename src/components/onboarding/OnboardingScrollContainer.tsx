import { ReactNode, useEffect, useRef } from 'react';

/**
 * Detects if current device is iOS Safari/WebKit
 */
function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  return isIOS || isSafari;
}

/**
 * Log diagnostic info for iOS scrolling debugging (dev mode only)
 */
function logScrollDiagnostics(containerRef: HTMLDivElement | null) {
  if (!import.meta.env.DEV) return;
  
  const htmlStyles = window.getComputedStyle(document.documentElement);
  const bodyStyles = window.getComputedStyle(document.body);
  
  console.log('[iOS Scroll Diagnostics] html:', {
    overflow: htmlStyles.overflow,
    overflowY: htmlStyles.overflowY,
    height: htmlStyles.height,
    position: htmlStyles.position,
  });
  
  console.log('[iOS Scroll Diagnostics] body:', {
    overflow: bodyStyles.overflow,
    overflowY: bodyStyles.overflowY,
    height: bodyStyles.height,
    position: bodyStyles.position,
    touchAction: bodyStyles.touchAction,
  });
  
  if (containerRef) {
    const containerStyles = window.getComputedStyle(containerRef);
    console.log('[iOS Scroll Diagnostics] OnboardingScrollContainer:', {
      overflow: containerStyles.overflow,
      overflowY: containerStyles.overflowY,
      height: containerStyles.height,
      minHeight: containerStyles.minHeight,
      touchAction: containerStyles.touchAction,
      webkitOverflowScrolling: (containerStyles as any).webkitOverflowScrolling,
    });
  }
}

interface OnboardingScrollContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Single scroll container for iOS Safari compatibility.
 * This component ensures:
 * - Exactly ONE scroll container with proper iOS styles
 * - html/body are set to allow scrolling
 * - No nested scroll containers
 */
export function OnboardingScrollContainer({ children, className = '' }: OnboardingScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Force html/body to allow scrolling
    document.documentElement.style.height = '100%';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.overflowY = 'auto';
    
    document.body.style.height = '100%';
    document.body.style.overflow = 'auto';
    document.body.style.overflowY = 'auto';
    document.body.style.position = 'static';
    document.body.style.touchAction = 'auto';
    document.body.removeAttribute('data-scroll-locked');

    // Log diagnostics on iOS
    if (isIOSSafari()) {
      // Small delay to ensure styles are applied
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
        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'auto';
        document.body.style.position = 'static';
        
        if (isIOSSafari() && import.meta.env.DEV) {
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
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        // Ensure this is the scroll container
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  );
}
