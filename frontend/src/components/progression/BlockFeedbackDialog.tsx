import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingDown, Minus, TrendingUp } from 'lucide-react';
import type { BlockFeedback } from '@/hooks/useProgressionEngine';
import { cn } from '@/lib/utils';

interface BlockFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feedback: BlockFeedback) => void;
  isLoading: boolean;
  blockNumber: number;
  adherenceRate: number;
}

const feedbackOptions: Array<{
  value: BlockFeedback;
  label: string;
  description: string;
  icon: typeof TrendingDown;
  color: string;
}> = [
  {
    value: 'too_easy',
    label: 'Too Easy',
    description: 'I could have done more',
    icon: TrendingUp,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20',
  },
  {
    value: 'just_right',
    label: 'Just Right',
    description: 'Challenging but manageable',
    icon: Minus,
    color: 'text-primary bg-primary/10 border-primary/30 hover:bg-primary/20',
  },
  {
    value: 'too_hard',
    label: 'Too Hard',
    description: 'I struggled to keep up',
    icon: TrendingDown,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20',
  },
];

export function BlockFeedbackDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  blockNumber,
  adherenceRate,
}: BlockFeedbackDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How did Block {blockNumber} feel?</DialogTitle>
          <DialogDescription>
            Your feedback helps create a better next block.
            {adherenceRate > 0 && (
              <span className="block mt-1 text-foreground/80">
                You completed {Math.round(adherenceRate * 100)}% of your workouts.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {feedbackOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.value}
                variant="outline"
                className={cn(
                  "h-auto flex items-center justify-start gap-4 p-4 border-2 transition-all",
                  option.color
                )}
                onClick={() => onSubmit(option.value)}
                disabled={isLoading}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/50">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm opacity-80">{option.description}</p>
                </div>
              </Button>
            );
          })}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Building your next block...</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
