/**
 * Email Service
 * 
 * Utility for sending transactional emails via the send-email edge function.
 */

import { supabase } from '@/integrations/supabase/client';

export type EmailType = 
  | 'welcome'
  | 'trial_started'
  | 'trial_ending'
  | 'subscription_confirmed'
  | 'payment_failed'
  | 'subscription_cancelled';

interface SendEmailParams {
  type: EmailType;
  userId: string;
  email: string;
  firstName?: string;
  data?: Record<string, any>;
}

interface SendEmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

/**
 * Send a transactional email
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    if (data?.error) {
      console.error('Email send failed:', data.error);
      return { success: false, error: data.error };
    }

    return { success: true, emailId: data?.emailId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Email send exception:', message);
    return { success: false, error: message };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(userId: string, email: string, firstName?: string): Promise<SendEmailResult> {
  return sendEmail({
    type: 'welcome',
    userId,
    email,
    firstName,
  });
}

/**
 * Send trial started email
 */
export async function sendTrialStartedEmail(
  userId: string,
  email: string,
  trialEndDate: Date,
  planType: string,
  firstName?: string
): Promise<SendEmailResult> {
  return sendEmail({
    type: 'trial_started',
    userId,
    email,
    firstName,
    data: {
      trialEndDate: trialEndDate.toISOString(),
      planType,
    },
  });
}

/**
 * Send trial ending reminder email
 */
export async function sendTrialEndingEmail(
  userId: string,
  email: string,
  trialEndDate: Date,
  firstName?: string
): Promise<SendEmailResult> {
  return sendEmail({
    type: 'trial_ending',
    userId,
    email,
    firstName,
    data: {
      trialEndDate: trialEndDate.toISOString(),
    },
  });
}

/**
 * Send subscription confirmation / receipt email
 */
export async function sendSubscriptionConfirmedEmail(
  userId: string,
  email: string,
  planType: string,
  amount: string,
  transactionDate: Date,
  paymentMethod?: string,
  firstName?: string
): Promise<SendEmailResult> {
  return sendEmail({
    type: 'subscription_confirmed',
    userId,
    email,
    firstName,
    data: {
      planType,
      amount,
      transactionDate: transactionDate.toISOString(),
      paymentMethod,
    },
  });
}

/**
 * Send payment failed email
 */
export async function sendPaymentFailedEmail(
  userId: string,
  email: string,
  firstName?: string
): Promise<SendEmailResult> {
  return sendEmail({
    type: 'payment_failed',
    userId,
    email,
    firstName,
  });
}

/**
 * Send subscription cancelled email
 */
export async function sendSubscriptionCancelledEmail(
  userId: string,
  email: string,
  accessEndDate: Date,
  firstName?: string
): Promise<SendEmailResult> {
  return sendEmail({
    type: 'subscription_cancelled',
    userId,
    email,
    firstName,
    data: {
      accessEndDate: accessEndDate.toISOString(),
    },
  });
}
