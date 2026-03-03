/**
 * Billing Page
 * 
 * Shows subscription status and allows users to manage their subscription via Stripe.
 */

import { useEffect, useState } from 'react';
import { ArrowLeft, CreditCard, Check, Loader2, ExternalLink, Crown, Calendar, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription, BETA_MODE_ENABLED } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

export default function BillingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { 
    status,
    hasPremiumAccess,
    loading,
    checkoutLoading,
    redirectToStripeCheckout,
    redirectToStripePortal,
    stripeCustomerId,
    currentPeriodEnd,
    isAdmin,
    refetch
  } = useSubscription();

  const [showSuccess, setShowSuccess] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);

  // Check for checkout success/cancel
  useEffect(() => {
    if (searchParams.get('success') === '1') {
      setShowSuccess(true);
      refetch();
      // Clean URL after showing message
      setTimeout(() => {
        navigate('/billing', { replace: true });
      }, 100);
    }
    if (searchParams.get('canceled') === '1') {
      setShowCanceled(true);
      setTimeout(() => {
        navigate('/billing', { replace: true });
      }, 100);
    }
  }, [searchParams, navigate, refetch]);

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    try {
      await redirectToStripeCheckout(plan);
    } catch (error) {
      console.error('Failed to start checkout:', error);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await redirectToStripePortal();
    } catch (error) {
      console.error('Failed to open portal:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-2 text-lg font-semibold">Billing</h1>
        </div>
      </header>

      <main className="container max-w-2xl px-4 py-8 space-y-6">
        {/* Success Message */}
        {showSuccess && (
          <Card className="border-green-500/50 bg-green-500/10">
            <CardContent className="flex items-center gap-3 py-4">
              <Check className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-green-500">Payment Successful!</p>
                <p className="text-sm text-muted-foreground">Welcome to BisaFit Premium. Your subscription is now active.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Canceled Message */}
        {showCanceled && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium text-yellow-500">Checkout Canceled</p>
                <p className="text-sm text-muted-foreground">No worries! You can subscribe whenever you're ready.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Beta Mode Notice */}
        {BETA_MODE_ENABLED && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center gap-3 py-4">
              <Crown className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Beta Access</p>
                <p className="text-sm text-muted-foreground">You have free premium access during our beta period!</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={hasPremiumAccess ? 'default' : 'secondary'}>
                {isAdmin ? 'Admin' : hasPremiumAccess ? 'Active' : status === 'expired' ? 'Expired' : 'Free'}
              </Badge>
            </div>
            
            {currentPeriodEnd && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Period Ends</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(currentPeriodEnd, 'MMM d, yyyy')}
                </span>
              </div>
            )}

            {stripeCustomerId && (
              <Button 
                onClick={handleManageSubscription}
                disabled={checkoutLoading}
                className="w-full mt-4"
                variant="outline"
              >
                {checkoutLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Manage Subscription
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Subscription Plans (only show if not premium) */}
        {!hasPremiumAccess && !BETA_MODE_ENABLED && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Choose Your Plan</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              {/* Monthly Plan */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle>Monthly</CardTitle>
                  <CardDescription>Flexible month-to-month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    $14.99<span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      AI-powered workout plans
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Nutrition guidance
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Progress tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Cancel anytime
                    </li>
                  </ul>
                  <Button 
                    onClick={() => handleSubscribe('monthly')}
                    disabled={checkoutLoading}
                    className="w-full"
                  >
                    {checkoutLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Subscribe Monthly
                  </Button>
                </CardContent>
              </Card>

              {/* Annual Plan */}
              <Card className="relative border-primary">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">3 Months Free</Badge>
                </div>
                <CardHeader>
                  <CardTitle>Annual</CardTitle>
                  <CardDescription>Best value — pay for 9, get 12!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    $11.24<span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Billed annually at $134.91</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Everything in Monthly
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Priority support
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Early access to features
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      3 months FREE
                    </li>
                  </ul>
                  <Button 
                    onClick={() => handleSubscribe('yearly')}
                    disabled={checkoutLoading}
                    className="w-full"
                  >
                    {checkoutLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Subscribe Annually
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span>{user?.email}</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
