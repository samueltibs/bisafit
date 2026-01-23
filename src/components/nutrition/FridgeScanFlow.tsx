import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Camera, Upload, X, Loader2, ChevronDown, Plus, 
  Trash2, CheckCircle2, UtensilsCrossed, Clock, Sparkles,
  ShoppingBasket, AlertTriangle, RefreshCw, Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DetectedIngredient {
  name: string;
  confidence: number;
  selected: boolean;
}

interface GeneratedMeal {
  meal_name: string;
  recipe_title: string;
  uses_ingredients: string[];
  missing_optional: string[];
  ingredients_with_amounts: string[];
  instructions: string;
  protein_g_est: number;
  calories_est: number;
  prep_time_minutes: number;
}

interface MealsResult {
  meals: GeneratedMeal[];
  leftover_tips: string[];
  shopping_suggestions: string[];
  note?: string;
  error?: string;
}

type FlowStep = 'select-mode' | 'upload' | 'review' | 'meals';
type ScanMode = 'fridge' | 'receipt';

interface FridgeScanFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToMealPlan?: (meal: GeneratedMeal) => void;
}

export function FridgeScanFlow({ open, onOpenChange, onAddToMealPlan }: FridgeScanFlowProps) {
  const [step, setStep] = useState<FlowStep>('select-mode');
  const [scanMode, setScanMode] = useState<ScanMode>('fridge');
  const [images, setImages] = useState<string[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [ingredients, setIngredients] = useState<DetectedIngredient[]>([]);
  const [detectionNotes, setDetectionNotes] = useState('');
  const [ignoredItems, setIgnoredItems] = useState<string[]>([]);
  const [lowConfidenceWarning, setLowConfidenceWarning] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');
  const [generating, setGenerating] = useState(false);
  const [mealsResult, setMealsResult] = useState<MealsResult | null>(null);
  const [swappingIndex, setSwappingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxImages = scanMode === 'receipt' ? 2 : 3;

  const resetFlow = () => {
    setStep('select-mode');
    setScanMode('fridge');
    setImages([]);
    setIngredients([]);
    setDetectionNotes('');
    setIgnoredItems([]);
    setLowConfidenceWarning(false);
    setNewIngredient('');
    setMealsResult(null);
    setDetecting(false);
    setGenerating(false);
  };

  const handleClose = () => {
    resetFlow();
    onOpenChange(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    for (let i = 0; i < Math.min(files.length, maxImages - images.length); i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        newImages.push(base64);
      }
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages].slice(0, maxImages));
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const detectIngredients = async () => {
    if (images.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    setDetecting(true);
    try {
      const functionName = scanMode === 'receipt' 
        ? 'detect-ingredients-from-receipt' 
        : 'detect-ingredients';

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { images },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const detected = (data.ingredients || []).map((ing: { name: string; confidence: number }) => ({
        ...ing,
        selected: ing.confidence >= 0.5,
      }));

      setIngredients(detected);
      setDetectionNotes(data.notes || '');
      setIgnoredItems(data.ignored_items || []);
      setLowConfidenceWarning(data.low_confidence_warning || false);
      setStep('review');

      if (detected.length === 0) {
        const msg = scanMode === 'receipt' 
          ? 'No food items found on receipt. Try a clearer photo or add items manually.'
          : 'No ingredients detected. Try a clearer photo or add items manually.';
        toast.info(msg);
      }
    } catch (err) {
      console.error('Detection error:', err);
      toast.error('Failed to analyze images. Please try again.');
    } finally {
      setDetecting(false);
    }
  };

  const toggleIngredient = (index: number) => {
    setIngredients(prev => prev.map((ing, i) => 
      i === index ? { ...ing, selected: !ing.selected } : ing
    ));
  };

  const updateIngredientName = (index: number, name: string) => {
    setIngredients(prev => prev.map((ing, i) => 
      i === index ? { ...ing, name } : ing
    ));
  };

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const addManualIngredient = () => {
    if (!newIngredient.trim()) return;
    setIngredients(prev => [
      ...prev,
      { name: newIngredient.trim(), confidence: 1, selected: true },
    ]);
    setNewIngredient('');
  };

  const generateMeals = async () => {
    const selectedIngredients = ingredients.filter(i => i.selected).map(i => i.name);
    
    if (selectedIngredients.length < 2) {
      toast.error('Please select at least 2 ingredients');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-meals-from-ingredients', {
        body: { ingredients: selectedIngredients },
      });

      if (error) throw error;

      if (data?.error && !data?.meals) {
        toast.error(data.error);
        return;
      }

      setMealsResult(data);
      setStep('meals');

      if (data.meals?.length === 0) {
        toast.info('Could not generate meals. Try adding more ingredients.');
      }
    } catch (err) {
      console.error('Generate meals error:', err);
      toast.error('Failed to generate meals. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const swapMeal = async (index: number) => {
    const selectedIngredients = ingredients.filter(i => i.selected).map(i => i.name);
    
    setSwappingIndex(index);
    try {
      const { data, error } = await supabase.functions.invoke('generate-meals-from-ingredients', {
        body: { ingredients: selectedIngredients },
      });

      if (error) throw error;

      if (data?.meals?.[0]) {
        setMealsResult(prev => {
          if (!prev) return prev;
          const newMeals = [...prev.meals];
          newMeals[index] = data.meals[0];
          return { ...prev, meals: newMeals };
        });
        toast.success('Meal swapped!');
      }
    } catch (err) {
      console.error('Swap meal error:', err);
      toast.error('Failed to swap meal');
    } finally {
      setSwappingIndex(null);
    }
  };

  const handleAddToMealPlan = (meal: GeneratedMeal) => {
    if (onAddToMealPlan) {
      onAddToMealPlan(meal);
      toast.success(`"${meal.recipe_title}" added to your meal plan!`);
    } else {
      toast.info('Feature coming soon!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {scanMode === 'receipt' ? <Receipt className="h-5 w-5" /> : <ShoppingBasket className="h-5 w-5" />}
            {step === 'select-mode' && 'Scan Ingredients'}
            {step === 'upload' && (scanMode === 'receipt' ? 'Scan Receipt' : 'Scan Your Fridge')}
            {step === 'review' && 'Confirm Ingredients'}
            {step === 'meals' && 'Meal Suggestions'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select-mode' && 'Choose how you want to add ingredients'}
            {step === 'upload' && (scanMode === 'receipt' 
              ? 'Upload photos of your grocery receipt to extract food items' 
              : 'Upload photos of your fridge or pantry to get meal ideas')}
            {step === 'review' && 'Review and edit the detected ingredients'}
            {step === 'meals' && 'Meals generated using what you already have'}
          </DialogDescription>
        </DialogHeader>

        {/* Mode Selection Step */}
        {step === 'select-mode' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setScanMode('fridge'); setStep('upload'); }}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-muted hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">Scan Fridge</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Photo of fridge or pantry
                  </p>
                </div>
              </button>

              <button
                onClick={() => { setScanMode('receipt'); setStep('upload'); }}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-muted hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">Scan Receipt</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Photo of grocery receipt
                  </p>
                </div>
              </button>
            </div>

            <Button variant="outline" onClick={handleClose} className="w-full">
              Cancel
            </Button>
          </div>
        )}

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4">
            <Alert className="border-primary/50 bg-primary/5">
              {scanMode === 'receipt' ? (
                <Receipt className="h-4 w-4 text-primary" />
              ) : (
                <Camera className="h-4 w-4 text-primary" />
              )}
              <AlertDescription className="text-sm">
                {scanMode === 'receipt' 
                  ? 'Take clear photos of your grocery receipt. Only food items will be extracted – prices and non-food items are ignored.'
                  : 'Take clear photos of your fridge shelves and pantry. Images are only used for ingredient detection and are not stored.'}
              </AlertDescription>
            </Alert>

            {/* Image Preview */}
            {images.length > 0 && (
              <div className={cn("grid gap-2", scanMode === 'receipt' ? "grid-cols-2" : "grid-cols-3")}>
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={img} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-background"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {images.length < maxImages && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">
                    {scanMode === 'receipt' ? 'Upload receipt photos' : 'Upload photos'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {images.length}/{maxImages} photos • JPG, PNG
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setImages([]); setStep('select-mode'); }} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={detectIngredients} 
                disabled={images.length === 0 || detecting}
                className="flex-1 gap-2"
              >
                {detecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Detect Ingredients
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && (
          <div className="space-y-4">
            {lowConfidenceWarning && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-sm">
                  Some items had low confidence. Please review carefully and correct any errors.
                </AlertDescription>
              </Alert>
            )}

            {detectionNotes && (
              <Alert className="border-muted bg-muted/50">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <AlertDescription className="text-sm">{detectionNotes}</AlertDescription>
              </Alert>
            )}

            {ignoredItems.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                    <span className="text-xs">{ignoredItems.length} non-food items ignored</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {ignoredItems.map((item, i) => (
                      <Badge key={i} variant="outline" className="text-xs text-muted-foreground">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {ingredients.map((ing, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg border",
                    ing.selected ? "border-primary/30 bg-primary/5" : "border-muted"
                  )}
                >
                  <Checkbox
                    checked={ing.selected}
                    onCheckedChange={() => toggleIngredient(i)}
                  />
                  <Input
                    value={ing.name}
                    onChange={(e) => updateIngredientName(i, e.target.value)}
                    className="flex-1 h-8 text-sm"
                  />
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {Math.round(ing.confidence * 100)}%
                  </Badge>
                  <button onClick={() => removeIngredient(i)} className="p-1 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {ingredients.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No ingredients detected. Add items manually below.
                </p>
              )}
            </div>

            {/* Add Manual */}
            <div className="flex gap-2">
              <Input
                placeholder="Add ingredient..."
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addManualIngredient()}
              />
              <Button variant="outline" size="icon" onClick={addManualIngredient}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={generateMeals} 
                disabled={ingredients.filter(i => i.selected).length < 2 || generating}
                className="flex-1 gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <UtensilsCrossed className="h-4 w-4" />
                    Generate Meals
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Meals Step */}
        {step === 'meals' && mealsResult && (
          <div className="space-y-4">
            <Alert className="border-primary/50 bg-primary/10">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                These meals were generated using what you already have.
              </AlertDescription>
            </Alert>

            {mealsResult.meals.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    Not enough ingredients to generate complete meals. Try adding more items.
                  </p>
                  <Button variant="outline" onClick={() => setStep('review')} className="mt-4">
                    Edit Ingredients
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mealsResult.meals.map((meal, i) => (
                  <MealSuggestionCard
                    key={i}
                    meal={meal}
                    onSwap={() => swapMeal(i)}
                    onAddToPlan={() => handleAddToMealPlan(meal)}
                    swapping={swappingIndex === i}
                  />
                ))}
              </div>
            )}

            {mealsResult.leftover_tips.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="text-sm">Leftover Tips</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  {mealsResult.leftover_tips.map((tip, i) => (
                    <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span>💡</span> {tip}
                    </p>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('review')} className="flex-1">
                Edit Ingredients
              </Button>
              <Button onClick={handleClose} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MealSuggestionCard({ 
  meal, 
  onSwap, 
  onAddToPlan, 
  swapping 
}: { 
  meal: GeneratedMeal; 
  onSwap: () => void; 
  onAddToPlan: () => void;
  swapping: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <Card className="border-border">
        <CardContent className="p-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-start gap-3 cursor-pointer">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{meal.recipe_title}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {meal.prep_time_minutes} min
                  </span>
                  <span>•</span>
                  <span>{meal.calories_est} kcal</span>
                  <span>•</span>
                  <span>{meal.protein_g_est}g protein</span>
                </div>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                expanded && "rotate-180"
              )} />
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="pt-4 space-y-3">
            {/* Uses Ingredients */}
            <div>
              <p className="text-xs font-medium mb-1">Uses your ingredients:</p>
              <div className="flex flex-wrap gap-1">
                {meal.uses_ingredients.map((ing, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {ing}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Missing Optional */}
            {meal.missing_optional.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1 text-muted-foreground">Optional additions:</p>
                <div className="flex flex-wrap gap-1">
                  {meal.missing_optional.map((ing, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {ing}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Full Ingredients */}
            <div>
              <p className="text-xs font-medium mb-1">Ingredients:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {meal.ingredients_with_amounts.map((ing, i) => (
                  <li key={i}>• {ing}</li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <p className="text-xs font-medium mb-1">Instructions:</p>
              <p className="text-xs text-muted-foreground">{meal.instructions}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => { e.stopPropagation(); onSwap(); }}
                disabled={swapping}
                className="gap-1"
              >
                {swapping ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Swap
              </Button>
              <Button 
                size="sm" 
                onClick={(e) => { e.stopPropagation(); onAddToPlan(); }}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Add to Plan
              </Button>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
