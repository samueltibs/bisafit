/**
 * Paywall Component
 * 
 * Displays subscription plans and handles trial signup.
 * NOTE: Stripe Checkout + webhooks will replace mock provider once LLC and Stripe account are live.
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
  { icon: Zap, label: 'Personalized AI workouts' },
  { icon: Utensils, label: 'Custom nutrition plans' },
  { icon: Camera, label: 'Ingredient & equipment scans' },
  { icon: Calendar, label: 'Calendar sync' },
  { icon: Sparkles, label: 'Smart progression engine' },
];

interface PaywallProps {
  onClose?: () => void;
  redirectAfterTrial?: string;
}

export function Paywall({ onClose, redirectAfterTrial = '/home' }: PaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('monthly');
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

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Crown className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Start your 7-day free trial
        </h1>
        <p className="mt-2 text-muted-foreground">
          Unlock your full fitness potential with BisaFit Premium
        </p>
      </div>

      {/* Features */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            What you'll get:
          </h3>
          <ul className="space-y-2">
            {PREMIUM_FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-3.5 w-3.5 text-primary" />
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
              "relative w-full rounded-xl border-2 p-4 text-left transition-all",
              plan.popular && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              selectedPlan === plan.id
                ? "border-primary bg-primary/5 shadow-lg"
                : "border-border bg-card hover:border-primary/50 hover:shadow-md"
            )}
          >
            {plan.badge && (
              <Badge 
                className={cn(
                  "absolute -top-2 right-4 font-bold",
                  plan.popular 
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {plan.badge}
              </Badge>
            )}
            
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-foreground">
                    {plan.name}
                  </span>
                  {selectedPlan === plan.id && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">
                    {plan.price}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {plan.pricePerMonth}
                  </p>
                  {plan.savings && (
                    <p className="text-sm font-medium text-primary">
                      {plan.savings}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
                <span className="text-lg font-bold text-foreground">
                  {plan.price}
                </span>
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2",
                  selectedPlan === plan.id
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}>
                  {selectedPlan === plan.id && (
                    <Check className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* CTA */}
      <Button
        size="lg"
        onClick={handleStartTrial}
        disabled={isLoading}
        className="w-full text-lg font-semibold"
      >
        {isLoading ? 'Starting Trial...' : 'Start Free Trial'}
      </Button>

      {/* Disclaimer */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        7-day free trial. Payment method required.
        <br />
        You won't be charged until your trial ends.
      </p>

      {/* Not Now Link */}
      <button
        onClick={() => navigate('/home')}
        className="mt-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        Not now
      </button>

      {/* Terms */}
      <p className="mt-4 text-center text-xs text-muted-foreground/70">
        By starting your trial, you agree to our Terms of Service and Privacy Policy.
        Cancel anytime before your trial ends.
      </p>
    </div>
  );
}
