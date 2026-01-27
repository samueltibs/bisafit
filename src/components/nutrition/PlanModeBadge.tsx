import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

type PlanMode = 'generic' | 'ingredients';
type IngredientMode = 'strict_only' | 'flexible_prefer';

interface PlanModeBadgeProps {
  planMode: PlanMode;
  ingredientMode?: IngredientMode;
  className?: string;
}

export function PlanModeBadge({ planMode, ingredientMode, className }: PlanModeBadgeProps) {
  if (planMode === 'generic') {
    return (
      <Badge variant="secondary" className={cn("gap-1", className)}>
        <UtensilsCrossed className="h-3 w-3" />
        Generic Plan
      </Badge>
    );
  }

  if (ingredientMode === 'strict_only') {
    return (
      <Badge variant="outline" className={cn("gap-1 border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400", className)}>
        <Lock className="h-3 w-3" />
        Strict: only your ingredients
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn("gap-1 border-primary/50 bg-primary/10 text-primary", className)}>
      <Sparkles className="h-3 w-3" />
      Using your ingredients + optional add-ons
    </Badge>
  );
}
