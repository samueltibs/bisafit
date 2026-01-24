import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import { useScheduleRealignment } from '@/hooks/useScheduleRealignment';
import { AppLayout } from '@/components/layout/AppLayout';
import { IntroTour } from '@/components/onboarding/IntroTour';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Crown,
  Loader2,
  Edit2,
  Calendar,
  Dumbbell,
  Sparkles,
  Clock,
  FileText,
  User,
  Target,
  Ruler,
  MessageSquare,
  CreditCard,
  MapPin,
  Mail,
  Info,
  Compass,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getDefaultUnitPreference,
  lbToKg,
  kgToLb,
  ftInToCm,
  cmToFtIn,
  formatHeight,
  type UnitPreference,
} from '@/lib/unitConversions';
import { formatTimeDisplay } from '@/lib/calendarUtils';
import { WorkoutDaysSelector } from '@/components/settings/WorkoutDaysSelector';
import { EquipmentEditor, formatEquipmentName, normalizeEquipmentName } from '@/components/settings/EquipmentEditor';
import { WorkoutTimeSettings } from '@/components/settings/WorkoutTimeSettings';
import { CoachToneSelector } from '@/components/settings/CoachToneSelector';
import { CoachVoiceSelector } from '@/components/settings/CoachVoiceSelector';
import { APP_NAME, APP_VERSION, EMAIL_SUPPORT } from '@/lib/branding';
import { openExternalLink, openMailto, EXTERNAL_URLS } from '@/lib/externalLinks';
import { type CoachTone, normalizeCoachTone } from '@/lib/coachTone';
import { FAQScreen } from '@/components/settings/FAQScreen';
import { getCountryName } from '@/lib/countryUtils';
import { CountrySelector } from '@/components/settings/CountrySelector';

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { profile, loading, update, refetch } = useUserProfile();
  const { realignSchedule, haveWorkoutDaysChanged, isRealigning } = useScheduleRealignment();
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isIntroTourOpen, setIsIntroTourOpen] = useState(false);
  
  // Coach tone state
  const [coachTone, setCoachTone] = useState<CoachTone>('balanced');
  
  // Notifications master toggle
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Calendar sync hook
  const calendarSync = useCalendarSync();
  const [isSaving, setIsSaving] = useState(false);
  const [showEquipmentBanner, setShowEquipmentBanner] = useState(false);
  
  // Track original workout days to detect changes
  const originalWorkoutDaysRef = useRef<string[]>([]);
  
  const [editForm, setEditForm] = useState({
    fullName: '',
    unitPreference: 'metric' as UnitPreference,
    country: null as string | null,
    heightFeet: '',
    heightInches: '',
    heightCm: '',
    weight: '',
    workoutDays: ['Monday', 'Wednesday', 'Thursday', 'Friday'] as string[],
  });
  const [equipmentList, setEquipmentList] = useState<string[]>([]);

  // Auto-open modal if ?edit=true in URL
  useEffect(() => {
    if (searchParams.get('edit') === 'true' && !loading) {
      setIsEditModalOpen(true);
      setSearchParams({});
    }
    if (searchParams.get('equipment') === 'true' && !loading) {
      setIsEquipmentModalOpen(true);
      setSearchParams({});
    }
    if (searchParams.get('schedule') === 'true' && !loading) {
      setIsScheduleModalOpen(true);
      setSearchParams({});
    }
  }, [searchParams, loading, setSearchParams]);

  // Initialize equipment list when modal opens
  useEffect(() => {
    if (isEquipmentModalOpen && profile) {
      const equipment = (profile as any).equipment_json || [];
      setEquipmentList(Array.isArray(equipment) ? equipment : []);
    }
  }, [isEquipmentModalOpen, profile]);

  // Load coach tone and notifications from profile
  useEffect(() => {
    if (profile) {
      setCoachTone(normalizeCoachTone((profile as any).coach_tone));
      setNotificationsEnabled((profile as any).notifications_enabled ?? true);
    }
  }, [profile]);

  // Initialize calendar sync settings when schedule modal opens
  useEffect(() => {
    if (isScheduleModalOpen && profile) {
      calendarSync.loadSettings(profile);
      if (user && (profile as any).current_plan_id) {
        calendarSync.loadCurrentPlanWorkouts(user.id, (profile as any).current_plan_id);
      }
    }
  }, [isScheduleModalOpen, profile, user]);

  // Initialize edit form when modal opens
  useEffect(() => {
    if (isEditModalOpen && profile) {
      const savedUnit = profile.unit_preference as UnitPreference | null;
      const unitPref = savedUnit || getDefaultUnitPreference();
      
      let heightFeet = '';
      let heightInches = '';
      let heightCm = '';
      let weight = '';

      if (profile.height_cm) {
        if (unitPref === 'imperial') {
          const { feet, inches } = cmToFtIn(profile.height_cm);
          heightFeet = String(feet);
          heightInches = String(inches);
        } else {
          heightCm = String(profile.height_cm);
        }
      }

      if (profile.weight_kg) {
        if (unitPref === 'imperial') {
          weight = String(kgToLb(Number(profile.weight_kg)));
        } else {
          weight = String(Number(profile.weight_kg));
        }
      }

      const workoutDays = (profile as any).workout_days || ['Monday', 'Wednesday', 'Thursday', 'Friday'];
      const country = (profile as any).country || null;

      // Store original workout days to detect changes on save
      originalWorkoutDaysRef.current = [...workoutDays];

      setEditForm({
        fullName: profile.full_name || '',
        unitPreference: unitPref,
        country,
        heightFeet,
        heightInches,
        heightCm,
        weight,
        workoutDays,
      });
    }
  }, [isEditModalOpen, profile]);

  // Handle unit toggle
  const handleUnitChange = (checked: boolean) => {
    const newUnit: UnitPreference = checked ? 'metric' : 'imperial';
    const oldUnit = editForm.unitPreference;

    if (newUnit === oldUnit) return;

    let newForm = { ...editForm, unitPreference: newUnit };

    if (oldUnit === 'imperial' && newUnit === 'metric') {
      const feet = parseInt(editForm.heightFeet) || 0;
      const inches = parseInt(editForm.heightInches) || 0;
      if (feet > 0 || inches > 0) {
        newForm.heightCm = String(ftInToCm(feet, inches));
      }
      if (editForm.weight) {
        const lb = parseFloat(editForm.weight);
        if (!isNaN(lb)) {
          newForm.weight = String(lbToKg(lb));
        }
      }
    } else if (oldUnit === 'metric' && newUnit === 'imperial') {
      if (editForm.heightCm) {
        const cm = parseInt(editForm.heightCm);
        if (!isNaN(cm)) {
          const { feet, inches } = cmToFtIn(cm);
          newForm.heightFeet = String(feet);
          newForm.heightInches = String(inches);
        }
      }
      if (editForm.weight) {
        const kg = parseFloat(editForm.weight);
        if (!isNaN(kg)) {
          newForm.weight = String(kgToLb(kg));
        }
      }
    }

    setEditForm(newForm);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/auth');
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    try {
      await update({ notifications_enabled: enabled } as any);
      toast.success(enabled ? 'Notifications enabled' : 'Notifications disabled');
    } catch (error) {
      toast.error('Failed to update notification settings');
      setNotificationsEnabled(!enabled);
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.fullName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsSaving(true);
    try {
      let heightCm: number | null = null;
      let weightKg: number | null = null;

      if (editForm.unitPreference === 'imperial') {
        const feet = parseInt(editForm.heightFeet) || 0;
        const inches = parseInt(editForm.heightInches) || 0;
        if (feet > 0 || inches > 0) {
          heightCm = ftInToCm(feet, inches);
        }
        if (editForm.weight) {
          const lb = parseFloat(editForm.weight);
          if (!isNaN(lb)) {
            weightKg = lbToKg(lb);
          }
        }
      } else {
        if (editForm.heightCm) {
          heightCm = parseInt(editForm.heightCm);
          if (isNaN(heightCm)) heightCm = null;
        }
        if (editForm.weight) {
          weightKg = parseFloat(editForm.weight);
          if (isNaN(weightKg)) weightKg = null;
        }
      }

      // Check if workout days have changed
      const workoutDaysChanged = haveWorkoutDaysChanged(
        originalWorkoutDaysRef.current,
        editForm.workoutDays
      );

      const success = await update({
        full_name: editForm.fullName.trim(),
        height_cm: heightCm,
        weight_kg: weightKg,
        unit_preference: editForm.unitPreference,
        country: editForm.country,
        workout_days: editForm.workoutDays,
        days_per_week: editForm.workoutDays.length,
      } as any);

      if (success) {
        await refetch();
        
        // If workout days changed, realign the schedule
        if (workoutDaysChanged) {
          const currentPlanId = (profile as any)?.current_plan_id || null;
          const result = await realignSchedule(editForm.workoutDays, currentPlanId);
          
          if (result.success) {
            // Check if some workouts couldn't fit
            if (result.workoutsCouldNotFit > 0) {
              toast.warning(
                "We couldn't fit all workouts into your selected days. Please choose an alternate day or adjust your schedule.",
                { duration: 6000 }
              );
            } else if (result.workoutsRescheduled > 0) {
              toast.success(
                'Schedule updated. Your plan has been adjusted to your new workout days.',
                { duration: 5000 }
              );
            } else {
              toast.success('Profile updated. Your schedule is already aligned with your workout days.');
            }
          } else {
            toast.success('Profile updated!');
            if (result.error) {
              console.warn('Schedule realignment issue:', result.error);
            }
          }
        } else {
          toast.success('Profile updated successfully!');
        }
        
        setIsEditModalOpen(false);
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEquipment = async () => {
    setIsSaving(true);
    try {
      const normalizedEquipment = equipmentList.map(normalizeEquipmentName);
      const uniqueEquipment = [...new Set(normalizedEquipment)];

      const success = await update({
        equipment_json: uniqueEquipment,
      } as any);

      if (success) {
        await refetch();
        toast.success('Equipment updated');
        setIsEquipmentModalOpen(false);
        setShowEquipmentBanner(true);
      } else {
        toast.error('Failed to update equipment');
      }
    } catch (error) {
      console.error('Equipment update error:', error);
      toast.error('Failed to update equipment');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  const goalLabels: Record<string, string> = {
    fat_loss: 'Fat Loss',
    muscle_gain: 'Build Muscle',
    endurance: 'Endurance',
    maintenance: 'Maintenance',
  };

  const displayUnit: UnitPreference = (profile?.unit_preference as UnitPreference) || getDefaultUnitPreference();

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container space-y-6 px-4 py-6">
        {/* Profile Header - Compact */}
        <Card className="border-border animate-fade-in">
          <CardContent className="flex items-center gap-4 p-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">
                {profile?.full_name?.trim() || 'BisaFit User'}
              </h2>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsEditModalOpen(true)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Section 1: You & Your Plan */}
        <div className="space-y-4 animate-slide-up">
          <h3 className="text-sm font-medium text-muted-foreground">You & Your Plan</h3>
          
          <Card className="border-border">
            <CardContent className="divide-y divide-border p-0">
              {/* Goals */}
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="block font-medium">Goals</span>
                    <span className="text-sm text-muted-foreground">
                      {profile?.goal_primary ? goalLabels[profile.goal_primary] || profile.goal_primary : 'Not set'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Country / Region */}
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="block font-medium">Country / Region</span>
                    <span className="text-sm text-muted-foreground">
                      {getCountryName((profile as any)?.country)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Weight & Height */}
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Ruler className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="block font-medium">Weight & Height</span>
                    <span className="text-sm text-muted-foreground">
                      {profile?.weight_kg || profile?.height_cm ? (
                        <>
                          {profile?.weight_kg && `${displayUnit === 'metric' ? Number(profile.weight_kg) : kgToLb(Number(profile.weight_kg))} ${displayUnit === 'metric' ? 'kg' : 'lb'}`}
                          {profile?.weight_kg && profile?.height_cm && ' • '}
                          {profile?.height_cm && formatHeight(profile.height_cm, displayUnit)}
                        </>
                      ) : 'Not set'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Workout Schedule Preferences */}
              <button 
                onClick={() => setIsScheduleModalOpen(true)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="block font-medium">Workout Schedule</span>
                    <span className="text-sm text-muted-foreground">
                      {(profile as any)?.workout_days 
                        ? `${((profile as any).workout_days as string[]).length} days/week`
                        : 'Not set'}
                      {(profile as any)?.workout_time_preferences_json && (
                        <> • {formatTimeDisplay(((profile as any).workout_time_preferences_json as any)?.default_time || '06:00')}</>
                      )}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Available Equipment */}
              <button 
                onClick={() => setIsEquipmentModalOpen(true)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Dumbbell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="block font-medium">Equipment</span>
                    <span className="text-sm text-muted-foreground">
                      {(profile as any)?.equipment_json && ((profile as any).equipment_json as string[]).length > 0 
                        ? `${((profile as any).equipment_json as string[]).length} items`
                        : 'None added'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Coach Tone */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Coach Tone</span>
                </div>
                <CoachToneSelector
                  currentTone={coachTone}
                  onToneChange={setCoachTone}
                  compact
                />
              </div>

              {/* Coach Voice */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Coach Voice</span>
                </div>
                <CoachVoiceSelector compact />
              </div>
            </CardContent>
          </Card>

          {/* Equipment Update Banner */}
          {showEquipmentBanner && (
            <Alert className="border-primary/30 bg-primary/5">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertDescription className="flex items-center justify-between">
                <span>Equipment updated. Regenerate your plan to use it.</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setShowEquipmentBanner(false);
                    navigate('/plan');
                  }}
                >
                  Go to Plan
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Section 2: Account */}
        <div className="space-y-4 animate-slide-up">
          <h3 className="text-sm font-medium text-muted-foreground">Account</h3>
          
          <Card className="border-border">
            <CardContent className="divide-y divide-border p-0">
              {/* Contact Information (Email) */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="block font-medium">Contact Information</span>
                    <span className="text-sm text-muted-foreground truncate">{user?.email}</span>
                  </div>
                </div>
              </div>

              {/* Address - Placeholder */}
              <div className="flex items-center justify-between p-4 opacity-50">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="block font-medium">Address</span>
                    <span className="text-sm text-muted-foreground">Not set</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Payment Method - Placeholder */}
              <div className="flex items-center justify-between p-4 opacity-50">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="block font-medium">Payment Method</span>
                    <span className="text-sm text-muted-foreground">Not set</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Subscription / Billing */}
              <button 
                onClick={() => navigate('/paywall')}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-primary" />
                  <div>
                    <span className="block font-medium">Subscription</span>
                    <span className="text-sm text-muted-foreground">
                      {profile?.is_pro ? 'Pro Plan • Full access' : 'Free Plan'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Sign Out */}
              <button 
                onClick={handleSignOut}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 text-destructive"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign Out</span>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Help & Support */}
        <div className="space-y-4 animate-slide-up">
          <h3 className="text-sm font-medium text-muted-foreground">Help & Support</h3>
          
          <Card className="border-border">
            <CardContent className="divide-y divide-border p-0">
              {/* Help / FAQ */}
              <button 
                onClick={() => setIsFAQOpen(true)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Help / FAQ</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Contact Support */}
              <button 
                onClick={() => openMailto(EMAIL_SUPPORT)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Contact Support</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Send Feedback */}
              <button 
                onClick={() => setIsFeedbackModalOpen(true)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Send Feedback</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* App Tour */}
              <button 
                onClick={() => setIsIntroTourOpen(true)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Compass className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">App Tour</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* App Version */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">App Version</span>
                </div>
                <span className="text-sm text-muted-foreground">{APP_VERSION}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Intro Tour Modal - Replay from Settings */}
        <IntroTour open={isIntroTourOpen} onComplete={() => setIsIntroTourOpen(false)} />

        {/* FAQ Screen */}
        <FAQScreen open={isFAQOpen} onOpenChange={setIsFAQOpen} />
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              />
            </div>

            {/* Country / Region */}
            <CountrySelector
              value={editForm.country}
              onChange={(v) => setEditForm({ ...editForm, country: v })}
              compact
            />

            {/* Unit Toggle */}
            <div className="flex items-center justify-between py-2">
              <Label>Units</Label>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${editForm.unitPreference === 'imperial' ? 'font-medium' : 'text-muted-foreground'}`}>
                  Imperial
                </span>
                <Switch
                  checked={editForm.unitPreference === 'metric'}
                  onCheckedChange={handleUnitChange}
                />
                <span className={`text-sm ${editForm.unitPreference === 'metric' ? 'font-medium' : 'text-muted-foreground'}`}>
                  Metric
                </span>
              </div>
            </div>

            {/* Height Input */}
            <div className="space-y-2">
              <Label>Height {editForm.unitPreference === 'metric' ? '(cm)' : '(ft/in)'}</Label>
              {editForm.unitPreference === 'metric' ? (
                <Input
                  type="number"
                  placeholder="170"
                  value={editForm.heightCm}
                  onChange={(e) => setEditForm({ ...editForm, heightCm: e.target.value })}
                />
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="5"
                      value={editForm.heightFeet}
                      onChange={(e) => setEditForm({ ...editForm, heightFeet: e.target.value })}
                    />
                    <span className="text-xs text-muted-foreground mt-1 block">feet</span>
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="7"
                      min="0"
                      max="11"
                      value={editForm.heightInches}
                      onChange={(e) => setEditForm({ ...editForm, heightInches: e.target.value })}
                    />
                    <span className="text-xs text-muted-foreground mt-1 block">inches</span>
                  </div>
                </div>
              )}
            </div>

            {/* Weight Input */}
            <div className="space-y-2">
              <Label>Weight ({editForm.unitPreference === 'metric' ? 'kg' : 'lb'})</Label>
              <Input
                type="number"
                step="0.1"
                placeholder={editForm.unitPreference === 'metric' ? '70' : '154'}
                value={editForm.weight}
                onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
              />
            </div>

            {/* Workout Days */}
            <WorkoutDaysSelector
              workoutDays={editForm.workoutDays}
              onWorkoutDaysChange={(days) => setEditForm({ ...editForm, workoutDays: days })}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSaving || isRealigning}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSaving || isRealigning}>
              {isSaving || isRealigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isRealigning ? 'Updating schedule...' : 'Saving...'}
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Equipment Edit Modal */}
      <Dialog open={isEquipmentModalOpen} onOpenChange={setIsEquipmentModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>
              Update your available equipment. Your plan will use these for exercise selection.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <EquipmentEditor
              equipment={equipmentList}
              onEquipmentChange={setEquipmentList}
              showTitle={false}
              compact
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEquipmentModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEquipment} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Equipment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule & Calendar Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Workout Time & Calendar</DialogTitle>
            <DialogDescription>
              Set your preferred workout time and sync workouts to your calendar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <WorkoutTimeSettings
              preferences={calendarSync.preferences}
              calendarSyncEnabled={calendarSync.calendarSyncEnabled}
              calendarProvider={calendarSync.calendarProvider}
              onPreferencesChange={calendarSync.setPreferences}
              onCalendarSyncChange={calendarSync.setCalendarSyncEnabled}
              onCalendarProviderChange={calendarSync.setCalendarProvider}
              onSave={async () => {
                const success = await calendarSync.saveSettings();
                if (success) {
                  await refetch();
                  setIsScheduleModalOpen(false);
                }
              }}
              isSaving={calendarSync.isSaving}
              currentPlanWorkouts={calendarSync.currentPlanWorkouts}
              currentPlan={calendarSync.currentPlan}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Feedback Modal */}
      <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              Let us know how we can improve your experience.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="What would you like to share with us?"
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => {
              setIsFeedbackModalOpen(false);
              setFeedbackMessage('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (feedbackMessage.trim()) {
                  openMailto(EMAIL_SUPPORT, `${APP_NAME} Feedback`);
                  setIsFeedbackModalOpen(false);
                  setFeedbackMessage('');
                  toast.success('Opening email to send feedback');
                } else {
                  toast.error('Please enter your feedback');
                }
              }}
              disabled={!feedbackMessage.trim()}
            >
              Send Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
