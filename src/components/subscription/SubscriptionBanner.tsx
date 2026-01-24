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
import { Sparkles, Crown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

export function SubscriptionBanner() {
  const navigate = useNavigate();
  const { status, trialEndDate } = useSubscription();

  // No banner for active subscribers
  if (status === 'active') {
    return null;
  }

  // Preview or expired state - prompt to start trial
  if (status === 'preview' || status === 'expired') {
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

  // Trialing state - show trial end date
  if (status === 'trialing' && trialEndDate) {
    const formattedDate = format(new Date(trialEndDate), 'MMM d');

    const handleManage = () => {
      // Placeholder for future subscription management
      toast.info('Subscription management coming soon!');
    };

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
            className="text-xs text-muted-foreground hover:text-foreground gap-1"
            onClick={handleManage}
          >
            <Settings className="h-3 w-3" />
            Manage
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
