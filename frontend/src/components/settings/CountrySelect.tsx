/**
 * Unified Country Select Component
 * 
 * A searchable country dropdown with flags for use in both Settings and Edit Profile.
 * Uses the full ISO-3166 country list with emoji flags.
 * Correctly binds to saved ISO country code and handles missing countries gracefully.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { Globe, Check, Search, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ALL_COUNTRIES, getCountryFlag, getCountryFromCode } from '@/lib/countryFlags';
import { cn } from '@/lib/utils';

interface CountrySelectProps {
  value: string | null;
  onChange: (countryCode: string) => void;
  showLabel?: boolean;
  compact?: boolean;
  disabled?: boolean;
}

export function CountrySelect({
  value,
  onChange,
  showLabel = true,
  compact = false,
  disabled = false,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get selected country from full ISO-3166 list
  const selectedCountry = getCountryFromCode(value);
  
  // Handle case where saved country code isn't in our list (graceful fallback)
  const displayValue = useMemo(() => {
    if (!value) return null;
    if (selectedCountry) {
      return {
        flag: getCountryFlag(selectedCountry.code),
        name: selectedCountry.name,
        code: selectedCountry.code,
      };
    }
    // Fallback: show the code with a generic flag if not found
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Country code "${value}" not found in ISO-3166 list`);
    }
    return {
      flag: getCountryFlag(value),
      name: value.toUpperCase(),
      code: value,
    };
  }, [value, selectedCountry]);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!search.trim()) return ALL_COUNTRIES;
    const query = search.toLowerCase();
    return ALL_COUNTRIES.filter((country) =>
      country.name.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query)
    );
  }, [search]);

  // Focus search input when popover opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearch('');
    }
  }, [open]);

  const handleSelect = (countryCode: string) => {
    onChange(countryCode);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {showLabel && (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Label>Country / Region</Label>
        </div>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 text-left",
              "min-h-[44px] touch-manipulation",
              "ring-offset-background transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              compact ? 'h-10' : 'h-12'
            )}
          >
            <span className={cn(
              "flex items-center gap-2 truncate",
              !displayValue && "text-muted-foreground"
            )}>
              {displayValue ? (
                <>
                  <span className="text-lg">{displayValue.flag}</span>
                  <span>{displayValue.name}</span>
                </>
              ) : (
                'Select your country'
              )}
            </span>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
              open && "rotate-180"
            )} />
          </button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0 z-50" 
          align="start"
          sideOffset={4}
        >
          {/* Search input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search countries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-10 bg-background"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </div>
          
          {/* Country list */}
          <ScrollArea className="h-[240px]">
            <div className="p-1">
              {filteredCountries.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No countries found
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country.code)}
                    className={cn(
                      "relative flex w-full items-center gap-3 rounded-md py-2.5 px-3 text-sm",
                      "min-h-[44px] touch-manipulation",
                      "transition-colors duration-150",
                      "hover:bg-accent hover:text-accent-foreground",
                      "active:scale-[0.98]",
                      value === country.code && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <span className="text-lg shrink-0">{getCountryFlag(country.code)}</span>
                    <span className="flex-1 text-left">{country.name}</span>
                    {value === country.code && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      
      {!compact && (
        <p className="text-xs text-muted-foreground">
          Used for sensible defaults. You can still customize language and units separately.
        </p>
      )}
    </div>
  );
}
