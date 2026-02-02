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
import { trackEvent } from '@/lib/analytics';
import { SUPPORT_MESSAGE_SHORT, EMAIL_SUPPORT } from '@/lib/branding';
import { type CoachTone, normalizeCoachTone } from '@/lib/coachTone';
import { useIOSScrollUnlock } from '@/hooks/useIOSScrollUnlock';
import { ActiveRestConfig, getDefaultActiveRestConfig } from '@/types/activeRest';

import { OnboardingProgress, StepAboutYou } from '@/components/onboarding';
import { StepGoals } from '@/components/onboarding/StepGoals';
import { StepSchedule } from '@/components/onboarding/StepSchedule';
import { StepEquipment } from '@/components/onboarding/StepEquipment';
import { StepHealth } from '@/components/onboarding/StepHealth';
import { StepNutrition } from '@/components/onboarding/StepNutrition';
import { StepCoachTone } from '@/components/onboarding/StepCoachTone';
import { OnboardingScrollContainer } from '@/components/onboarding/OnboardingScrollContainer';

const TOTAL_STEPS = 7;

interface WorkoutTimePrefs {
  default_time: string;
  fallback_duration_minutes: number;
  buffer_minutes: number;
}

interface FormData {
  // Step 1: About You
  fullName: string;
  gender: string;
  heightCm: number | null;
  weightKg: number | null;
  unitPreference: string;
  country: string | null;
  language: string;
  goalPrimary: string;
  goalSecondary: string;
  experienceLevel: string;
  // Step 3: Schedule
  daysPerWeek: number;
  sessionMinutes: number;
  workoutDays: string[];
  workoutTimePrefs: WorkoutTimePrefs | null;
  activeRestConfig: ActiveRestConfig;
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
  // Step 7: Coach Tone
  coachTone: CoachTone;
}

const initialFormData: FormData = {
  fullName: '',
  gender: '',
  heightCm: null,
  weightKg: null,
  unitPreference: 'metric',
  country: null,
  language: 'auto',
  // Step 2: Goals
  goalPrimary: '',
  goalSecondary: '',
  experienceLevel: '',
  daysPerWeek: 4,
  sessionMinutes: 45,
  workoutDays: ['Monday', 'Wednesday', 'Thursday', 'Friday'],
  workoutTimePrefs: null,
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
  coachTone: 'balanced',
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

  // iOS scroll unlock: force-reset scroll-lock styles on mount and step change
  // Includes 1500ms failsafe for iOS devices
  const { forceUnlock } = useIOSScrollUnlock(`Onboarding-Step${currentStep}`);

  // Re-run unlock on step change (especially for Goals step)
  useEffect(() => {
    forceUnlock();
  }, [currentStep, forceUnlock]);

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

      // Parse workout time preferences
      const workoutTimePrefsJson = profile.workout_time_preferences_json as {
        default_time?: string;
        fallback_duration_minutes?: number;
        buffer_minutes?: number;
      } | null;

      setFormData((prev) => ({
        ...prev,
        fullName: profile.full_name || '',
        gender: profile.gender || '',
        heightCm: profile.height_cm || null,
        weightKg: profile.weight_kg ? Number(profile.weight_kg) : null,
        unitPreference: (profile as any).unit_preference || 'metric',
        country: (profile as any).country || null,
        language: (profile as any).language || 'auto',
        goalPrimary: profile.goal_primary || '',
        goalSecondary: (profile as any).goal_secondary || '',
        experienceLevel: profile.experience_level || '',
        daysPerWeek: profile.days_per_week || 4,
        sessionMinutes: profile.session_minutes || 45,
        workoutDays: (profile as any).workout_days || ['Monday', 'Wednesday', 'Thursday', 'Friday'],
        workoutTimePrefs: workoutTimePrefsJson ? {
          default_time: workoutTimePrefsJson.default_time || '06:00',
          fallback_duration_minutes: workoutTimePrefsJson.fallback_duration_minutes || 60,
          buffer_minutes: workoutTimePrefsJson.buffer_minutes || 5,
        } : null,
        equipment: equipmentJson || ['bodyweight'],
        constraints: {
          injury_flags: constraintsJson?.injury_flags || [],
          preferences: constraintsJson?.preferences || [],
          notes: constraintsJson?.notes || '',
        },
        coachTone: normalizeCoachTone((profile as any).coach_tone),
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
        return formData.workoutDays.length >= 2 && formData.sessionMinutes >= 15;
      case 4:
        return formData.equipment.length > 0;
      case 5:
        return true; // Health constraints are optional
      case 6:
        return formData.nutritionPreferences.goal_style.length > 0;
      case 7:
        return true; // Coach tone always has a default
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
      // Get today's date in YYYY-MM-DD format for program_start_date
      const today = new Date();
      const programStartDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Update user profile (include workout time prefs if set)
      const profileSuccess = await update({
        full_name: formData.fullName.trim(),
        gender: formData.gender || null,
        height_cm: formData.heightCm,
        weight_kg: formData.weightKg,
        unit_preference: formData.unitPreference,
        country: formData.country,
        language: formData.language,
        goal_primary: formData.goalPrimary,
        goal_secondary: formData.goalSecondary || null,
        experience_level: formData.experienceLevel,
        days_per_week: formData.workoutDays.length,
        session_minutes: formData.sessionMinutes,
        workout_days: formData.workoutDays,
        equipment_json: formData.equipment,
        constraints_json: formData.constraints,
        coach_tone: formData.coachTone,
        // Set program_start_date to today (enrollment date)
        program_start_date: programStartDate,
        // Only save workout time prefs if user set them
        ...(formData.workoutTimePrefs && {
          workout_time_preferences_json: formData.workoutTimePrefs,
        }),
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
      trackEvent('profile_completed');

      // Generate the AI plan
      const result = await generatePlan();

      if (result.success) {
        toast.success(result.message || 'Your plan is ready!');
        navigate('/plan-preview');
      } else {
        trackEvent('generation_error', { feature: 'workout', reason: result.error || 'unknown' });
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
    <OnboardingScrollContainer className="bg-background">
      {/* Inner content wrapper - NO nested scroll containers */}
      <div 
        className="flex flex-col p-4 flex-1"
        style={{
          // Ensure children don't create scroll containers
          overflow: 'visible',
        }}
      >
        {/* Header - Not fixed, scrolls with content */}
        <div className="mb-4 flex items-center gap-2 flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">BisaFit</span>
        </div>

        {/* Error Display */}
        {(profileError || saveError) && (
          <Alert variant="destructive" className="mb-4 flex-shrink-0">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {profileError?.message || saveError}
            </AlertDescription>
          </Alert>
        )}

        {/* Progress */}
        <div className="flex-shrink-0">
          <OnboardingProgress currentStep={currentStep} />
        </div>

        {/* Content - NO overflow on Card or CardContent */}
        <Card 
          className="flex-1 border-border mt-4" 
          style={{ 
            overflow: 'visible',
            minHeight: 'auto',
            pointerEvents: 'auto',
          }}
        >
          <CardContent 
            className="p-4" 
            style={{ 
              overflow: 'visible',
              touchAction: 'auto',
              pointerEvents: 'auto',
            }}
          >
          {currentStep === 1 && (
            <StepAboutYou
              fullName={formData.fullName}
              gender={formData.gender}
              heightCm={formData.heightCm}
              weightKg={formData.weightKg}
              unitPreference={formData.unitPreference}
              country={formData.country}
              language={formData.language}
              onFullNameChange={(v) => setFormData(prev => ({ ...prev, fullName: v }))}
              onGenderChange={(v) => setFormData(prev => ({ ...prev, gender: v }))}
              onHeightChange={(v) => setFormData(prev => ({ ...prev, heightCm: v }))}
              onWeightChange={(v) => setFormData(prev => ({ ...prev, weightKg: v }))}
              onUnitPreferenceChange={(v) => setFormData(prev => ({ ...prev, unitPreference: v }))}
              onCountryChange={(v) => setFormData(prev => ({ ...prev, country: v }))}
              onLanguageChange={(v) => setFormData(prev => ({ ...prev, language: v }))}
            />
          )}

          {currentStep === 2 && (
            <StepGoals
              goalPrimary={formData.goalPrimary}
              goalSecondary={formData.goalSecondary}
              experienceLevel={formData.experienceLevel}
              onGoalChange={(v) => setFormData(prev => ({ ...prev, goalPrimary: v, goalSecondary: prev.goalSecondary === v ? '' : prev.goalSecondary }))}
              onSecondaryGoalChange={(v) => setFormData(prev => ({ ...prev, goalSecondary: v }))}
              onExperienceChange={(v) => setFormData(prev => ({ ...prev, experienceLevel: v }))}
            />
          )}

          {currentStep === 3 && (
            <StepSchedule
              daysPerWeek={formData.workoutDays.length}
              sessionMinutes={formData.sessionMinutes}
              workoutDays={formData.workoutDays}
              workoutTimePrefs={formData.workoutTimePrefs}
              onDaysChange={(v) => setFormData(prev => ({ ...prev, daysPerWeek: v }))}
              onSessionChange={(v) => setFormData(prev => ({ ...prev, sessionMinutes: v }))}
              onWorkoutDaysChange={(v) => {
                if (import.meta.env.DEV) {
                  console.log('[Onboarding] onWorkoutDaysChange called with:', v);
                }
                setFormData(prev => ({ ...prev, workoutDays: v, daysPerWeek: v.length }));
              }}
              onWorkoutTimePrefsChange={(v) => setFormData(prev => ({ ...prev, workoutTimePrefs: v }))}
            />
          )}

          {currentStep === 4 && (
            <StepEquipment
              equipment={formData.equipment}
              onEquipmentChange={(v) => setFormData(prev => ({ ...prev, equipment: v }))}
            />
          )}

          {currentStep === 5 && (
            <StepHealth
              constraints={formData.constraints}
              onConstraintsChange={(v) => setFormData(prev => ({ ...prev, constraints: v }))}
            />
          )}

          {currentStep === 6 && (
            <StepNutrition
              preferences={formData.nutritionPreferences}
              onPreferencesChange={(v) => setFormData(prev => ({ ...prev, nutritionPreferences: v }))}
            />
          )}

          {currentStep === 7 && (
            <StepCoachTone
              coachTone={formData.coachTone}
              onToneChange={(v) => setFormData(prev => ({ ...prev, coachTone: v }))}
            />
          )}
        </CardContent>
      </Card>

      {/* Support Reference */}
      <p className="text-center text-xs text-muted-foreground mt-2">
        {SUPPORT_MESSAGE_SHORT}
      </p>

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
                {isGenerating ? 'Generating your plan… this can take a moment' : 'Saving...'}
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
    </OnboardingScrollContainer>
  );
}
