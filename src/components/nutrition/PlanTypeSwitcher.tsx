import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ChevronDown, UtensilsCrossed, ShoppingBasket, Loader2, Check } from 'lucide-react';

type PlanMode = 'generic' | 'ingredients';

interface PlanTypeSwitcherProps {
  currentMode: PlanMode;
  hasIngredients: boolean;
  onSwitchToGeneric: () => void;
  onSwitchToIngredients: () => void;
  isLoading?: boolean;
}

export function PlanTypeSwitcher({
  currentMode,
  hasIngredients,
  onSwitchToGeneric,
  onSwitchToIngredients,
  isLoading = false,
}: PlanTypeSwitcherProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleGenericClick = () => {
    // Don't do anything if already on generic
    if (currentMode === 'generic') return;
    
    // Show confirmation when switching away from ingredients mode
    setConfirmDialogOpen(true);
  };

  const handleConfirmSwitch = () => {
    setConfirmDialogOpen(false);
    onSwitchToGeneric();
  };

  const handleIngredientsClick = () => {
    // Don't do anything if already on ingredients
    if (currentMode === 'ingredients') return;
    
    onSwitchToIngredients();
  };

  // Only disable options during loading - NOT when they are selected
  const isDisabled = isLoading;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1 text-xs text-muted-foreground"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating…
              </>
            ) : (
              <>
                Change plan type
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem 
            onClick={handleGenericClick}
            disabled={isDisabled}
            className="gap-2 cursor-pointer"
          >
            <UtensilsCrossed className="h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium flex items-center gap-2">
                Generic Plan
                {currentMode === 'generic' && (
                  <Check className="h-3 w-3 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">Standard meal planning</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleIngredientsClick}
            disabled={isDisabled}
            className="gap-2 cursor-pointer"
          >
            <ShoppingBasket className="h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium flex items-center gap-2">
                Use My Ingredients
                {currentMode === 'ingredients' && (
                  <Check className="h-3 w-3 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {hasIngredients ? 'From scanned items' : 'Add ingredients first'}
              </p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to Generic Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will ignore your ingredient-only constraint and generate a standard meal plan instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSwitch}>
              Switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
