/**
 * Subscription Types
 * 
 * NOTE: Stripe Checkout + webhooks will replace mock provider once LLC and Stripe account are live.
 */

export type SubscriptionStatus = 'preview' | 'trialing' | 'active' | 'expired';
export type SubscriptionProvider = 'mock' | 'stripe';
export type SubscriptionPlan = 'monthly' | 'annual';

export interface SubscriptionState {
  status: SubscriptionStatus;
  provider: SubscriptionProvider;
  plan: SubscriptionPlan | null;
  trialStartDate: Date | null;
  trialEndDate: Date | null;
  isTrialExpired: boolean;
  hasPremiumAccess: boolean;
  daysLeftInTrial: number | null;
}

export interface SubscriptionPlanOption {
  id: SubscriptionPlan;
  name: string;
  price: string;
  pricePerMonth: string;
  interval: 'month' | 'year';
  badge?: string;
  savings?: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanOption[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$12.99',
    pricePerMonth: '$12.99/month',
    interval: 'month',
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$119',
    pricePerMonth: '$9.92/month',
    interval: 'year',
    badge: 'Best Value',
    savings: 'Save $36',
  },
];

// Stripe config placeholders (to be populated when Stripe is integrated)
export const STRIPE_CONFIG = {
  publishableKey: '', // Will be set via environment variable
  monthlyPriceId: '', // Stripe Price ID for monthly plan
  annualPriceId: '', // Stripe Price ID for annual plan
  webhookEndpoint: '/api/stripe-webhook', // Webhook handler stub
};
