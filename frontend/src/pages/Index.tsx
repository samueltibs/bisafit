import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasPremiumAccess, loading: subscriptionLoading } = useSubscription();
  const location = useLocation();

  // Check for password recovery token in URL hash FIRST
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const type = hashParams.get('type');
  
  if (type === 'recovery') {
    // Redirect to reset password page with the hash intact
    return <Navigate to={`/reset-password${window.location.hash}`} replace />;
  }

  // Show loading only for auth check
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

  // User is logged in - check subscription
  if (subscriptionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Logged in - go directly to home (let home page handle any redirects if needed)
  // This prevents the onboarding loop for returning users
  return <Navigate to="/home" replace />;
};

export default Index;
