/**
 * Subscription Hook
 * 
 * Manages subscription state with Stripe integration.
 * 
 * BETA MODE: Set BETA_MODE_ENABLED to true to give all users free access
 * ADMIN: Admin emails always have full premium access
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { isAdminEmail } from '@/lib/adminConfig';
import { 
  createCheckoutSession, 
  createPortalSession, 
  getSubscriptionStatus 
} from '@/api/stripe';
import type { SubscriptionStatus, SubscriptionPlan, SubscriptionState } from '@/types/subscription';

// ============================================
// BETA MODE TOGGLE
// Set to true during beta testing - all users get free access
// Set to false for soft launch - normal subscription rules apply
// ============================================
export const BETA_MODE_ENABLED = true;

export function useSubscription() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionState>({
    status: 'preview',
    provider: 'mock',
    plan: null,
    trialStartDate: null,
    trialEndDate: null,
    isTrialExpired: false,
    hasPremiumAccess: false,
    daysLeftInTrial: null,
  });

  // Stripe-specific state
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<Date | null>(null);

  // Check if user is admin (always has premium access)
  const isAdmin = isAdminEmail(user?.email);
  
  // Check if user gets free access (admin OR beta mode)
  const hasFreeAccess = isAdmin || BETA_MODE_ENABLED;

  const checkTrialExpiry = useCallback((
    status: SubscriptionStatus,
    trialEndDate: Date | null
  ): { isExpired: boolean; daysLeft: number | null } => {
    if (status !== 'trialing' || !trialEndDate) {
      return { isExpired: false, daysLeft: null };
    }

    const now = new Date();
    const endDate = new Date(trialEndDate);
    const isExpired = now > endDate;
    
    if (isExpired) {
      return { isExpired: true, daysLeft: 0 };
    }

    const diffTime = endDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return { isExpired: false, daysLeft };
  }, []);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Admin or beta mode = instant premium access
    if (hasFreeAccess) {
      setSubscription({
        status: 'active',
        provider: 'stripe',
        plan: 'yearly',
        trialStartDate: null,
        trialEndDate: null,
        isTrialExpired: false,
        hasPremiumAccess: true,
        daysLeftInTrial: null,
      });
      setLoading(false);
      return;
    }

    try {
      // First check Stripe subscription status from backend
      const stripeStatus = await getSubscriptionStatus(user.id);
      
      if (stripeStatus.has_subscription && stripeStatus.subscription_status) {
        // User has Stripe subscription
        setStripeCustomerId(stripeStatus.stripe_customer_id || null);
        setStripeSubscriptionId(stripeStatus.stripe_subscription_id || null);
        
        if (stripeStatus.current_period_end) {
          setCurrentPeriodEnd(new Date(stripeStatus.current_period_end));
        }

        const isActive = ['active', 'trialing'].includes(stripeStatus.subscription_status);
        
        setSubscription({
          status: isActive ? 'active' : (stripeStatus.subscription_status as SubscriptionStatus),
          provider: 'stripe',
          plan: 'monthly', // Default, could be determined from price
          trialStartDate: null,
          trialEndDate: null,
          isTrialExpired: false,
          hasPremiumAccess: isActive,
          daysLeftInTrial: null,
        });
        
        setLoading(false);
        return;
      }

      // Fallback to Supabase profile data
      const { data, error } = await supabase
        .from('users_profile')
        .select('subscription_status, subscription_provider, subscription_plan, trial_start_date, trial_end_date, stripe_customer_id, stripe_subscription_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Update Stripe IDs from profile if available
      if (data?.stripe_customer_id) {
        setStripeCustomerId(data.stripe_customer_id);
      }
      if (data?.stripe_subscription_id) {
        setStripeSubscriptionId(data.stripe_subscription_id);
      }

      const status = (data?.subscription_status as SubscriptionStatus) || 'preview';
      const trialEndDate = data?.trial_end_date ? new Date(data.trial_end_date) : null;
      const { isExpired, daysLeft } = checkTrialExpiry(status, trialEndDate);

      const hasPremiumAccess = status === 'trialing' || status === 'active';

      setSubscription({
        status,
        provider: (data?.subscription_provider as 'mock' | 'stripe') || 'mock',
        plan: data?.subscription_plan as SubscriptionPlan | null,
        trialStartDate: data?.trial_start_date ? new Date(data.trial_start_date) : null,
        trialEndDate,
        isTrialExpired: isExpired,
        hasPremiumAccess,
        daysLeftInTrial: daysLeft,
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [user, checkTrialExpiry, hasFreeAccess]);

  /**
   * Redirect to Stripe Checkout for subscription
   */
  const redirectToStripeCheckout = async (plan: SubscriptionPlan): Promise<void> => {
    if (!user || !user.email) {
      console.error('User not authenticated');
      return;
    }

    setCheckoutLoading(true);

    try {
      // Map plan to price lookup key
      const priceLookupKey = plan === 'yearly' ? 'bisafit_annual' : 'bisafit_monthly';
      
      const result = await createCheckoutSession({
        price_lookup_key: priceLookupKey,
        user_id: user.id,
        email: user.email,
        customer_id: stripeCustomerId || undefined,
        origin_url: window.location.origin,
      });

      // Redirect to Stripe Checkout
      window.location.href = result.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setCheckoutLoading(false);
      throw error;
    }
  };

  /**
   * Redirect to Stripe Billing Portal for subscription management
   */
  const redirectToStripePortal = async (): Promise<void> => {
    if (!stripeCustomerId) {
      console.error('No Stripe customer ID found');
      return;
    }

    setCheckoutLoading(true);

    try {
      const result = await createPortalSession({
        customer_id: stripeCustomerId,
        return_url: `${window.location.origin}/billing`,
      });

      // Redirect to Stripe Portal
      window.location.href = result.url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      setCheckoutLoading(false);
      throw error;
    }
  };

  /**
   * Start a trial (mock implementation for beta)
   */
  const startTrial = async (plan: SubscriptionPlan): Promise<boolean> => {
    if (!user) return false;

    // In production with Stripe, redirect to checkout instead
    if (!BETA_MODE_ENABLED) {
      await redirectToStripeCheckout(plan);
      return true;
    }

    // Beta mode - just grant access
    setSubscription(prev => ({
      ...prev,
      status: 'active',
      plan,
      hasPremiumAccess: true,
    }));
    return true;
  };

  /**
   * Expire trial (for mock implementation)
   */
  const expireTrial = async (): Promise<void> => {
    if (!user || hasFreeAccess) return;

    try {
      const { error } = await supabase
        .from('users_profile')
        .update({
          subscription_status: 'expired',
        })
        .eq('id', user.id);

      if (error) throw error;

      setSubscription(prev => ({
        ...prev,
        status: 'expired',
        hasPremiumAccess: false,
        isTrialExpired: true,
        daysLeftInTrial: 0,
      }));
    } catch (error) {
      console.error('Error expiring trial:', error);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Check subscription status on app focus
  useEffect(() => {
    const handleFocus = () => {
      if (!hasFreeAccess) {
        fetchSubscription();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchSubscription, hasFreeAccess]);

  // Check for successful checkout return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');

    if (success === '1' && sessionId) {
      // Checkout was successful, refresh subscription status
      fetchSubscription();
      
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [fetchSubscription]);

  return {
    ...subscription,
    loading,
    checkoutLoading,
    startTrial,
    expireTrial,
    redirectToStripeCheckout,
    redirectToStripePortal,
    refetch: fetchSubscription,
    isAdmin,
    isBetaMode: BETA_MODE_ENABLED,
    stripeCustomerId,
    stripeSubscriptionId,
    currentPeriodEnd,
  };
}
