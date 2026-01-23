import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showNav?: boolean;
}

export function AppLayout({ children, title = 'BisaFit', showNav = true }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header title={title} />
      <main className="flex-1 pb-20">
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
