/**
 * Inline Language Selector for Settings page
 * 
 * A simple dropdown that saves immediately and triggers UI re-render.
 * Mobile-optimized with 44px+ touch targets.
 */

import { useState } from 'react';
import { Languages, Check, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '@/lib/languageUtils';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface InlineLanguageSelectorProps {
  value: string | null;
  onSave: (languageCode: string) => Promise<boolean>;
  disabled?: boolean;
}

export function InlineLanguageSelector({
  value,
  onSave,
  disabled = false,
}: InlineLanguageSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedLanguage = getLanguageByCode(value || 'auto');
  const displayValue = selectedLanguage?.name || 'Auto';

  const handleSelect = async (languageCode: string) => {
    if (languageCode === value) {
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
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Languages className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <span className="block font-medium">{t('settings.language')}</span>
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
              "touch-manipulation"
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
          className="w-[240px] p-1 bg-popover z-50" 
          align="end"
          sideOffset={4}
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => handleSelect(language.code)}
              className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-sm py-3 px-3 text-sm outline-none",
                "min-h-[44px] touch-manipulation",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:bg-accent focus:text-accent-foreground",
                (value || 'auto') === language.code && "bg-accent/50"
              )}
            >
              <div className="flex-1 text-left">
                <span>{language.name}</span>
                {language.code !== 'auto' && language.nativeName !== language.name && (
                  <span className="text-muted-foreground ml-1">
                    ({language.nativeName})
                  </span>
                )}
              </div>
              {(value || 'auto') === language.code && (
                <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
              )}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
