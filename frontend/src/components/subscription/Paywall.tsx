/**
 * Paywall Component
 * 
 * Displays subscription plans with new pricing structure.
 * Ready for RevenueCat integration for mobile payments.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Sparkles, Zap, Calendar, Utensils, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '@/types/subscription';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { ERROR_MESSAGES } from '@/lib/branding';

const PREMIUM_FEATURES = [
  { icon: Zap, label: 'AI-generated workouts & form guides' },
  { icon: Utensils, label: 'Custom nutrition plans' },
  { icon: Camera, label: 'Progress photo tracking' },
  { icon: Calendar, label: 'Workout calendar & scheduling' },
  { icon: Sparkles, label: 'Smart progression engine' },
];

interface PaywallProps {
  onClose?: () => void;
  redirectAfterTrial?: string;
}

export function Paywall({ onClose, redirectAfterTrial = '/home' }: PaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('annual');
  const [isLoading, setIsLoading] = useState(false);
  const { startTrial } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Track paywall view on mount
  useEffect(() => {
    trackEvent('paywall_viewed');
  }, []);

  const handleStartTrial = async () => {
    setIsLoading(true);
    
    try {
      const success = await startTrial(selectedPlan);
      
      if (success) {
        trackEvent('trial_started', { plan_type: selectedPlan });
        
        toast({
          title: "Trial started — welcome to BisaFit Premium 💪",
        });
        
        if (onClose) {
          onClose();
        } else {
          navigate(redirectAfterTrial);
        }
      } else {
        throw new Error('Failed to start trial');
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: ERROR_MESSAGES.trialStart,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlanDetails = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20 px-4 py-8">
      {/* Promo Banner */}
      <div className="mb-6 animate-fade-in">
        <Card className="border-2 border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary flex-shrink-0">
                <Sparkles className="h-5 w-5 text-primary-foreground animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">🎁 LIMITED TIME OFFER</p>
                <p className="text-xs text-muted-foreground">Pay annually & get 3 months FREE!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg">
          <Crown className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Start Your Free Trial
        </h1>
        <p className="mt-2 text-muted-foreground">
          Unlock your full fitness potential
        </p>
      </div>

      {/* Features */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wider">
            Premium Features:
          </h3>
          <ul className="space-y-3">
            {PREMIUM_FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-foreground">{label}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Plan Selection */}
      <div className="mb-6 space-y-3">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={cn(
              "relative w-full rounded-xl border-2 p-5 text-left transition-all",
              plan.popular && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              selectedPlan === plan.id
                ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
                : "border-border bg-card hover:border-primary/50 hover:shadow-md"
            )}
          >
            {plan.badge && (
              <Badge 
                className={cn(
                  "absolute -top-2 right-4 font-bold text-xs",
                  plan.popular 
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {plan.badge}
              </Badge>
            )}
            
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-lg text-foreground">
                    {plan.name}
                  </span>
                  {selectedPlan === plan.id && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground font-bold" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-foreground">
                    {plan.price}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {plan.pricePerMonth}
                  </p>
                  {plan.savings && (
                    <p className="text-sm font-semibold text-primary">
                      💰 {plan.savings}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* CTA Button */}
      <Button
        onClick={handleStartTrial}
        disabled={isLoading}
        size="lg"
        className="w-full text-base font-semibold h-12 shadow-lg"
      >
        {isLoading ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Starting Trial...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Start 7-Day Free Trial
          </>
        )}
      </Button>

      {/* Fine Print */}
      <div className="mt-6 space-y-2 text-center">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Free for 7 days</span>, then{' '}
          <span className="font-semibold text-foreground">
            {selectedPlanDetails?.price}
          </span>
          {selectedPlan !== 'lifetime' && (
            <> {selectedPlanDetails?.interval === 'year' ? ' per year' : ' per month'}</>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          Cancel anytime during your free trial. You won't be charged until the trial ends.
        </p>
      </div>

      {/* Not Now Link */}
      {onClose && (
        <button
          onClick={onClose}
          className="mt-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          Maybe later
        </button>
      )}

      {/* Terms */}
      <p className="mt-6 text-center text-xs text-muted-foreground/70">
        By starting your trial, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
