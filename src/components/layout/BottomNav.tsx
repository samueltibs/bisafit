import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Dumbbell, Apple, TrendingUp, ShoppingBag, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/plan', icon: Calendar, label: 'Plan' },
  { path: '/workout/today', icon: Dumbbell, label: 'Workout' },
  { path: '/nutrition', icon: Apple, label: 'Nutrition' },
  { path: '/progress', icon: TrendingUp, label: 'Progress' },
  { path: '/store', icon: ShoppingBag, label: 'Store' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 safe-bottom">
      <div className="container flex h-16 items-center justify-around px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(path.split('/')[1] ? `/${path.split('/')[1]}` : path);
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "animate-scale-in")} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
