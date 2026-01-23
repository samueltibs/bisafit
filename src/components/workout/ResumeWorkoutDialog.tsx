import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Play, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface ResumeWorkoutDialogProps {
  open: boolean;
  onResume: () => void;
  onDiscard: () => void;
  startedAt: string;
  setsCompleted?: number;
}

export function ResumeWorkoutDialog({
  open,
  onResume,
  onDiscard,
  startedAt,
  setsCompleted = 0,
}: ResumeWorkoutDialogProps) {
  const formattedTime = startedAt ? format(new Date(startedAt), 'h:mm a') : '';
  const formattedDate = startedAt ? format(new Date(startedAt), 'MMM d') : '';

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">Resume Your Workout?</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            You have an incomplete workout from {formattedDate} at {formattedTime}.
            {setsCompleted > 0 && (
              <span className="block mt-2 font-medium text-foreground">
                {setsCompleted} set{setsCompleted !== 1 ? 's' : ''} completed
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={onResume} className="w-full gap-2">
            <Play className="h-4 w-4" />
            Resume Workout
          </Button>
          <Button 
            variant="outline" 
            onClick={onDiscard}
            className="w-full gap-2 text-muted-foreground"
          >
            <Trash2 className="h-4 w-4" />
            Discard & Start Fresh
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
