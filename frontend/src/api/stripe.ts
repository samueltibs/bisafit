/**
 * Stripe API Client
 * 
 * Handles all Stripe-related API calls to the backend.
 */

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

export interface CreateCheckoutSessionRequest {
  price_lookup_key: 'bisafit_monthly' | 'bisafit_annual';
  user_id: string;
  email: string;
  customer_id?: string;
  origin_url: string;
}

export interface CreateCheckoutSessionResponse {
  url: string;
  session_id: string;
}

export interface CreatePortalSessionRequest {
  customer_id: string;
  return_url: string;
}

export interface CreatePortalSessionResponse {
  url: string;
}

export interface SubscriptionStatusResponse {
  has_subscription: boolean;
  user_id?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

export interface StripePricesResponse {
  prices: {
    [key: string]: {
      name: string;
      interval: string;
      description: string;
    };
  };
}

/**
 * Create a Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(
  request: CreateCheckoutSessionRequest
): Promise<CreateCheckoutSessionResponse> {
  const response = await fetch(`${BACKEND_URL}/api/stripe/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to create checkout session' }));
    throw new Error(error.detail || 'Failed to create checkout session');
  }

  return response.json();
}

/**
 * Create a Stripe Billing Portal Session
 */
export async function createPortalSession(
  request: CreatePortalSessionRequest
): Promise<CreatePortalSessionResponse> {
  const response = await fetch(`${BACKEND_URL}/api/stripe/create-portal-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to create portal session' }));
    throw new Error(error.detail || 'Failed to create portal session');
  }

  return response.json();
}

/**
 * Get subscription status for a user
 */
export async function getSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatusResponse> {
  const response = await fetch(`${BACKEND_URL}/api/stripe/subscription-status/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to get subscription status' }));
    throw new Error(error.detail || 'Failed to get subscription status');
  }

  return response.json();
}

/**
 * Get available Stripe prices
 */
export async function getStripePrices(): Promise<StripePricesResponse> {
  const response = await fetch(`${BACKEND_URL}/api/stripe/prices`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to get prices' }));
    throw new Error(error.detail || 'Failed to get prices');
  }

  return response.json();
}
