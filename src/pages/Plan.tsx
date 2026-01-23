import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Dumbbell, Timer, Check, Sparkles, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, isToday, isBefore } from 'date-fns';
import { usePlan } from '@/hooks/usePlan';
import { usePlanGeneration } from '@/hooks/usePlanGeneration';
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
  const { plan, planJson, loading, error, getWorkoutsForWeek, refetch } = usePlan();
  const { generatePlan, isGenerating } = usePlanGeneration();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // If plan exists, align to plan start date initially
  useEffect(() => {
    if (plan?.start_date) {
      const planStart = new Date(plan.start_date);
      const weekStart = startOfWeek(planStart, { weekStartsOn: 1 });
      setCurrentWeekStart(weekStart);
    }
  }, [plan?.start_date]);

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const displayWorkouts = plan ? getWorkoutsForWeek(currentWeekStart) : [];

  const handleGeneratePlan = async () => {
    const result = await generatePlan();
    if (result.success) {
      await refetch();
    }
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

        {/* Week Navigation */}
        <div className="flex items-center justify-between animate-fade-in">
          <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
            </h2>
            {planJson && (
              <p className="text-xs text-muted-foreground">
                Block {planJson.block_number} • {planJson.progression_strategy} progression
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Week Overview */}
        <div className="flex justify-between gap-1 animate-slide-up">
          {weekDays.map((day, i) => {
            const workout = displayWorkouts[i];
            const hasWorkout = workout && workout.type !== 'rest';
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
                {hasWorkout && (
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    workout.completed ? "bg-primary" : "bg-muted-foreground/30"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Weekly Workouts */}
        <div className="space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">This Week's Plan</h3>
            {planJson?.progression_notes && (
              <Badge variant="secondary" className="text-xs">
                {planJson.progression_strategy}
              </Badge>
            )}
          </div>
          
          {displayWorkouts.map((workout, index) => (
            <Link
              key={workout.id}
              to={workout.type !== 'rest' ? `/workout/${workout.id}` : '#'}
              className={workout.type === 'rest' ? 'pointer-events-none' : ''}
            >
              <Card
                className={cn(
                  "border-border transition-all",
                  workout.type !== 'rest' && "cursor-pointer hover:border-primary/50 hover:shadow-md",
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
                  
                  {workout.type !== 'rest' && workout.duration > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      <span>{workout.duration}m</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
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
    </AppLayout>
  );
}
