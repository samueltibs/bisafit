import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface NextBlockSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewPlan: () => void;
  blockNumber: number;
  startDate: string;
  workoutsCreated: number;
  progressionApplied?: string;
}

export function NextBlockSuccessDialog({
  open,
  onOpenChange,
  onViewPlan,
  blockNumber,
  startDate,
  workoutsCreated,
  progressionApplied,
}: NextBlockSuccessDialogProps) {
  const formattedDate = startDate ? format(parseISO(startDate), 'MMMM d, yyyy') : '';

  const progressionLabels: Record<string, { label: string; description: string }> = {
    increase: {
      label: 'Progressive Overload',
      description: 'Intensity increased based on your strong performance',
    },
    maintain: {
      label: 'Consolidation Phase',
      description: 'Structure maintained with fresh exercise variations',
    },
    decrease: {
      label: 'Recovery Focus',
      description: 'Deload week included for optimal recovery',
    },
  };

  const progression = progressionApplied ? progressionLabels[progressionApplied] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">Block {blockNumber} is Ready!</DialogTitle>
          <DialogDescription>
            Your next training block has been created based on your performance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Start Date */}
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Starts {formattedDate}</p>
              <p className="text-xs text-muted-foreground">
                {workoutsCreated} workouts scheduled
              </p>
            </div>
          </div>

          {/* Progression Applied */}
          {progression && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{progression.label}</p>
                <p className="text-xs text-muted-foreground">{progression.description}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={onViewPlan} className="w-full gap-2">
            View New Plan
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Continue Training
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
