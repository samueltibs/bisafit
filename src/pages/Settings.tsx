import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Bell, 
  Moon, 
  Shield, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Crown,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  full_name: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  fitness_goal: string | null;
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('full_name, height_cm, weight_kg, fitness_goal')
        .eq('user_id', user.id)
        .single();
      
      if (data) setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/auth');
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  const goalLabels: Record<string, string> = {
    lose_weight: 'Lose Weight',
    build_muscle: 'Build Muscle',
    stay_fit: 'Stay Fit',
    improve_health: 'Improve Health',
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
              {profile?.fitness_goal && (
                <p className="mt-1 text-sm text-primary">
                  Goal: {goalLabels[profile.fitness_goal] || profile.fitness_goal}
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/onboarding')}>
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
                  <p className="text-2xl font-bold">{profile.weight_kg}</p>
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
              <p className="font-semibold">Free Plan</p>
              <p className="text-sm opacity-90">Upgrade to unlock all features</p>
            </div>
            <Button variant="secondary" size="sm">
              Upgrade
            </Button>
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
