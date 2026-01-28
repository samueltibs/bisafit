/**
 * Collapsible Language Selector for Settings page
 * 
 * A row that expands inline to reveal language options.
 * Shows both native name and English name for non-English languages.
 * Smooth animations and mobile-optimized.
 */

import { useState, useRef, useEffect } from 'react';
import { Languages, Check, Loader2, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '@/lib/languageUtils';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface CollapsibleLanguageSelectorProps {
  value: string | null;
  onSave: (languageCode: string) => Promise<boolean>;
  disabled?: boolean;
}

export function CollapsibleLanguageSelector({
  value,
  onSave,
  disabled = false,
}: CollapsibleLanguageSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLanguage = getLanguageByCode(value || 'auto');
  const displayValue = selectedLanguage
    ? selectedLanguage.code === 'auto'
      ? selectedLanguage.name
      : `${selectedLanguage.nativeName}`
    : 'Auto';

  // Handle click outside to collapse
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
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

  const handleSelect = async (languageCode: string) => {
    if (languageCode === (value || 'auto')) {
      setOpen(false);
      return;
    }

    setSaving(true);
    try {
      const success = await onSave(languageCode);
      if (success) {
        setOpen(false);
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
            <Languages className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="font-medium">{t('settings.language')}</span>
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
          <div className="px-4 pb-4 pt-2">
            <ScrollArea className="h-[280px] rounded-lg border bg-background">
              <div className="p-1">
                {SUPPORTED_LANGUAGES.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleSelect(language.code)}
                    disabled={saving}
                    className={cn(
                      "relative flex w-full items-center rounded-md py-3 px-3 text-sm",
                      "min-h-[44px] touch-manipulation",
                      "transition-colors duration-150",
                      "hover:bg-accent hover:text-accent-foreground",
                      "active:scale-[0.98]",
                      (value || 'auto') === language.code && "bg-primary/10 text-primary"
                    )}
                  >
                    <div className="flex-1 text-left">
                      {language.code === 'auto' ? (
                        <span>{language.name}</span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{language.nativeName}</span>
                          {language.nativeName !== language.name && (
                            <span className="text-xs text-muted-foreground">
                              {language.name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {(value || 'auto') === language.code && (
                      <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
