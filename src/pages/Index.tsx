import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, hasCompletedOnboarding } = useUserProfile();

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in - go to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Logged in but no profile or onboarding incomplete - go to onboarding
  if (!profile || !hasCompletedOnboarding()) {
    return <Navigate to="/onboarding" replace />;
  }

  // Logged in with complete profile - go to home
  return <Navigate to="/home" replace />;
};

export default Index;
