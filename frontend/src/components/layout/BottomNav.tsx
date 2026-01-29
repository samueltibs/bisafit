import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Dumbbell, Apple } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation, type TranslationKey } from '@/lib/i18n';

// Optimized for mobile: Only 4 primary tabs
// Progress, Store, and Settings moved to top-right menu
const navItems: { path: string; icon: typeof Home; labelKey: TranslationKey }[] = [
  { path: '/home', icon: Home, labelKey: 'nav.home' },
  { path: '/plan', icon: Calendar, labelKey: 'nav.plan' },
  { path: '/nutrition', icon: Apple, labelKey: 'nav.nutrition' },
  { path: '/workout/today', icon: Dumbbell, labelKey: 'nav.workout' },
];

export function BottomNav() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/90 safe-bottom">
      <div className="container flex h-16 items-center justify-around px-2">
        {navItems.map(({ path, icon: Icon, labelKey }) => {
          const isActive = location.pathname.startsWith(path.split('/')[1] ? `/${path.split('/')[1]}` : path);
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 transition-all duration-200 rounded-xl flex-1",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2 : 1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <span className={cn(
                "text-[10px] font-medium transition-all duration-200",
                isActive && "font-semibold"
              )}>
                {t(labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
