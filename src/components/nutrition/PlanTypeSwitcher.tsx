import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, UtensilsCrossed, ShoppingBasket } from 'lucide-react';

type PlanMode = 'generic' | 'ingredients';

interface PlanTypeSwitcherProps {
  currentMode: PlanMode;
  hasIngredients: boolean;
  onSwitchToGeneric: () => void;
  onSwitchToIngredients: () => void;
}

export function PlanTypeSwitcher({
  currentMode,
  hasIngredients,
  onSwitchToGeneric,
  onSwitchToIngredients,
}: PlanTypeSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
          Change plan type
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem 
          onClick={onSwitchToGeneric}
          disabled={currentMode === 'generic'}
          className="gap-2"
        >
          <UtensilsCrossed className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-medium">Generic Plan</div>
            <p className="text-xs text-muted-foreground">Standard meal planning</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={onSwitchToIngredients}
          disabled={currentMode === 'ingredients' || !hasIngredients}
          className="gap-2"
        >
          <ShoppingBasket className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-medium">Use My Ingredients</div>
            <p className="text-xs text-muted-foreground">
              {hasIngredients ? 'From scanned items' : 'Scan ingredients first'}
            </p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
