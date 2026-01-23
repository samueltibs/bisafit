import { useState, useCallback } from 'react';
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
  Camera, ShoppingBasket
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNutrition, type Meal, type DayPlan, type NutritionTargets } from '@/hooks/useNutrition';
import { FridgeScanFlow } from '@/components/nutrition/FridgeScanFlow';
import { CuisineThemeSelector } from '@/components/nutrition/CuisineThemeSelector';
import { useIngredientSession } from '@/hooks/useIngredientSession';
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

  const [selectedDay, setSelectedDay] = useState(0);
  const [fridgeScanOpen, setFridgeScanOpen] = useState(false);
  const [generatingFromIngredients, setGeneratingFromIngredients] = useState(false);
  const [weekCuisineTheme, setWeekCuisineTheme] = useState<string | null>(null);
  
  const { hasActiveSession, getIngredientNames, clearIngredients } = useIngredientSession();
  
  const targets = profile?.targets_json as NutritionTargets | null;
  const mealPlan = profile?.meal_plan_json;
  const isSimpleMode = profile?.nutrition_goal_style !== 'macros';
  const savedCuisinePrefs = (profile?.cuisine_preferences_json || []) as string[];
  const isFallbackTargets = targets?.source === 'fallback';

  // Generate meal plan from saved ingredients
  const handleGeneratePlanFromIngredients = useCallback(async () => {
    const ingredientNames = getIngredientNames();
    if (ingredientNames.length < 2) return;

    setGeneratingFromIngredients(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
        body: { days: 7, ingredients: ingredientNames, weekCuisineTheme },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      clearIngredients();
      await refetch();
    } catch (err) {
      console.error('Generate from ingredients error:', err);
      throw err;
    } finally {
      setGeneratingFromIngredients(false);
    }
  }, [getIngredientNames, clearIngredients, refetch, weekCuisineTheme]);

  // Handle generate meal plan with cuisine theme
  const handleGenerateMealPlan = useCallback(async (days = 7) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
        body: { days, weekCuisineTheme },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await refetch();
    } catch (err) {
      console.error('Generate meal plan error:', err);
      throw err;
    }
  }, [refetch, weekCuisineTheme]);

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
            onClick={() => setFridgeScanOpen(true)}
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
        
        {/* Active ingredient session hint */}
        {hasActiveSession && !fridgeScanOpen && (
          <Alert className="border-primary/50 bg-primary/5">
            <ShoppingBasket className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span>
                  You have saved ingredients from your scan ({getIngredientNames().length} items).
                </span>
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
                    onClick={async () => {
                      const ingredientNames = getIngredientNames();
                      if (process.env.NODE_ENV === 'development') {
                        console.log('[Nutrition] Banner CTA clicked, ingredients count:', ingredientNames.length);
                      }
                      if (ingredientNames.length < 2) {
                        toast.error('Need at least 2 ingredients. Add more or scan again.');
                        return;
                      }
                      try {
                        await handleGeneratePlanFromIngredients();
                        toast.success('Meal plan generated using what you already have!');
                        // Scroll to meal plan section
                        setTimeout(() => {
                          document.getElementById('meal-plan-section')?.scrollIntoView({ behavior: 'smooth' });
                        }, 500);
                      } catch (err) {
                        console.error('[Nutrition] Generate from ingredients error:', err);
                        toast.error("Couldn't generate plan right now. Try again.");
                      }
                    }}
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
              <h2 className="text-lg font-semibold">7-Day Meal Plan</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <CuisineThemeSelector
                  selectedCuisine={weekCuisineTheme}
                  onCuisineChange={setWeekCuisineTheme}
                  savedPreferences={savedCuisinePrefs}
                  compact
                />
                <Button 
                  onClick={() => handleGenerateMealPlan(7)} 
                  disabled={generatingMealPlan}
                  variant={mealPlan ? "outline" : "default"}
                  className="gap-2"
                >
                  {generatingMealPlan ? (
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
                      savedPreferences={savedCuisinePrefs}
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
      </div>
    </AppLayout>
  );
}
