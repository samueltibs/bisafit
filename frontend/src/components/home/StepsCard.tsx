/**
 * Steps Display Card
 * 
 * Shows step count with source indicator (Apple Health sync indicator when connected).
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Footprints, Watch } from 'lucide-react';
import { useAppleHealth } from '@/hooks/useAppleHealth';
import { cn } from '@/lib/utils';

interface StepsCardProps {
  steps: number;
  target: number;
  className?: string;
}

export function StepsCard({ steps, target, className }: StepsCardProps) {
  const { connectionState, todaySteps } = useAppleHealth();
  
  // Use synced steps if available, otherwise use provided steps
  const displaySteps = connectionState === 'connected' && todaySteps !== null 
    ? todaySteps 
    : steps;
  
  const isFromAppleHealth = connectionState === 'connected' && todaySteps !== null;
  const percentage = Math.min(100, (displaySteps / target) * 100);

  return (
    <Card className={cn("border-border relative", className)}>
      <CardContent className="p-4 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full icon-bg-steps">
          <Footprints className="h-5 w-5 icon-steps" />
        </div>
        <p className="text-lg font-bold tabular-nums">{(displaySteps / 1000).toFixed(1)}k</p>
        <p className="text-xs text-muted-foreground">/ {target / 1000}k steps</p>
        
        {isFromAppleHealth && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 text-[10px] px-1.5 py-0 h-4 gap-0.5"
          >
            <Watch className="h-2.5 w-2.5" />
            Synced
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export default StepsCard;
