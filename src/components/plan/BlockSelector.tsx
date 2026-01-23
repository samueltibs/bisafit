import { ChevronDown, Check, History } from 'lucide-react';
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
import type { PlanSummary } from '@/hooks/usePlan';
import { format } from 'date-fns';

interface BlockSelectorProps {
  plans: PlanSummary[];
  selectedPlanId: string | null;
  onSelectPlan: (planId: string) => void;
  disabled?: boolean;
}

export function BlockSelector({
  plans,
  selectedPlanId,
  onSelectPlan,
  disabled,
}: BlockSelectorProps) {
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const activePlan = plans.find(p => p.isActive);

  if (plans.length <= 1) {
    // Single plan - show simple label
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <History className="h-4 w-4" />
        <span>Block {selectedPlan?.blockNumber || 1}</span>
        {selectedPlan?.isActive && (
          <Badge variant="secondary" className="text-[10px]">Active</Badge>
        )}
      </div>
    );
  }

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
            <Badge variant="secondary" className="text-[10px]">Active</Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-64 bg-popover border border-border shadow-lg z-50"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Training Blocks
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {plans.map((plan) => {
          const isSelected = plan.id === selectedPlanId;
          const weekRange = `Weeks ${(plan.blockNumber - 1) * 4 + 1}–${plan.blockNumber * 4}`;
          const dateLabel = plan.startDate 
            ? format(new Date(plan.startDate), 'MMM d, yyyy')
            : '';

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
                  {plan.isActive && (
                    <Badge variant="default" className="text-[10px] h-4">
                      Active
                    </Badge>
                  )}
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