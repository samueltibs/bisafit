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
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'indian', label: 'Indian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'asian', label: 'Asian' },
  { value: 'cajun', label: 'Cajun' },
  { value: 'italian', label: 'Italian' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'thai', label: 'Thai' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'american', label: 'American' },
  { value: 'french', label: 'French' },
  { value: 'korean', label: 'Korean' },
  { value: 'greek', label: 'Greek' },
  { value: 'vietnamese', label: 'Vietnamese' },
];

interface CuisineThemeSelectorProps {
  selectedCuisine: string | null;
  onCuisineChange: (cuisine: string | null) => void;
  savedPreferences?: string[];
  compact?: boolean;
}

export function CuisineThemeSelector({
  selectedCuisine,
  onCuisineChange,
  savedPreferences = [],
  compact = false,
}: CuisineThemeSelectorProps) {
  // Show saved preferences first, then other options
  const sortedOptions = [
    ...CUISINE_OPTIONS.filter((c) => savedPreferences.includes(c.value)),
    ...CUISINE_OPTIONS.filter((c) => !savedPreferences.includes(c.value)),
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <ChefHat className="h-4 w-4 text-muted-foreground" />
        <Select
          value={selectedCuisine || 'none'}
          onValueChange={(v) => onCuisineChange(v === 'none' ? null : v)}
        >
          <SelectTrigger className="w-[160px] h-8 text-sm">
            <SelectValue placeholder="Cuisine theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No theme</SelectItem>
            {sortedOptions.map((cuisine) => (
              <SelectItem key={cuisine.value} value={cuisine.value}>
                {cuisine.label}
                {savedPreferences.includes(cuisine.value) && ' ★'}
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
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <ChefHat className="h-4 w-4" />
          This week's cuisine theme
        </Label>
        <p className="text-xs text-muted-foreground">
          Cuisine themes guide flavor, not strict rules.
        </p>
      </div>
      <Select
        value={selectedCuisine || 'none'}
        onValueChange={(v) => onCuisineChange(v === 'none' ? null : v)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a cuisine theme (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No theme</SelectItem>
          {sortedOptions.map((cuisine) => (
            <SelectItem key={cuisine.value} value={cuisine.value}>
              {cuisine.label}
              {savedPreferences.includes(cuisine.value) && ' ★'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { CUISINE_OPTIONS };
