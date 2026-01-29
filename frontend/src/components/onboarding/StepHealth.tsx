import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const injuryAreas = [
  { id: 'knee', label: 'Knee', icon: '🦵' },
  { id: 'back', label: 'Back', icon: '🔙' },
  { id: 'shoulder', label: 'Shoulder', icon: '💪' },
  { id: 'elbow', label: 'Elbow', icon: '🦾' },
  { id: 'wrist', label: 'Wrist', icon: '✋' },
  { id: 'ankle', label: 'Ankle', icon: '🦶' },
  { id: 'none', label: 'No Injuries', icon: '✅' },
];

const trainingPreferences = [
  { id: 'low_impact', label: 'Low-impact exercises', description: 'Easier on joints' },
  { id: 'avoid_jumping', label: 'Avoid jumping', description: 'No plyometrics' },
  { id: 'avoid_heavy_spinal', label: 'Avoid heavy spinal loading', description: 'No heavy squats/deadlifts' },
];

interface Constraints {
  injury_flags: string[];
  preferences: string[];
  notes: string;
}

interface StepHealthProps {
  constraints: Constraints;
  onConstraintsChange: (constraints: Constraints) => void;
}

export function StepHealth({ constraints, onConstraintsChange }: StepHealthProps) {
  const toggleInjury = (id: string) => {
    let newFlags: string[];
    if (id === 'none') {
      newFlags = constraints.injury_flags.includes('none') ? [] : ['none'];
    } else {
      const withoutNone = constraints.injury_flags.filter((f) => f !== 'none');
      if (withoutNone.includes(id)) {
        newFlags = withoutNone.filter((f) => f !== id);
      } else {
        newFlags = [...withoutNone, id];
      }
    }
    onConstraintsChange({ ...constraints, injury_flags: newFlags });
  };

  const togglePreference = (id: string) => {
    const newPrefs = constraints.preferences.includes(id)
      ? constraints.preferences.filter((p) => p !== id)
      : [...constraints.preferences, id];
    onConstraintsChange({ ...constraints, preferences: newPrefs });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base font-medium">Any injuries or limitations?</Label>
        <p className="text-sm text-muted-foreground">We'll adapt your plan accordingly</p>
        
        <div className="grid grid-cols-3 gap-2">
          {injuryAreas.map((area) => (
            <div
              key={area.id}
              onClick={() => toggleInjury(area.id)}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition-all",
                constraints.injury_flags.includes(area.id)
                  ? area.id === 'none'
                    ? "border-primary bg-primary/10"
                    : "border-destructive bg-destructive/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Checkbox
                id={`injury-${area.id}`}
                checked={constraints.injury_flags.includes(area.id)}
                onCheckedChange={() => toggleInjury(area.id)}
                className="sr-only"
              />
              <span className="text-2xl">{area.icon}</span>
              <Label htmlFor={`injury-${area.id}`} className="cursor-pointer text-xs">
                {area.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">Training preferences</Label>
        <div className="space-y-2">
          {trainingPreferences.map((pref) => (
            <div
              key={pref.id}
              onClick={() => togglePreference(pref.id)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all",
                constraints.preferences.includes(pref.id)
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Checkbox
                id={`pref-${pref.id}`}
                checked={constraints.preferences.includes(pref.id)}
                onCheckedChange={() => togglePreference(pref.id)}
              />
              <div>
                <Label htmlFor={`pref-${pref.id}`} className="cursor-pointer font-medium">
                  {pref.label}
                </Label>
                <p className="text-xs text-muted-foreground">{pref.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="health-notes" className="text-base font-medium">
          Anything else your coach should know?
        </Label>
        <Textarea
          id="health-notes"
          placeholder="e.g., recovering from surgery, have limited mobility..."
          value={constraints.notes}
          onChange={(e) => onConstraintsChange({ ...constraints, notes: e.target.value })}
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
}
