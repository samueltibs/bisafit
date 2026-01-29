import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWeeklyStory, type WeeklySummary } from '@/hooks/useWeeklyStory';
import { WeeklyStoryModal } from './WeeklyStoryModal';

interface WeeklyStoryCardProps {
  className?: string;
}

export function WeeklyStoryCard({ className }: WeeklyStoryCardProps) {
  const { story, loading, generating, generateStory } = useWeeklyStory();
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return (
      <Card className={cn("border-border animate-pulse", className)}>
        <CardContent className="p-4">
          <div className="h-16 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // No story yet - show generate prompt
  if (!story) {
    return (
      <Card className={cn("border-primary/30 bg-primary/5", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Weekly Progress Story</p>
              <p className="text-xs text-muted-foreground">
                See your week's achievements in one place
              </p>
            </div>
            <Button 
              size="sm" 
              onClick={generateStory}
              disabled={generating}
              className="gap-1"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Creating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card 
        className={cn(
          "border-border cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
          className
        )}
        onClick={() => setModalOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-energy/10">
              <Sparkles className="h-5 w-5 text-energy" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm truncate">{story.headline}</p>
                <Badge variant="secondary" className="text-xs shrink-0">
                  This Week
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {story.badge_line || 'Tap to view your progress story'}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </div>
        </CardContent>
      </Card>

      <WeeklyStoryModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        story={story}
        onRegenerate={generateStory}
        regenerating={generating}
      />
    </>
  );
}
