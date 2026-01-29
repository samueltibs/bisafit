import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Loader2, 
  Play, 
  SkipForward, 
  Calendar, 
  Bed,
  Dumbbell,
  AlertCircle,
  Clock,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useWorkoutContext } from '@/hooks/useWorkoutContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWorkoutTitle } from '@/hooks/useWorkoutTitle';
import { useTranslation } from '@/lib/i18n';
import { RescheduleWorkoutDialog } from '@/components/workout/RescheduleWorkoutDialog';
import { SkipWorkoutConfirmDialog } from '@/components/workout/SkipWorkoutConfirmDialog';
import { QuickWinBanner } from '@/components/workout/QuickWinBanner';
import { StreakBadgeCompact } from '@/components/workout/StreakSaveBadge';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { DisplayWorkout } from '@/types/plan';
import { 
  getCoachMessage, 
  normalizeCoachTone,
  type CoachTone 
} from '@/lib/coachTone';
import { generateQuickWinWorkout } from '@/lib/quickWinWorkout';

// Helper to get localized workout title
function useLocalizedWorkoutTitle(workout: DisplayWorkout | null | undefined): string {
  const { getTitle } = useWorkoutTitle();
  const { t } = useTranslation();
  
  if (!workout) return t('workout.generic');
  
  if (workout.workoutJson) {
    return getTitle(workout.workoutJson, workout.workout);
  }
  
  return workout.workout || t('workout.generic');
}

export default function WorkoutToday() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { t } = useTranslation();
  const { getTitle: getDisplayTitle } = useWorkoutTitle();
  const { 
    contextType, 
    todayWorkout, 
    missedWorkout, 
    nextWorkout,
    loading,
    refetch 
  } = useWorkoutContext();

  // Get user's coach tone
  const coachTone: CoachTone = normalizeCoachTone((profile as any)?.coach_tone);

  // Reschedule dialog state
  const [showReschedule, setShowReschedule] = useState(false);
  const [workoutToReschedule, setWorkoutToReschedule] = useState<DisplayWorkout | null>(null);

  // Skip confirmation dialog state
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [workoutToSkip, setWorkoutToSkip] = useState<DisplayWorkout | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);

  // Quick Win state
  const [showQuickWinMode, setShowQuickWinMode] = useState(false);

  // Extract user preferences for suggestions
  const workoutDays = Array.isArray((profile as any)?.workout_days) 
    ? (profile as any).workout_days as string[] 
    : [];
  const timePrefs = (profile as any)?.workout_time_preferences_json as { default_time?: string } | null;
  const preferredTime = timePrefs?.default_time;

  // Get current streak from profile
  const currentStreak = (profile as any)?.longest_streak || 0;

  const handleOpenReschedule = (workout: DisplayWorkout) => {
    setWorkoutToReschedule(workout);
    setShowReschedule(true);
  };

  const handleRescheduleSuccess = () => {
    refetch();
    setShowReschedule(false);
    setWorkoutToReschedule(null);
  };

  const handleOpenSkipConfirm = (workout: DisplayWorkout) => {
    setWorkoutToSkip(workout);
    setShowSkipConfirm(true);
  };

  const handleSkipStart = () => {
    if (workoutToSkip) {
      navigate(`/workout/${workoutToSkip.id}`);
    }
  };

  const handleSkipReschedule = () => {
    if (workoutToSkip) {
      setShowSkipConfirm(false);
      handleOpenReschedule(workoutToSkip);
    }
  };

  const handleSkipConfirm = async () => {
    if (!workoutToSkip) return;

    setIsSkipping(true);
    try {
      // Mark the workout as skipped by moving its scheduled_date to past (effectively removing it from active state)
      // We move it back 30 days so it won't show as "missed" anymore
      const skipDate = format(addDays(new Date(), -30), 'yyyy-MM-dd');
      
      await supabase
        .from('workouts')
        .update({ scheduled_date: skipDate })
        .eq('id', workoutToSkip.id);

      // Close dialog and clear state
      setShowSkipConfirm(false);
      setWorkoutToSkip(null);

      // Show confirmation toast
      toast({
        title: "Workout skipped",
        description: "We'll get you ready for your next scheduled workout.",
      });

      // Refresh the workout context to show next state
      refetch();
    } catch (error) {
      console.error('Error skipping workout:', error);
      toast({
        title: "Error",
        description: "Failed to skip workout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSkipping(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // No plan state
  if (contextType === 'no_plan') {
    return (
      <AppLayout>
        <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Dumbbell className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">No Training Plan</h1>
            <p className="text-muted-foreground">
              {getCoachMessage('no_plan', coachTone)}
            </p>
          </div>
          <Button size="lg" onClick={() => navigate('/plan')}>
            Create Your Plan
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Today is a workout day - redirect to the actual workout
  if (contextType === 'today_workout' && todayWorkout && !todayWorkout.isRest) {
    const todayTitle = todayWorkout.workoutJson 
      ? getDisplayTitle(todayWorkout.workoutJson, todayWorkout.workout)
      : todayWorkout.workout;
    
    return (
      <AppLayout>
        <div className="container space-y-6 px-4 py-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t('workout.todaysWorkout')}</p>
              {currentStreak > 0 && <StreakBadgeCompact streak={currentStreak} />}
            </div>
            <h1 className="text-2xl font-bold">{todayTitle}</h1>
          </div>

          {/* Quick Win Banner - show for longer workouts */}
          {todayWorkout.duration >= 30 && todayWorkout.workoutJson && (
            <QuickWinBanner
              originalDuration={todayWorkout.duration}
              quickWinDuration={15}
              onStartQuickWin={() => {
                // Navigate with quick win mode
                navigate(`/workout/${todayWorkout.id}?quickWin=1`);
              }}
            />
          )}

          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <Dumbbell className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{todayTitle}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{todayWorkout.duration} min</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {getCoachMessage('workout_ready', coachTone)}
              </p>

              <div className="space-y-3">
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg"
                  onClick={() => navigate(`/workout/${todayWorkout.id}`)}
                >
                  <Play className="mr-2 h-5 w-5" />
                  {getCoachMessage('workout_start_cta', coachTone)}
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-12"
                    onClick={() => handleOpenSkipConfirm(todayWorkout)}
                  >
                    <SkipForward className="mr-2 h-4 w-4" />
                    Skip Workout
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12"
                    onClick={() => handleOpenReschedule(todayWorkout)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Reschedule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next workout preview */}
          {nextWorkout && (
            <Card className="border-border/40 bg-muted/30">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  {getCoachMessage('next_workout_preview', coachTone)}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{nextWorkout.workout}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(nextWorkout.dayDate, 'EEEE, MMM d')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dialogs */}
        <RescheduleWorkoutDialog
          open={showReschedule}
          onOpenChange={setShowReschedule}
          workout={workoutToReschedule}
          onSuccess={handleRescheduleSuccess}
        />
        <SkipWorkoutConfirmDialog
          open={showSkipConfirm}
          onOpenChange={setShowSkipConfirm}
          workoutName={workoutToSkip?.workout || ''}
          workoutDuration={workoutToSkip?.duration}
          coachTone={coachTone}
          userWorkoutDays={workoutDays}
          preferredTime={preferredTime}
          onStart={handleSkipStart}
          onReschedule={handleSkipReschedule}
          onSkip={handleSkipConfirm}
        />
      </AppLayout>
    );
  }

  // Missed workout state
  if (contextType === 'missed_workout' && missedWorkout) {
    const missedDateLabel = missedWorkout.daysAgo === 1 
      ? "yesterday's" 
      : `${format(missedWorkout.missedDate, 'EEEE')}'s`;

    return (
      <AppLayout>
        <div className="container space-y-6 px-4 py-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-accent">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">Missed Workout</p>
              </div>
              {currentStreak > 0 && <StreakBadgeCompact streak={currentStreak} />}
            </div>
            <h1 className="text-2xl font-bold">
              {getCoachMessage('missed_workout', coachTone).replace("yesterday's", missedDateLabel)}
            </h1>
          </div>

          {/* Quick Win Banner for missed workouts */}
          {missedWorkout.workout.duration >= 30 && missedWorkout.workout.workoutJson && (
            <QuickWinBanner
              originalDuration={missedWorkout.workout.duration}
              quickWinDuration={15}
              onStartQuickWin={() => {
                navigate(`/workout/${missedWorkout.workout.id}?quickWin=1`);
              }}
            />
          )}

          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
                  <Dumbbell className="h-7 w-7 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{missedWorkout.workout.workout}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{missedWorkout.workout.duration} min</span>
                    <span className="text-accent">• Scheduled for {format(missedWorkout.missedDate, 'MMM d')}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {getCoachMessage('missed_workout_action', coachTone)}
              </p>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button 
              size="lg" 
              className="w-full h-14 text-lg"
              onClick={() => navigate(`/workout/${missedWorkout.workout.id}`)}
            >
              <Play className="mr-2 h-5 w-5" />
              {getCoachMessage('workout_start_cta', coachTone)}
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-12"
                onClick={() => handleOpenSkipConfirm(missedWorkout.workout)}
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Skip Workout
              </Button>
              <Button 
                variant="outline" 
                className="h-12"
                onClick={() => handleOpenReschedule(missedWorkout.workout)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Reschedule
              </Button>
            </div>
          </div>

          {/* Next workout preview */}
          {nextWorkout && (
            <Card className="border-border/40 bg-muted/30">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Next Scheduled</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{nextWorkout.workout}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(nextWorkout.dayDate, 'EEEE, MMM d')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dialogs */}
        <RescheduleWorkoutDialog
          open={showReschedule}
          onOpenChange={setShowReschedule}
          workout={workoutToReschedule}
          onSuccess={handleRescheduleSuccess}
        />
        <SkipWorkoutConfirmDialog
          open={showSkipConfirm}
          onOpenChange={setShowSkipConfirm}
          workoutName={workoutToSkip?.workout || ''}
          workoutDuration={workoutToSkip?.duration}
          coachTone={coachTone}
          userWorkoutDays={workoutDays}
          preferredTime={preferredTime}
          onStart={handleSkipStart}
          onReschedule={handleSkipReschedule}
          onSkip={handleSkipConfirm}
        />
      </AppLayout>
    );
  }

  // Rest day state (default fallback)
  return (
    <AppLayout>
      <div className="container space-y-6 px-4 py-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Today</p>
          <h1 className="text-2xl font-bold">Rest Day</h1>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                <Bed className="h-7 w-7 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">
                  {getCoachMessage('rest_day', coachTone)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recovery suggestion */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-primary mb-1">Recovery Tip</p>
            <p className="text-sm text-muted-foreground">
              {getCoachMessage('rest_day_recovery', coachTone)}
            </p>
          </CardContent>
        </Card>

        {/* Next workout preview */}
        {nextWorkout && (
          <Card className="border-border/40 bg-muted/30" interactive onClick={() => navigate(`/workout/${nextWorkout.id}`)}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2">
                {getCoachMessage('next_workout_preview', coachTone)}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{nextWorkout.workout}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(nextWorkout.dayDate, 'EEEE, MMM d')} • {nextWorkout.duration} min
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reschedule Dialog */}
      <RescheduleWorkoutDialog
        open={showReschedule}
        onOpenChange={setShowReschedule}
        workout={workoutToReschedule}
        onSuccess={handleRescheduleSuccess}
      />

      {/* Skip Workout Confirmation Dialog */}
      <SkipWorkoutConfirmDialog
        open={showSkipConfirm}
        onOpenChange={setShowSkipConfirm}
        workoutName={workoutToSkip?.workout || ''}
        workoutDuration={workoutToSkip?.duration}
        coachTone={coachTone}
        userWorkoutDays={workoutDays}
        preferredTime={preferredTime}
        onStart={handleSkipStart}
        onReschedule={handleSkipReschedule}
        onSkip={handleSkipConfirm}
      />
    </AppLayout>
  );
}
