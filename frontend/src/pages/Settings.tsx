import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import { useScheduleRealignment } from '@/hooks/useScheduleRealignment';
import { restoreBodyScroll } from '@/hooks/useScrollRestore';
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
  Dumbbell,
  Sparkles,
  User,
  Target,
  Ruler,
  MessageSquare,
  CreditCard,
  MapPin,
  Mail,
  Info,
  Compass,
  Music,
  Activity,
  BarChart3,
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
import { parseTimePreferences, getDefaultTimePreferences } from '@/lib/calendarUtils';
import { SchedulingSection } from '@/components/settings/SchedulingSection';
import { EquipmentEditor, formatEquipmentName, normalizeEquipmentName } from '@/components/settings/EquipmentEditor';
import { CoachToneSelector } from '@/components/settings/CoachToneSelector';
import { CoachVoiceSelector } from '@/components/settings/CoachVoiceSelector';
import { APP_NAME, APP_VERSION, EMAIL_SUPPORT } from '@/lib/branding';
import { openExternalLink, openMailto, EXTERNAL_URLS } from '@/lib/externalLinks';
import { type CoachTone, normalizeCoachTone } from '@/lib/coachTone';
import { FAQScreen } from '@/components/settings/FAQScreen';
import { getCountryName } from '@/lib/countryUtils';
import { CountrySelect } from '@/components/settings/CountrySelect';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { CollapsibleCountrySelector } from '@/components/settings/CollapsibleCountrySelector';
import { CollapsibleLanguageSelector } from '@/components/settings/CollapsibleLanguageSelector';
import { getLanguageName } from '@/lib/languageUtils';
import { useTranslation, translateGoal } from '@/lib/i18n';
import { MusicSettings } from '@/components/settings/MusicSettings';
import { HealthPlatformSettings } from '@/components/settings/HealthPlatformSettings';
import { ReminderSettings } from '@/components/settings/ReminderSettings';
import { BetaFeedbackForm } from '@/components/settings/BetaFeedbackForm';
import { ActiveRestSelector } from '@/components/settings/ActiveRestSelector';
import { isAdminEmail } from '@/lib/adminConfig';
import { ActiveRestConfig, getDefaultActiveRestConfig } from '@/types/activeRest';
import { useNutritionSettings } from '@/hooks/useNutritionSettings';

// Toggle this to switch between beta feedback form and simple feedback
const BETA_MODE = true;

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { profile, loading, update, refetch } = useUserProfile();
  const { realignSchedule, haveWorkoutDaysChanged, isRealigning } = useScheduleRealignment();
  
  // Check if user is admin
  const isAdmin = isAdminEmail(user?.email);
  
  // Modal states with scroll restoration on close
  const [isEditModalOpen, setIsEditModalOpenState] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpenState] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpenState] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isFAQOpen, setIsFAQOpenState] = useState(false);
  const [isIntroTourOpen, setIsIntroTourOpenState] = useState(false);
  
  // Track which section to scroll to in the edit modal
  const [editModalSection, setEditModalSection] = useState<'profile' | 'country' | 'language' | 'goals' | null>(null);
  const countrySectionRef = useRef<HTMLDivElement>(null);
  const languageSectionRef = useRef<HTMLDivElement>(null);
  const goalsSectionRef = useRef<HTMLDivElement>(null);

  // Wrap modal setters to restore scroll on close
  const setIsEditModalOpen = useCallback((open: boolean, section?: 'profile' | 'country' | 'language' | 'goals') => {
    setIsEditModalOpenState(open);
    if (open && section) {
      setEditModalSection(section);
    } else if (!open) {
      setEditModalSection(null);
      setTimeout(restoreBodyScroll, 50);
    }
  }, []);
  
  const setIsEquipmentModalOpen = useCallback((open: boolean) => {
    setIsEquipmentModalOpenState(open);
    if (!open) setTimeout(restoreBodyScroll, 50);
  }, []);
  
  const setIsFeedbackModalOpen = useCallback((open: boolean) => {
    setIsFeedbackModalOpenState(open);
    if (!open) setTimeout(restoreBodyScroll, 50);
  }, []);
  
  const setIsFAQOpen = useCallback((open: boolean) => {
    setIsFAQOpenState(open);
    if (!open) setTimeout(restoreBodyScroll, 50);
  }, []);
  
  const setIsIntroTourOpen = useCallback((open: boolean) => {
    setIsIntroTourOpenState(open);
    if (!open) setTimeout(restoreBodyScroll, 50);
  }, []);
  
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
  
  // Edit form state - now includes scheduling info
  const [editForm, setEditForm] = useState({
    fullName: '',
    unitPreference: 'metric' as UnitPreference,
    country: null as string | null,
    language: 'auto' as string,
    heightFeet: '',
    heightInches: '',
    heightCm: '',
    weight: '',
    workoutDays: ['Monday', 'Wednesday', 'Thursday', 'Friday'] as string[],
    timePreferences: getDefaultTimePreferences(),
    calendarSyncEnabled: false,
    notificationsEnabled: false,
    activeRestConfig: getDefaultActiveRestConfig() as ActiveRestConfig,
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
    // Redirect schedule param to edit modal since it's consolidated now
    if (searchParams.get('schedule') === 'true' && !loading) {
      setIsEditModalOpen(true);
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

  // Initialize calendar sync settings when edit modal opens
  useEffect(() => {
    if (isEditModalOpen && profile && user) {
      calendarSync.loadSettings(profile);
      if ((profile as any).current_plan_id) {
        calendarSync.loadCurrentPlanWorkouts(user.id, (profile as any).current_plan_id);
      }
    }
  }, [isEditModalOpen, profile, user]);

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
      const language = (profile as any).language || 'auto';
      const timePreferences = parseTimePreferences((profile as any).workout_time_preferences_json);
      const calendarSyncEnabled = (profile as any).calendar_sync_enabled || false;
      const notificationsEnabledVal = (profile as any).notifications_enabled ?? false;
      const activeRestConfig = (profile as any).active_rest_config || getDefaultActiveRestConfig();

      // Store original workout days to detect changes on save
      originalWorkoutDaysRef.current = [...workoutDays];

      setEditForm({
        fullName: profile.full_name || '',
        unitPreference: unitPref,
        country,
        language,
        heightFeet,
        heightInches,
        heightCm,
        weight,
        workoutDays,
        timePreferences,
        calendarSyncEnabled,
        notificationsEnabled: notificationsEnabledVal,
        activeRestConfig,
      });
    }
  }, [isEditModalOpen, profile]);

  // Scroll to section when modal opens with a specific section target
  useEffect(() => {
    if (isEditModalOpen && editModalSection) {
      // Small delay to ensure modal content is rendered
      const scrollTimeout = setTimeout(() => {
        let targetRef: React.RefObject<HTMLDivElement> | null = null;
        if (editModalSection === 'country') {
          targetRef = countrySectionRef;
        } else if (editModalSection === 'language') {
          targetRef = languageSectionRef;
        } else if (editModalSection === 'goals') {
          targetRef = goalsSectionRef;
        }
        
        if (targetRef?.current) {
          targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a brief highlight effect
          targetRef.current.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            targetRef?.current?.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 1500);
        }
      }, 150);
      
      return () => clearTimeout(scrollTimeout);
    }
  }, [isEditModalOpen, editModalSection]);

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
        language: editForm.language,
        workout_days: editForm.workoutDays,
        days_per_week: editForm.workoutDays.length,
        workout_time_preferences_json: editForm.timePreferences,
        calendar_sync_enabled: editForm.calendarSyncEnabled,
        calendar_provider: editForm.calendarSyncEnabled ? 'ics' : null,
        notifications_enabled: editForm.notificationsEnabled,
        active_rest_config: editForm.activeRestConfig,
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

  // Inline save handler for Country
  const handleInlineCountrySave = async (countryCode: string): Promise<boolean> => {
    try {
      const success = await update({ country: countryCode } as any);
      if (success) {
        // Refetch to ensure global state is updated
        await refetch();
        // Also update local editForm state in case modal is opened later
        setEditForm(prev => ({ ...prev, country: countryCode }));
        toast.success('Country updated');
        return true;
      } else {
        toast.error('Failed to update country');
        return false;
      }
    } catch (error) {
      console.error('Country update error:', error);
      toast.error('Failed to update country');
      return false;
    }
  };

  // Inline save handler for Language
  const handleInlineLanguageSave = async (languageCode: string): Promise<boolean> => {
    try {
      const success = await update({ language: languageCode } as any);
      if (success) {
        // Refetch to ensure global state is updated
        await refetch();
        // Also update local editForm state in case modal is opened later
        setEditForm(prev => ({ ...prev, language: languageCode }));
        toast.success('Language updated');
        // The UI will re-render automatically when profile updates trigger AppLanguageProvider
        return true;
      } else {
        toast.error('Failed to update language');
        return false;
      }
    } catch (error) {
      console.error('Language update error:', error);
      toast.error('Failed to update language');
      return false;
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  const { t } = useTranslation();

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
      <div className="container space-y-6 px-4 py-6 pb-24">
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
            <Button variant="ghost" size="icon" onClick={() => setIsEditModalOpen(true, 'profile')}>
              <Edit2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Section 1: You & Your Plan */}
        <div className="space-y-4 animate-slide-up">
          <h3 className="text-sm font-medium text-muted-foreground">{t('settings.youAndYourPlan')}</h3>
          
          <Card className="border-border">
            <CardContent className="divide-y divide-border p-0">
              {/* Goals */}
              <button 
                onClick={() => {
                  if (import.meta.env.DEV) console.log('[Settings] Item clicked: Goals -> edit modal (goals section)');
                  setIsEditModalOpen(true, 'goals');
                }}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="block font-medium">{t('settings.goals')}</span>
                    <span className="text-sm text-muted-foreground">
                      {profile?.goal_primary ? translateGoal(profile.goal_primary, t) : 'Not set'}
                      {(() => {
                        const activeRestConfig = (profile as any)?.active_rest_config;
                        const activeCount = activeRestConfig?.activities?.length || 0;
                        if (activeCount > 0) {
                          return ` • ${activeCount} active rest ${activeCount === 1 ? 'day' : 'days'}`;
                        }
                        return '';
                      })()}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Country / Region - Collapsible Inline */}
              <CollapsibleCountrySelector
                value={(profile as any)?.country || null}
                onSave={handleInlineCountrySave}
              />

              {/* Language - Collapsible Inline */}
              <CollapsibleLanguageSelector
                value={(profile as any)?.language || null}
                onSave={handleInlineLanguageSave}
              />

              <button 
                onClick={() => setIsEquipmentModalOpen(true)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Dumbbell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="block font-medium">{t('settings.equipment')}</span>
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
                  <span className="font-medium">{t('settings.coachTone')}</span>
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
                  <span className="font-medium">{t('settings.coachVoice')}</span>
                </div>
                <CoachVoiceSelector compact />
              </div>

              {/* Music */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Music className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Music</span>
                </div>
                <MusicSettings compact />
              </div>

              {/* Health Platforms */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Health Tracking</span>
                </div>
                <HealthPlatformSettings compact />
              </div>
            </CardContent>
          </Card>

          {/* Smart Reminders Section */}
          <ReminderSettings />

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
          <h3 className="text-sm font-medium text-muted-foreground">{t('settings.account')}</h3>
          
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
                  <span className="font-medium">{t('settings.signOut')}</span>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Help & Support */}
        <div className="space-y-4 animate-slide-up">
          <h3 className="text-sm font-medium text-muted-foreground">{t('settings.helpSupport')}</h3>
          
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
                  <MessageSquare className="h-5 w-5 icon-heart" />
                  <div>
                    <span className="font-medium">{BETA_MODE ? 'Beta Feedback' : 'Send Feedback'}</span>
                    {BETA_MODE && (
                      <p className="text-xs text-muted-foreground">Help us improve before launch</p>
                    )}
                  </div>
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

              {/* Admin Analytics - Only show for admin users */}
              {BETA_MODE && isAdmin && (
                <button 
                  onClick={() => navigate('/admin/analytics')}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 icon-energy" />
                    <div>
                      <span className="font-medium">Analytics Dashboard</span>
                      <p className="text-xs text-muted-foreground">View feedback & usage data</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              )}

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
      <Dialog open={isEditModalOpen} onOpenChange={(open) => setIsEditModalOpen(open)}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
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
            <div ref={countrySectionRef} className="rounded-lg transition-all duration-300">
              <CountrySelect
                value={editForm.country}
                onChange={(v) => setEditForm({ ...editForm, country: v })}
                compact
              />
            </div>

            {/* Language */}
            <div ref={languageSectionRef} className="rounded-lg transition-all duration-300">
              <LanguageSelector
                value={editForm.language}
                onChange={(v) => setEditForm({ ...editForm, language: v })}
                compact
              />
            </div>

            {/* Goals Section - includes Active Rest configuration */}
            <div ref={goalsSectionRef} className="rounded-lg transition-all duration-300 space-y-4 py-4 border-t border-border">
              <div className="flex items-center gap-2 text-base font-medium">
                <Target className="h-5 w-5 text-primary" />
                <span>Goals & Recovery</span>
              </div>
              
              {/* Primary Goal Display */}
              <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                <div>
                  <span className="text-sm text-muted-foreground">Primary Goal</span>
                  <p className="font-medium">{profile?.goal_primary ? translateGoal(profile.goal_primary, t) : 'Not set'}</p>
                </div>
                <span className="text-xs text-muted-foreground">Set in onboarding</span>
              </div>
              
              {/* Active Rest Days */}
              <div className="pt-2">
                <ActiveRestSelector
                  workoutDays={editForm.workoutDays}
                  config={editForm.activeRestConfig}
                  onChange={(config) => setEditForm({ ...editForm, activeRestConfig: config })}
                  showAISuggestions={true}
                />
              </div>
            </div>

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

            {/* Consolidated Scheduling Section */}
            <div className="pt-4 border-t border-border">
              <SchedulingSection
                workoutDays={editForm.workoutDays}
                onWorkoutDaysChange={(days) => setEditForm({ ...editForm, workoutDays: days })}
                preferences={editForm.timePreferences}
                onPreferencesChange={(prefs) => setEditForm({ ...editForm, timePreferences: prefs })}
                calendarSyncEnabled={editForm.calendarSyncEnabled}
                onCalendarSyncChange={(enabled) => setEditForm({ ...editForm, calendarSyncEnabled: enabled })}
                notificationsEnabled={editForm.notificationsEnabled}
                onNotificationsChange={(enabled) => setEditForm({ ...editForm, notificationsEnabled: enabled })}
                currentPlanWorkouts={calendarSync.currentPlanWorkouts}
                currentPlan={calendarSync.currentPlan}
              />
            </div>
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

      {/* Send Feedback Modal - Conditional based on BETA_MODE */}
      {BETA_MODE ? (
        <BetaFeedbackForm 
          open={isFeedbackModalOpen} 
          onOpenChange={setIsFeedbackModalOpen} 
        />
      ) : (
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
      )}
    </AppLayout>
  );
}
