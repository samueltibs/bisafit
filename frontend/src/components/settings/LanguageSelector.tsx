import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '@/lib/languageUtils';
import { Languages } from 'lucide-react';

interface LanguageSelectorProps {
  value: string | null;
  onChange: (value: string) => void;
  showLabel?: boolean;
  compact?: boolean;
}

export function LanguageSelector({
  value,
  onChange,
  showLabel = true,
  compact = false,
}: LanguageSelectorProps) {
  const selectedLanguage = getLanguageByCode(value);

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {showLabel && (
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <Label>Language</Label>
        </div>
      )}
      <Select value={value || 'auto'} onValueChange={onChange}>
        <SelectTrigger className={compact ? 'h-10' : 'h-12'}>
          <SelectValue placeholder="Select language">
            {selectedLanguage ? (
              <span>
                {selectedLanguage.name}
                {selectedLanguage.code !== 'auto' && selectedLanguage.nativeName !== selectedLanguage.name && (
                  <span className="text-muted-foreground ml-1">
                    ({selectedLanguage.nativeName})
                  </span>
                )}
              </span>
            ) : (
              'Select language'
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          {SUPPORTED_LANGUAGES.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <span className="flex items-center gap-2">
                {language.name}
                {language.code !== 'auto' && language.nativeName !== language.name && (
                  <span className="text-muted-foreground">
                    ({language.nativeName})
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!compact && (
        <p className="text-xs text-muted-foreground">
          Choose your preferred language for the app interface.
        </p>
      )}
    </div>
  );
}
