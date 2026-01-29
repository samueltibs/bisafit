import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Lock, ShoppingBasket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StrictModeToggleProps {
  strictMode: boolean;
  onStrictModeChange: (value: boolean) => void;
  includeStaples: boolean;
  onIncludeStaplesChange: (value: boolean) => void;
  className?: string;
}

const COMMON_STAPLES = ['salt', 'pepper', 'water', 'cooking oil'];

export function StrictModeToggle({
  strictMode,
  onStrictModeChange,
  includeStaples,
  onIncludeStaplesChange,
  className,
}: StrictModeToggleProps) {
  return (
    <div className={cn("space-y-3 p-3 rounded-lg border bg-muted/30", className)}>
      {/* Main Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <Label htmlFor="strict-mode" className="text-sm font-medium cursor-pointer">
              Use only what I entered
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {strictMode 
                ? "Recipes will only use your items" 
                : "Recipes may suggest extra ingredients"}
            </p>
          </div>
        </div>
        <Switch
          id="strict-mode"
          checked={strictMode}
          onCheckedChange={onStrictModeChange}
        />
      </div>

      {/* Staples Checkbox - only show when strict mode is ON */}
      {strictMode && (
        <div className="flex items-start gap-2 pl-6 pt-2 border-t border-border/50">
          <Checkbox
            id="include-staples"
            checked={includeStaples}
            onCheckedChange={(checked) => onIncludeStaplesChange(checked === true)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label htmlFor="include-staples" className="text-sm cursor-pointer">
              Include common staples
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <ShoppingBasket className="h-3 w-3" />
              {COMMON_STAPLES.join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
