/**
 * Streak Save Badge Component
 * Shows when a workout qualifies for streak protection
 */

import { Shield, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StreakSaveBadgeProps {
  currentStreak: number;
  isQuickWin?: boolean;
  className?: string;
}

export function StreakSaveBadge({
  currentStreak,
  isQuickWin = false,
  className,
}: StreakSaveBadgeProps) {
  if (currentStreak <= 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Streak badge */}
      <Badge 
        variant="secondary" 
        className="bg-accent/10 text-accent border-accent/20 gap-1"
      >
        <Flame className="h-3 w-3" />
        {currentStreak}-day streak
      </Badge>

      {/* Streak save indicator */}
      {isQuickWin && (
        <Badge 
          variant="outline" 
          className="bg-primary/10 text-primary border-primary/20 gap-1"
        >
          <Shield className="h-3 w-3" />
          Streak saved
        </Badge>
      )}
    </div>
  );
}

/**
 * Compact version for use in headers
 */
export function StreakBadgeCompact({ 
  streak, 
  className 
}: { 
  streak: number; 
  className?: string; 
}) {
  if (streak <= 0) return null;

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium text-accent",
        className
      )}
    >
      <Flame className="h-4 w-4" />
      {streak}
    </span>
  );
}
