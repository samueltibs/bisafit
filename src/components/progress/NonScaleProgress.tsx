import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, 
  Trophy, 
  TrendingUp, 
  Zap, 
  Timer, 
  Dumbbell,
  Heart,
  Sparkles,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProgressSummary, EnergyLevel } from '@/types/progress';
import { ENERGY_LABELS } from '@/types/progress';

interface NonScaleProgressProps {
  summary: ProgressSummary | null;
  loading?: boolean;
}

export function NonScaleProgress({ summary, loading }: NonScaleProgressProps) {
  // Calculate average energy (hook must be before any returns)
  const avgEnergy = useMemo(() => {
    if (!summary || summary.energyTrend.length === 0) return null;
    const sum = summary.energyTrend.reduce((acc, e) => acc + e.level, 0);
    return Math.round(sum / summary.energyTrend.length) as EnergyLevel;
  }, [summary]);

  if (loading) {
    return (
      <Card className="border-border animate-pulse">
        <CardContent className="p-6">
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="border-border">
        <CardContent className="p-6 text-center">
          <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Complete your first workout to start tracking progress!</p>
        </CardContent>
      </Card>
    );
  }

  const { 
    streak, 
    weeklyAdherence, 
    recentPRs, 
    strengthImprovements,
    activeMinutesThisWeek,
    activeMinutesLastWeek,
    energyTrend,
  } = summary;

  const activeMinutesChange = activeMinutesThisWeek - activeMinutesLastWeek;
  const hasImprovements = recentPRs.length > 0 || strengthImprovements.length > 0 || activeMinutesChange > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">You're Progressing</h2>
      </div>

      {/* Streak & Consistency */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-energy/10">
                <Flame className="h-5 w-5 text-energy" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{streak.current}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
            {streak.longest > streak.current && (
              <p className="text-xs text-muted-foreground mt-2">
                Best: {streak.longest} days
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{weeklyAdherence.percentage}%</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {weeklyAdherence.completed}/{weeklyAdherence.planned} workouts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Minutes */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <Timer className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium">{activeMinutesThisWeek} min</p>
                <p className="text-xs text-muted-foreground">Active this week</p>
              </div>
            </div>
            {activeMinutesChange !== 0 && (
              <Badge 
                variant={activeMinutesChange > 0 ? "default" : "secondary"}
                className="gap-1"
              >
                {activeMinutesChange > 0 ? <TrendingUp className="h-3 w-3" /> : null}
                {activeMinutesChange > 0 ? '+' : ''}{activeMinutesChange} min
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Strength Improvements / PRs */}
      {(recentPRs.length > 0 || strengthImprovements.length > 0) && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              You're Getting Stronger
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentPRs.slice(0, 3).map((pr, idx) => (
              <div key={pr.id || idx} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-energy" />
                  <span className="text-sm">{pr.exercise_name}</span>
                </div>
                <Badge variant="outline" className="text-energy border-energy/30">
                  New PR!
                </Badge>
              </div>
            ))}
            {strengthImprovements
              .filter(s => !recentPRs.find(pr => pr.exercise_name === s.exercise_name))
              .slice(0, 3)
              .map((signal, idx) => (
                <div key={idx} className="flex items-center justify-between py-1">
                  <span className="text-sm text-muted-foreground">{signal.exercise_name}</span>
                  <Badge variant="secondary" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{signal.improvement_percent}% {signal.improvement_type}
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Energy Trend */}
      {energyTrend.length > 0 && avgEnergy && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-energy" />
              Energy Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">This week's average</span>
              <div className={cn("flex items-center gap-1", ENERGY_LABELS[avgEnergy].color)}>
                <span>{ENERGY_LABELS[avgEnergy].emoji}</span>
                <span className="text-sm font-medium">{ENERGY_LABELS[avgEnergy].label}</span>
              </div>
            </div>
            <div className="flex gap-1 justify-between">
              {energyTrend.map((e, idx) => (
                <div 
                  key={idx}
                  className="flex flex-col items-center gap-1"
                  title={`${e.date}: ${ENERGY_LABELS[e.level].label}`}
                >
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm",
                      e.level >= 4 ? "bg-primary/20" :
                      e.level === 3 ? "bg-muted" :
                      "bg-destructive/10"
                    )}
                  >
                    {ENERGY_LABELS[e.level].emoji}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Motivational message */}
      {!hasImprovements && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">You showed up — that counts</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Progress isn't always visible. Every workout builds a stronger you.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
