import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EnergyLevel } from '@/types/progress';
import { ENERGY_LABELS } from '@/types/progress';

interface EnergyLevelPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (level: EnergyLevel) => void;
  loading?: boolean;
}

export function EnergyLevelPrompt({ open, onOpenChange, onSubmit, loading }: EnergyLevelPromptProps) {
  const [selected, setSelected] = useState<EnergyLevel | null>(null);

  const handleSubmit = () => {
    if (selected) {
      onSubmit(selected);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  const levels: EnergyLevel[] = [1, 2, 3, 4, 5];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">How did you feel today?</DialogTitle>
          <DialogDescription className="text-center">
            Tracking your energy helps you understand your progress beyond the scale.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="flex justify-center gap-3">
            {levels.map((level) => {
              const config = ENERGY_LABELS[level];
              const isSelected = selected === level;
              
              return (
                <button
                  key={level}
                  onClick={() => setSelected(level)}
                  disabled={loading}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                    "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary",
                    isSelected && "bg-primary/10 ring-2 ring-primary"
                  )}
                >
                  <span className="text-3xl">{config.emoji}</span>
                  <span className={cn(
                    "text-xs font-medium",
                    isSelected ? config.color : "text-muted-foreground"
                  )}>
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleSkip}
            disabled={loading}
          >
            Skip
          </Button>
          <Button 
            className="flex-1"
            onClick={handleSubmit}
            disabled={!selected || loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
