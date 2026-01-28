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
  Coffee, Moon, Apple, ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import { useUserProfile } from '@/hooks/useUserProfile';

interface FoodItem {
  id: string;
  name: string;
  portion: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence?: number;
}

interface RecentMealLog {
  id: string;
  logged_at: string;
  meal_type: string;
  items_json: FoodItem[];
  total_calories: number;
}

type FlowStep = 'select-method' | 'photo-capture' | 'photo-review' | 'manual-entry' | 'meal-context' | 'copy-recent';
type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

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
  const { profile } = useUserProfile();
  const [step, setStep] = useState<FlowStep>('select-method');
  const [entryMethod, setEntryMethod] = useState<'photo' | 'manual' | 'copy'>('manual');
  
  // Photo flow state
  const [image, setImage] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  
  // Items state
  const [items, setItems] = useState<FoodItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // Meal context
  const [mealType, setMealType] = useState<MealType>('Lunch');
  const [mealTime, setMealTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Recent meals for copy feature
  const [recentMeals, setRecentMeals] = useState<RecentMealLog[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  
  // New item form
  const [newItemName, setNewItemName] = useState('');
  const [newItemPortion, setNewItemPortion] = useState('');
  const [newItemCalories, setNewItemCalories] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const unitSystem = profile?.unit_preference === 'imperial' ? 'imperial' : 'metric';

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
    setNewItemPortion('');
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
        items_json: (d.items_json as unknown) as FoodItem[],
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
      detectFoodsFromPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const detectFoodsFromPhoto = async (imageData: string) => {
    setDetecting(true);
    setStep('photo-review');
    
    try {
      const { data, error } = await supabase.functions.invoke('detect-meal-from-photo', {
        body: { image: imageData },
      });

      if (error) throw error;

      if (data?.error && (!data?.items || data.items.length === 0)) {
        toast.error(data.error);
        return;
      }

      const detectedItems: FoodItem[] = (data.items || []).map((item: Omit<FoodItem, 'id'>) => ({
        ...item,
        id: generateId(),
      }));

      setItems(detectedItems);
      trackEvent('meal_photo_scanned', { item_count: detectedItems.length });

      if (detectedItems.length === 0) {
        toast.info('No foods detected. Add items manually.');
      }
    } catch (err) {
      console.error('Detection error:', err);
      toast.error('Failed to analyze photo. Try again or add manually.');
      trackEvent('meal_scan_error', { reason: err instanceof Error ? err.message : 'unknown' });
    } finally {
      setDetecting(false);
    }
  };

  // Item management
  const addNewItem = () => {
    if (!newItemName.trim()) return;

    const newItem: FoodItem = {
      id: generateId(),
      name: newItemName.trim(),
      portion: newItemPortion.trim() || '1 serving',
      calories: parseInt(newItemCalories) || 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
    };

    setItems(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemPortion('');
    setNewItemCalories('');
  };

  const updateItem = (id: string, updates: Partial<FoodItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const copyFromRecent = (meal: RecentMealLog) => {
    const copiedItems = meal.items_json.map(item => ({
      ...item,
      id: generateId(),
    }));
    setItems(copiedItems);
    setMealType(meal.meal_type as MealType);
    setStep('meal-context');
    toast.success('Copied from recent meal');
  };

  // Calculate totals
  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein_g || 0),
      carbs: acc.carbs + (item.carbs_g || 0),
      fat: acc.fat + (item.fat_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Save meal log
  const saveMealLog = async () => {
    if (items.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Parse time and create logged_at timestamp
      const [hours, minutes] = mealTime.split(':').map(Number);
      const loggedAt = new Date();
      loggedAt.setHours(hours, minutes, 0, 0);

      const { error } = await supabase
        .from('meal_logs')
        .insert([{
          user_id: user.id,
          logged_at: loggedAt.toISOString(),
          meal_type: mealType,
          photo_url: image || null,
          items_json: JSON.parse(JSON.stringify(items)),
          total_calories: Math.round(totals.calories),
          total_protein_g: Math.round(totals.protein * 10) / 10,
          total_carbs_g: Math.round(totals.carbs * 10) / 10,
          total_fat_g: Math.round(totals.fat * 10) / 10,
          notes: notes || null,
          entry_method: entryMethod,
        }]);

      if (error) throw error;

      trackEvent('meal_logged', { 
        method: entryMethod, 
        item_count: items.length,
        meal_type: mealType,
      });

      toast.success('Meal logged!');
      onMealLogged?.();
      handleClose();
    } catch (err) {
      console.error('Save meal log error:', err);
      toast.error('Failed to save meal. Please try again.');
    } finally {
      setSaving(false);
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
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.portion}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="shrink-0">
                                {item.calories} kcal
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
                                  value={item.portion}
                                  onChange={(e) => updateItem(item.id, { portion: e.target.value })}
                                  placeholder="Portion"
                                />
                                <Input
                                  type="number"
                                  value={item.calories || ''}
                                  onChange={(e) => updateItem(item.id, { calories: parseInt(e.target.value) || 0 })}
                                  placeholder="Calories"
                                />
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
                        <span className="font-medium">Total</span>
                        <span className="text-lg font-bold">{Math.round(totals.calories)} kcal</span>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>P: {Math.round(totals.protein)}g</span>
                        <span>C: {Math.round(totals.carbs)}g</span>
                        <span>F: {Math.round(totals.fat)}g</span>
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
                        <p className="text-xs text-muted-foreground">{item.portion}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.calories > 0 && (
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
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={newItemPortion}
                  onChange={(e) => setNewItemPortion(e.target.value)}
                  placeholder={`Amount (e.g., 1 ${unitSystem === 'imperial' ? 'cup' : 'serving'})`}
                />
                <Input
                  type="number"
                  value={newItemCalories}
                  onChange={(e) => setNewItemCalories(e.target.value)}
                  placeholder="Calories (optional)"
                />
              </div>
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
                    <span className="text-lg font-bold">{Math.round(totals.calories)} kcal</span>
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
                      {items.length} items • {Math.round(totals.calories)} kcal
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
