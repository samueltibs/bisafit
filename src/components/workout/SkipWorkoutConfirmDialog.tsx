import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Calendar, SkipForward, Clock } from 'lucide-react';
import { format, addDays, isToday, setHours, setMinutes } from 'date-fns';
import { 
  type CoachTone, 
  normalizeCoachTone 
} from '@/lib/coachTone';

interface SkipWorkoutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutName: string;
  workoutDuration?: number;
  coachTone?: CoachTone | string | null;
  userWorkoutDays?: string[];
  preferredTime?: string; // e.g. "18:00"
  onStart: () => void;
  onReschedule: () => void;
  onSkip: () => void;
}

interface Suggestion {
  type: 'later_today' | 'next_day';
  label: string;
  description: string;
}

/**
 * Tone-specific messaging for skip workout confirmation
 */
const SKIP_MESSAGES = {
  title: {
    gentle: 'Skip this workout?',
    balanced: 'Skip workout?',
    direct: 'Skip?',
  },
  description: {
    gentle: "No worries if now isn't the right time. Here are some options that might work better for you.",
    balanced: "You can start now, reschedule, or skip this workout.",
    direct: "Start now, reschedule, or skip.",
  },
  suggestion_intro: {
    gentle: "Here's an idea:",
    balanced: "Suggestion:",
    direct: "",
  },
  skip_button: {
    gentle: "Skip for now",
    balanced: "Skip workout",
    direct: "Skip",
  },
};

/**
 * Generate a contextual suggestion based on time of day and user preferences
 */
function generateSuggestion(
  workoutDuration: number,
  preferredTime: string | undefined,
  userWorkoutDays: string[] | undefined
): Suggestion | null {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Parse preferred time
  let preferredHour = 18; // Default to 6 PM
  if (preferredTime) {
    const [hours] = preferredTime.split(':').map(Number);
    if (!isNaN(hours)) preferredHour = hours;
  }

  // Check if there's time left today
  const hoursNeeded = Math.ceil(workoutDuration / 60);
  const latestStartHour = 21; // Don't suggest workouts after 9 PM
  
  // If it's early enough and preferred time is later today
  if (currentHour < preferredHour && preferredHour + hoursNeeded <= latestStartHour) {
    const suggestedTime = setMinutes(setHours(now, preferredHour), 0);
    return {
      type: 'later_today',
      label: `Later today at ${format(suggestedTime, 'h:mm a')}`,
      description: `You could fit this ${workoutDuration}-minute workout in later.`,
    };
  }

  // Suggest next workout day if available
  if (userWorkoutDays && userWorkoutDays.length > 0) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayIndex = now.getDay();
    
    // Find next workout day
    for (let i = 1; i <= 7; i++) {
      const checkDate = addDays(now, i);
      const checkDayName = dayNames[checkDate.getDay()];
      
      if (userWorkoutDays.includes(checkDayName)) {
        return {
          type: 'next_day',
          label: `Reschedule to ${format(checkDate, 'EEEE')}`,
          description: `Your next scheduled workout day.`,
        };
      }
    }
  }

  return null;
}

export function SkipWorkoutConfirmDialog({
  open,
  onOpenChange,
  workoutName,
  workoutDuration = 30,
  coachTone,
  userWorkoutDays,
  preferredTime,
  onStart,
  onReschedule,
  onSkip,
}: SkipWorkoutConfirmDialogProps) {
  const tone = normalizeCoachTone(coachTone);
  
  const suggestion = useMemo(() => {
    return generateSuggestion(workoutDuration, preferredTime, userWorkoutDays);
  }, [workoutDuration, preferredTime, userWorkoutDays]);

  const handleStart = () => {
    onOpenChange(false);
    onStart();
  };

  const handleReschedule = () => {
    onOpenChange(false);
    onReschedule();
  };

  const handleSkip = () => {
    onOpenChange(false);
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{SKIP_MESSAGES.title[tone]}</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{workoutName}</span>
            {workoutDuration && (
              <span className="text-muted-foreground"> • {workoutDuration} min</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            {SKIP_MESSAGES.description[tone]}
          </p>

          {/* Contextual suggestion */}
          {suggestion && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              {SKIP_MESSAGES.suggestion_intro[tone] && (
                <p className="text-xs font-medium text-primary mb-1">
                  {SKIP_MESSAGES.suggestion_intro[tone]}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">{suggestion.label}</p>
                  <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {/* Primary actions */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button onClick={handleStart} className="h-11">
              <Play className="mr-2 h-4 w-4" />
              Start Now
            </Button>
            <Button variant="outline" onClick={handleReschedule} className="h-11">
              <Calendar className="mr-2 h-4 w-4" />
              Reschedule
            </Button>
          </div>
          
          {/* Secondary action */}
          <Button 
            variant="ghost" 
            onClick={handleSkip} 
            className="w-full text-muted-foreground h-10"
          >
            <SkipForward className="mr-2 h-4 w-4" />
            {SKIP_MESSAGES.skip_button[tone]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
