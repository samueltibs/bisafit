import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
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
  Moon, 
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
  Mail,
  FileText,
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
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { EmailPreferences } from '@/components/settings/EmailPreferences';
import { APP_NAME, APP_VERSION, EMAIL_SUPPORT, SUPPORT_MESSAGE } from '@/lib/branding';
import { openExternalLink, openMailto, EXTERNAL_URLS } from '@/lib/externalLinks';

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { profile, loading, update, refetch } = useUserProfile();
  const [darkMode, setDarkMode] = useState(false);
  
  // Profile editing modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  
  // Calendar sync hook
  const calendarSync = useCalendarSync();
  const [isSaving, setIsSaving] = useState(false);
  const [showEquipmentBanner, setShowEquipmentBanner] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    unitPreference: 'metric' as UnitPreference,
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

  // Initialize calendar sync settings when schedule modal opens
  useEffect(() => {
    if (isScheduleModalOpen && profile) {
      calendarSync.loadSettings(profile);
      // Load current plan workouts
      if (user && (profile as any).current_plan_id) {
        calendarSync.loadCurrentPlanWorkouts(user.id, (profile as any).current_plan_id);
      }
    }
  }, [isScheduleModalOpen, profile, user]);

  // Initialize edit form when modal opens
  useEffect(() => {
    if (isEditModalOpen && profile) {
      // Determine unit preference: use saved, or infer from locale
      const savedUnit = profile.unit_preference as UnitPreference | null;
      const unitPref = savedUnit || getDefaultUnitPreference();
      
      // Convert stored values to display values
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

      // Load workout days
      const workoutDays = (profile as any).workout_days || ['Monday', 'Wednesday', 'Thursday', 'Friday'];

      setEditForm({
        fullName: profile.full_name || '',
        unitPreference: unitPref,
        heightFeet,
        heightInches,
        heightCm,
        weight,
        workoutDays,
      });
    }
  }, [isEditModalOpen, profile]);

  // Handle unit toggle - convert values when switching units
  const handleUnitChange = (checked: boolean) => {
    const newUnit: UnitPreference = checked ? 'metric' : 'imperial';
    const oldUnit = editForm.unitPreference;

    if (newUnit === oldUnit) return;

    let newForm = { ...editForm, unitPreference: newUnit };

    // Convert height
    if (oldUnit === 'imperial' && newUnit === 'metric') {
      // Imperial -> Metric
      const feet = parseInt(editForm.heightFeet) || 0;
      const inches = parseInt(editForm.heightInches) || 0;
      if (feet > 0 || inches > 0) {
        newForm.heightCm = String(ftInToCm(feet, inches));
      }
      // Convert weight lb -> kg
      if (editForm.weight) {
        const lb = parseFloat(editForm.weight);
        if (!isNaN(lb)) {
          newForm.weight = String(lbToKg(lb));
        }
      }
    } else if (oldUnit === 'metric' && newUnit === 'imperial') {
      // Metric -> Imperial
      if (editForm.heightCm) {
        const cm = parseInt(editForm.heightCm);
        if (!isNaN(cm)) {
          const { feet, inches } = cmToFtIn(cm);
          newForm.heightFeet = String(feet);
          newForm.heightInches = String(inches);
        }
      }
      // Convert weight kg -> lb
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

  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleSaveProfile = async () => {
    if (!editForm.fullName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsSaving(true);
    try {
      // Convert to storage units (cm, kg)
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

      const success = await update({
        full_name: editForm.fullName.trim(),
        height_cm: heightCm,
        weight_kg: weightKg,
        unit_preference: editForm.unitPreference,
        workout_days: editForm.workoutDays,
        days_per_week: editForm.workoutDays.length,
      } as any);

      if (success) {
        await refetch();
        toast.success('Profile updated successfully!');
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
      // Normalize all equipment names
      const normalizedEquipment = equipmentList.map(normalizeEquipmentName);
      // Deduplicate
      const uniqueEquipment = [...new Set(normalizedEquipment)];

      const success = await update({
        equipment_json: uniqueEquipment,
      } as any);

      if (success) {
        await refetch();
        toast.success('Equipment updated');
        setIsEquipmentModalOpen(false);
        // Show banner about plan regeneration
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

  // Get effective unit preference for display
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
        {/* Profile Header */}
        <Card className="border-border animate-fade-in">
          <CardContent className="flex items-center gap-4 p-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">
                {profile?.full_name?.trim() || 'BisaFit User'}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {profile?.goal_primary && (
                <p className="mt-1 text-sm text-primary">
                  Goal: {goalLabels[profile.goal_primary] || profile.goal_primary}
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleOpenEditModal}>
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        {(profile?.height_cm || profile?.weight_kg) && (
          <div className="grid grid-cols-2 gap-3 animate-slide-up">
            {profile.height_cm && (
              <Card className="border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{formatHeight(profile.height_cm, displayUnit).replace(/ cm| lb/, '')}</p>
                  <p className="text-sm text-muted-foreground">
                    Height {displayUnit === 'metric' ? '(cm)' : '(ft/in)'}
                  </p>
                </CardContent>
              </Card>
            )}
            {profile.weight_kg && (
              <Card className="border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">
                    {displayUnit === 'metric' ? Number(profile.weight_kg) : kgToLb(Number(profile.weight_kg))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Weight ({displayUnit === 'metric' ? 'kg' : 'lb'})
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Workout Schedule Summary */}
        {(profile as any)?.workout_days && (
          <Card className="border-border animate-slide-up">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Workout Schedule</p>
                    <p className="text-sm text-muted-foreground">
                      {((profile as any).workout_days as string[]).join(', ')} ({((profile as any).workout_days as string[]).length} days/week)
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workout Time & Calendar Section */}
        <Card className="border-border animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">Workout Time & Calendar</p>
                  {(profile as any)?.workout_time_preferences_json ? (
                    <p className="text-sm text-muted-foreground">
                      {formatTimeDisplay(((profile as any).workout_time_preferences_json as any)?.default_time || '06:00')}
                      {(profile as any)?.calendar_sync_enabled && ' • Calendar sync on'}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Set your preferred workout time</p>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsScheduleModalOpen(true)}>
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Section */}
        <Card className="border-border animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Dumbbell className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">My Equipment</p>
                  {(profile as any)?.equipment_json && ((profile as any).equipment_json as string[]).length > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {((profile as any).equipment_json as string[]).slice(0, 3).map(formatEquipmentName).join(', ')}
                      {((profile as any).equipment_json as string[]).length > 3 && ` +${((profile as any).equipment_json as string[]).length - 3} more`}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No equipment added</p>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsEquipmentModalOpen(true)}>
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Update Banner */}
        {showEquipmentBanner && (
          <Alert className="border-primary/30 bg-primary/5 animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertDescription className="flex items-center justify-between">
              <span>New equipment added. Regenerate your plan to include it.</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setShowEquipmentBanner(false);
                  navigate('/plan');
                }}
              >
                Regenerate Plan
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription */}
        <Card className="gradient-primary text-primary-foreground animate-slide-up">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
              <Crown className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{profile?.is_pro ? 'Pro Plan' : 'Free Plan'}</p>
              <p className="text-sm opacity-90">
                {profile?.is_pro ? 'Full access to all features' : 'Start your free trial to unlock everything'}
              </p>
            </div>
            {!profile?.is_pro && (
              <Button variant="secondary" size="sm" onClick={() => navigate('/paywall')}>
                Start Free Trial
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <div className="animate-slide-up">
          <NotificationSettings />
        </div>

        {/* Email Preferences */}
        <div className="animate-slide-up">
          <EmailPreferences />
        </div>

        {/* Settings List */}
        <div className="space-y-4 animate-slide-up">
          <h3 className="text-sm font-medium text-muted-foreground">Preferences</h3>
          
          <Card className="border-border">
            <CardContent className="divide-y divide-border p-0">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-muted-foreground" />
                  <span>Dark Mode</span>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
            </CardContent>
          </Card>

          <h3 className="text-sm font-medium text-muted-foreground">Support</h3>
          
          <Card className="border-border">
            <CardContent className="divide-y divide-border p-0">
              {/* Need Help? */}
              <button 
                onClick={() => openMailto(EMAIL_SUPPORT)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="block">Need help?</span>
                    <span className="text-sm text-muted-foreground">{EMAIL_SUPPORT}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              {/* Privacy Policy */}
              <button 
                onClick={() => openExternalLink(EXTERNAL_URLS.privacyPolicy)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span>Privacy Policy</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              {/* Terms of Service */}
              <button 
                onClick={() => openExternalLink(EXTERNAL_URLS.termsOfService)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span>Terms of Service</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Sign Out */}
        <Button
          variant="outline"
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive animate-slide-up"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {APP_NAME} v{APP_VERSION}
        </p>
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
            <Button variant="outline" onClick={handleCloseEditModal} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
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
    </AppLayout>
  );
}
