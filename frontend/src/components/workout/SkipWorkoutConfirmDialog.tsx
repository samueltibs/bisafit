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
  text: string;
}

/**
 * Tone-specific messaging for skip workout confirmation
 */
const SKIP_MESSAGES = {
  title: {
    gentle: 'Before you skip',
    balanced: 'Skip this workout?',
    direct: 'One more option',
  },
  description: {
    gentle: "That's okay — just checking in before you decide.",
    balanced: "You can skip it, or fit it in later if that works better.",
    direct: "You can skip this workout, or get it done later today.",
  },
  skip_button: {
    gentle: "Skip for now",
    balanced: "Skip workout",
    direct: "Skip",
  },
};

/**
 * Generate a contextual suggestion based on time of day and user preferences
 * Returns tone-specific copy using the format:
 * - Gentle: "You could do a [duration] workout on [suggested day/time] if you'd like."
 * - Balanced: "A [duration] workout on [suggested day/time] could still work."
 * - Direct: "A [duration] workout on [suggested day/time] is still available."
 */
function generateSuggestion(
  workoutDuration: number,
  preferredTime: string | undefined,
  userWorkoutDays: string[] | undefined,
  tone: CoachTone
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
    const timeLabel = format(suggestedTime, 'h:mm a');
    
    const text = {
      gentle: `You could do a ${workoutDuration}-minute workout at ${timeLabel} if you'd like.`,
      balanced: `A ${workoutDuration}-minute workout at ${timeLabel} could still work.`,
      direct: `A ${workoutDuration}-minute workout at ${timeLabel} is still available.`,
    };
    
    return {
      type: 'later_today',
      text: text[tone],
    };
  }

  // Suggest next workout day if available
  if (userWorkoutDays && userWorkoutDays.length > 0) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Find next workout day
    for (let i = 1; i <= 7; i++) {
      const checkDate = addDays(now, i);
      const checkDayName = dayNames[checkDate.getDay()];
      
      if (userWorkoutDays.includes(checkDayName)) {
        const dayLabel = format(checkDate, 'EEEE');
        
        const text = {
          gentle: `You could do a ${workoutDuration}-minute workout on ${dayLabel} if you'd like.`,
          balanced: `A ${workoutDuration}-minute workout on ${dayLabel} could still work.`,
          direct: `A ${workoutDuration}-minute workout on ${dayLabel} is still available.`,
        };
        
        return {
          type: 'next_day',
          text: text[tone],
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
    return generateSuggestion(workoutDuration, preferredTime, userWorkoutDays, tone);
  }, [workoutDuration, preferredTime, userWorkoutDays, tone]);

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
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">{suggestion.text}</p>
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
