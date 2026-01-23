import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dumbbell, User, Target, Activity, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const steps = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Your Goals', icon: Target },
  { id: 3, title: 'Activity Level', icon: Activity },
];

const fitnessGoals = [
  { value: 'lose_weight', label: 'Lose Weight', description: 'Burn fat and slim down' },
  { value: 'build_muscle', label: 'Build Muscle', description: 'Gain strength and size' },
  { value: 'stay_fit', label: 'Stay Fit', description: 'Maintain current fitness' },
  { value: 'improve_health', label: 'Improve Health', description: 'Better overall wellness' },
];

const activityLevels = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
  { value: 'light', label: 'Lightly Active', description: '1-3 days/week' },
  { value: 'moderate', label: 'Moderately Active', description: '3-5 days/week' },
  { value: 'very_active', label: 'Very Active', description: '6-7 days/week' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    heightCm: '',
    weightKg: '',
    fitnessGoal: '',
    activityLevel: '',
  });

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
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
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.fullName || null,
        gender: formData.gender || null,
        height_cm: formData.heightCm ? parseFloat(formData.heightCm) : null,
        weight_kg: formData.weightKg ? parseFloat(formData.weightKg) : null,
        fitness_goal: formData.fitnessGoal || null,
        activity_level: formData.activityLevel || null,
        onboarding_completed: true,
      })
      .eq('user_id', user.id);
    
    if (error) {
      toast.error('Failed to save profile');
      console.error(error);
    } else {
      toast.success('Profile saved! Let\'s get started!');
      navigate('/home');
    }
    
    setIsLoading(false);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName.trim().length > 0;
      case 2:
        return formData.fitnessGoal.length > 0;
      case 3:
        return formData.activityLevel.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
          <Dumbbell className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">BisaFit</span>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Step {currentStep} of {steps.length}</span>
          <span className="font-medium text-primary">{steps[currentStep - 1].title}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="flex-1 animate-fade-in border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => {
              const Icon = steps[currentStep - 1].icon;
              return <Icon className="h-5 w-5 text-primary" />;
            })()}
            {steps[currentStep - 1].title}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Tell us a bit about yourself"}
            {currentStep === 2 && "What do you want to achieve?"}
            {currentStep === 3 && "How active are you currently?"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Your name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Gender</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  className="flex gap-4"
                >
                  {['male', 'female', 'other'].map((g) => (
                    <div key={g} className="flex items-center space-x-2">
                      <RadioGroupItem value={g} id={g} />
                      <Label htmlFor={g} className="capitalize">{g}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    value={formData.heightCm}
                    onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <RadioGroup
              value={formData.fitnessGoal}
              onValueChange={(value) => setFormData({ ...formData, fitnessGoal: value })}
              className="space-y-3"
            >
              {fitnessGoals.map((goal) => (
                <div
                  key={goal.value}
                  className={cn(
                    "flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all",
                    formData.fitnessGoal === goal.value
                      ? "border-primary bg-accent"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setFormData({ ...formData, fitnessGoal: goal.value })}
                >
                  <RadioGroupItem value={goal.value} id={goal.value} />
                  <div>
                    <Label htmlFor={goal.value} className="cursor-pointer font-medium">
                      {goal.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentStep === 3 && (
            <RadioGroup
              value={formData.activityLevel}
              onValueChange={(value) => setFormData({ ...formData, activityLevel: value })}
              className="space-y-3"
            >
              {activityLevels.map((level) => (
                <div
                  key={level.value}
                  className={cn(
                    "flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all",
                    formData.activityLevel === level.value
                      ? "border-primary bg-accent"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setFormData({ ...formData, activityLevel: level.value })}
                >
                  <RadioGroupItem value={level.value} id={level.value} />
                  <div>
                    <Label htmlFor={level.value} className="cursor-pointer font-medium">
                      {level.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{level.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-3">
        {currentStep > 1 && (
          <Button variant="outline" onClick={handleBack} className="flex-1">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        )}
        
        {currentStep < steps.length ? (
          <Button onClick={handleNext} disabled={!canProceed()} className="flex-1">
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={!canProceed() || isLoading} className="flex-1">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Get Started'}
          </Button>
        )}
      </div>
    </div>
  );
}
