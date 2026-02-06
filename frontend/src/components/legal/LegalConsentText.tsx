/**
 * Legal Consent Text Component
 * Shows "By continuing, you agree..." text on auth screens
 */

import { Link } from 'react-router-dom';

interface LegalConsentTextProps {
  className?: string;
}

export function LegalConsentText({ className = '' }: LegalConsentTextProps) {
  return (
    <p className={`text-xs text-muted-foreground text-center ${className}`}>
      By continuing, you agree to the{' '}
      <Link
        to="/terms"
        target="_blank"
        className="text-primary hover:underline"
      >
        Terms of Service
      </Link>{' '}
      and{' '}
      <Link
        to="/privacy"
        target="_blank"
        className="text-primary hover:underline"
      >
        Privacy Policy
      </Link>
    </p>
  );
}
