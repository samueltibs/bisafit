import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWeeklyStory, isWeekendPeriod } from '@/hooks/useWeeklyStory';

interface WeekRecapBannerProps {
  className?: string;
}

const DISMISSED_KEY = 'bisafit_week_recap_dismissed';

export function WeekRecapBanner({ className }: WeekRecapBannerProps) {
  const { story, loading, generateStory, generating } = useWeeklyStory();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  // Check if this week's banner was already dismissed
  useEffect(() => {
    const dismissedWeek = localStorage.getItem(DISMISSED_KEY);
    const currentWeekStart = new Date();
    const day = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
    currentWeekStart.setDate(diff);
    const weekKey = currentWeekStart.toISOString().split('T')[0];
    
    if (dismissedWeek === weekKey) {
      setDismissed(true);
    }
  }, []);

  // Show banner only on weekends (Friday-Sunday) when there's a story or data to generate
  useEffect(() => {
    if (!loading && !dismissed && isWeekendPeriod()) {
      setVisible(true);
    }
  }, [loading, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    
    // Remember dismissal for this week
    const currentWeekStart = new Date();
    const day = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
    currentWeekStart.setDate(diff);
    const weekKey = currentWeekStart.toISOString().split('T')[0];
    localStorage.setItem(DISMISSED_KEY, weekKey);
  };

  if (!visible || loading) {
    return null;
  }

  return (
    <Card className={cn("border-energy/30 bg-energy/5 animate-fade-in", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-energy/10 shrink-0">
            <Sparkles className="h-5 w-5 text-energy" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">
                {story ? 'Your week recap is ready!' : 'Ready to see your progress?'}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 -mr-2 -mt-1"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {story 
                ? story.headline 
                : 'Generate your weekly progress story'}
            </p>
            <div className="mt-2">
              {story ? (
                <Link to="/progress?tab=progress">
                  <Button size="sm" variant="secondary" className="gap-1 h-7 text-xs">
                    View Story
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              ) : (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="gap-1 h-7 text-xs"
                  onClick={generateStory}
                  disabled={generating}
                >
                  {generating ? 'Creating...' : 'Generate Now'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
