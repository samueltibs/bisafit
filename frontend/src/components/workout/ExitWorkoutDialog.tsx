import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExitWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  progressPercentage?: number;
}

/**
 * Confirmation dialog before exiting an active workout.
 */
export function ExitWorkoutDialog({
  open,
  onOpenChange,
  onConfirm,
  progressPercentage = 0,
}: ExitWorkoutDialogProps) {
  const hasProgress = progressPercentage > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasProgress ? 'End Workout?' : 'Exit Workout?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasProgress ? (
              <>
                You've completed <span className="font-semibold text-foreground">{Math.round(progressPercentage)}%</span> of this workout.
                Your progress will be saved, but you won't get credit for a completed workout.
              </>
            ) : (
              "Are you sure you want to exit? This workout hasn't been started yet."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Going</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {hasProgress ? 'End Workout' : 'Exit'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
