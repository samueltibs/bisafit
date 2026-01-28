import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, PenLine, X, Loader2, Plus, Trash2, 
  Clock, UtensilsCrossed, CheckCircle2, Copy, Edit2,
  Coffee, Moon, Apple, ImageIcon, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMealLog, calculateTotals, createFoodLogItem, detectedItemToFoodLogItem } from '@/hooks/useMealLog';
import type { 
  FoodLogItem, 
  MealType, 
  EntryMethod,
  FoodUnit,
} from '@/types/mealLog';
import { getDefaultUnits, formatQuantityWithUnit, getUnitLabel } from '@/lib/foodUnits';

interface RecentMealLog {
  id: string;
  logged_at: string;
  meal_type: string;
  items_json: any[];
  total_calories: number;
}

type FlowStep = 'select-method' | 'photo-capture' | 'photo-review' | 'manual-entry' | 'meal-context' | 'copy-recent';

const mealTypeIcons: Record<MealType, typeof Coffee> = {
  Breakfast: Coffee,
  Lunch: UtensilsCrossed,
  Dinner: Moon,
  Snack: Apple,
};

interface LogMealFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMealLogged?: () => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

export function LogMealFlow({ open, onOpenChange, onMealLogged }: LogMealFlowProps) {
  const { 
    measurementSystem, 
    defaultUnits, 
    primaryWeightUnit,
    saving,
    createMealLog,
    detectFoodsFromPhoto,
  } = useMealLog();

  const [step, setStep] = useState<FlowStep>('select-method');
  const [entryMethod, setEntryMethod] = useState<EntryMethod>('manual');
  
  // Photo flow state
  const [image, setImage] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  
  // Items state
  const [items, setItems] = useState<FoodLogItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // Meal context
  const [mealType, setMealType] = useState<MealType>('Lunch');
  const [mealTime, setMealTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');
  
  // Recent meals for copy feature
  const [recentMeals, setRecentMeals] = useState<RecentMealLog[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  
  // New item form
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState<FoodUnit>(primaryWeightUnit);
  const [newItemCalories, setNewItemCalories] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate totals
  const totals = calculateTotals(items);

  // Check if any item has AI confidence (is estimated)
  const hasEstimatedItems = items.some(item => item.confidence !== undefined && item.confidence < 1);

  const resetFlow = () => {
    setStep('select-method');
    setImage(null);
    setItems([]);
    setEditingItemId(null);
    setMealType('Lunch');
    setMealTime(() => {
      const now = new Date();
      return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    });
    setNotes('');
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemUnit(primaryWeightUnit);
    setNewItemCalories('');
    setRecentMeals([]);
  };

  const handleClose = () => {
    resetFlow();
    onOpenChange(false);
  };

  // Load recent meals for copy feature
  const loadRecentMeals = async () => {
    setLoadingRecent(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('meal_logs')
        .select('id, logged_at, meal_type, items_json, total_calories')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      setRecentMeals((data || []).map(d => ({
        ...d,
        items_json: (d.items_json as unknown) as any[],
      })));
    } catch (err) {
      console.error('Failed to load recent meals:', err);
      toast.error('Failed to load recent meals');
    } finally {
      setLoadingRecent(false);
    }
  };

  // Photo handling
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      handlePhotoDetection(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoDetection = async (imageData: string) => {
    setDetecting(true);
    setStep('photo-review');
    
    try {
      const detectedItems = await detectFoodsFromPhoto(imageData);
      setItems(detectedItems);
    } finally {
      setDetecting(false);
    }
  };

  // Item management
  const addNewItem = () => {
    if (!newItemName.trim()) return;

    const quantity = parseFloat(newItemQuantity) || undefined;
    const calories = parseInt(newItemCalories) || undefined;

    const newItem = createFoodLogItem({
      name: newItemName.trim(),
      quantity,
      unit: quantity ? newItemUnit : undefined,
      calories,
      portionDisplay: quantity 
        ? formatQuantityWithUnit(quantity, newItemUnit)
        : '1 serving',
      source: 'user_added',
    });

    setItems(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemCalories('');
  };

  const updateItem = (id: string, updates: Partial<FoodLogItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const updateItemMacro = (id: string, macro: 'protein' | 'carbs' | 'fat', value: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        macros: {
          protein: item.macros?.protein || 0,
          carbs: item.macros?.carbs || 0,
          fat: item.macros?.fat || 0,
          [macro]: value,
        },
      };
    }));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const copyFromRecent = (meal: RecentMealLog) => {
    // Convert old format items to new FoodLogItem format
    const copiedItems: FoodLogItem[] = meal.items_json.map((item: any) => ({
      id: generateId(),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      grams: item.grams,
      calories: item.calories,
      macros: item.macros || {
        protein: item.protein_g || 0,
        carbs: item.carbs_g || 0,
        fat: item.fat_g || 0,
      },
      confidence: undefined, // Not estimated since it's copied
      source: 'copied' as const,
      portionDisplay: item.portionDisplay || item.portion || '1 serving',
    }));
    
    setItems(copiedItems);
    setMealType(meal.meal_type as MealType);
    setEntryMethod('copy');
    setStep('meal-context');
    toast.success('Copied from recent meal');
  };

  // Save meal log
  const saveMealLog = async () => {
    if (items.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    // Parse time and create logged_at timestamp
    const [hours, minutes] = mealTime.split(':').map(Number);
    const loggedAt = new Date();
    loggedAt.setHours(hours, minutes, 0, 0);

    const result = await createMealLog({
      mealType,
      source: entryMethod,
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        macros: item.macros,
        portionDisplay: item.portionDisplay,
        confidence: item.confidence,
        source: item.source,
      })),
      timestamp: loggedAt.toISOString(),
      photoUrl: image || undefined,
      notes: notes || undefined,
    });

    if (result) {
      onMealLogged?.();
      handleClose();
    }
  };

  const MealTypeIcon = mealTypeIcons[mealType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            {step === 'select-method' && 'Log Meal'}
            {step === 'photo-capture' && 'Take Photo'}
            {step === 'photo-review' && 'Review & Confirm'}
            {step === 'manual-entry' && 'Add Foods'}
            {step === 'meal-context' && 'Meal Details'}
            {step === 'copy-recent' && 'Copy from Recent'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select-method' && 'How would you like to log your meal?'}
            {step === 'photo-capture' && 'Take or upload a photo of your meal'}
            {step === 'photo-review' && 'Review detected foods and adjust as needed'}
            {step === 'manual-entry' && 'Add each food item you ate'}
            {step === 'meal-context' && 'Add meal type and time'}
            {step === 'copy-recent' && 'Select a recent meal to copy'}
          </DialogDescription>
        </DialogHeader>

        {/* Method Selection */}
        {step === 'select-method' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setEntryMethod('photo');
                  fileInputRef.current?.click();
                }}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-muted hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Snap a Photo</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI estimates calories
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setEntryMethod('manual');
                  setStep('manual-entry');
                }}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-muted hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <PenLine className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Manual Entry</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Type your foods
                  </p>
                </div>
              </button>
            </div>

            {/* Copy from recent shortcut */}
            <Button
              variant="outline"
              onClick={() => {
                setEntryMethod('copy');
                loadRecentMeals();
                setStep('copy-recent');
              }}
              className="w-full gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy from recent meal
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />

            <Button variant="ghost" onClick={handleClose} className="w-full">
              Cancel
            </Button>
          </div>
        )}

        {/* Photo Review Step */}
        {step === 'photo-review' && (
          <div className="space-y-4">
            {/* Photo preview */}
            {image && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <img src={image} alt="Meal" className="w-full h-full object-cover" />
                {detecting && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm font-medium">Analyzing your meal...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!detecting && (
              <>
                {/* Estimated warning */}
                {hasEstimatedItems && (
                  <Alert className="bg-warning/10 border-warning/30">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-warning-foreground">
                      These values are <strong>AI estimates</strong>. Please review and adjust as needed.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Detected items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Detected Foods</Label>
                    <Badge variant="secondary">{items.length} items</Badge>
                  </div>
                  
                  {items.length === 0 ? (
                    <Alert>
                      <ImageIcon className="h-4 w-4" />
                      <AlertDescription>
                        No foods detected. Try adding items manually below.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {items.map((item) => (
                        <Card key={item.id} className="p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                {item.confidence !== undefined && item.confidence < 0.8 && (
                                  <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">
                                    Low confidence
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{item.portionDisplay}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="shrink-0">
                                {item.calories || 0} kcal
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setEditingItemId(editingItemId === item.id ? null : item.id)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Edit form */}
                          {editingItemId === item.id && (
                            <div className="mt-3 pt-3 border-t space-y-2">
                              <Input
                                value={item.name}
                                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                placeholder="Food name"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  value={item.portionDisplay || ''}
                                  onChange={(e) => updateItem(item.id, { portionDisplay: e.target.value })}
                                  placeholder="Portion"
                                />
                                <Input
                                  type="number"
                                  value={item.calories || ''}
                                  onChange={(e) => updateItem(item.id, { calories: parseInt(e.target.value) || 0 })}
                                  placeholder="Calories"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Protein (g)</Label>
                                  <Input
                                    type="number"
                                    value={item.macros?.protein || ''}
                                    onChange={(e) => updateItemMacro(item.id, 'protein', parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Carbs (g)</Label>
                                  <Input
                                    type="number"
                                    value={item.macros?.carbs || ''}
                                    onChange={(e) => updateItemMacro(item.id, 'carbs', parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Fat (g)</Label>
                                  <Input
                                    type="number"
                                    value={item.macros?.fat || ''}
                                    onChange={(e) => updateItemMacro(item.id, 'fat', parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add missing item */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Add missing item</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Food name"
                      className="flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && addNewItem()}
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={addNewItem}
                      disabled={!newItemName.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Totals */}
                {items.length > 0 && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          Total {hasEstimatedItems && <span className="text-xs text-muted-foreground">(Estimated)</span>}
                        </span>
                        <span className="text-lg font-bold">{totals.calories} kcal</span>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>P: {Math.round(totals.macros.protein)}g</span>
                        <span>C: {Math.round(totals.macros.carbs)}g</span>
                        <span>F: {Math.round(totals.macros.fat)}g</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => setStep('meal-context')} 
                    className="flex-1"
                    disabled={items.length === 0}
                  >
                    Continue
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Manual Entry Step */}
        {step === 'manual-entry' && (
          <div className="space-y-4">
            {/* Items list */}
            {items.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.portionDisplay}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(item.calories || 0) > 0 && (
                          <Badge variant="outline" className="shrink-0">
                            {item.calories} kcal
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Add item form */}
            <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Food name (required)"
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                  placeholder="Qty"
                />
                <Select value={newItemUnit} onValueChange={(v) => setNewItemUnit(v as FoodUnit)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultUnits.map(unit => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={newItemCalories}
                  onChange={(e) => setNewItemCalories(e.target.value)}
                  placeholder="Calories"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Calories and macros are optional. You can add them later.
              </p>
              <Button
                variant="secondary"
                onClick={addNewItem}
                disabled={!newItemName.trim()}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>

            {/* Totals */}
            {items.length > 0 && totals.calories > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total</span>
                    <span className="text-lg font-bold">{totals.calories} kcal</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('select-method')}>
                Back
              </Button>
              <Button 
                onClick={() => setStep('meal-context')} 
                className="flex-1"
                disabled={items.length === 0}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Copy from Recent Step */}
        {step === 'copy-recent' && (
          <div className="space-y-4">
            {loadingRecent ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : recentMeals.length === 0 ? (
              <Alert>
                <UtensilsCrossed className="h-4 w-4" />
                <AlertDescription>
                  No recent meals found. Start logging to build your history!
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {recentMeals.map((meal) => {
                  const Icon = mealTypeIcons[meal.meal_type as MealType] || UtensilsCrossed;
                  const date = new Date(meal.logged_at);
                  return (
                    <Card 
                      key={meal.id} 
                      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => copyFromRecent(meal)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{meal.meal_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {date.toLocaleDateString()} • {meal.items_json.length} items
                          </p>
                        </div>
                        <Badge variant="outline">{meal.total_calories} kcal</Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            <Button variant="outline" onClick={() => setStep('select-method')} className="w-full">
              Back
            </Button>
          </div>
        )}

        {/* Meal Context Step */}
        {step === 'meal-context' && (
          <div className="space-y-4">
            {/* Meal type */}
            <div className="space-y-2">
              <Label>Meal Type</Label>
              <div className="grid grid-cols-4 gap-2">
                {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as MealType[]).map((type) => {
                  const Icon = mealTypeIcons[type];
                  const isSelected = mealType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setMealType(type)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors",
                        isSelected 
                          ? "border-primary bg-primary/10" 
                          : "border-muted hover:border-primary/50"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("text-xs font-medium", isSelected && "text-primary")}>{type}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="meal-time">Time</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="meal-time"
                  type="time"
                  value={mealTime}
                  onChange={(e) => setMealTime(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="meal-notes">Notes (optional)</Label>
              <Textarea
                id="meal-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did this meal make you feel?"
                rows={2}
              />
            </div>

            {/* Summary */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <MealTypeIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{mealType}</p>
                    <p className="text-sm text-muted-foreground">
                      {items.length} items • {totals.calories} kcal
                      {hasEstimatedItems && ' (estimated)'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep(entryMethod === 'photo' ? 'photo-review' : 'manual-entry')}
              >
                Back
              </Button>
              <Button 
                onClick={saveMealLog} 
                className="flex-1 gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Save Log
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
