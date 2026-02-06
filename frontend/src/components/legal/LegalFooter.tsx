/**
 * Legal Footer Component
 * Shows links to Terms of Service and Privacy Policy
 */

import { Link } from 'react-router-dom';

interface LegalFooterProps {
  className?: string;
  showCopyright?: boolean;
}

export function LegalFooter({ className = '', showCopyright = false }: LegalFooterProps) {
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
      </div>
      {showCopyright && (
        <p className="mt-2">
          © {new Date().getFullYear()} Bisa Group, LLC
        </p>
      )}
    </div>
  );
}
