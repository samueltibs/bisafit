import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Lock, Sparkles, Check } from 'lucide-react';
import type { IngredientMode } from '@/hooks/useIngredientSession';

interface IngredientModeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mode: IngredientMode) => void;
}

export function IngredientModeModal({ 
  open, 
  onOpenChange, 
  onConfirm 
}: IngredientModeModalProps) {
  const [selectedMode, setSelectedMode] = useState<IngredientMode>('flexible_prefer');

  const handleConfirm = () => {
    onConfirm(selectedMode);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How should we use your ingredients?</DialogTitle>
          <DialogDescription>
            Choose how strictly to follow your scanned ingredients.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          {/* Strict Option */}
          <button
            onClick={() => setSelectedMode('strict_only')}
            className={cn(
              "flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all",
              selectedMode === 'strict_only'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/50"
            )}
          >
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              selectedMode === 'strict_only' ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <Lock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Use only what I have</span>
                {selectedMode === 'strict_only' && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                No extra ingredients. Meals may be simpler.
              </p>
            </div>
          </button>

          {/* Flexible Option */}
          <button
            onClick={() => setSelectedMode('flexible_prefer')}
            className={cn(
              "flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all",
              selectedMode === 'flexible_prefer'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/50"
            )}
          >
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              selectedMode === 'flexible_prefer' ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Use what I have + optional add-ons</span>
                {selectedMode === 'flexible_prefer' && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                We'll suggest a few extras to make better meals.
              </p>
              <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Recommended
              </span>
            </div>
          </button>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
