/**
 * Subscription Banner Component
 * 
 * Shows contextual messaging based on subscription status:
 * - preview/expired: Prompt to start trial
 * - trialing: Shows trial end date with manage link
 * - active: No banner shown
 */

import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Sparkles, Crown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';

export function SubscriptionBanner() {
  const navigate = useNavigate();
  const { status, trialEndDate } = useSubscription();

  // No banner for active subscribers
  if (status === 'active') {
    return null;
  }

  // Expired state - prompt to restart trial
  if (status === 'expired') {
    return (
      <Card className="border-destructive/30 bg-destructive/5 animate-fade-in">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Your trial ended</p>
            <p className="text-xs text-muted-foreground">
              Start again to unlock workouts and nutrition.
            </p>
          </div>
          <Button size="sm" onClick={() => navigate('/paywall')}>
            Start Free Trial
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Preview state - prompt to start trial
  if (status === 'preview') {
    return (
      <Card className="border-primary/30 bg-primary/5 animate-fade-in">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Your personalized plan is ready</p>
            <p className="text-xs text-muted-foreground">
              Start your 7-day free trial to unlock workouts and nutrition.
            </p>
          </div>
          <Button size="sm" onClick={() => navigate('/paywall')}>
            Start Free Trial
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Trialing state - show trial end date with manage link
  if (status === 'trialing' && trialEndDate) {
    const formattedDate = format(new Date(trialEndDate), 'MMM d');

    return (
      <Card className="border-primary/20 bg-primary/5 animate-fade-in">
        <CardContent className="flex items-center gap-3 p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              Trial active — ends on <span className="font-medium">{formattedDate}</span>
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/manage-subscription')}
          >
            Manage
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
