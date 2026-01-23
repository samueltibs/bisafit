import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User } from 'lucide-react';

interface StepAboutYouProps {
  fullName: string;
  gender: string;
  heightCm: number | null;
  weightKg: number | null;
  unitPreference: string;
  onFullNameChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onHeightChange: (value: number | null) => void;
  onWeightChange: (value: number | null) => void;
  onUnitPreferenceChange: (value: string) => void;
}

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export function StepAboutYou({
  fullName,
  gender,
  heightCm,
  weightKg,
  unitPreference,
  onFullNameChange,
  onGenderChange,
  onHeightChange,
  onWeightChange,
  onUnitPreferenceChange,
}: StepAboutYouProps) {
  const isMetric = unitPreference === 'metric';

  // Convert values for display
  const displayHeight = isMetric
    ? heightCm
    : heightCm
    ? Math.round(heightCm / 2.54)
    : null;

  const displayWeight = isMetric
    ? weightKg
    : weightKg
    ? Math.round(weightKg * 2.205)
    : null;

  const handleHeightChange = (value: string) => {
    if (value === '') {
      onHeightChange(null);
      return;
    }
    const num = parseFloat(value);
    if (isNaN(num)) return;
    // Convert to cm if imperial
    const cmValue = isMetric ? num : num * 2.54;
    onHeightChange(Math.round(cmValue));
  };

  const handleWeightChange = (value: string) => {
    if (value === '') {
      onWeightChange(null);
      return;
    }
    const num = parseFloat(value);
    if (isNaN(num)) return;
    // Convert to kg if imperial
    const kgValue = isMetric ? num : num / 2.205;
    onWeightChange(Math.round(kgValue * 10) / 10);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">About You</h3>
          <p className="text-sm text-muted-foreground">Let's get to know you better</p>
        </div>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="fullName">
          Your Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="fullName"
          placeholder="Enter your name"
          value={fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
        />
      </div>

      {/* Gender */}
      <div className="space-y-3">
        <Label>Gender (optional)</Label>
        <RadioGroup value={gender} onValueChange={onGenderChange} className="grid grid-cols-2 gap-2">
          {genderOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`gender-${option.value}`} />
              <Label htmlFor={`gender-${option.value}`} className="cursor-pointer font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Unit Preference */}
      <div className="space-y-3">
        <Label>Unit Preference</Label>
        <RadioGroup
          value={unitPreference}
          onValueChange={onUnitPreferenceChange}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="metric" id="unit-metric" />
            <Label htmlFor="unit-metric" className="cursor-pointer font-normal">
              Metric (kg, cm)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="imperial" id="unit-imperial" />
            <Label htmlFor="unit-imperial" className="cursor-pointer font-normal">
              Imperial (lb, in)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Height & Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height">Height ({isMetric ? 'cm' : 'in'})</Label>
          <Input
            id="height"
            type="number"
            placeholder={isMetric ? '170' : '67'}
            value={displayHeight ?? ''}
            onChange={(e) => handleHeightChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Weight ({isMetric ? 'kg' : 'lb'})</Label>
          <Input
            id="weight"
            type="number"
            placeholder={isMetric ? '70' : '154'}
            value={displayWeight ?? ''}
            onChange={(e) => handleWeightChange(e.target.value)}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Height and weight help us personalize your workout intensity and calorie recommendations.
      </p>
    </div>
  );
}
