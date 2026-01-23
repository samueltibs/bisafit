import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Dumbbell, Timer, Check, Sparkles, Calendar, Loader2, AlertTriangle, Bed, RefreshCw, Rocket, Lock, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { usePlan } from '@/hooks/usePlan';
import { usePlanGeneration } from '@/hooks/usePlanGeneration';
import { useProgressionEngine, type BlockFeedback } from '@/hooks/useProgressionEngine';
import { BlockFeedbackDialog, NextBlockSuccessDialog } from '@/components/progression';
import { BlockSelector, ScheduleMismatchBanner, ScheduleDebugBanner } from '@/components/plan';
import type { DisplayWorkout, WorkoutType } from '@/types/plan';

const typeColors: Record<WorkoutType, string> = {
  strength: 'bg-primary/10 text-primary',
  cardio: 'bg-orange-500/10 text-orange-500',
  recovery: 'bg-blue-500/10 text-blue-500',
  core: 'bg-purple-500/10 text-purple-500',
  rest: 'bg-muted text-muted-foreground',
  conditioning: 'bg-orange-500/10 text-orange-500',
};

export default function Plan() {
  const navigate = useNavigate();
  const { 
    plan, 
    planJson, 
    loading, 
    getWorkoutsForWeek, 
    refetch, 
    hasGenerationIssue, 
    currentWeekIndex, 
    getPlanWeekStart, 
    schedulingDebug,
    dismissMismatch,
    allPlans,
    selectedPlanId,
    setSelectedPlanId,
    currentPlanId,
    isViewingCurrentPlan,
    startBlock,
    markBlockComplete,
  } = usePlan();
  const { generatePlan, isGenerating } = usePlanGeneration();
  // For non-current plans, default to week 0 (Week 1) instead of using today's date
  const [weekOffset, setWeekOffset] = useState(0);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [showMarkCompleteConfirm, setShowMarkCompleteConfirm] = useState(false);

  // Progression engine state
  const {
    checkEligibility,
    generateNextBlock,
    isGenerating: isGeneratingNextBlock,
    generationResult,
  } = useProgressionEngine({
    planId: plan?.id,
    planJson: planJson as UseProgressionEngineProps['planJson'],
    currentWeekIndex,
  });

  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showEarlyProgressConfirm, setShowEarlyProgressConfirm] = useState(false);
  const [eligibility, setEligibility] = useState<{
    isEligible: boolean;
    adherenceRate: number;
    completedWorkouts: number;
    plannedWorkouts: number;
    isWeek4: boolean;
    hasAnyWorkouts: boolean;
  } | null>(null);

  // Check eligibility when plan loads
  useEffect(() => {
    if (plan && planJson) {
      checkEligibility().then(setEligibility);
    }
  }, [plan, planJson, checkEligibility]);

  // Calculate week start based on plan start + current week offset
  // For non-current plans, start from Week 1 (offset 0)
  const getWeekStartForOffset = (offset: number): Date => {
    const planWeekStart = getPlanWeekStart();
    if (planWeekStart) {
      // For current plan, use currentWeekIndex; for others, start from week 0
      const baseWeekIndex = isViewingCurrentPlan ? currentWeekIndex : 0;
      return addDays(planWeekStart, (baseWeekIndex + offset) * 7);
    }
    return addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), offset * 7);
  };

  const currentWeekStart = getWeekStartForOffset(weekOffset);

  // Reset week offset when switching plans
  useEffect(() => {
    setWeekOffset(0);
  }, [selectedPlanId]);

  const goToPreviousWeek = () => {
    const baseWeekIndex = isViewingCurrentPlan ? currentWeekIndex : 0;
    if (weekOffset > -baseWeekIndex) {
      setWeekOffset(weekOffset - 1);
    }
  };

  const goToNextWeek = () => {
    const baseWeekIndex = isViewingCurrentPlan ? currentWeekIndex : 0;
    if (baseWeekIndex + weekOffset < 3) {
      setWeekOffset(weekOffset + 1);
    }
  };

  const viewingPlanWeek = (isViewingCurrentPlan ? currentWeekIndex : 0) + weekOffset + 1;
  const isViewingCurrentWeek = weekOffset === 0;

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const displayWorkouts = plan ? getWorkoutsForWeek(currentWeekStart) : [];
  const workoutDaysCount = displayWorkouts.filter(w => !w.isRest).length;

  const handleGeneratePlan = async () => {
    const result = await generatePlan();
    if (result.success) {
      setWeekOffset(0);
      await refetch();
    }
    setShowRegenerateConfirm(false);
  };

  const handleRegenerateClick = () => {
    if (plan) {
      setShowRegenerateConfirm(true);
    } else {
      handleGeneratePlan();
    }
  };

  // Handle next block generation
  const handleBuildNextBlock = () => {
    setShowFeedbackDialog(true);
  };

  // Handle manual override - check if user has completed any workouts first
  const handleManualOverride = () => {
    if (!eligibility?.hasAnyWorkouts) {
      setShowEarlyProgressConfirm(true);
    } else {
      setShowFeedbackDialog(true);
    }
  };

  const handleConfirmEarlyProgress = () => {
    setShowEarlyProgressConfirm(false);
    setShowFeedbackDialog(true);
  };

  const handleFeedbackSubmit = async (feedback: BlockFeedback) => {
    const result = await generateNextBlock(feedback);
    if (result.success) {
      setShowFeedbackDialog(false);
      if (result.existing) {
        // Plan already exists, just refresh to show it
        await refetch();
      } else {
        // Show success dialog - plan is queued
        setShowSuccessDialog(true);
      }
    }
  };

  // Handle starting a queued block
  const handleStartBlock = async () => {
    if (plan?.id) {
      await startBlock(plan.id);
    }
  };

  // Handle marking block complete
  const handleMarkComplete = async () => {
    if (plan?.id) {
      await markBlockComplete(plan.id);
      setShowMarkCompleteConfirm(false);
    }
  };

  const handleViewNewPlan = async () => {
    setShowSuccessDialog(false);
    setWeekOffset(0);
    // Switch to the newly created plan (which becomes active)
    setSelectedPlanId(null); // Reset to trigger active plan selection
    await refetch();
  };

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="container space-y-6 px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AppLayout>
    );
  }

  // No plan state
  if (!plan) {
    return (
      <AppLayout>
        <div className="container space-y-6 px-4 py-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">No Training Plan Yet</h2>
            <p className="mb-6 max-w-sm text-muted-foreground">
              Complete your profile to get a personalized 4-week progressive training plan.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/onboarding')}>
                Complete Profile
              </Button>
              <Button onClick={handleGeneratePlan} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Plan
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container space-y-6 px-4 py-6">
        {/* Progression CTAs - Only show for current plan */}
        {isViewingCurrentPlan && (
        <Card className={cn(
          "animate-fade-in transition-all",
          eligibility?.isEligible 
            ? "border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10" 
            : "border-border/50"
        )}>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Main CTA Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    eligibility?.isEligible ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Rocket className={cn(
                      "h-5 w-5",
                      eligibility?.isEligible ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    {eligibility?.isEligible ? (
                      <>
                        <p className="font-semibold text-primary">Ready for Your Next Block!</p>
                        <p className="text-sm text-muted-foreground">
                          {eligibility.adherenceRate >= 0.7 
                            ? `Great work! You've completed ${Math.round(eligibility.adherenceRate * 100)}% of Block ${planJson?.block_number || 1}.`
                            : `You're in Week 4 of Block ${planJson?.block_number || 1}. Time to plan ahead!`
                          }
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold">Block {planJson?.block_number || 1} in Progress</p>
                        <p className="text-sm text-muted-foreground">
                          Week {currentWeekIndex + 1} of 4 • {eligibility?.completedWorkouts || 0}/{eligibility?.plannedWorkouts || 0} workouts completed
                        </p>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {eligibility?.isEligible ? (
                    <Button 
                      onClick={handleBuildNextBlock}
                      disabled={isGeneratingNextBlock}
                      className="shrink-0"
                    >
                      {isGeneratingNextBlock ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing your workouts...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Build My Next Block
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={handleManualOverride}
                      disabled={isGeneratingNextBlock}
                      className="shrink-0"
                    >
                      {isGeneratingNextBlock ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing your workouts...
                        </>
                      ) : (
                        <>
                          <Rocket className="mr-2 h-4 w-4" />
                          Build Next Block Now
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Helper text for manual override */}
              {!eligibility?.isEligible && (
                <p className="text-xs text-muted-foreground pl-13">
                  You don't have to wait 4 weeks if you're ready to progress.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Schedule Mismatch Banner - Friendly CTA */}
        {schedulingDebug?.hasMismatch && !schedulingDebug.mismatchDismissed && (
          <ScheduleMismatchBanner
            profileDays={schedulingDebug.profileWorkoutDays}
            planDays={schedulingDebug.scheduledWorkoutDays}
            onUpdateSchedule={handleGeneratePlan}
            onDismiss={dismissMismatch}
            isUpdating={isGenerating}
          />
        )}

        {/* Debug Banner (only show when mismatch is dismissed or no mismatch) */}
        {schedulingDebug && (schedulingDebug.mismatchDismissed || !schedulingDebug.hasMismatch) && (
          <ScheduleDebugBanner
            profileDays={schedulingDebug.profileWorkoutDays}
            planDays={schedulingDebug.scheduledWorkoutDays}
            hasMismatch={schedulingDebug.hasMismatch}
            isDismissed={schedulingDebug.mismatchDismissed}
          />
        )}

        {/* Generation Issue Warning */}
        {hasGenerationIssue && (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Plan generation issue: no workouts scheduled. Please regenerate.</span>
              <Button size="sm" variant="outline" onClick={handleGeneratePlan} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Regenerate'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Plan Header */}
        {planJson?.coach_notes && (
          <Card className="border-primary/20 bg-primary/5 animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">Coach Notes</p>
                  <p className="mt-1 text-sm text-muted-foreground">{planJson.coach_notes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Block Selector and Week Navigation */}
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Block Selector Row */}
          <div className="flex items-center justify-between">
            <BlockSelector
              plans={allPlans}
              selectedPlanId={selectedPlanId}
              currentPlanId={currentPlanId}
              onSelectPlan={setSelectedPlanId}
              disabled={isGenerating || isGeneratingNextBlock}
            />
            <div className="flex items-center gap-2">
              {/* Queued block: Show "Start This Block" button */}
              {allPlans.find(p => p.id === selectedPlanId)?.status === 'queued' && (
                <Button size="sm" onClick={handleStartBlock}>
                  <Play className="h-3 w-3 mr-1" />
                  Start This Block
                </Button>
              )}
              {/* Current block: Show "Mark Complete" button */}
              {isViewingCurrentPlan && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowMarkCompleteConfirm(true)}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark Complete
                </Button>
              )}
              {!isViewingCurrentPlan && allPlans.find(p => p.id === selectedPlanId)?.status !== 'queued' && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Completed
                </Badge>
              )}
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <h2 className="text-lg font-semibold">
                {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
              </h2>
              {planJson && (
              <p className="text-xs text-muted-foreground">
                  Week {viewingPlanWeek} of 4 • {workoutDaysCount} workouts
                  {isViewingCurrentWeek && isViewingCurrentPlan && (
                    <Badge variant="outline" className="ml-2 text-[10px]">Current</Badge>
                  )}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Week Overview */}
        <div className="flex justify-between gap-1 animate-slide-up">
          {weekDays.map((day, i) => {
            const workout = displayWorkouts[i];
            const hasWorkout = workout && !workout.isRest;
            return (
              <div
                key={i}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-lg p-2 transition-all",
                  isToday(day) && "bg-primary/10"
                )}
              >
                <span className="text-xs text-muted-foreground">{format(day, 'EEE')}</span>
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                    isToday(day) ? "bg-primary text-primary-foreground" : ""
                  )}
                >
                  {format(day, 'd')}
                </span>
                {hasWorkout ? (
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    workout.completed ? "bg-primary" : "bg-primary/50"
                  )} />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" />
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Week {viewingPlanWeek} Plan</h3>
            <div className="flex items-center gap-2">
              {planJson?.progression_notes && (
                <Badge variant="secondary" className="text-xs">
                  {planJson.progression_strategy}
                </Badge>
              )}
              {isViewingCurrentPlan ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRegenerateClick}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Regenerate
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPlanId(currentPlanId)}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Go to Current Block
                </Button>
              )}
            </div>
          </div>
          
          {displayWorkouts.map((workout) => (
            <WorkoutDayCard key={workout.id} workout={workout} />
          ))}

          {displayWorkouts.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">No workouts scheduled for this week</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Progression Notes */}
        {planJson?.progression_notes && (
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Progression Notes
              </p>
              <p className="text-sm text-foreground">{planJson.progression_notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Regenerate Confirmation Dialog */}
      <Dialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Training Plan?</DialogTitle>
            <DialogDescription>
              This will create a new 4-week plan and replace your current workouts. 
              Any completed workout history will be preserved, but scheduled workouts will be replaced.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowRegenerateConfirm(false)} disabled={isGenerating}>
              Cancel
            </Button>
            <Button onClick={handleGeneratePlan} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate Plan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Complete Confirmation Dialog */}
      <Dialog open={showMarkCompleteConfirm} onOpenChange={setShowMarkCompleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Block Complete?</DialogTitle>
            <DialogDescription>
              This will mark Block {planJson?.block_number || 1} as completed. You can still view it in your block history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowMarkCompleteConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkComplete}>
              <Check className="mr-2 h-4 w-4" />
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Early Progress Confirmation Dialog */}
      <Dialog open={showEarlyProgressConfirm} onOpenChange={setShowEarlyProgressConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Progress Early?
            </DialogTitle>
            <DialogDescription>
              You haven't completed many workouts yet. The progression engine works best with workout data to analyze your performance.
              <span className="block mt-2 font-medium text-foreground">
                Do you want to build your next block anyway?
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowEarlyProgressConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmEarlyProgress}>
              Continue Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Feedback Dialog */}
      <BlockFeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
        onSubmit={handleFeedbackSubmit}
        isLoading={isGeneratingNextBlock}
        blockNumber={planJson?.block_number || 1}
        adherenceRate={eligibility?.adherenceRate || 0}
      />

      {/* Next Block Success Dialog */}
      {generationResult && (
        <NextBlockSuccessDialog
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
          onViewPlan={handleViewNewPlan}
          blockNumber={generationResult.block_number || 2}
          startDate={generationResult.start_date || ''}
          workoutsCreated={16}
          progressionApplied={generationResult.analysis?.progression_applied}
        />
      )}
    </AppLayout>
  );
}

// Type for useProgressionEngine props (needed for casting)
interface UseProgressionEngineProps {
  planId?: string;
  planJson?: {
    block_number: number;
    weeks: Array<{
      week_number: number;
      days: Array<{
        day_name: string;
        type: 'workout' | 'rest';
        workout_id?: string;
      }>;
    }>;
  } | null;
  currentWeekIndex: number;
}

interface WorkoutDayCardProps {
  workout: DisplayWorkout;
}

function WorkoutDayCard({ workout }: WorkoutDayCardProps) {
  if (workout.isRest) {
    return (
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="flex items-center gap-4 p-4">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", typeColors.rest)}>
            <Bed className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-muted-foreground">Rest Day</p>
              {isToday(workout.dayDate) && (
                <Badge variant="secondary" className="text-xs">Today</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{workout.day} • Recovery & Mobility</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link to={`/workout/${workout.id}`}>
      <Card
        className={cn(
          "border-border transition-all cursor-pointer hover:border-primary/50 hover:shadow-md",
          workout.completed && "opacity-75"
        )}
      >
        <CardContent className="flex items-center gap-4 p-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              typeColors[workout.type]
            )}
          >
            {workout.completed ? (
              <Check className="h-6 w-6" />
            ) : (
              <Dumbbell className="h-6 w-6" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className={cn("font-medium", workout.completed && "line-through")}>
                {workout.workout}
              </p>
              {isToday(workout.dayDate) && (
                <Badge variant="secondary" className="text-xs">Today</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{workout.day}</p>
          </div>
          
          {workout.duration > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span>{workout.duration}m</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
