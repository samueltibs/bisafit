import { ReactNode, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { TrialBanner } from '@/components/subscription/TrialBanner';
import { PageTransition } from '@/components/ui/page-transition';
import { usePageTracking, useSessionTracking } from '@/hooks/useAnalytics';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showNav?: boolean;
}

/**
 * Dev-only diagnostic for scroll debugging
 */
function logScrollDiagnostics(context: string, scrollContainerRef: React.RefObject<HTMLElement>) {
  if (!import.meta.env.DEV) return;
  
  const scrollEl = scrollContainerRef.current;
  const htmlStyle = window.getComputedStyle(document.documentElement);
  const bodyStyle = window.getComputedStyle(document.body);
  
  console.log(`[Scroll Debug: ${context}]`, {
    html: {
      overflow: htmlStyle.overflow,
      height: htmlStyle.height,
    },
    body: {
      overflow: bodyStyle.overflow,
      position: bodyStyle.position,
      height: bodyStyle.height,
    },
    mainContainer: scrollEl ? {
      overflowY: window.getComputedStyle(scrollEl).overflowY,
      height: window.getComputedStyle(scrollEl).height,
      scrollHeight: scrollEl.scrollHeight,
      clientHeight: scrollEl.clientHeight,
    } : 'not mounted',
  });
}

/**
 * AppLayout - Main authenticated app shell
 * 
 * SCROLLING STRATEGY (Option A: App-shell scrolling):
 * - html, body: height: 100%, overflow: hidden (set in CSS)
 * - Shell root: height: 100vh, display: flex, flex-direction: column, overflow: hidden
 * - Main content (<main>): flex: 1, overflow-y: auto (THE ONLY scroll container)
 * - Pages render inside <main> and should NOT create nested scroll containers
 * 
 * This prevents iOS Safari rubber-banding issues and scroll conflicts.
 */
export function AppLayout({ children, title = 'BisaFit', showNav = true }: AppLayoutProps) {
  const scrollContainerRef = useRef<HTMLElement>(null);
  const location = useLocation();
  
  // Track page views and session
  usePageTracking();
  useSessionTracking();

  // Route change diagnostic
  useEffect(() => {
    logScrollDiagnostics(`Route: ${location.pathname}`, scrollContainerRef);
    
    // Scroll to top on route change
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    
    // Clean up any lingering modal scroll locks
    document.body.removeAttribute('data-scroll-locked');
    document.body.style.pointerEvents = '';
  }, [location.pathname]);

  // Initial mount: ensure clean scroll state
  useEffect(() => {
    // Log initial state
    setTimeout(() => {
      logScrollDiagnostics('Initial mount', scrollContainerRef);
    }, 100);
  }, []);

  return (
    <>
      {/* 
        App shell container:
        - Fixed height (100vh) prevents body scroll
        - Flex column layout with header, main content, and bottom nav
        - Only <main> scrolls
      */}
      <div 
        className="flex flex-col bg-background"
        style={{ 
          height: '100dvh', // Dynamic viewport height for mobile browsers, falls back to 100vh
          overflow: 'hidden',
        }}
      >
        <TrialBanner />
        <Header title={title} />
        
        {/* Main scroll container - THE ONLY scrollable element in authenticated app */}
        <main 
          ref={scrollContainerRef}
          className="flex-1 pb-20"
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            minHeight: 0, // Critical: allows flex child to shrink and enable scrolling
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
