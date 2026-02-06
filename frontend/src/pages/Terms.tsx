/**
 * Terms of Service Page
 * Public route - no authentication required
 */

import { useLegalDocument } from '@/hooks/useLegalDocuments';
import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';

export default function Terms() {
  const { document, loading, error } = useLegalDocument('terms');

  return (
    <LegalDocumentPage
      document={document}
      loading={loading}
      error={error}
      fallbackTitle="Terms of Service"
    />
  );
}
