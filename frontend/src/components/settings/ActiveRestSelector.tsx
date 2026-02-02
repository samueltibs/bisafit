/**
 * Active Rest Day Selector Component
 * 
 * Allows users to configure active rest activities for their non-workout days.
 * Used in both Onboarding and Settings.
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Plus, Trash2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ActiveRestConfig,
  ActiveRestActivity,
  ActiveRestActivityType,
  ACTIVE_REST_ACTIVITIES,
  getActivityMeta,
  generateActivityId,
} from '@/types/activeRest';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface ActiveRestSelectorProps {
  workoutDays: string[];
  config: ActiveRestConfig;
  onChange: (config: ActiveRestConfig) => void;
  showAISuggestions?: boolean;
  compact?: boolean;
}

export function ActiveRestSelector({
  workoutDays,
  config,
  onChange,
  showAISuggestions = true,
  compact = false,
}: ActiveRestSelectorProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Calculate rest days (days not in workoutDays)
  const restDays = useMemo(() => {
    return ALL_DAYS.filter(day => !workoutDays.includes(day));
  }, [workoutDays]);

  // Get activity for a specific day
  const getActivityForDay = (day: string): ActiveRestActivity | undefined => {
    return config.activities.find(a => a.day === day);
  };

  // Toggle active rest for a day
  const toggleDayActive = (day: string, enabled: boolean) => {
    const existingActivity = getActivityForDay(day);
    
    if (enabled && !existingActivity) {
      // Add new activity with default settings
      const newActivity: ActiveRestActivity = {
        id: generateActivityId(),
        day,
        activityType: 'light_walk',
        durationMinutes: 30,
        distanceMiles: 1.5,
        enabled: true,
      };
      onChange({
        enabled: true,
        activities: [...config.activities, newActivity],
      });
    } else if (!enabled && existingActivity) {
      // Remove activity
      onChange({
        ...config,
        activities: config.activities.filter(a => a.day !== day),
        enabled: config.activities.filter(a => a.day !== day).length > 0,
      });
    }
  };

  // Update activity settings
  const updateActivity = (day: string, updates: Partial<ActiveRestActivity>) => {
    onChange({
      ...config,
      activities: config.activities.map(a => 
        a.day === day ? { ...a, ...updates } : a
      ),
    });
  };

  // Quick add suggestion based on user's goal
  const addAISuggestion = () => {
    // Suggest activities for all rest days
    const suggestions: ActiveRestActivity[] = restDays.map((day, index) => {
      // Rotate through different activities
      const activityTypes: ActiveRestActivityType[] = ['light_walk', 'yoga_stretch', 'light_bodyweight'];
      const type = activityTypes[index % activityTypes.length];
      const meta = getActivityMeta(type);
      
      return {
        id: generateActivityId(),
        day,
        activityType: type,
        durationMinutes: meta.defaultDuration,
        distanceMiles: meta.defaultDistance,
        enabled: true,
        description: meta.description,
      };
    });

    onChange({
      enabled: true,
      activities: suggestions,
    });
  };

  if (restDays.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        <p>No rest days available. Consider adding rest days to your schedule for optimal recovery.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with AI Suggestion */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Active Rest Days</Label>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add light activity on rest days to aid recovery
          </p>
        </div>
        {showAISuggestions && config.activities.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={addAISuggestion}
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Suggest
          </Button>
        )}
      </div>

      {/* Rest Days List */}
      <div className="space-y-2">
        {restDays.map((day) => {
          const activity = getActivityForDay(day);
          const isActive = !!activity;
          const isExpanded = expandedDay === day;
          const meta = activity ? getActivityMeta(activity.activityType) : null;

          return (
            <Card 
              key={day} 
              className={cn(
                "transition-all duration-200",
                isActive ? "border-primary/30 bg-primary/5" : "border-border"
              )}
            >
              <CardContent className="p-3">
                {/* Day Header with Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={isActive}
                      onCheckedChange={(checked) => toggleDayActive(day, checked)}
                    />
                    <div>
                      <span className="font-medium">{day}</span>
                      {isActive && meta && (
                        <span className="text-sm text-muted-foreground ml-2">
                          {meta.emoji} {meta.label}
                          {activity.distanceMiles && meta.usesDistance ? (
                            ` • ${activity.distanceMiles} mi`
                          ) : activity.durationMinutes ? (
                            ` • ${activity.durationMinutes} min`
                          ) : null}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedDay(isExpanded ? null : day)}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                    </Button>
                  )}
                </div>

                {/* Expanded Settings */}
                {isActive && isExpanded && activity && (
                  <div className="mt-4 pt-4 border-t border-border space-y-4">
                    {/* Activity Type Selector */}
                    <div className="space-y-2">
                      <Label>Activity Type</Label>
                      <Select
                        value={activity.activityType}
                        onValueChange={(value: ActiveRestActivityType) => {
                          const newMeta = getActivityMeta(value);
                          updateActivity(day, {
                            activityType: value,
                            durationMinutes: newMeta.defaultDuration,
                            distanceMiles: newMeta.usesDistance ? newMeta.defaultDistance : undefined,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIVE_REST_ACTIVITIES.map((act) => (
                            <SelectItem key={act.type} value={act.type}>
                              <span className="flex items-center gap-2">
                                <span>{act.emoji}</span>
                                <span>{act.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Distance Slider (for walk/run/cycling) */}
                    {meta?.usesDistance && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Distance</Label>
                          <span className="text-sm font-medium text-primary">
                            {activity.distanceMiles || 1} miles
                          </span>
                        </div>
                        <Slider
                          value={[activity.distanceMiles || 1]}
                          onValueChange={([v]) => updateActivity(day, { distanceMiles: v })}
                          min={0.5}
                          max={10}
                          step={0.5}
                          className="py-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0.5 mi</span>
                          <span>10 mi</span>
                        </div>
                      </div>
                    )}

                    {/* Duration Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Duration</Label>
                        <span className="text-sm font-medium text-primary">
                          {activity.durationMinutes || 20} min
                        </span>
                      </div>
                      <Slider
                        value={[activity.durationMinutes || 20]}
                        onValueChange={([v]) => updateActivity(day, { durationMinutes: v })}
                        min={10}
                        max={60}
                        step={5}
                        className="py-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>10 min</span>
                        <span>60 min</span>
                      </div>
                    </div>

                    {/* Activity Benefits */}
                    {meta && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-2">{meta.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {meta.benefits.map((benefit, i) => (
                            <span 
                              key={i}
                              className="text-xs bg-background px-2 py-0.5 rounded-full border"
                            >
                              {benefit}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDayActive(day, false)}
                      className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Active Rest
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      {config.activities.length > 0 && (
        <div className="text-center text-sm text-muted-foreground pt-2">
          {config.activities.length} active rest {config.activities.length === 1 ? 'day' : 'days'} configured
        </div>
      )}
    </div>
  );
}
