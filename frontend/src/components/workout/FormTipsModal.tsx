import { Info, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FormTipsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  tips: string[];
}

/**
 * Modal to display form tips for an exercise.
 * Shows 3-5 bullet points with key cues for proper form.
 */
export function FormTipsModal({
  open,
  onOpenChange,
  exerciseName,
  tips,
}: FormTipsModalProps) {
  if (!tips || tips.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-primary" />
            Form Tips
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Exercise name */}
          <p className="text-sm text-muted-foreground">
            Key cues for <span className="font-medium text-foreground">{exerciseName}</span>
          </p>

          {/* Tips list */}
          <ul className="space-y-3">
            {tips.map((tip, index) => (
              <li
                key={index}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg",
                  "bg-muted/50 border border-border/50"
                )}
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <DialogClose asChild>
          <Button variant="outline" className="w-full mt-2">
            Got it
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
