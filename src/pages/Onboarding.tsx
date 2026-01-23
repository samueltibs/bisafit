import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePlanGeneration } from '@/hooks/usePlanGeneration';
import { upsertNutritionProfile, getNutritionProfile } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dumbbell, ChevronRight, ChevronLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { OnboardingProgress, StepAboutYou } from '@/components/onboarding';
import { StepGoals } from '@/components/onboarding/StepGoals';
import { StepSchedule } from '@/components/onboarding/StepSchedule';
import { StepEquipment } from '@/components/onboarding/StepEquipment';
import { StepHealth } from '@/components/onboarding/StepHealth';
import { StepNutrition } from '@/components/onboarding/StepNutrition';

const TOTAL_STEPS = 6;

interface FormData {
  // Step 1: About You
  fullName: string;
  gender: string;
  heightCm: number | null;
  weightKg: number | null;
  unitPreference: string;
  // Step 2: Goals
  goalPrimary: string;
  goalSecondary: string;
  experienceLevel: string;
  // Step 3: Schedule
  daysPerWeek: number;
  sessionMinutes: number;
  restDay: string;
  // Step 4: Equipment
  equipment: string[];
  // Step 5: Health
  constraints: {
    injury_flags: string[];
    preferences: string[];
    notes: string;
  };
  // Step 6: Nutrition
  nutritionPreferences: {
    goal_style: string;
    dietary: string[];
    allergies: string;
    protein_emphasis: string;
  };
}

const initialFormData: FormData = {
  fullName: '',
  gender: '',
  heightCm: null,
  weightKg: null,
  unitPreference: 'metric',
  goalPrimary: '',
  goalSecondary: '',
  experienceLevel: '',
  daysPerWeek: 4,
  sessionMinutes: 45,
  restDay: 'Tuesday',
  equipment: ['bodyweight'],
  constraints: {
    injury_flags: [],
    preferences: [],
    notes: '',
  },
  nutritionPreferences: {
    goal_style: 'simple',
    dietary: [],
    allergies: '',
    protein_emphasis: 'medium',
  },
};
export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading, update, error: profileError } = useUserProfile();
  const { generatePlan, isGenerating } = usePlanGeneration();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Pre-fill form with existing profile data
  useEffect(() => {
    async function loadExistingData() {
      if (!user || !profile) return;

      // Pre-fill from existing profile
      const equipmentJson = profile.equipment_json as string[] | null;
      const constraintsJson = profile.constraints_json as {
        injury_flags?: string[];
        preferences?: string[];
        notes?: string;
      } | null;

      setFormData((prev) => ({
        ...prev,
        fullName: profile.full_name || '',
        gender: profile.gender || '',
        heightCm: profile.height_cm || null,
        weightKg: profile.weight_kg ? Number(profile.weight_kg) : null,
        unitPreference: (profile as any).unit_preference || 'metric',
        goalPrimary: profile.goal_primary || '',
        goalSecondary: (profile as any).goal_secondary || '',
        experienceLevel: profile.experience_level || '',
        daysPerWeek: profile.days_per_week || 4,
        sessionMinutes: profile.session_minutes || 45,
        restDay: profile.rest_day || 'Tuesday',
        equipment: equipmentJson || ['bodyweight'],
        constraints: {
          injury_flags: constraintsJson?.injury_flags || [],
          preferences: constraintsJson?.preferences || [],
          notes: constraintsJson?.notes || '',
        },
      }));

      // Load nutrition profile
      const nutritionProfile = await getNutritionProfile(user.id);
      if (nutritionProfile) {
        const dietaryJson = nutritionProfile.dietary_preferences_json as {
          goal_style?: string;
          dietary?: string[];
          allergies?: string;
          protein_emphasis?: string;
        } | null;

        if (dietaryJson) {
          setFormData((prev) => ({
            ...prev,
            nutritionPreferences: {
              goal_style: dietaryJson.goal_style || 'simple',
              dietary: dietaryJson.dietary || [],
              allergies: dietaryJson.allergies || '',
              protein_emphasis: dietaryJson.protein_emphasis || 'medium',
            },
          }));
        }
      }
    }

    loadExistingData();
  }, [user, profile]);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.fullName.trim().length > 0;
      case 2:
        return formData.goalPrimary.length > 0 && formData.experienceLevel.length > 0;
      case 3:
        return formData.daysPerWeek >= 2 && formData.sessionMinutes >= 15;
      case 4:
        return formData.equipment.length > 0;
      case 5:
        return true; // Health constraints are optional
      case 6:
        return formData.nutritionPreferences.goal_style.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsLoading(true);
    setSaveError(null);

    try {
      // Update user profile
      const profileSuccess = await update({
        full_name: formData.fullName.trim(),
        gender: formData.gender || null,
        height_cm: formData.heightCm,
        weight_kg: formData.weightKg,
        unit_preference: formData.unitPreference,
        goal_primary: formData.goalPrimary,
        goal_secondary: formData.goalSecondary || null,
        experience_level: formData.experienceLevel,
        days_per_week: formData.daysPerWeek,
        session_minutes: formData.sessionMinutes,
        rest_day: formData.restDay,
        equipment_json: formData.equipment,
        constraints_json: formData.constraints,
      } as any);

      if (!profileSuccess) {
        throw new Error('Failed to save profile - update returned false');
      }

      // Upsert nutrition profile
      const nutritionSuccess = await upsertNutritionProfile({
        user_id: user.id,
        dietary_preferences_json: formData.nutritionPreferences,
      });

      if (!nutritionSuccess) {
        throw new Error('Failed to save nutrition preferences');
      }

      toast.success('Profile saved! Generating your plan...');

      // Generate the AI plan
      const result = await generatePlan();

      if (result.success) {
        toast.success(result.message || 'Your plan is ready!');
        navigate('/plan');
      } else {
        throw new Error(result.error || 'Failed to generate plan');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Onboarding error:', error);
      setSaveError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Dumbbell className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">BisaFit</span>
      </div>

      {/* Error Display */}
      {(profileError || saveError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {profileError?.message || saveError}
          </AlertDescription>
        </Alert>
      )}

      {/* Progress */}
      <OnboardingProgress currentStep={currentStep} />

      {/* Content */}
      <Card className="flex-1 overflow-hidden border-border">
        <CardContent className="p-4 h-full overflow-y-auto">
          {currentStep === 1 && (
            <StepAboutYou
              fullName={formData.fullName}
              gender={formData.gender}
              heightCm={formData.heightCm}
              weightKg={formData.weightKg}
              unitPreference={formData.unitPreference}
              onFullNameChange={(v) => setFormData({ ...formData, fullName: v })}
              onGenderChange={(v) => setFormData({ ...formData, gender: v })}
              onHeightChange={(v) => setFormData({ ...formData, heightCm: v })}
              onWeightChange={(v) => setFormData({ ...formData, weightKg: v })}
              onUnitPreferenceChange={(v) => setFormData({ ...formData, unitPreference: v })}
            />
          )}

          {currentStep === 2 && (
            <StepGoals
              goalPrimary={formData.goalPrimary}
              goalSecondary={formData.goalSecondary}
              experienceLevel={formData.experienceLevel}
              onGoalChange={(v) => setFormData({ ...formData, goalPrimary: v, goalSecondary: formData.goalSecondary === v ? '' : formData.goalSecondary })}
              onSecondaryGoalChange={(v) => setFormData({ ...formData, goalSecondary: v })}
              onExperienceChange={(v) => setFormData({ ...formData, experienceLevel: v })}
            />
          )}

          {currentStep === 3 && (
            <StepSchedule
              daysPerWeek={formData.daysPerWeek}
              sessionMinutes={formData.sessionMinutes}
              restDay={formData.restDay}
              onDaysChange={(v) => setFormData({ ...formData, daysPerWeek: v })}
              onSessionChange={(v) => setFormData({ ...formData, sessionMinutes: v })}
              onRestDayChange={(v) => setFormData({ ...formData, restDay: v })}
            />
          )}

          {currentStep === 4 && (
            <StepEquipment
              equipment={formData.equipment}
              onEquipmentChange={(v) => setFormData({ ...formData, equipment: v })}
            />
          )}

          {currentStep === 5 && (
            <StepHealth
              constraints={formData.constraints}
              onConstraintsChange={(v) => setFormData({ ...formData, constraints: v })}
            />
          )}

          {currentStep === 6 && (
            <StepNutrition
              preferences={formData.nutritionPreferences}
              onPreferencesChange={(v) => setFormData({ ...formData, nutritionPreferences: v })}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-4 flex gap-3">
        {currentStep > 1 && (
          <Button variant="outline" onClick={handleBack} className="flex-1">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        )}

        {currentStep < TOTAL_STEPS ? (
          <Button onClick={handleNext} disabled={!canProceed()} className="flex-1">
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={!canProceed() || isLoading || isGenerating}
            className="flex-1 gap-2"
          >
            {isLoading || isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isGenerating ? 'Creating Your Plan...' : 'Saving...'}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate My Plan
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
