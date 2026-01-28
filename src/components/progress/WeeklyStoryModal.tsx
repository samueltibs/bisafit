import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sparkles, 
  Share2, 
  RefreshCw, 
  Check,
  Flame,
  Trophy,
  Timer,
  Zap,
  Footprints,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WeeklySummary } from '@/hooks/useWeeklyStory';
import confetti from 'canvas-confetti';

interface WeeklyStoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  story: WeeklySummary;
  onRegenerate: () => void;
  regenerating: boolean;
}

export function WeeklyStoryModal({
  open,
  onOpenChange,
  story,
  onRegenerate,
  regenerating,
}: WeeklyStoryModalProps) {
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger confetti on first open
  useEffect(() => {
    if (open && !showConfetti) {
      setShowConfetti(true);
      // Fire confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.3 },
        colors: ['#6FCF97', '#E6B65C', '#ffffff'],
      });
    }
  }, [open, showConfetti]);

  const handleShare = async () => {
    const shareText = formatShareText(story);
    
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatShareText = (s: WeeklySummary): string => {
    const lines = [
      `📊 My Week in Review: ${s.headline}`,
      '',
      ...s.bullets.map(b => `• ${b}`),
      '',
      s.badge_line || '',
      '',
      '— Tracked with BisaFit',
    ];
    return lines.filter(Boolean).join('\n');
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  const stats = story.stats_snapshot;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-energy" />
            <DialogTitle className="text-lg">Weekly Progress Story</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDateRange(story.week_start_date, story.week_end_date)}
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Headline */}
          <div className="text-center py-4 px-2 rounded-xl bg-gradient-to-br from-primary/10 to-energy/10">
            <h2 className="text-xl font-bold">{story.headline}</h2>
          </div>

          {/* Quick Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 gap-2">
              <Card className="border-border">
                <CardContent className="p-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-lg font-bold tabular-nums">
                      {stats.workoutsCompleted}/{stats.workoutsPlanned}
                    </p>
                    <p className="text-xs text-muted-foreground">Workouts</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border">
                <CardContent className="p-3 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-energy" />
                  <div>
                    <p className="text-lg font-bold tabular-nums">{stats.currentStreak}</p>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                  </div>
                </CardContent>
              </Card>

              {stats.activeMinutesThisWeek > 0 && (
                <Card className="border-border">
                  <CardContent className="p-3 flex items-center gap-2">
                    <Timer className="h-4 w-4 text-accent-foreground" />
                    <div>
                      <p className="text-lg font-bold tabular-nums">{stats.activeMinutesThisWeek}</p>
                      <p className="text-xs text-muted-foreground">Active Min</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {stats.personalBests && stats.personalBests.length > 0 && (
                <Card className="border-border">
                  <CardContent className="p-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-energy" />
                    <div>
                      <p className="text-lg font-bold tabular-nums">{stats.personalBests.length}</p>
                      <p className="text-xs text-muted-foreground">New PRs</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {stats.avgEnergyLevel && (
                <Card className="border-border">
                  <CardContent className="p-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-energy" />
                    <div>
                      <p className="text-lg font-bold tabular-nums">{stats.avgEnergyLevel}/5</p>
                      <p className="text-xs text-muted-foreground">Avg Energy</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {stats.stepsThisWeek && stats.stepsThisWeek > 0 && (
                <Card className="border-border">
                  <CardContent className="p-3 flex items-center gap-2">
                    <Footprints className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-lg font-bold tabular-nums">
                        {(stats.stepsThisWeek / 1000).toFixed(1)}k
                      </p>
                      <p className="text-xs text-muted-foreground">Steps</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Bullet Points */}
          <div className="space-y-2">
            {story.bullets.map((bullet, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-2 text-sm animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <span className="text-primary mt-0.5">•</span>
                <span>{bullet}</span>
              </div>
            ))}
          </div>

          {/* Badge Line */}
          {story.badge_line && (
            <div className="text-center py-3 px-4 rounded-lg bg-energy/10 border border-energy/20">
              <p className="font-medium text-sm">{story.badge_line}</p>
            </div>
          )}

          {/* Next Suggestion */}
          {story.next_suggestion && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-1">Next Week Suggestion</p>
                <p className="text-sm">{story.next_suggestion}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 gap-1"
              onClick={handleShare}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  Share
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              disabled={regenerating}
              className="gap-1"
            >
              <RefreshCw className={cn("h-4 w-4", regenerating && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
