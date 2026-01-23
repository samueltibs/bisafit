import { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { getDefaultCues } from '@/lib/exerciseMediaMap';

interface CoachingCuesProps {
  exerciseName: string;
  instructions: string;
  coachingCues?: string[];
  bigMode?: boolean;
  isActiveCard?: boolean;
  className?: string;
}

/**
 * Extract short coaching cues from instructions text
 * - Looks for numbered lists, bullet points, or key phrases
 * - Falls back to first 2-3 sentences
 */
function extractCuesFromInstructions(instructions: string): string[] {
  if (!instructions || instructions.trim().length === 0) {
    return [];
  }

  // Try to find bullet points or numbered items
  const bulletPattern = /^[\s]*[-•*]\s*(.+)$/gm;
  const numberedPattern = /^[\s]*\d+[.)]\s*(.+)$/gm;
  
  const bullets: string[] = [];
  let match;

  while ((match = bulletPattern.exec(instructions)) !== null) {
    if (match[1].trim().length > 0) {
      bullets.push(match[1].trim());
    }
  }

  while ((match = numberedPattern.exec(instructions)) !== null) {
    if (match[1].trim().length > 0) {
      bullets.push(match[1].trim());
    }
  }

  if (bullets.length >= 2) {
    return bullets.slice(0, 3);
  }

  // Fall back to extracting key phrases
  const keyPhrases = [
    /keep\s+(?:your\s+)?(.+?)(?:\.|,|$)/i,
    /focus\s+on\s+(.+?)(?:\.|,|$)/i,
    /squeeze\s+(?:your\s+)?(.+?)(?:\.|,|$)/i,
    /engage\s+(?:your\s+)?(.+?)(?:\.|,|$)/i,
    /maintain\s+(.+?)(?:\.|,|$)/i,
    /avoid\s+(.+?)(?:\.|,|$)/i,
  ];

  const phrases: string[] = [];
  for (const pattern of keyPhrases) {
    const match = instructions.match(pattern);
    if (match && match[0]) {
      const phrase = match[0].replace(/\.$/, '').trim();
      if (phrase.length > 10 && phrase.length < 80) {
        phrases.push(phrase.charAt(0).toUpperCase() + phrase.slice(1));
      }
    }
    if (phrases.length >= 3) break;
  }

  if (phrases.length >= 2) {
    return phrases.slice(0, 3);
  }

  // Final fallback: first 2 sentences
  const sentences = instructions
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && s.length < 100);

  return sentences.slice(0, 2).map(s => 
    s.endsWith('.') ? s : s + '.'
  );
}

export function CoachingCues({
  exerciseName,
  instructions,
  coachingCues,
  bigMode = false,
  isActiveCard = false,
  className,
}: CoachingCuesProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Priority: provided cues > media map cues > extracted from instructions
  const mapCues = getDefaultCues(exerciseName);
  const cues = coachingCues && coachingCues.length > 0 
    ? coachingCues 
    : mapCues.length > 0
      ? mapCues
      : extractCuesFromInstructions(instructions);

  const hasFullInstructions = instructions && instructions.trim().length > 0;
  const hasCues = cues.length > 0;

  if (!hasCues && !hasFullInstructions) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Quick cues */}
      {hasCues && (
        <div className={cn(
          "space-y-1.5",
          bigMode && "space-y-2"
        )}>
          <div className={cn(
            "flex items-center gap-1.5",
            isActiveCard ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            <Lightbulb className={cn(bigMode ? "h-4 w-4" : "h-3 w-3")} />
            <span className={cn(
              "font-medium uppercase tracking-wider",
              bigMode ? "text-sm" : "text-xs"
            )}>
              Key Points
            </span>
          </div>
          <ul className={cn(
            "space-y-1",
            bigMode ? "text-base" : "text-sm"
          )}>
            {cues.map((cue, index) => (
              <li 
                key={index}
                className={cn(
                  "flex items-start gap-2",
                  isActiveCard ? "text-primary-foreground/90" : "text-foreground"
                )}
              >
                <span className={cn(
                  "mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0",
                  isActiveCard ? "bg-primary-foreground/60" : "bg-primary"
                )} />
                <span className="leading-relaxed">{cue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full instructions toggle */}
      {hasFullInstructions && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-auto py-1.5 px-2 gap-1",
                isActiveCard 
                  ? "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10" 
                  : "text-muted-foreground hover:text-foreground",
                bigMode && "text-base"
              )}
            >
              {isOpen ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide instructions
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  How to perform
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="animate-accordion-down">
            <div className={cn(
              "mt-2 p-3 rounded-lg",
              isActiveCard 
                ? "bg-primary-foreground/10 text-primary-foreground/90" 
                : "bg-muted text-foreground",
              bigMode ? "text-base p-4" : "text-sm"
            )}>
              <p className="leading-relaxed whitespace-pre-wrap">
                {instructions}
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
