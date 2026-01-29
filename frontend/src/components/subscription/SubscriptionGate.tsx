/**
 * Subscription Gate Component
 * 
 * Wraps premium features and redirects to paywall if user doesn't have access.
 * NOTE: Stripe Checkout + webhooks will replace mock provider once LLC and Stripe account are live.
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface SubscriptionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SubscriptionGate({ children, fallback }: SubscriptionGateProps) {
  const { hasPremiumAccess, loading, status } = useSubscription();
  const location = useLocation();

  if (loading) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    );
  }

  // Users with preview or expired status should see the paywall
  if (!hasPremiumAccess) {
    return (
      <Navigate 
        to="/paywall" 
        state={{ from: location.pathname }}
        replace 
      />
    );
  }

  return <>{children}</>;
}

/**
 * Hook to check if a feature requires premium access
 * Useful for conditionally showing upgrade prompts
 */
export function usePremiumFeature() {
  const { hasPremiumAccess, status, daysLeftInTrial } = useSubscription();

  return {
    hasPremiumAccess,
    status,
    daysLeftInTrial,
    requiresUpgrade: !hasPremiumAccess,
    isTrialing: status === 'trialing',
    showTrialBanner: status === 'trialing' && daysLeftInTrial !== null && daysLeftInTrial <= 3,
  };
}
