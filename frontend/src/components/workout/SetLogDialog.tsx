import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SetLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  setNumber: number;
  prescribedReps: string;
  onComplete: (weight?: number, reps?: number) => void;
}

export function SetLogDialog({
  open,
  onOpenChange,
  exerciseName,
  setNumber,
  prescribedReps,
  onComplete,
}: SetLogDialogProps) {
  const defaultReps = parseInt(prescribedReps) || 10;
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>(String(defaultReps));

  const handleSubmit = () => {
    const weightNum = weight ? parseFloat(weight) : undefined;
    const repsNum = parseInt(reps) || defaultReps;
    onComplete(weightNum, repsNum);
    setWeight('');
    setReps(String(defaultReps));
    onOpenChange(false);
  };

  const handleQuickComplete = () => {
    onComplete(undefined, defaultReps);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Set {setNumber}</DialogTitle>
          <p className="text-sm text-muted-foreground">{exerciseName}</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (optional)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="e.g., 25"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              inputMode="decimal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reps">Reps completed</Label>
            <Input
              id="reps"
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              inputMode="numeric"
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleSubmit} className="w-full">
            Log & Continue
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleQuickComplete} 
            className="w-full text-muted-foreground"
          >
            Skip logging (use defaults)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
