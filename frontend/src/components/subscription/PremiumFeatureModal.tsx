/**
 * Premium Feature Modal
 * 
 * Displayed when a user without premium access tries to use a gated feature.
 */

import { useNavigate } from 'react-router-dom';
import { Crown, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PremiumFeatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

export function PremiumFeatureModal({ 
  open, 
  onOpenChange,
  featureName,
}: PremiumFeatureModalProps) {
  const navigate = useNavigate();

  const handleStartTrial = () => {
    onOpenChange(false);
    navigate('/paywall');
  };

  const handleMaybeLater = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">Unlock BisaFit Premium</DialogTitle>
          <DialogDescription className="text-base">
            Start your 7-day free trial to access workouts, nutrition, scanning, and scheduling.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <Button 
            onClick={handleStartTrial} 
            className="w-full gap-2"
            size="lg"
          >
            <Sparkles className="h-4 w-4" />
            Start Free Trial
          </Button>
          
          <button
            onClick={handleMaybeLater}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
