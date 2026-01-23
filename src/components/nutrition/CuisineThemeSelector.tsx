import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChefHat, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const CUISINE_OPTIONS = [
  { value: 'american', label: 'American' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'cajun', label: 'Cajun' },
  { value: 'indian', label: 'Indian' },
  { value: 'east_african', label: 'East African' },
  { value: 'asian', label: 'Asian (Chinese / Japanese / Korean)' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'latin', label: 'Latin' },
  { value: 'italian', label: 'Italian' },
  { value: 'african', label: 'African (General)' },
  { value: 'surprise', label: 'Surprise me 🎲' },
];

interface CuisineThemeSelectorProps {
  selectedCuisine: string | null;
  onCuisineChange: (cuisine: string | null) => void;
  compact?: boolean;
}

export function CuisineThemeSelector({
  selectedCuisine,
  onCuisineChange,
  compact = false,
}: CuisineThemeSelectorProps) {
  const sortedOptions = CUISINE_OPTIONS;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <ChefHat className="h-4 w-4 text-muted-foreground" />
        <Select
          value={selectedCuisine || 'none'}
          onValueChange={(v) => onCuisineChange(v === 'none' ? null : v)}
        >
          <SelectTrigger className="w-[200px] h-8 text-sm">
            <SelectValue placeholder="Cuisine theme" />
          </SelectTrigger>
          <SelectContent className="bg-background border z-50">
            <SelectItem value="none">None</SelectItem>
            {sortedOptions.map((cuisine) => (
              <SelectItem key={cuisine.value} value={cuisine.value}>
                {cuisine.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCuisine && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onCuisineChange(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <ChefHat className="h-4 w-4" />
        Cuisine theme (optional)
      </Label>
      <p className="text-xs text-muted-foreground">
        Pick a cuisine to inspire flavors this week. Not strict.
      </p>
      <Select
        value={selectedCuisine || 'none'}
        onValueChange={(v) => onCuisineChange(v === 'none' ? null : v)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent className="bg-background border z-50">
          <SelectItem value="none">None</SelectItem>
          {sortedOptions.map((cuisine) => (
            <SelectItem key={cuisine.value} value={cuisine.value}>
              {cuisine.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { CUISINE_OPTIONS };
