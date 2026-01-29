import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User } from 'lucide-react';
import { CountrySelector } from '@/components/settings/CountrySelector';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { getUnitPreferenceForCountry, detectCountryFromDevice } from '@/lib/countryUtils';
import { useEffect } from 'react';
import { useTranslation, type TranslationKey } from '@/lib/i18n';

interface StepAboutYouProps {
  fullName: string;
  gender: string;
  heightCm: number | null;
  weightKg: number | null;
  unitPreference: string;
  country: string | null;
  language: string | null;
  onFullNameChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onHeightChange: (value: number | null) => void;
  onWeightChange: (value: number | null) => void;
  onUnitPreferenceChange: (value: string) => void;
  onCountryChange: (value: string | null) => void;
  onLanguageChange: (value: string) => void;
}

const genderOptions: { value: string; labelKey: TranslationKey }[] = [
  { value: 'male', labelKey: 'gender.male' },
  { value: 'female', labelKey: 'gender.female' },
  { value: 'prefer_not_to_say', labelKey: 'gender.preferNotToSay' },
];

export function StepAboutYou({
  fullName,
  gender,
  heightCm,
  weightKg,
  unitPreference,
  country,
  language,
  onFullNameChange,
  onGenderChange,
  onHeightChange,
  onWeightChange,
  onUnitPreferenceChange,
  onCountryChange,
  onLanguageChange,
}: StepAboutYouProps) {
  const { t } = useTranslation();
  const isMetric = unitPreference === 'metric';

  // Auto-detect country on mount if not set
  useEffect(() => {
    if (!country) {
      const detectedCountry = detectCountryFromDevice();
      if (detectedCountry) {
        onCountryChange(detectedCountry);
        // Also set unit preference based on country if not explicitly set
        const suggestedUnit = getUnitPreferenceForCountry(detectedCountry);
        if (suggestedUnit !== unitPreference) {
          onUnitPreferenceChange(suggestedUnit);
        }
      }
    }
  }, []); // Only run on mount

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
          <h3 className="text-lg font-semibold">{t('onboarding.aboutYou')}</h3>
          <p className="text-sm text-muted-foreground">{t('onboarding.aboutYou.desc')}</p>
        </div>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="fullName">
          {t('onboarding.yourName')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="fullName"
          placeholder={t('onboarding.yourName')}
          value={fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
        />
      </div>

      {/* Gender */}
      <div className="space-y-3">
        <Label>{t('onboarding.gender')} ({t('common.optional')})</Label>
        <RadioGroup value={gender} onValueChange={onGenderChange} className="grid grid-cols-2 gap-2">
          {genderOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`gender-${option.value}`} />
              <Label htmlFor={`gender-${option.value}`} className="cursor-pointer font-normal">
                {t(option.labelKey)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Country / Region */}
      <CountrySelector
        value={country}
        onChange={(v) => onCountryChange(v)}
      />

      {/* Language */}
      <LanguageSelector
        value={language}
        onChange={onLanguageChange}
      />

      {/* Unit Preference */}
      <div className="space-y-3">
        <Label>{t('onboarding.unitPreference')}</Label>
        <RadioGroup
          value={unitPreference}
          onValueChange={onUnitPreferenceChange}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="metric" id="unit-metric" />
            <Label htmlFor="unit-metric" className="cursor-pointer font-normal">
              {t('onboarding.metric')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="imperial" id="unit-imperial" />
            <Label htmlFor="unit-imperial" className="cursor-pointer font-normal">
              {t('onboarding.imperial')}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Height & Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height">{t('onboarding.height')} ({isMetric ? 'cm' : 'in'})</Label>
          <Input
            id="height"
            type="number"
            placeholder={isMetric ? '170' : '67'}
            value={displayHeight ?? ''}
            onChange={(e) => handleHeightChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">{t('onboarding.weight')} ({isMetric ? 'kg' : 'lb'})</Label>
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
