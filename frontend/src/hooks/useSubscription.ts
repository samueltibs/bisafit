/**
 * Subscription Hook
 * 
 * Manages subscription state and trial logic.
 * NOTE: Stripe Checkout + webhooks will replace mock provider once LLC and Stripe account are live.
 * 
 * BETA MODE: Set BETA_MODE_ENABLED to true to give all users free access
 * ADMIN: Admin emails always have full premium access
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { sendTrialStartedEmail } from '@/lib/emailService';
import { isAdminEmail } from '@/lib/adminConfig';
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
        provider: 'mock',
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
      const { data, error } = await supabase
        .from('users_profile')
        .select('subscription_status, subscription_provider, subscription_plan, trial_start_date, trial_end_date')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const status = (data?.subscription_status as SubscriptionStatus) || 'preview';
      const trialEndDate = data?.trial_end_date ? new Date(data.trial_end_date) : null;
      const { isExpired, daysLeft } = checkTrialExpiry(status, trialEndDate);

      // Auto-expire trial if needed
      if (isExpired && status === 'trialing') {
        await expireTrial();
        return;
      }

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

  const startTrial = async (plan: SubscriptionPlan): Promise<boolean> => {
    if (!user) return false;

    // Admin or beta mode - just grant access without actually starting trial
    if (hasFreeAccess) {
      setSubscription(prev => ({
        ...prev,
        status: 'active',
        plan,
        hasPremiumAccess: true,
      }));
      return true;
    }

    try {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 7); // 7-day trial

      const { error } = await supabase
        .from('users_profile')
        .update({
          subscription_status: 'trialing',
          subscription_provider: 'mock', // Will be 'stripe' when integrated
          subscription_plan: plan,
          trial_start_date: now.toISOString(),
          trial_end_date: trialEnd.toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setSubscription(prev => ({
        ...prev,
        status: 'trialing',
        plan,
        trialStartDate: now,
        trialEndDate: trialEnd,
        hasPremiumAccess: true,
        daysLeftInTrial: 7,
      }));

      // Send trial started email (fire and forget)
      sendTrialStartedEmail(
        user.id,
        user.email || '',
        trialEnd,
        plan
      ).catch(err => console.error('Failed to send trial started email:', err));

      return true;
    } catch (error) {
      console.error('Error starting trial:', error);
      return false;
    }
  };

  const expireTrial = async (): Promise<void> => {
    if (!user) return;

    // Admin or beta mode - never expire
    if (hasFreeAccess) return;

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

  // Stripe integration stub - to be implemented when Stripe is ready
  const redirectToStripeCheckout = async (_plan: SubscriptionPlan): Promise<void> => {
    // TODO: Implement Stripe Checkout redirect
    // This will create a Stripe Checkout session and redirect the user
    console.log('Stripe checkout not yet implemented');
  };

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Check trial expiry on app focus
  useEffect(() => {
    const handleFocus = () => {
      if (subscription.status === 'trialing' && !hasFreeAccess) {
        fetchSubscription();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [subscription.status, fetchSubscription, hasFreeAccess]);

  return {
    ...subscription,
    loading,
    startTrial,
    expireTrial,
    redirectToStripeCheckout,
    refetch: fetchSubscription,
    isAdmin,
    isBetaMode: BETA_MODE_ENABLED,
  };
}
