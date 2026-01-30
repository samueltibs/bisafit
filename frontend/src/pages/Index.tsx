import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, hasCompletedOnboarding } = useUserProfile();
  const { hasPremiumAccess, loading: subscriptionLoading } = useSubscription();

  // Show loading only for auth check initially
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in - go to auth (login/signup page)
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // User is logged in, now check profile and subscription
  if (profileLoading || subscriptionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Logged in but no profile or onboarding incomplete - go to onboarding
  if (!profile || !hasCompletedOnboarding()) {
    return <Navigate to="/onboarding" replace />;
  }

  // Logged in with complete profile but no premium access - go to paywall
  if (!hasPremiumAccess) {
    return <Navigate to="/paywall" replace />;
  }

  // Logged in with complete profile and premium access - go to home
  return <Navigate to="/home" replace />;
};

export default Index;
