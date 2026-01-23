import { useState, useCallback, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Flame, Beef, Wheat, Droplets, Loader2, Sparkles, 
  ChevronDown, ShoppingCart, Lightbulb, RefreshCw, 
  Coffee, UtensilsCrossed, Moon, Apple, AlertTriangle, Target,
  Camera, ShoppingBasket, Lock, Shuffle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNutrition, type Meal, type DayPlan, type NutritionTargets } from '@/hooks/useNutrition';
import { FridgeScanFlow } from '@/components/nutrition/FridgeScanFlow';
import { CuisineThemeSelector } from '@/components/nutrition/CuisineThemeSelector';
import { IngredientModeModal } from '@/components/nutrition/IngredientModeModal';
import { PlanTypeSwitcher } from '@/components/nutrition/PlanTypeSwitcher';
import { PlanModeBadge } from '@/components/nutrition/PlanModeBadge';
import { OptionalAdditionsList } from '@/components/nutrition/OptionalAdditionsList';
import { useIngredientSession, type IngredientMode } from '@/hooks/useIngredientSession';
import { usePremiumFeature } from '@/hooks/usePremiumFeature';
import { PremiumFeatureModal } from '@/components/subscription';
import { supabase } from '@/integrations/supabase/client';

const macroColors = {
  protein: { bg: 'bg-primary/10', text: 'text-primary', bar: 'bg-primary' },
  carbs: { bg: 'bg-accent/10', text: 'text-accent-foreground', bar: 'bg-accent' },
  fat: { bg: 'bg-secondary/10', text: 'text-secondary-foreground', bar: 'bg-secondary' },
};

const mealIcons: Record<string, typeof Coffee> = {
  Breakfast: Coffee,
  Lunch: UtensilsCrossed,
  Dinner: Moon,
  Snack: Apple,
  'Snack 1': Apple,
  'Snack 2': Apple,
};

function MealCard({ 
  meal, 
  dayIndex, 
  mealIndex, 
  isSnack, 
  onSwap, 
  swapping 
}: { 
  meal: Meal; 
  dayIndex: number; 
  mealIndex: number; 
  isSnack: boolean;
  onSwap: (dayIndex: number, mealIndex: number, isSnack: boolean) => void;
  swapping: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = mealIcons[meal.name] || UtensilsCrossed;
  
  // Type assertion for cuisine_style since it's a new field
  const cuisineStyle = (meal as Meal & { cuisine_style?: string }).cuisine_style;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-border">
        <CardContent className="p-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-4 cursor-pointer">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent shrink-0">
                <Icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">{meal.recipe_title}</p>
                  {cuisineStyle && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {cuisineStyle}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{meal.calories_est} kcal</span>
                  <span>•</span>
                  <span>{meal.protein_g_est}g protein</span>
                </div>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="mt-4 space-y-4 border-t pt-4">
              <div>
                <p className="text-sm font-medium mb-2">Ingredients</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {meal.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Instructions</p>
                <p className="text-sm text-muted-foreground">{meal.instructions}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwap(dayIndex, mealIndex, isSnack);
                }}
                disabled={swapping}
              >
                {swapping ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Swap Meal
              </Button>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

function DayMeals({ 
  day, 
  dayIndex, 
  onSwap, 
  swapping 
}: { 
  day: DayPlan; 
  dayIndex: number;
  onSwap: (dayIndex: number, mealIndex: number, isSnack: boolean) => void;
  swapping: boolean;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">{day.day}</h3>
      
      {day.meals.map((meal, mealIndex) => (
        <MealCard 
          key={`meal-${mealIndex}`}
          meal={meal}
          dayIndex={dayIndex}
          mealIndex={mealIndex}
          isSnack={false}
          onSwap={onSwap}
          swapping={swapping}
        />
      ))}
      
      {day.snacks.map((snack, snackIndex) => (
        <MealCard 
          key={`snack-${snackIndex}`}
          meal={snack}
          dayIndex={dayIndex}
          mealIndex={snackIndex}
          isSnack={true}
          onSwap={onSwap}
          swapping={swapping}
        />
      ))}
    </div>
  );
}

function GroceryListSection({ groceryList }: { groceryList: { produce: string[]; proteins: string[]; pantry: string[]; dairy_optional: string[] } }) {
  const sections = [
    { title: 'Produce', items: groceryList.produce, icon: '🥬' },
    { title: 'Proteins', items: groceryList.proteins, icon: '🍗' },
    { title: 'Pantry', items: groceryList.pantry, icon: '🥫' },
    { title: 'Dairy (Optional)', items: groceryList.dairy_optional, icon: '🧀' },
  ].filter(s => s.items.length > 0);

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <Card key={section.title} className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <span>{section.icon}</span>
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {section.items.map((item, i) => (
                <Badge key={i} variant="secondary" className="text-sm">
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Nutrition() {
  const {
    profile,
    loading,
    generateTargets,
    generatingTargets,
    generateMealPlan,
    generatingMealPlan,
    swapMeal,
    swappingMeal,
    refetch,
    retryTargets,
  } = useNutrition();

  const { showModal: showPremiumModal, setShowModal: setShowPremiumModal, checkPremiumAccess } = usePremiumFeature();

  const [selectedDay, setSelectedDay] = useState(0);
  const [fridgeScanOpen, setFridgeScanOpen] = useState(false);
  const [generatingFromIngredients, setGeneratingFromIngredients] = useState(false);
  const [weekCuisineTheme, setWeekCuisineTheme] = useState<string | null>(null);
  const [modeModalOpen, setModeModalOpen] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState(false);
  
  const { 
    hasActiveSession, 
    getIngredientNames, 
    clearIngredients, 
    mode, 
    status,
    updateMode,
    updateStatus,
  } = useIngredientSession();
  
  const targets = profile?.targets_json as NutritionTargets | null;
  const mealPlan = profile?.meal_plan_json;
  const isSimpleMode = profile?.nutrition_goal_style !== 'macros';
  const savedCuisinePrefs = (profile?.cuisine_preferences_json || []) as string[];
  const isFallbackTargets = targets?.source === 'fallback';
  
  // Get last plan mode from profile (with type assertion)
  const lastPlanMode = ((profile as unknown as Record<string, unknown> | null)?.last_plan_mode as 'generic' | 'ingredients') || 'generic';
  
  // Get optional additions from meal plan (if any)
  const optionalAdditions = (mealPlan as unknown as Record<string, unknown> | null)?.optional_additions as string[] | undefined;

  // Update last_plan_mode in the database
  const updateLastPlanMode = useCallback(async (mode: 'generic' | 'ingredients') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase
        .from('nutrition_profiles')
        .update({ last_plan_mode: mode })
        .eq('user_id', user.id);
    } catch (err) {
      console.error('Failed to update last_plan_mode:', err);
    }
  }, []);

  // Generate meal plan from saved ingredients
  const handleGeneratePlanFromIngredients = useCallback(async (overrideMode?: IngredientMode) => {
    const ingredientNames = getIngredientNames();
    const activeMode = overrideMode || mode;
    
    if (ingredientNames.length < 2) return;

    if (process.env.NODE_ENV === 'development') {
      console.log('[Nutrition] Generating meal plan from ingredients:', {
        count: ingredientNames.length,
        mode: activeMode,
        weekCuisineTheme,
      });
    }

    setGeneratingFromIngredients(true);
    updateStatus('generating');
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
        body: { 
          days: 7, 
          ingredients: ingredientNames, 
          weekCuisineTheme,
          ingredientMode: activeMode,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Update last plan mode to ingredients
      await updateLastPlanMode('ingredients');
      
      // Mark session as used but keep ingredients for regeneration
      updateStatus('used');
      
      await refetch();
      
      toast.success(
        activeMode === 'strict_only' 
          ? 'Meal plan generated using only what you have!' 
          : 'Meal plan generated using your ingredients!'
      );
      
      // Scroll to meal plan section
      setTimeout(() => {
        document.getElementById('meal-plan-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (err) {
      console.error('Generate from ingredients error:', err);
      // Restore status to ready on failure
      updateStatus('ready');
      toast.error("Couldn't generate plan right now. Try again.");
    } finally {
      setGeneratingFromIngredients(false);
    }
  }, [getIngredientNames, refetch, weekCuisineTheme, mode, updateLastPlanMode, updateStatus]);

  // Handle the mode selection modal confirm
  const handleModeConfirm = useCallback(async (selectedMode: IngredientMode) => {
    updateMode(selectedMode);
    await handleGeneratePlanFromIngredients(selectedMode);
  }, [handleGeneratePlanFromIngredients, updateMode]);

  // Handle the "Generate plan using these" button click
  const handleIngredientPlanClick = useCallback(async () => {
    // Gate ingredient-based plan behind premium
    if (!checkPremiumAccess()) return;
    
    const ingredientNames = getIngredientNames();
    
    if (ingredientNames.length < 2) {
      toast.error('Need at least 2 ingredients. Add more or scan again.');
      return;
    }

    // If first time using ingredients or switching from generic, show mode selection
    if (lastPlanMode !== 'ingredients') {
      setModeModalOpen(true);
    } else {
      // Reuse previous mode automatically
      await handleGeneratePlanFromIngredients();
    }
  }, [getIngredientNames, lastPlanMode, handleGeneratePlanFromIngredients, checkPremiumAccess]);

  // Handle generate generic meal plan
  const handleGenerateMealPlan = useCallback(async (days = 7) => {
    // Gate meal plan generation behind premium
    if (!checkPremiumAccess()) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
        body: { days, weekCuisineTheme },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Update last plan mode to generic
      await updateLastPlanMode('generic');
      
      await refetch();
      toast.success('Meal plan generated!');
    } catch (err) {
      console.error('Generate meal plan error:', err);
      toast.error("Couldn't generate plan right now. Try again.");
    }
  }, [refetch, weekCuisineTheme, updateLastPlanMode, checkPremiumAccess]);

  // Handle regenerate based on last plan mode
  const handleRegenerate = useCallback(async () => {
    if (lastPlanMode === 'ingredients' && (hasActiveSession || status === 'used')) {
      // Regenerate ingredient-based plan with saved mode
      const ingredientNames = getIngredientNames();
      if (ingredientNames.length >= 2) {
        await handleGeneratePlanFromIngredients();
      } else {
        // Fall back to generic if no ingredients available
        await handleGenerateMealPlan(7);
      }
    } else {
      // Regenerate generic plan
      await handleGenerateMealPlan(7);
    }
  }, [lastPlanMode, hasActiveSession, status, getIngredientNames, handleGeneratePlanFromIngredients, handleGenerateMealPlan]);

  // Handle switching plan types
  const handleSwitchToGeneric = useCallback(async () => {
    await handleGenerateMealPlan(7);
  }, [handleGenerateMealPlan]);

  const handleSwitchToIngredients = useCallback(() => {
    if (!hasActiveSession) {
      setFridgeScanOpen(true);
    } else {
      handleIngredientPlanClick();
    }
  }, [hasActiveSession, handleIngredientPlanClick]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container space-y-6 px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Nutrition</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              // Gate fridge scan behind premium
              if (!checkPremiumAccess()) return;
              setFridgeScanOpen(true);
            }}
            className="gap-2"
          >
            <Camera className="h-4 w-4" />
            Scan Fridge
          </Button>
        </div>

        {/* Fridge Scan Dialog */}
        <FridgeScanFlow 
          open={fridgeScanOpen} 
          onOpenChange={setFridgeScanOpen}
          onGeneratePlanFromIngredients={handleGeneratePlanFromIngredients}
          generatingPlan={generatingFromIngredients}
        />
        
        {/* Ingredient Mode Selection Modal */}
        <IngredientModeModal
          open={modeModalOpen}
          onOpenChange={setModeModalOpen}
          onConfirm={handleModeConfirm}
        />
        
        {/* Active ingredient session hint */}
        {hasActiveSession && !fridgeScanOpen && status !== 'used' && (
          <Alert className={cn(
            "border-primary/50",
            mode === 'strict_only' ? "bg-amber-500/10" : "bg-primary/5"
          )}>
            {mode === 'strict_only' ? (
              <Lock className="h-4 w-4 text-amber-600" />
            ) : (
              <ShoppingBasket className="h-4 w-4 text-primary" />
            )}
            <AlertDescription className="text-sm">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span>
                      {getIngredientNames().length} saved ingredients
                    </span>
                    {lastPlanMode === 'ingredients' && (
                      <Badge variant="outline" className="text-xs">
                        {mode === 'strict_only' ? (
                          <>
                            <Lock className="h-2.5 w-2.5 mr-1" />
                            Strict
                          </>
                        ) : (
                          <>
                            <Shuffle className="h-2.5 w-2.5 mr-1" />
                            Flexible
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setFridgeScanOpen(true)}
                      className="h-auto py-1 px-2 text-xs text-muted-foreground"
                    >
                      Edit ingredients
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleIngredientPlanClick}
                      disabled={generatingFromIngredients || getIngredientNames().length < 2}
                      className="h-auto py-1 px-3 gap-2"
                    >
                      {generatingFromIngredients ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" />
                          Generate plan using these
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {lastPlanMode === 'ingredients' 
                    ? (mode === 'strict_only' 
                        ? "Will use only scanned ingredients — no additions." 
                        : "Will use scanned ingredients + common staples if needed.")
                    : "Choose how strictly to use your ingredients when generating."}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Disclaimer */}
        <Alert className="border-muted bg-muted/50">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <AlertDescription className="text-sm text-muted-foreground">
            Not medical advice. Consult a healthcare professional for personalized nutrition guidance.
          </AlertDescription>
        </Alert>

        {/* Targets Section */}
        {!targets ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Set Your Nutrition Targets</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Generate personalized daily calorie and protein targets based on your goals.
                </p>
              </div>
              <Button onClick={generateTargets} disabled={generatingTargets} className="gap-2">
                {generatingTargets ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate Targets
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Fallback Warning */}
            {isFallbackTargets && (
              <Alert className="border-destructive/50 bg-destructive/10 animate-slide-up">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-sm flex items-center justify-between flex-wrap gap-2">
                  <span>Using estimated targets. Personalized AI targets temporarily unavailable.</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={retryTargets}
                    disabled={generatingTargets}
                    className="gap-2 shrink-0"
                  >
                    {generatingTargets ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Try again
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Calorie Target */}
            <Card className={cn(
              "animate-slide-up",
              isFallbackTargets 
                ? "bg-muted/50 border-dashed" 
                : "gradient-primary text-primary-foreground"
            )}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className={cn("text-sm", isFallbackTargets ? "text-muted-foreground" : "opacity-90")}>
                      Daily Calorie Target {isFallbackTargets && <Badge variant="secondary" className="ml-2 text-xs">Estimated</Badge>}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        {targets.calories_target.low}–{targets.calories_target.high}
                      </span>
                      <span className={cn("text-lg", isFallbackTargets ? "text-muted-foreground" : "opacity-80")}>kcal</span>
                    </div>
                  </div>
                  <div className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full",
                    isFallbackTargets ? "bg-muted" : "bg-primary-foreground/20"
                  )}>
                    <Flame className={cn("h-7 w-7", isFallbackTargets && "text-muted-foreground")} />
                  </div>
                </div>
                {!isFallbackTargets && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="gap-2"
                    onClick={generateTargets}
                    disabled={generatingTargets}
                  >
                    {generatingTargets ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Recalculate
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Macro Cards */}
            <div className={cn("grid gap-3 animate-slide-up", isSimpleMode ? "grid-cols-2" : "grid-cols-3")}>
              {/* Protein - Always shown */}
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-lg", macroColors.protein.bg)}>
                    <Beef className={cn("h-4 w-4", macroColors.protein.text)} />
                  </div>
                  <p className="text-xs text-muted-foreground">Protein</p>
                  <p className="text-xl font-bold">{targets.protein_g}g</p>
                  <p className="text-xs text-muted-foreground mt-1">daily target</p>
                </CardContent>
              </Card>

              {/* Water */}
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                    <Droplets className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Water</p>
                  <p className="text-xl font-bold">{targets.water_liters}L</p>
                  <p className="text-xs text-muted-foreground mt-1">daily target</p>
                </CardContent>
              </Card>

              {/* Carbs - Only in macros mode */}
              {!isSimpleMode && targets.carbs_g_optional && (
                <Card className="border-border">
                  <CardContent className="p-4">
                    <div className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-lg", macroColors.carbs.bg)}>
                      <Wheat className={cn("h-4 w-4", macroColors.carbs.text)} />
                    </div>
                    <p className="text-xs text-muted-foreground">Carbs</p>
                    <p className="text-xl font-bold">{targets.carbs_g_optional}g</p>
                    <p className="text-xs text-muted-foreground mt-1">daily target</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Notes */}
            {targets.notes && (
              <Card className="border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{targets.notes}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Meal Plan Section */}
        {targets && (
          <div id="meal-plan-section" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold">7-Day Meal Plan</h2>
                {mealPlan && (
                  <PlanModeBadge 
                    planMode={lastPlanMode} 
                    ingredientMode={mode}
                  />
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <CuisineThemeSelector
                  selectedCuisine={weekCuisineTheme}
                  onCuisineChange={setWeekCuisineTheme}
                  compact
                />
                {mealPlan && (
                  <PlanTypeSwitcher
                    currentMode={lastPlanMode}
                    hasIngredients={hasActiveSession || status === 'used'}
                    onSwitchToGeneric={handleSwitchToGeneric}
                    onSwitchToIngredients={handleSwitchToIngredients}
                  />
                )}
                <Button 
                  onClick={mealPlan ? handleRegenerate : () => handleGenerateMealPlan(7)} 
                  disabled={generatingMealPlan || generatingFromIngredients}
                  variant={mealPlan ? "outline" : "default"}
                  className="gap-2"
                >
                  {(generatingMealPlan || generatingFromIngredients) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {mealPlan ? 'Regenerate' : 'Generate Plan'}
                </Button>
              </div>
            </div>

            {!mealPlan ? (
              <Card className="border-dashed border-2">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <UtensilsCrossed className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Generate Your Meal Plan</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Get a personalized 7-day meal plan with recipes and a grocery list.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 max-w-sm mx-auto">
                    <CuisineThemeSelector
                      selectedCuisine={weekCuisineTheme}
                      onCuisineChange={setWeekCuisineTheme}
                    />
                    <Button 
                      onClick={() => handleGenerateMealPlan(7)} 
                      disabled={generatingMealPlan}
                      className="gap-2"
                    >
                      {generatingMealPlan ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Generate Plan
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setFridgeScanOpen(true)}
                      className="gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Use What I Have
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="meals" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="meals">Meals</TabsTrigger>
                  <TabsTrigger value="grocery" className="gap-1">
                    <ShoppingCart className="h-4 w-4" />
                    Grocery
                  </TabsTrigger>
                  <TabsTrigger value="tips" className="gap-1">
                    <Lightbulb className="h-4 w-4" />
                    Tips
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="meals" className="space-y-4 mt-4">
                  {/* Optional additions for flexible mode */}
                  {lastPlanMode === 'ingredients' && mode === 'flexible_prefer' && optionalAdditions && optionalAdditions.length > 0 && (
                    <OptionalAdditionsList additions={optionalAdditions} />
                  )}
                  
                  {/* Day selector */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {mealPlan.days.map((day, i) => (
                      <Button
                        key={day.day}
                        variant={selectedDay === i ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDay(i)}
                        className="shrink-0"
                      >
                        {day.day.slice(0, 3)}
                      </Button>
                    ))}
                  </div>

                  {/* Selected day meals */}
                  {mealPlan.days[selectedDay] && (
                    <DayMeals 
                      day={mealPlan.days[selectedDay]}
                      dayIndex={selectedDay}
                      onSwap={swapMeal}
                      swapping={swappingMeal}
                    />
                  )}
                </TabsContent>

                <TabsContent value="grocery" className="mt-4">
                  <GroceryListSection groceryList={mealPlan.grocery_list} />
                </TabsContent>

                <TabsContent value="tips" className="space-y-4 mt-4">
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-base">Prep Tips</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {mealPlan.prep_tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary shrink-0">💡</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-base">Swap Rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{mealPlan.swap_rules}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}

        <PremiumFeatureModal
          open={showPremiumModal}
          onOpenChange={setShowPremiumModal}
        />
      </div>
    </AppLayout>
  );
}
