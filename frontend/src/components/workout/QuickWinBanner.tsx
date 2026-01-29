/**
 * Quick Win Banner Component
 * Shows a suggestion for a shorter workout when user might be short on time
 */

import { Zap, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getQuickWinLabel } from '@/lib/quickWinWorkout';
import { cn } from '@/lib/utils';

interface QuickWinBannerProps {
  originalDuration: number;
  quickWinDuration?: number;
  onStartQuickWin: () => void;
  className?: string;
}

export function QuickWinBanner({
  originalDuration,
  quickWinDuration = 15,
  onStartQuickWin,
  className,
}: QuickWinBannerProps) {
  const timeSaved = originalDuration - quickWinDuration;

  return (
    <Card 
      className={cn(
        "border-accent/30 bg-gradient-to-r from-accent/10 to-primary/10",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
            <Zap className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">
              Short on time?
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{getQuickWinLabel(quickWinDuration)}</span>
              <span className="text-accent">• Save {timeSaved} min</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0"
            onClick={onStartQuickWin}
          >
            Quick Win
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
