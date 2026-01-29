/**
 * Trial Banner Component
 * 
 * Shows remaining trial days as a subtle banner.
 */

import { Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

interface TrialBannerProps {
  className?: string;
}

export function TrialBanner({ className }: TrialBannerProps) {
  const { status, daysLeftInTrial } = useSubscription();

  if (status !== 'trialing' || daysLeftInTrial === null) {
    return null;
  }

  const isUrgent = daysLeftInTrial <= 2;
  const dayText = daysLeftInTrial === 1 ? 'day' : 'days';

  return (
    <div 
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 text-sm",
        isUrgent 
          ? "bg-destructive/10 text-destructive" 
          : "bg-primary/10 text-primary",
        className
      )}
    >
      <Crown className="h-4 w-4" />
      <span>
        {daysLeftInTrial === 0 
          ? "Trial ends today!" 
          : `${daysLeftInTrial} ${dayText} left in your trial`
        }
      </span>
    </div>
  );
}
