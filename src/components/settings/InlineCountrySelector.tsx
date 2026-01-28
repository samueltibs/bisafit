/**
 * Inline Country Selector for Settings page
 * 
 * A searchable dropdown that saves immediately on selection.
 * Mobile-optimized with 44px+ touch targets.
 */

import { useState, useMemo } from 'react';
import { Globe, Check, Search, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { COUNTRIES, getCountryByCode, getCountryName } from '@/lib/countryUtils';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface InlineCountrySelectorProps {
  value: string | null;
  onSave: (countryCode: string) => Promise<boolean>;
  disabled?: boolean;
}

export function InlineCountrySelector({
  value,
  onSave,
  disabled = false,
}: InlineCountrySelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedCountry = getCountryByCode(value);
  const displayValue = selectedCountry?.name || 'Select country';

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const lowerSearch = search.toLowerCase();
    return COUNTRIES.filter((country) =>
      country.name.toLowerCase().includes(lowerSearch) ||
      country.code.toLowerCase().includes(lowerSearch)
    );
  }, [search]);

  const handleSelect = async (countryCode: string) => {
    if (countryCode === value) {
      setOpen(false);
      return;
    }

    setSaving(true);
    try {
      const success = await onSave(countryCode);
      if (success) {
        setOpen(false);
        setSearch('');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <span className="block font-medium">{t('onboarding.countryRegion')}</span>
        </div>
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || saving}
            className={cn(
              "h-11 min-h-[44px] min-w-[120px] max-w-[180px] justify-between text-sm",
              "touch-manipulation",
              !value && "text-muted-foreground"
            )}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="truncate">{displayValue}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[280px] p-0 bg-popover z-50" 
          align="end"
          sideOffset={4}
        >
          {/* Search input */}
          <div className="flex items-center border-b px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
            <Input
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          
          {/* Country list */}
          <ScrollArea className="h-[300px]">
            <div className="p-1">
              {filteredCountries.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No countries found
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleSelect(country.code)}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-3 px-3 text-sm outline-none",
                      "min-h-[44px] touch-manipulation",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground",
                      value === country.code && "bg-accent/50"
                    )}
                  >
                    <span className="flex-1 text-left">{country.name}</span>
                    {value === country.code && (
                      <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
