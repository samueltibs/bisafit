/**
 * Privacy Policy Page
 * Public route - no authentication required
 */

import { useLegalDocument } from '@/hooks/useLegalDocuments';
import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';

export default function Privacy() {
  const { document, loading, error } = useLegalDocument('privacy');

  return (
    <LegalDocumentPage
      document={document}
      loading={loading}
      error={error}
      fallbackTitle="Privacy Policy"
    />
  );
}
