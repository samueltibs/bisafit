import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  X,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading, update } = useUserProfile();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    gender: '',
    heightCm: null as number | null,
    weightKg: null as number | null,
    unitPreference: 'metric',
  });

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        fullName: profile.full_name || '',
        gender: profile.gender || '',
        heightCm: profile.height_cm || null,
        weightKg: profile.weight_kg ? Number(profile.weight_kg) : null,
        unitPreference: (profile as any).unit_preference || 'metric',
      });
    }
  }, [profile]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/auth');
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const success = await update({
        full_name: editForm.fullName.trim() || null,
        gender: editForm.gender || null,
        height_cm: editForm.heightCm,
        weight_kg: editForm.weightKg,
        unit_preference: editForm.unitPreference,
      } as any);

      if (success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
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

  const handleCancelEdit = () => {
    // Reset form to current profile values
    if (profile) {
      setEditForm({
        fullName: profile.full_name || '',
        gender: profile.gender || '',
        heightCm: profile.height_cm || null,
        weightKg: profile.weight_kg ? Number(profile.weight_kg) : null,
        unitPreference: (profile as any).unit_preference || 'metric',
      });
    }
    setIsEditing(false);
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  const goalLabels: Record<string, string> = {
    fat_loss: 'Fat Loss',
    muscle_gain: 'Build Muscle',
    endurance: 'Endurance',
    maintenance: 'Maintenance',
  };

  const genderLabels: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
    prefer_not_to_say: 'Prefer not to say',
  };

  const isMetric = editForm.unitPreference === 'metric';

  // Convert values for display in edit mode
  const displayHeight = isMetric
    ? editForm.heightCm
    : editForm.heightCm
    ? Math.round(editForm.heightCm / 2.54)
    : null;

  const displayWeight = isMetric
    ? editForm.weightKg
    : editForm.weightKg
    ? Math.round(editForm.weightKg * 2.205)
    : null;

  const handleHeightChange = (value: string) => {
    if (value === '') {
      setEditForm({ ...editForm, heightCm: null });
      return;
    }
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const cmValue = isMetric ? num : num * 2.54;
    setEditForm({ ...editForm, heightCm: Math.round(cmValue) });
  };

  const handleWeightChange = (value: string) => {
    if (value === '') {
      setEditForm({ ...editForm, weightKg: null });
      return;
    }
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const kgValue = isMetric ? num : num / 2.205;
    setEditForm({ ...editForm, weightKg: Math.round(kgValue * 10) / 10 });
  };

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
              <h2 className="text-xl font-bold">{profile?.full_name || 'BisaFit User'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {profile?.goal_primary && (
                <p className="mt-1 text-sm text-primary">
                  Goal: {goalLabels[profile.goal_primary] || profile.goal_primary}
                </p>
              )}
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Editable Profile Section */}
        {isEditing ? (
          <Card className="border-border animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                Edit Profile
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="editFullName">Name</Label>
                <Input
                  id="editFullName"
                  placeholder="Enter your name"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label>Gender</Label>
                <RadioGroup
                  value={editForm.gender}
                  onValueChange={(v) => setEditForm({ ...editForm, gender: v })}
                  className="grid grid-cols-2 gap-2"
                >
                  {Object.entries(genderLabels).map(([value, label]) => (
                    <div key={value} className="flex items-center space-x-2">
                      <RadioGroupItem value={value} id={`edit-gender-${value}`} />
                      <Label htmlFor={`edit-gender-${value}`} className="cursor-pointer font-normal text-sm">
                        {label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Unit Preference */}
              <div className="space-y-2">
                <Label>Unit Preference</Label>
                <RadioGroup
                  value={editForm.unitPreference}
                  onValueChange={(v) => setEditForm({ ...editForm, unitPreference: v })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="metric" id="edit-unit-metric" />
                    <Label htmlFor="edit-unit-metric" className="cursor-pointer font-normal">
                      Metric (kg, cm)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="imperial" id="edit-unit-imperial" />
                    <Label htmlFor="edit-unit-imperial" className="cursor-pointer font-normal">
                      Imperial (lb, in)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Height & Weight */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editHeight">Height ({isMetric ? 'cm' : 'in'})</Label>
                  <Input
                    id="editHeight"
                    type="number"
                    placeholder={isMetric ? '170' : '67'}
                    value={displayHeight ?? ''}
                    onChange={(e) => handleHeightChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editWeight">Weight ({isMetric ? 'kg' : 'lb'})</Label>
                  <Input
                    id="editWeight"
                    type="number"
                    placeholder={isMetric ? '70' : '154'}
                    value={displayWeight ?? ''}
                    onChange={(e) => handleWeightChange(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Stats Summary (only when not editing) */
          (profile?.height_cm || profile?.weight_kg) && (
            <div className="grid grid-cols-2 gap-3 animate-slide-up">
              {profile.height_cm && (
                <Card className="border-border">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{profile.height_cm}</p>
                    <p className="text-sm text-muted-foreground">Height (cm)</p>
                  </CardContent>
                </Card>
              )}
              {profile.weight_kg && (
                <Card className="border-border">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{Number(profile.weight_kg)}</p>
                    <p className="text-sm text-muted-foreground">Weight (kg)</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )
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
                {profile?.is_pro ? 'Full access to all features' : 'Upgrade to unlock all features'}
              </p>
            </div>
            {!profile?.is_pro && (
              <Button variant="secondary" size="sm">
                Upgrade
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Settings List */}
        <div className="space-y-4 animate-slide-up">
          <h3 className="text-sm font-medium text-muted-foreground">Preferences</h3>
          
          <Card className="border-border">
            <CardContent className="divide-y divide-border p-0">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span>Push Notifications</span>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
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
              <button className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <span>Help & FAQ</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <button className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span>Privacy Policy</span>
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
          BisaFit v1.0.0
        </p>
      </div>
    </AppLayout>
  );
}
