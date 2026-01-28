import { ReactNode, useRef, useEffect } from 'react';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { TrialBanner } from '@/components/subscription/TrialBanner';
import { PageTransition } from '@/components/ui/page-transition';
import { useScrollRestore } from '@/hooks/useScrollRestore';
import { useIOSScrollUnlock } from '@/hooks/useIOSScrollUnlock';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showNav?: boolean;
}

/**
 * AppLayout - Main authenticated app shell with iOS Safari scroll fix
 * 
 * Layout structure:
 * - Shell root: height: 100vh, overflow: hidden (prevents body scroll)
 * - Main content area: flex: 1, overflow-y: auto (THE scroll container)
 * - Fixed header (sticky) and fixed bottom nav
 */
export function AppLayout({ children, title = 'BisaFit', showNav = true }: AppLayoutProps) {
  const scrollContainerRef = useRef<HTMLElement>(null);
  
  // Restore scroll behavior on route changes
  useScrollRestore();
  
  // iOS scroll unlock with 1500ms failsafe
  const { forceUnlock } = useIOSScrollUnlock('AppLayout');

  // On mount, ensure html/body don't interfere with scroll
  useEffect(() => {
    // Set html/body to fixed dimensions, no scroll
    document.documentElement.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = '0';
    document.body.style.left = '0';

    // Dev diagnostic for iOS
    if (import.meta.env.DEV) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIOS) {
        setTimeout(() => {
          const scrollEl = scrollContainerRef.current;
          console.log('[AppLayout iOS Debug]', {
            html: {
              overflow: getComputedStyle(document.documentElement).overflow,
              height: getComputedStyle(document.documentElement).height,
            },
            body: {
              overflow: getComputedStyle(document.body).overflow,
              position: getComputedStyle(document.body).position,
              height: getComputedStyle(document.body).height,
            },
            scrollContainer: scrollEl ? {
              overflow: getComputedStyle(scrollEl).overflow,
              overflowY: getComputedStyle(scrollEl).overflowY,
              height: getComputedStyle(scrollEl).height,
              touchAction: getComputedStyle(scrollEl).touchAction,
            } : 'not mounted',
          });
        }, 500);
      }
    }

    return () => {
      // Cleanup: reset body styles (for modals/other pages)
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.left = '';
    };
  }, []);

  return (
    <>
      {/* 
        iOS Safari scroll fix:
        - Shell root: height 100vh, overflow hidden
        - Scroll happens ONLY in <main> with overflow-y: auto
        - Header is sticky (scrolls with content initially, then sticks)
        - BottomNav is fixed at bottom
      */}
      <div 
        className="h-screen bg-background flex flex-col"
        style={{ 
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <TrialBanner />
        <Header title={title} />
        
        {/* Main scroll container - THE ONLY scrollable element */}
        <main 
          ref={scrollContainerRef}
          className="flex-1 pb-20"
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            // Ensure it fills available space
            minHeight: 0, // Important for flex children to scroll properly
          }}
        >
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        
        {showNav && <BottomNav />}
      </div>
    </>
  );
}
