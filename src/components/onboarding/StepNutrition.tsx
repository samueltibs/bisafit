import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

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
  onPreferencesChange: (preferences: NutritionPreferences) => void;
}

export function StepNutrition({ preferences, onPreferencesChange }: StepNutritionProps) {
  const toggleDietary = (id: string) => {
    const newDietary = preferences.dietary.includes(id)
      ? preferences.dietary.filter((d) => d !== id)
      : [...preferences.dietary, id];
    onPreferencesChange({ ...preferences, dietary: newDietary });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
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
    </div>
  );
}
