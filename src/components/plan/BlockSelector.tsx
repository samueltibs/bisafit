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
import type { PlanSummary } from '@/hooks/usePlan';
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
 * Get the status badge info for display
 */
function getStatusBadge(
  plan: PlanSummary, 
  currentPlanId: string | null,
  nextBlockId: string | null
): { 
  label: string; 
  icon: React.ReactNode; 
  variant: 'default' | 'secondary' | 'outline';
  priority: 'current' | 'next' | 'archived';
} {
  // Current block (matching current_plan_id)
  if (plan.id === currentPlanId) {
    return { 
      label: 'Current', 
      icon: <Play className="h-3 w-3" />, 
      variant: 'default',
      priority: 'current',
    };
  }
  
  // Next block (newest queued plan)
  if (plan.id === nextBlockId) {
    return { 
      label: 'Next', 
      icon: <Clock className="h-3 w-3" />, 
      variant: 'outline',
      priority: 'next',
    };
  }
  
  // Archived: completed or older
  if (plan.status === 'completed') {
    return { 
      label: 'Archived', 
      icon: <CheckCircle className="h-3 w-3" />, 
      variant: 'secondary',
      priority: 'archived',
    };
  }
  
  // Other in_progress plans (not current) are also archived
  return { 
    label: 'Archived', 
    icon: <Archive className="h-3 w-3" />, 
    variant: 'secondary',
    priority: 'archived',
  };
}

/**
 * Calculate block date range from start date
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
 * Get block label from block_number
 */
function getBlockLabel(plan: PlanSummary): string {
  if (plan.blockNumber && plan.blockNumber > 0) {
    return `Block ${plan.blockNumber}`;
  }
  return 'Block (unlabeled)';
}

/**
 * Categorize plans into: current, next, and archived
 * - Current: matches current_plan_id
 * - Next: newest plan with status='queued'
 * - Archived: all others (completed, older in_progress, duplicates, needs_regen)
 */
function categorizePlans(
  plans: PlanSummary[], 
  currentPlanId: string | null
): {
  currentBlock: PlanSummary | null;
  nextBlock: PlanSummary | null;
  archivedBlocks: PlanSummary[];
  needsRegeneration: PlanSummary[];
} {
  let currentBlock: PlanSummary | null = null;
  let nextBlock: PlanSummary | null = null;
  const archivedBlocks: PlanSummary[] = [];
  const needsRegeneration: PlanSummary[] = [];
  
  // Find current block first
  currentBlock = plans.find(p => p.id === currentPlanId) || null;
  
  // Find next block: newest queued plan (highest block_number with status='queued')
  const queuedPlans = plans
    .filter(p => p.status === 'queued' && p.id !== currentPlanId && !p.needsRegeneration && p.workoutCount > 0)
    .sort((a, b) => b.blockNumber - a.blockNumber);
  
  if (queuedPlans.length > 0) {
    nextBlock = queuedPlans[0];
  }
  
  // Categorize remaining plans
  for (const plan of plans) {
    // Skip current and next
    if (plan.id === currentBlock?.id || plan.id === nextBlock?.id) {
      continue;
    }
    
    // Needs regeneration (no workouts)
    if (plan.needsRegeneration || plan.workoutCount === 0) {
      needsRegeneration.push(plan);
      continue;
    }
    
    // Everything else is archived
    archivedBlocks.push(plan);
  }
  
  // Sort archived by block_number descending (newest first)
  archivedBlocks.sort((a, b) => b.blockNumber - a.blockNumber);
  needsRegeneration.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  return { currentBlock, nextBlock, archivedBlocks, needsRegeneration };
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
  const { currentBlock, nextBlock, archivedBlocks, needsRegeneration } = categorizePlans(plans, currentPlanId);
  
  // Visible plans = current + next only
  const visiblePlans: PlanSummary[] = [];
  if (currentBlock) visiblePlans.push(currentBlock);
  if (nextBlock) visiblePlans.push(nextBlock);
  
  const totalArchivedCount = archivedBlocks.length + needsRegeneration.length;

  // Single plan or no plans - show simple label
  if (plans.length <= 1) {
    const statusInfo = selectedPlan ? getStatusBadge(selectedPlan, currentPlanId, nextBlock?.id || null) : null;
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <History className="h-4 w-4" />
        <span>{selectedPlan ? getBlockLabel(selectedPlan) : 'Block 1'}</span>
        {statusInfo?.priority === 'current' && (
          <Badge variant={statusInfo.variant} className="text-[10px] flex items-center gap-1">
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
        )}
      </div>
    );
  }

  const selectedStatusInfo = selectedPlan ? getStatusBadge(selectedPlan, currentPlanId, nextBlock?.id || null) : null;

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
          {selectedStatusInfo && selectedStatusInfo.priority !== 'archived' && (
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
        <div className="px-2 pb-2 text-[10px] text-muted-foreground leading-tight">
          Only your current and next block are shown. Older blocks are archived.
        </div>
        <DropdownMenuSeparator />
        
        {/* Current and Next blocks */}
        {visiblePlans.map((plan) => {
          const isSelected = plan.id === selectedPlanId;
          const dateRange = getBlockDateRange(plan.startDate);
          const statusInfo = getStatusBadge(plan, currentPlanId, nextBlock?.id || null);

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

        {/* No visible plans edge case */}
        {visiblePlans.length === 0 && (
          <div className="px-2 py-3 text-sm text-muted-foreground text-center">
            No active blocks. Check archived blocks below.
          </div>
        )}
        
        {/* Archived blocks section (collapsed by default) */}
        {totalArchivedCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <Collapsible open={showArchived} onOpenChange={setShowArchived}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between px-2 py-2 text-xs text-muted-foreground cursor-pointer hover:bg-accent rounded">
                  <div className="flex items-center gap-1">
                    <Archive className="h-3 w-3" />
                    <span>Archived blocks ({totalArchivedCount})</span>
                  </div>
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform",
                    showArchived && "rotate-180"
                  )} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {/* Regular archived blocks */}
                {archivedBlocks.map((plan) => {
                  const isSelected = plan.id === selectedPlanId;
                  const dateRange = getBlockDateRange(plan.startDate);

                  return (
                    <DropdownMenuItem
                      key={plan.id}
                      onClick={() => onSelectPlan(plan.id)}
                      className={cn(
                        "flex items-center justify-between cursor-pointer py-2 pl-6 opacity-70",
                        isSelected && "bg-accent opacity-100"
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{getBlockLabel(plan)} (Archived)</span>
                          {plan.status === 'completed' && (
                            <CheckCircle className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {dateRange.hasDates ? dateRange.label : 'No dates'}
                        </span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                  );
                })}

                {/* Needs regeneration plans */}
                {needsRegeneration.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-[10px] text-destructive flex items-center gap-1 ml-4">
                      <AlertCircle className="h-3 w-3" />
                      Needs regeneration
                    </div>
                    {needsRegeneration.map((plan) => {
                      const isSelected = plan.id === selectedPlanId;

                      return (
                        <DropdownMenuItem
                          key={plan.id}
                          onClick={() => onSelectPlan(plan.id)}
                          className={cn(
                            "flex items-center justify-between cursor-pointer py-2 pl-6 opacity-50",
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
                  </>
                )}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
