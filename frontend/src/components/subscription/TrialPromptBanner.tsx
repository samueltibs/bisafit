/**
 * Trial Prompt Banner
 * 
 * Shows on Home when user has 'preview' status (skipped paywall).
 * Encourages them to start their free trial.
 */

import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function TrialPromptBanner() {
  const navigate = useNavigate();

  return (
    <Card className="border-primary/30 bg-primary/5 animate-fade-in">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Your personalized plan is ready</p>
          <p className="text-xs text-muted-foreground">Start your 7-day trial to unlock it.</p>
        </div>
        <Button size="sm" onClick={() => navigate('/paywall')}>
          Start Free Trial
        </Button>
      </CardContent>
    </Card>
  );
}
