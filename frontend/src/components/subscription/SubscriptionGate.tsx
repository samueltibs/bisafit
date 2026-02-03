/**
 * Subscription Gate Component
 * 
 * Wraps premium features and redirects to paywall if user doesn't have access.
 * NOTE: Stripe Checkout + webhooks will replace mock provider once LLC and Stripe account are live.
 * 
 * BETA MODE: When enabled, all users bypass the paywall
 * ADMIN: Admin users always bypass the paywall
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSubscription, BETA_MODE_ENABLED } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/adminConfig';

interface SubscriptionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SubscriptionGate({ children, fallback }: SubscriptionGateProps) {
  const { hasPremiumAccess, loading, status } = useSubscription();
  const { user } = useAuth();
  const location = useLocation();

  // Check if user has free access (admin or beta mode)
  const isAdmin = isAdminEmail(user?.email);
  const hasFreeAccess = isAdmin || BETA_MODE_ENABLED;

  if (loading) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    );
  }

  // Admin or beta mode = bypass paywall
  if (hasFreeAccess) {
    return <>{children}</>;
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
  const { hasPremiumAccess, status, daysLeftInTrial, isAdmin, isBetaMode } = useSubscription();

  // Admin or beta mode = always has access
  const effectiveAccess = hasPremiumAccess || isAdmin || isBetaMode;

  return {
    hasPremiumAccess: effectiveAccess,
    status,
    daysLeftInTrial,
    requiresUpgrade: !effectiveAccess,
    isTrialing: status === 'trialing',
    showTrialBanner: status === 'trialing' && daysLeftInTrial !== null && daysLeftInTrial <= 3 && !isAdmin && !isBetaMode,
    isAdmin,
    isBetaMode,
  };
}
