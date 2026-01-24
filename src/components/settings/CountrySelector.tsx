import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COUNTRIES, getCountryByCode } from '@/lib/countryUtils';
import { Globe } from 'lucide-react';

interface CountrySelectorProps {
  value: string | null;
  onChange: (value: string) => void;
  showLabel?: boolean;
  compact?: boolean;
}

export function CountrySelector({
  value,
  onChange,
  showLabel = true,
  compact = false,
}: CountrySelectorProps) {
  const selectedCountry = getCountryByCode(value);

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {showLabel && (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Label>Country / Region</Label>
        </div>
      )}
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className={compact ? 'h-10' : 'h-12'}>
          <SelectValue placeholder="Select your country">
            {selectedCountry ? selectedCountry.name : 'Select your country'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {COUNTRIES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!compact && (
        <p className="text-xs text-muted-foreground">
          Used for sensible defaults. You can still customize language and units separately.
        </p>
      )}
    </div>
  );
}
