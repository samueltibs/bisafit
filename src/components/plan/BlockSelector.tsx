import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, Check, History, Play, CheckCircle, Clock, Archive, AlertCircle } from 'lucide-react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { PlanSummary, PlanStatus } from '@/hooks/usePlan';
import { 
  computeBlockEndDate, 
  formatBlockDateRange,
} from '@/lib/blockEngine';

interface BlockSelectorProps {
  plans: PlanSummary[];
  selectedPlanId: string | null;
  currentPlanId: string | null; // users_profile.current_plan_id
  onSelectPlan: (planId: string) => void;
  disabled?: boolean;
}

/**
 * Get the status badge info. "Current" is ONLY for current_plan_id match.
 */
function getStatusInfo(plan: PlanSummary, currentPlanId: string | null): { 
  label: string; 
  icon: React.ReactNode; 
  variant: 'default' | 'secondary' | 'outline';
  isCurrent: boolean;
} {
  // ONLY the plan matching current_plan_id shows "Current"
  if (plan.id === currentPlanId) {
    return { 
      label: 'Current', 
      icon: <Play className="h-3 w-3" />, 
      variant: 'default',
      isCurrent: true,
    };
  }
  
  // Other plans show their status
  if (plan.status === 'queued') {
    return { 
      label: 'Queued', 
      icon: <Clock className="h-3 w-3" />, 
      variant: 'outline',
      isCurrent: false,
    };
  }
  
  if (plan.status === 'completed') {
    return { 
      label: 'Completed', 
      icon: <CheckCircle className="h-3 w-3" />, 
      variant: 'secondary',
      isCurrent: false,
    };
  }
  
  // in_progress but not current
  return { 
    label: 'In Progress', 
    icon: <Play className="h-3 w-3" />, 
    variant: 'outline',
    isCurrent: false,
  };
}

/**
 * Calculate block end date from start date using blockEngine constants
 */
function getBlockDateRange(startDateStr: string | null | undefined): { 
  start: Date | null; 
  end: Date | null; 
  label: string;
  hasDates: boolean;
} {
  if (!startDateStr) {
    return { start: null, end: null, label: 'Dates missing', hasDates: false };
  }
  
  const start = new Date(startDateStr);
  const endDateStr = computeBlockEndDate(startDateStr);
  const end = new Date(endDateStr);
  
  return { 
    start, 
    end, 
    label: formatBlockDateRange(startDateStr),
    hasDates: true,
  };
}

/**
 * Get block label - use block_number from plans table or plan_json
 */
function getBlockLabel(plan: PlanSummary): string {
  if (plan.blockNumber && plan.blockNumber > 0) {
    return `Block ${plan.blockNumber}`;
  }
  return 'Block (unlabeled)';
}

/**
 * Separate plans into primary (newest per block_number), archived duplicates, and needs regeneration
 */
function separatePlans(plans: PlanSummary[]): {
  primaryPlans: PlanSummary[];
  archivedDuplicates: PlanSummary[];
  needsRegeneration: PlanSummary[];
} {
  const blockMap = new Map<number, PlanSummary[]>();
  const needsRegeneration: PlanSummary[] = [];
  
  // First pass: separate plans that need regeneration (no workouts)
  for (const plan of plans) {
    if (plan.needsRegeneration || plan.workoutCount === 0) {
      needsRegeneration.push(plan);
    } else {
      const blockNum = plan.blockNumber || 0;
      const existing = blockMap.get(blockNum) || [];
      existing.push(plan);
      blockMap.set(blockNum, existing);
    }
  }
  
  const primaryPlans: PlanSummary[] = [];
  const archivedDuplicates: PlanSummary[] = [];
  
  // For each block number, take the newest as primary, rest as archived
  for (const [, plansForBlock] of blockMap) {
    // Sort by createdAt descending (newest first)
    plansForBlock.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    if (plansForBlock.length > 0) {
      primaryPlans.push(plansForBlock[0]);
      archivedDuplicates.push(...plansForBlock.slice(1));
    }
  }
  
  // Sort primary plans by block number descending (newest first)
  primaryPlans.sort((a, b) => b.blockNumber - a.blockNumber);
  archivedDuplicates.sort((a, b) => b.blockNumber - a.blockNumber);
  needsRegeneration.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  return { primaryPlans, archivedDuplicates, needsRegeneration };
}

export function BlockSelector({
  plans,
  selectedPlanId,
  currentPlanId,
  onSelectPlan,
  disabled,
}: BlockSelectorProps) {
  const [showArchived, setShowArchived] = useState(false);
  const [showNeedsRegen, setShowNeedsRegen] = useState(false);
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const { primaryPlans, archivedDuplicates, needsRegeneration } = separatePlans(plans);

  if (plans.length <= 1) {
    // Single plan - show simple label
    const statusInfo = selectedPlan ? getStatusInfo(selectedPlan, currentPlanId) : null;
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <History className="h-4 w-4" />
        <span>{selectedPlan ? getBlockLabel(selectedPlan) : 'Block 1'}</span>
        {statusInfo?.isCurrent && (
          <Badge variant={statusInfo.variant} className="text-[10px] flex items-center gap-1">
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
        )}
      </div>
    );
  }

  const selectedStatusInfo = selectedPlan ? getStatusInfo(selectedPlan, currentPlanId) : null;

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
          <span>{selectedPlan ? getBlockLabel(selectedPlan) : 'Block 1'}</span>
          {selectedStatusInfo?.isCurrent && (
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
        className="w-80 bg-popover border border-border shadow-lg z-50 max-h-96 overflow-y-auto"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Training Blocks
        </DropdownMenuLabel>
        <div className="px-2 pb-2 text-[10px] text-muted-foreground">
          Current block drives Today's Workout on Home
        </div>
        <DropdownMenuSeparator />
        
        {/* Primary plans (newest per block number) */}
        {primaryPlans.map((plan) => {
          const isSelected = plan.id === selectedPlanId;
          const dateRange = getBlockDateRange(plan.startDate);
          const statusInfo = getStatusInfo(plan, currentPlanId);

          return (
            <DropdownMenuItem
              key={plan.id}
              onClick={() => onSelectPlan(plan.id)}
              className={cn(
                "flex items-center justify-between cursor-pointer py-3",
                isSelected && "bg-accent"
              )}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getBlockLabel(plan)}</span>
                  <Badge variant={statusInfo.variant} className="text-[10px] h-4 flex items-center gap-1">
                    {statusInfo.icon}
                    {statusInfo.label}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  Weeks 1–4 • {dateRange.hasDates ? (
                    dateRange.label
                  ) : (
                    <span className="text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {dateRange.label}
                    </span>
                  )}
                </span>
              </div>
              {isSelected && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
        
        {/* Needs Regeneration section */}
        {needsRegeneration.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <Collapsible open={showNeedsRegen} onOpenChange={setShowNeedsRegen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between px-2 py-2 text-xs text-muted-foreground cursor-pointer hover:bg-accent rounded">
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-destructive" />
                    <span className="text-destructive">Needs regeneration ({needsRegeneration.length})</span>
                  </div>
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform",
                    showNeedsRegen && "rotate-180"
                  )} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {needsRegeneration.map((plan) => {
                  const isSelected = plan.id === selectedPlanId;

                  return (
                    <DropdownMenuItem
                      key={plan.id}
                      onClick={() => onSelectPlan(plan.id)}
                      className={cn(
                        "flex items-center justify-between cursor-pointer py-2 pl-6 opacity-60",
                        isSelected && "bg-accent opacity-100"
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{getBlockLabel(plan)}</span>
                          <Badge variant="destructive" className="text-[10px] h-4">
                            No workouts
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Created {format(new Date(plan.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {/* Archived duplicates section */}
        {archivedDuplicates.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <Collapsible open={showArchived} onOpenChange={setShowArchived}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between px-2 py-2 text-xs text-muted-foreground cursor-pointer hover:bg-accent rounded">
                  <div className="flex items-center gap-1">
                    <Archive className="h-3 w-3" />
                    <span>Archived duplicates ({archivedDuplicates.length})</span>
                  </div>
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform",
                    showArchived && "rotate-180"
                  )} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {archivedDuplicates.map((plan) => {
                  const isSelected = plan.id === selectedPlanId;
                  const dateRange = getBlockDateRange(plan.startDate);

                  return (
                    <DropdownMenuItem
                      key={plan.id}
                      onClick={() => onSelectPlan(plan.id)}
                      className={cn(
                        "flex items-center justify-between cursor-pointer py-2 pl-6 opacity-60",
                        isSelected && "bg-accent opacity-100"
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Archived ({getBlockLabel(plan)})</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {dateRange.hasDates ? dateRange.label : 'No dates'}
                        </span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
