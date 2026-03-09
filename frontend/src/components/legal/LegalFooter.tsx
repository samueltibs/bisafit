/**
 * Legal Footer Component
 * Shows links to Terms of Service and Privacy Policy
 */

import { Link } from 'react-router-dom';
import { COMPANY_NAME, EMAIL_SUPPORT, COMPANY_PHONE } from '@/lib/branding';

interface LegalFooterProps {
  className?: string;
  showCopyright?: boolean;
  showContact?: boolean;
}

export function LegalFooter({ className = '', showCopyright = false, showContact = false }: LegalFooterProps) {
  return (
    <div className={`text-center text-xs text-muted-foreground ${className}`}>
      <div className="flex items-center justify-center gap-2">
        <Link to="/terms" className="hover:text-foreground hover:underline transition-colors">
          Terms of Service
        </Link>
        <span>|</span>
        <Link to="/privacy" className="hover:text-foreground hover:underline transition-colors">
          Privacy Policy
        </Link>
        <span>|</span>
        <Link to="/contact" className="hover:text-foreground hover:underline transition-colors">
          Contact
        </Link>
      </div>
      {showCopyright && (
        <p className="mt-2">
          © {new Date().getFullYear()} {COMPANY_NAME}
        </p>
      )}
      {showContact && (
        <p className="mt-2">
          Support: {EMAIL_SUPPORT} • {COMPANY_PHONE}
        </p>
      )}
    </div>
  );
}
