import { ReactNode } from 'react';
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

export function AppLayout({ children, title = 'BisaFit', showNav = true }: AppLayoutProps) {
  // Restore scroll behavior on route changes
  useScrollRestore();
  
  // iOS scroll unlock with 1500ms failsafe
  useIOSScrollUnlock('AppLayout');

  return (
    <>
      {/* 
        Single scroll container for iOS Safari compatibility.
        - No nested overflow containers
        - min-h-screen ensures full viewport
        - overflow-y-auto on this root div only
        - -webkit-overflow-scrolling: touch for momentum scrolling
      */}
      <div 
        className="min-h-screen bg-background flex flex-col"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <TrialBanner />
        <Header title={title} />
        <main className="flex-1 pb-20">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        {showNav && <BottomNav />}
      </div>
    </>
  );
}
