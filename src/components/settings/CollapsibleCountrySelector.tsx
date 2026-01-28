/**
 * Collapsible Country Selector for Settings page
 * 
 * A row that expands inline to reveal a searchable country list.
 * Smooth animations and mobile-optimized.
 */

import { useState, useRef, useEffect } from 'react';
import { Globe, Check, Search, Loader2, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { COUNTRIES, getCountryByCode } from '@/lib/countryUtils';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface CollapsibleCountrySelectorProps {
  value: string | null;
  onSave: (countryCode: string) => Promise<boolean>;
  disabled?: boolean;
}

export function CollapsibleCountrySelector({
  value,
  onSave,
  disabled = false,
}: CollapsibleCountrySelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = getCountryByCode(value);
  const displayValue = selectedCountry?.name || 'Not set';

  // Filter countries based on search
  const filteredCountries = search.trim()
    ? COUNTRIES.filter((country) =>
        country.name.toLowerCase().includes(search.toLowerCase()) ||
        country.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  // Handle click outside to collapse
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };

    // Use a small delay to prevent immediate close on mobile
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

  // Focus search input when opened
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [open]);

  const handleSelect = async (countryCode: string) => {
    if (countryCode === value) {
      setOpen(false);
      setSearch('');
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
    <div ref={containerRef}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          disabled={disabled || saving}
          className={cn(
            "flex w-full items-center justify-between p-4 text-left",
            "min-h-[56px] touch-manipulation",
            "transition-colors duration-200",
            open ? "bg-muted/50" : "hover:bg-muted/30",
            "active:scale-[0.99]"
          )}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="font-medium">{t('onboarding.countryRegion')}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                  {displayValue}
                </span>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    open && "rotate-180"
                  )} 
                />
              </>
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className="px-4 pb-4 pt-2 space-y-3">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search countries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 bg-background"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            
            {/* Country list */}
            <ScrollArea className="h-[200px] rounded-lg border bg-background">
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
                      disabled={saving}
                      className={cn(
                        "relative flex w-full items-center rounded-md py-3 px-3 text-sm",
                        "min-h-[44px] touch-manipulation",
                        "transition-colors duration-150",
                        "hover:bg-accent hover:text-accent-foreground",
                        "active:scale-[0.98]",
                        value === country.code && "bg-primary/10 text-primary"
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
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
