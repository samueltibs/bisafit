import { ChefHat, Shuffle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CuisineThemeLabelProps {
  cuisineTheme: string | null;
  isStrictMode: boolean;
  hasIngredients: boolean;
}

// Map cuisine values to display labels
const CUISINE_LABELS: Record<string, string> = {
  american: 'American',
  mediterranean: 'Mediterranean',
  cajun: 'Cajun',
  indian: 'Indian',
  east_african: 'East African',
  asian: 'Asian',
  middle_eastern: 'Middle Eastern',
  latin: 'Latin',
  italian: 'Italian',
  african: 'African',
  surprise: 'surprise',
};

export function CuisineThemeLabel({ 
  cuisineTheme, 
  isStrictMode, 
  hasIngredients 
}: CuisineThemeLabelProps) {
  // No cuisine theme selected - don't show anything
  if (!cuisineTheme) return null;

  const isSurprise = cuisineTheme === 'surprise';
  const cuisineLabel = CUISINE_LABELS[cuisineTheme] || cuisineTheme;

  // Show limitation note if strict mode WITH ingredients
  const showLimitationNote = isStrictMode && hasIngredients;

  return (
    <div className="space-y-2">
      {/* Limitation note for strict mode with ingredients */}
      {showLimitationNote && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>Cuisine theme limited by available ingredients.</span>
        </div>
      )}

      {/* Cuisine theme subtitle */}
      <div className={cn(
        "flex items-center gap-2 text-sm",
        showLimitationNote ? "text-muted-foreground" : "text-foreground"
      )}>
        {isSurprise ? (
          <>
            <Shuffle className="h-4 w-4 text-primary" />
            <span className="font-medium">Chef's choice</span>
          </>
        ) : (
          <>
            <ChefHat className="h-4 w-4 text-primary" />
            <span className="font-medium">{cuisineLabel}-inspired</span>
          </>
        )}
      </div>
    </div>
  );
}
