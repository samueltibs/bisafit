import { ChevronDown, Check, History, Play, CheckCircle, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PlanSummary, PlanStatus } from '@/hooks/usePlan';
import { format } from 'date-fns';

interface BlockSelectorProps {
  plans: PlanSummary[];
  selectedPlanId: string | null;
  onSelectPlan: (planId: string) => void;
  disabled?: boolean;
}

const statusLabels: Record<PlanStatus, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'outline' }> = {
  in_progress: { label: 'Current', icon: <Play className="h-3 w-3" />, variant: 'default' },
  queued: { label: 'Queued', icon: <Clock className="h-3 w-3" />, variant: 'outline' },
  completed: { label: 'Completed', icon: <CheckCircle className="h-3 w-3" />, variant: 'secondary' },
};

export function BlockSelector({
  plans,
  selectedPlanId,
  onSelectPlan,
  disabled,
}: BlockSelectorProps) {
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  if (plans.length <= 1) {
    // Single plan - show simple label
    const status = selectedPlan?.status || 'in_progress';
    const statusInfo = statusLabels[status];
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <History className="h-4 w-4" />
        <span>Block {selectedPlan?.blockNumber || 1}</span>
        {selectedPlan?.isActive && (
          <Badge variant={statusInfo.variant} className="text-[10px] flex items-center gap-1">
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
        )}
      </div>
    );
  }

  const selectedStatus = selectedPlan?.status || 'in_progress';
  const selectedStatusInfo = statusLabels[selectedStatus];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={disabled}
        >
          <History className="h-4 w-4" />
          <span>Block {selectedPlan?.blockNumber || 1}</span>
          {selectedPlan?.isActive && (
            <Badge variant={selectedStatusInfo.variant} className="text-[10px] flex items-center gap-1">
              {selectedStatusInfo.icon}
              {selectedStatusInfo.label}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-72 bg-popover border border-border shadow-lg z-50"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Training Blocks
        </DropdownMenuLabel>
        <div className="px-2 pb-2 text-[10px] text-muted-foreground">
          Current block drives Today's Workout on Home
        </div>
        <DropdownMenuSeparator />
        {plans.map((plan) => {
          const isSelected = plan.id === selectedPlanId;
          const weekRange = `Weeks ${(plan.blockNumber - 1) * 4 + 1}–${plan.blockNumber * 4}`;
          const dateLabel = plan.startDate 
            ? format(new Date(plan.startDate), 'MMM d, yyyy')
            : '';
          const statusInfo = statusLabels[plan.status];

          return (
            <DropdownMenuItem
              key={plan.id}
              onClick={() => onSelectPlan(plan.id)}
              className={cn(
                "flex items-center justify-between cursor-pointer",
                isSelected && "bg-accent"
              )}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Block {plan.blockNumber}</span>
                  <Badge variant={statusInfo.variant} className="text-[10px] h-4 flex items-center gap-1">
                    {statusInfo.icon}
                    {statusInfo.label}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {weekRange} • {dateLabel}
                </span>
              </div>
              {isSelected && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
