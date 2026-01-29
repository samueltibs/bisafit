/**
 * Subscription Types
 * 
 * Ready for RevenueCat integration for mobile subscriptions.
 * Supports monthly, annual, and lifetime plans.
 */

export type SubscriptionStatus = 'preview' | 'trialing' | 'active' | 'expired' | 'lifetime';
export type SubscriptionProvider = 'mock' | 'revenuecat' | 'stripe';
export type SubscriptionPlan = 'monthly' | 'annual' | 'lifetime';

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
  interval: 'month' | 'year' | 'lifetime';
  badge?: string;
  savings?: string;
  popular?: boolean;
}

// UPDATED PRICING - Current Promotional Offer
export const SUBSCRIPTION_PLANS: SubscriptionPlanOption[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$14.99',
    pricePerMonth: '$14.99/month',
    interval: 'month',
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$134.99',
    pricePerMonth: '$11.25/month',
    interval: 'year',
    badge: '🎁 3 MONTHS FREE',
    savings: 'Limited Time Offer',
    popular: true,
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '$249.99',
    pricePerMonth: 'One-time payment',
    interval: 'lifetime',
    badge: 'PREMIUM',
    savings: 'Never pay again',
  },
];

// RevenueCat Product IDs (will be configured when RevenueCat is set up)
export const REVENUECAT_CONFIG = {
  apiKey: '', // Will be set via environment variable
  products: {
    monthly: 'bisafit_monthly_9.99', // Product ID in RevenueCat
    annual: 'bisafit_annual_79.99',  // Product ID in RevenueCat
    lifetime: 'bisafit_lifetime_199.99', // Product ID in RevenueCat
  },
  entitlementId: 'premium', // Entitlement identifier
};

// Stripe config placeholders (backup for web payments)
export const STRIPE_CONFIG = {
  publishableKey: '', // Will be set via environment variable
  monthlyPriceId: '', // Stripe Price ID for monthly plan
  annualPriceId: '', // Stripe Price ID for annual plan
  lifetimePriceId: '', // Stripe Price ID for lifetime plan
  webhookEndpoint: '/api/stripe-webhook', // Webhook handler
};
