import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, TrendingUp, ShoppingBag, Settings, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export function HeaderMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const menuItems = [
    { path: '/progress', icon: TrendingUp, labelKey: 'nav.progress' as const },
    { path: '/store', icon: ShoppingBag, labelKey: 'nav.store' as const },
    { path: '/settings', icon: Settings, labelKey: 'nav.settings' as const },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-9 w-9 rounded-full"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.path);
          
          return (
            <div key={item.path}>
              {index === menuItems.length - 1 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  "cursor-pointer gap-2",
                  isActive && "bg-accent text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{'labelKey' in item ? t(item.labelKey) : item.label}</span>
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
