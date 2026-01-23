import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { profile, loading, update, refetch } = useUserProfile();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Profile editing modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    heightCm: '' as string,
    weightKg: '' as string,
  });

  // Auto-open modal if ?edit=true in URL
  useEffect(() => {
    if (searchParams.get('edit') === 'true' && !loading) {
      setIsEditModalOpen(true);
      // Clear the query param
      setSearchParams({});
    }
  }, [searchParams, loading, setSearchParams]);

  // Initialize edit form when modal opens
  useEffect(() => {
    if (isEditModalOpen && profile) {
      setEditForm({
        fullName: profile.full_name || '',
        heightCm: profile.height_cm ? String(profile.height_cm) : '',
        weightKg: profile.weight_kg ? String(Number(profile.weight_kg)) : '',
      });
    }
  }, [isEditModalOpen, profile]);

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
      const heightValue = editForm.heightCm ? parseInt(editForm.heightCm, 10) : null;
      const weightValue = editForm.weightKg ? parseFloat(editForm.weightKg) : null;

      const success = await update({
        full_name: editForm.fullName.trim(),
        height_cm: isNaN(heightValue as number) ? null : heightValue,
        weight_kg: isNaN(weightValue as number) ? null : weightValue,
      });

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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="heightCm">Height (cm)</Label>
                <Input
                  id="heightCm"
                  type="number"
                  placeholder="170"
                  value={editForm.heightCm}
                  onChange={(e) => setEditForm({ ...editForm, heightCm: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightKg">Weight (kg)</Label>
                <Input
                  id="weightKg"
                  type="number"
                  step="0.1"
                  placeholder="70"
                  value={editForm.weightKg}
                  onChange={(e) => setEditForm({ ...editForm, weightKg: e.target.value })}
                />
              </div>
            </div>
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
    </AppLayout>
  );
}
