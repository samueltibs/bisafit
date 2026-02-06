/**
 * Legal Acceptance Modal
 * Blocking modal shown when user needs to accept updated Terms/Privacy
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import type { ActiveLegalDocuments, LegalAcceptanceStatus } from '@/types/legal';
import { APP_NAME } from '@/lib/branding';

interface LegalAcceptanceModalProps {
  open: boolean;
  documents: ActiveLegalDocuments;
  acceptanceStatus: LegalAcceptanceStatus | null;
  accepting: boolean;
  onAccept: () => Promise<boolean>;
  onSignOut?: () => void;
}

export function LegalAcceptanceModal({
  open,
  documents,
  acceptanceStatus,
  accepting,
  onAccept,
  onSignOut,
}: LegalAcceptanceModalProps) {
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  const needsTerms = acceptanceStatus && !acceptanceStatus.terms_accepted && documents.terms;
  const needsPrivacy = acceptanceStatus && !acceptanceStatus.privacy_accepted && documents.privacy;

  const canAccept = 
    (!needsTerms || termsChecked) && 
    (!needsPrivacy || privacyChecked);

  const handleAccept = async () => {
    const success = await onAccept();
    if (success) {
      setTermsChecked(false);
      setPrivacyChecked(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Updated Legal Documents
          </DialogTitle>
          <DialogDescription>
            We've updated our legal documents. Please review and accept them to continue using {APP_NAME}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Terms of Service */}
          {needsTerms && documents.terms && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept-terms"
                  checked={termsChecked}
                  onCheckedChange={(checked) => setTermsChecked(checked === true)}
                  disabled={accepting}
                />
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor="accept-terms"
                    className="font-medium cursor-pointer"
                  >
                    {documents.terms.title}
                  </Label>
                  <div className="text-xs text-muted-foreground">
                    Version {documents.terms.version}
                    {documents.terms.published_at && (
                      <> • Published {format(new Date(documents.terms.published_at), 'MMM d, yyyy')}</>
                    )}
                  </div>
                  <Link
                    to="/terms"
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                  >
                    Read full document
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Policy */}
          {needsPrivacy && documents.privacy && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept-privacy"
                  checked={privacyChecked}
                  onCheckedChange={(checked) => setPrivacyChecked(checked === true)}
                  disabled={accepting}
                />
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor="accept-privacy"
                    className="font-medium cursor-pointer"
                  >
                    {documents.privacy.title}
                  </Label>
                  <div className="text-xs text-muted-foreground">
                    Version {documents.privacy.version}
                    {documents.privacy.published_at && (
                      <> • Published {format(new Date(documents.privacy.published_at), 'MMM d, yyyy')}</>
                    )}
                  </div>
                  <Link
                    to="/privacy"
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                  >
                    Read full document
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onSignOut && (
            <Button variant="ghost" onClick={onSignOut} disabled={accepting}>
              Sign Out
            </Button>
          )}
          <Button onClick={handleAccept} disabled={!canAccept || accepting}>
            {accepting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Accepting...
              </>
            ) : (
              'Accept and Continue'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
