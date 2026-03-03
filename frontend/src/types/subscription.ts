/**
 * Subscription Types
 * 
 * Ready for RevenueCat integration for mobile subscriptions.
 * Supports monthly, annual, and lifetime plans.
 */

export type SubscriptionStatus = 'preview' | 'trialing' | 'active' | 'expired' | 'lifetime';
export type SubscriptionProvider = 'mock' | 'revenuecat' | 'stripe';
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
  popular?: boolean;
}

// CURRENT PRICING - BisaFit Premium
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
    price: '$134.91',
    pricePerMonth: '$11.24/month',
    interval: 'year',
    badge: '🎁 3 MONTHS FREE',
    savings: 'Pay for 9 months, get 12!',
    popular: true,
  },
];

// RevenueCat Product IDs (configure these in your RevenueCat dashboard)
export const REVENUECAT_CONFIG = {
  apiKey: '', // Set via environment variable: VITE_REVENUECAT_API_KEY
  products: {
    monthly: 'bisafit_monthly_14.99', // Product ID in RevenueCat
    annual: 'bisafit_annual_134.99',  // Product ID in RevenueCat
  },
  entitlementId: 'premium', // Entitlement identifier in RevenueCat
};

// Stripe config placeholders (backup for web payments)
export const STRIPE_CONFIG = {
  publishableKey: '', // Will be set via environment variable
  monthlyPriceId: '', // Stripe Price ID for monthly plan
  annualPriceId: '', // Stripe Price ID for annual plan
  lifetimePriceId: '', // Stripe Price ID for lifetime plan
  webhookEndpoint: '/api/stripe-webhook', // Webhook handler
};
