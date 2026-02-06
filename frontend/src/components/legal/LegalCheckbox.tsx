/**
 * Legal Checkbox Component
 * Checkbox for accepting Terms & Privacy during signup
 */

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

interface LegalCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: boolean;
}

export function LegalCheckbox({
  checked,
  onCheckedChange,
  disabled = false,
  error = false,
}: LegalCheckboxProps) {
  return (
    <div className="flex items-start gap-2">
      <Checkbox
        id="legal-acceptance"
        checked={checked}
        onCheckedChange={(checked) => onCheckedChange(checked === true)}
        disabled={disabled}
        className={error ? 'border-destructive' : ''}
      />
      <Label
        htmlFor="legal-acceptance"
        className={`text-sm leading-relaxed cursor-pointer ${
          error ? 'text-destructive' : 'text-muted-foreground'
        }`}
      >
        I agree to the{' '}
        <Link
          to="/terms"
          target="_blank"
          className="text-primary hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link
          to="/privacy"
          target="_blank"
          className="text-primary hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          Privacy Policy
        </Link>
      </Label>
    </div>
  );
}
