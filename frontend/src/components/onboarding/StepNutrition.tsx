import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Apple, ChefHat, SkipForward } from 'lucide-react';

const goalStyles = [
  { value: 'simple', label: 'Simple', description: 'Track calories + protein only' },
  { value: 'macros', label: 'Full Macros', description: 'Track protein, carbs & fats' },
];

const dietaryOptions = [
  { id: 'halal', label: 'Halal' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'lactose_free', label: 'Lactose-Free' },
  { id: 'gluten_free', label: 'Gluten-Free' },
];

const proteinEmphasis = [
  { value: 'low', label: 'Low', description: '~0.6g per lb body weight' },
  { value: 'medium', label: 'Medium', description: '~0.8g per lb body weight' },
  { value: 'high', label: 'High', description: '~1g per lb body weight' },
];

interface NutritionPreferences {
  goal_style: string;
  dietary: string[];
  allergies: string;
  protein_emphasis: string;
}

interface StepNutritionProps {
  preferences: NutritionPreferences;
  nutritionEnabled: boolean;
  onPreferencesChange: (preferences: NutritionPreferences) => void;
  onNutritionEnabledChange: (enabled: boolean) => void;
}

export function StepNutrition({ 
  preferences, 
  nutritionEnabled,
  onPreferencesChange,
  onNutritionEnabledChange,
}: StepNutritionProps) {
  const toggleDietary = (id: string) => {
    const newDietary = preferences.dietary.includes(id)
      ? preferences.dietary.filter((d) => d !== id)
      : [...preferences.dietary, id];
    onPreferencesChange({ ...preferences, dietary: newDietary });
  };

  return (
    <div className="space-y-6">
      {/* Nutrition Opt-in Choice */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Would you like help with nutrition?</Label>
        <p className="text-sm text-muted-foreground">
          BisaFit can create personalized meal plans and help you track your nutrition goals.
        </p>
        
        <div className="grid grid-cols-1 gap-3 mt-4">
          {/* Yes, help me with nutrition */}
          <Card 
            className={cn(
              "cursor-pointer transition-all border-2",
              nutritionEnabled 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            )}
            onClick={() => onNutritionEnabledChange(true)}
          >
            <CardContent className="flex items-start gap-4 p-4">
              <div className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                nutritionEnabled ? "bg-primary/20" : "bg-muted"
              )}>
                <ChefHat className={cn(
                  "h-6 w-6",
                  nutritionEnabled ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Yes, help me with nutrition</span>
                  {nutritionEnabled && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Get personalized meal plans, macro tracking, and nutrition insights
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Skip for now */}
          <Card 
            className={cn(
              "cursor-pointer transition-all border-2",
              !nutritionEnabled 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            )}
            onClick={() => onNutritionEnabledChange(false)}
          >
            <CardContent className="flex items-start gap-4 p-4">
              <div className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                !nutritionEnabled ? "bg-primary/20" : "bg-muted"
              )}>
                <SkipForward className={cn(
                  "h-6 w-6",
                  !nutritionEnabled ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Skip for now</span>
                  {!nutritionEnabled && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  I'll manage nutrition myself. You can enable this later in Settings.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Show nutrition preferences only if opted in */}
      {nutritionEnabled && (
        <>
          <div className="border-t border-border pt-6 space-y-3">
            <Label className="text-base font-medium">How do you want to track nutrition?</Label>
            <RadioGroup
              value={preferences.goal_style}
              onValueChange={(v) => onPreferencesChange({ ...preferences, goal_style: v })}
              className="grid grid-cols-2 gap-3"
            >
              {goalStyles.map((style) => (
                <div
                  key={style.value}
                  onClick={() => onPreferencesChange({ ...preferences, goal_style: style.value })}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
                    preferences.goal_style === style.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value={style.value} id={style.value} className="sr-only" />
                  <Label htmlFor={style.value} className="cursor-pointer font-medium">
                    {style.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{style.description}</p>
                </div>
              ))}
            </RadioGroup>
          </div>

          {preferences.goal_style === 'simple' && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Protein emphasis</Label>
              <RadioGroup
                value={preferences.protein_emphasis}
                onValueChange={(v) => onPreferencesChange({ ...preferences, protein_emphasis: v })}
                className="space-y-2"
              >
                {proteinEmphasis.map((level) => (
                  <div
                    key={level.value}
                    onClick={() => onPreferencesChange({ ...preferences, protein_emphasis: level.value })}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all",
                      preferences.protein_emphasis === level.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem value={level.value} id={level.value} />
                    <div>
                      <Label htmlFor={level.value} className="cursor-pointer font-medium">
                        {level.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{level.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-base font-medium">Dietary preferences</Label>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => toggleDietary(option.id)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-full border-2 px-4 py-2 transition-all",
                    preferences.dietary.includes(option.id)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Checkbox
                    id={`diet-${option.id}`}
                    checked={preferences.dietary.includes(option.id)}
                    onCheckedChange={() => toggleDietary(option.id)}
                    className="sr-only"
                  />
                  <Label htmlFor={`diet-${option.id}`} className="cursor-pointer text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies" className="text-base font-medium">
              Food allergies or restrictions
            </Label>
            <Textarea
              id="allergies"
              placeholder="e.g., peanuts, shellfish, soy..."
              value={preferences.allergies}
              onChange={(e) => onPreferencesChange({ ...preferences, allergies: e.target.value })}
              className="min-h-[80px]"
            />
          </div>
        </>
      )}
    </div>
  );
}
