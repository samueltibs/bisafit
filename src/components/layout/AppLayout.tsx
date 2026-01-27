import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { TrialBanner } from '@/components/subscription/TrialBanner';
import { PageTransition } from '@/components/ui/page-transition';
import { useScrollRestore } from '@/hooks/useScrollRestore';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showNav?: boolean;
}

export function AppLayout({ children, title = 'BisaFit', showNav = true }: AppLayoutProps) {
  // Restore scroll behavior on route changes
  useScrollRestore();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TrialBanner />
      <Header title={title} />
      <main className="flex-1 pb-20 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
