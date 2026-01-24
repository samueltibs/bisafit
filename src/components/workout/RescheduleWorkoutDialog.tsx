import { useState, useEffect } from 'react';
import { format, addDays, startOfDay, isBefore } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  AlertTriangle,
  Download,
  Loader2,
  Check
} from 'lucide-react';
import { useWorkoutReschedule, RescheduleValidation } from '@/hooks/useWorkoutReschedule';
import { useUserProfile } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';
import type { DisplayWorkout } from '@/types/plan';

interface RescheduleWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: DisplayWorkout | null;
  onSuccess?: () => void;
}

export function RescheduleWorkoutDialog({
  open,
  onOpenChange,
  workout,
  onSuccess,
}: RescheduleWorkoutDialogProps) {
  const { validateReschedule, rescheduleWorkout, downloadRescheduledICS, isRescheduling } = useWorkoutReschedule();
  const { profile } = useUserProfile();
  
  // State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [validation, setValidation] = useState<RescheduleValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [step, setStep] = useState<'date' | 'confirm'>('date');
  const [showCalendarDownload, setShowCalendarDownload] = useState(false);

  // Get workout days from profile
  const workoutDays = profile?.workout_days as string[] | undefined;
  
  // Get default time from profile
  const defaultTime = (profile?.workout_time_preferences_json as { default_time?: string })?.default_time || '09:00';

  // Reset state when dialog opens
  useEffect(() => {
    if (open && workout) {
      // Default to tomorrow or the next available day
      const tomorrow = addDays(new Date(), 1);
      setSelectedDate(tomorrow);
      setSelectedTime(defaultTime);
      setValidation(null);
      setStep('date');
      setShowCalendarDownload(false);
    }
  }, [open, workout, defaultTime]);

  // Validate when date or time changes
  useEffect(() => {
    if (!selectedDate || !workout) return;

    const runValidation = async () => {
      setIsValidating(true);
      const result = await validateReschedule(
        workout.id,
        selectedDate,
        selectedTime,
        workoutDays
      );
      setValidation(result);
      setIsValidating(false);
    };

    runValidation();
  }, [selectedDate, selectedTime, workout, workoutDays, validateReschedule]);

  const handleConfirm = async () => {
    if (!workout || !selectedDate || !validation?.isValid) return;

    const result = await rescheduleWorkout(workout.id, selectedDate, selectedTime);
    
    if (result.success) {
      setShowCalendarDownload(true);
    }
  };

  const handleDownloadCalendar = async () => {
    if (!workout || !selectedDate) return;
    await downloadRescheduledICS(workout.id, selectedDate, selectedTime);
  };

  const handleClose = () => {
    if (showCalendarDownload) {
      onSuccess?.();
    }
    onOpenChange(false);
  };

  const workoutDuration = workout?.duration || 45;

  // Disable past dates
  const disabledDays = (date: Date) => {
    return isBefore(startOfDay(date), startOfDay(new Date()));
  };

  if (!workout) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Workout</DialogTitle>
          <DialogDescription>
            {workout.workout} • {workoutDuration} min
          </DialogDescription>
        </DialogHeader>

        {!showCalendarDownload ? (
          <div className="space-y-6 py-4">
            {/* Date Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                Select New Date
              </Label>
              <div className="flex justify-center rounded-lg border border-border/50 p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={disabledDays}
                  className="pointer-events-auto"
                  initialFocus
                />
              </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Start Time
              </Label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Duration: {workoutDuration} minutes
              </p>
            </div>

            {/* Validation Feedback */}
            {validation && !isValidating && (
              <>
                {validation.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validation.error}</AlertDescription>
                  </Alert>
                )}
                {validation.warning && (
                  <Alert className="border-accent/50 bg-accent/5">
                    <AlertTriangle className="h-4 w-4 text-accent" />
                    <AlertDescription className="text-accent">
                      {validation.warning}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* Selected Summary */}
            {selectedDate && validation?.isValid && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm font-medium">New Schedule</p>
                <p className="text-lg font-semibold text-primary">
                  {format(selectedDate, 'EEEE, MMMM d')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')} • {workoutDuration} min
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={isRescheduling}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
                disabled={!validation?.isValid || isRescheduling || isValidating}
              >
                {isRescheduling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rescheduling...
                  </>
                ) : (
                  'Confirm Reschedule'
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Success State */
          <div className="space-y-6 py-4 text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Workout Rescheduled!</h3>
              <p className="text-sm text-muted-foreground">
                Your workout is now scheduled for{' '}
                <span className="font-medium text-foreground">
                  {selectedDate && format(selectedDate, 'EEEE, MMMM d')}
                </span>{' '}
                at{' '}
                <span className="font-medium text-foreground">
                  {format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')}
                </span>
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDownloadCalendar}
              >
                <Download className="mr-2 h-4 w-4" />
                Add to Calendar (.ics)
              </Button>
              <Button className="w-full" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
