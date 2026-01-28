import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Clock, Users, ExternalLink, Copy, Check, ChevronDown,
  UtensilsCrossed, Flame, Beef, RefreshCw, Loader2, BookOpen, Sparkles, ChefHat
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { openExternalLink } from '@/lib/externalLinks';
import type { Meal, InstructionStyle } from '@/hooks/useNutrition';

const INSTRUCTION_STYLE_KEY = 'bisafit_instruction_style';

interface MealDetailSheetProps {
  meal: Meal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwap?: () => void;
  swapping?: boolean;
}

const styleLabels: Record<InstructionStyle, string> = {
  simple: 'Simple',
  detailed: 'Detailed',
  gourmet: 'Gourmet',
};

export function MealDetailSheet({ 
  meal, 
  open, 
  onOpenChange,
  onSwap,
  swapping = false,
}: MealDetailSheetProps) {
  const [copied, setCopied] = useState(false);
  const [showMealPrepNotes, setShowMealPrepNotes] = useState(false);
  const [instructionStyle, setInstructionStyle] = useState<InstructionStyle>(() => {
    const saved = localStorage.getItem(INSTRUCTION_STYLE_KEY);
    return (saved as InstructionStyle) || 'simple';
  });

  useEffect(() => {
    localStorage.setItem(INSTRUCTION_STYLE_KEY, instructionStyle);
  }, [instructionStyle]);

  if (!meal) return null;

  const hasDetailedInstructions = meal.detailed_instructions && meal.detailed_instructions.length > 0;
  const hasGourmetNotes = !!meal.gourmet_notes;
  const hasSourceUrl = !!meal.recipe_source_url;
  const totalTime = (meal.prep_time_minutes || 0) + (meal.cook_time_minutes || 0);

  // Determine effective style based on available content
  const getEffectiveStyle = (): InstructionStyle => {
    if (instructionStyle === 'gourmet' && !hasGourmetNotes && !hasDetailedInstructions) {
      return 'simple';
    }
    if (instructionStyle === 'gourmet' && !hasGourmetNotes) {
      return 'detailed';
    }
    if (instructionStyle === 'detailed' && !hasDetailedInstructions) {
      return 'simple';
    }
    return instructionStyle;
  };

  const effectiveStyle = getEffectiveStyle();

  const handleCopyInstructions = async () => {
    try {
      let text = `${meal.recipe_title}\n\n`;
      text += `Ingredients:\n${meal.ingredients.map(i => `• ${i}`).join('\n')}\n\n`;
      
      if (effectiveStyle === 'simple') {
        text += `Instructions:\n${meal.instructions}`;
      } else if (hasDetailedInstructions) {
        text += `Detailed Instructions:\n${meal.detailed_instructions!.map((step, i) => `${i + 1}. ${step}`).join('\n')}`;
      }
      
      if (effectiveStyle === 'gourmet' && hasGourmetNotes) {
        text += `\n\nChef's Notes:\n${meal.gourmet_notes}`;
      }
      
      if (meal.meal_prep_notes) {
        text += `\n\nMeal Prep Notes:\n${meal.meal_prep_notes}`;
      }

      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Recipe copied to clipboard!');
    } catch {
      toast.error('Failed to copy recipe');
    }
  };

  const handleOpenRecipeSource = () => {
    if (meal.recipe_source_url) {
      openExternalLink(meal.recipe_source_url);
    }
  };

  const renderInstructions = () => {
    switch (effectiveStyle) {
      case 'simple':
        return (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {meal.instructions}
          </p>
        );
      case 'detailed':
      case 'gourmet':
        return (
          <div className="space-y-4">
            {hasDetailedInstructions ? (
              <ol className="space-y-4">
                {meal.detailed_instructions!.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {i + 1}
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-0.5">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {meal.instructions}
              </p>
            )}
            
            {effectiveStyle === 'gourmet' && hasGourmetNotes && (
              <div className="mt-6 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <ChefHat className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Chef's Notes</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {meal.gourmet_notes}
                </p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="text-left pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl">{meal.recipe_title}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1 flex-wrap">
                <span>{meal.name}</span>
                {meal.cuisine_style && (
                  <Badge variant="outline" className="text-xs">
                    {meal.cuisine_style}
                  </Badge>
                )}
              </SheetDescription>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Flame className="h-4 w-4 text-primary" />
              <span>{meal.calories_est} kcal</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Beef className="h-4 w-4 text-primary" />
              <span>{meal.protein_g_est}g protein</span>
            </div>
            {totalTime > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{totalTime} min</span>
              </div>
            )}
            {meal.servings && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{meal.servings} serving{meal.servings > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Time Breakdown */}
          {(meal.prep_time_minutes || meal.cook_time_minutes) && (
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {meal.prep_time_minutes && (
                <span>Prep: {meal.prep_time_minutes} min</span>
              )}
              {meal.prep_time_minutes && meal.cook_time_minutes && <span>•</span>}
              {meal.cook_time_minutes && (
                <span>Cook: {meal.cook_time_minutes} min</span>
              )}
            </div>
          )}
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100%-180px)] py-4 space-y-6">
          {/* Ingredients */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Ingredients
            </h3>
            <ul className="space-y-2">
              {meal.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions with Style Selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Instructions
              </h3>
              
              {/* Style Segmented Control */}
              <div className="flex rounded-lg border bg-muted/50 p-0.5">
                {(['simple', 'detailed', 'gourmet'] as InstructionStyle[]).map((style) => {
                  const isDisabled = 
                    (style === 'detailed' && !hasDetailedInstructions) ||
                    (style === 'gourmet' && !hasGourmetNotes && !hasDetailedInstructions);
                  
                  return (
                    <button
                      key={style}
                      onClick={() => !isDisabled && setInstructionStyle(style)}
                      disabled={isDisabled}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                        instructionStyle === style
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                        isDisabled && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {styleLabels[style]}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {renderInstructions()}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 mt-4"
              onClick={handleCopyInstructions}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Recipe'}
            </Button>
          </div>

          {/* Meal Prep Notes */}
          {meal.meal_prep_notes && (
            <Collapsible open={showMealPrepNotes} onOpenChange={setShowMealPrepNotes}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <span className="font-semibold text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Meal Prep Tips
                  </span>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    showMealPrepNotes && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    {meal.meal_prep_notes}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Recipe Source */}
          <div className="pt-2">
            {hasSourceUrl ? (
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={handleOpenRecipeSource}
              >
                <ExternalLink className="h-4 w-4" />
                View Full Recipe
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                <Sparkles className="h-4 w-4" />
                Original BisaFit Recipe
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            {onSwap && (
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                onClick={onSwap}
                disabled={swapping}
              >
                {swapping ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Swap Meal
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
