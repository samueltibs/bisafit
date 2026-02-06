/**
 * Legal Documents Hook
 * Handles fetching and accepting legal documents (Terms & Privacy)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { 
  LegalDocument, 
  LegalDocType, 
  LegalAcceptanceStatus,
  ActiveLegalDocuments 
} from '@/types/legal';

/**
 * Get active legal documents (Terms and Privacy)
 */
export async function getActiveLegalDocuments(): Promise<ActiveLegalDocuments> {
  const { data, error } = await supabase
    .from('legal_documents')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('[Legal] Error fetching documents:', error);
    return { terms: null, privacy: null };
  }

  const terms = data?.find(d => d.doc_type === 'terms') || null;
  const privacy = data?.find(d => d.doc_type === 'privacy') || null;

  return { terms, privacy };
}

/**
 * Check if user has accepted latest versions of all legal documents
 */
export async function userHasAcceptedLatest(userId: string): Promise<LegalAcceptanceStatus> {
  // Get active documents
  const { terms, privacy } = await getActiveLegalDocuments();
  
  // If no documents exist, consider accepted
  if (!terms && !privacy) {
    return {
      terms_accepted: true,
      privacy_accepted: true,
      terms_version: null,
      privacy_version: null,
    };
  }

  // Get user's acceptances
  const { data: acceptances, error } = await supabase
    .from('legal_acceptances')
    .select('doc_type, version')
    .eq('user_id', userId);

  if (error) {
    console.error('[Legal] Error checking acceptances:', error);
    return {
      terms_accepted: false,
      privacy_accepted: false,
      terms_version: terms?.version || null,
      privacy_version: privacy?.version || null,
    };
  }

  const termsAccepted = !terms || acceptances?.some(
    a => a.doc_type === 'terms' && a.version === terms.version
  ) || false;

  const privacyAccepted = !privacy || acceptances?.some(
    a => a.doc_type === 'privacy' && a.version === privacy.version
  ) || false;

  return {
    terms_accepted: termsAccepted,
    privacy_accepted: privacyAccepted,
    terms_version: terms?.version || null,
    privacy_version: privacy?.version || null,
  };
}

/**
 * Hook for legal documents functionality
 */
export function useLegalDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ActiveLegalDocuments>({ terms: null, privacy: null });
  const [acceptanceStatus, setAcceptanceStatus] = useState<LegalAcceptanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  // Fetch active documents
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const docs = await getActiveLegalDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('[Legal] Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check user acceptance status
  const checkAcceptanceStatus = useCallback(async () => {
    if (!user) {
      setAcceptanceStatus(null);
      return;
    }

    try {
      const status = await userHasAcceptedLatest(user.id);
      setAcceptanceStatus(status);
    } catch (error) {
      console.error('[Legal] Error checking acceptance:', error);
    }
  }, [user]);

  // Accept a legal document
  const acceptDocument = useCallback(async (
    docType: LegalDocType,
    version: string
  ): Promise<boolean> => {
    if (!user) return false;

    setAccepting(true);
    try {
      const { error } = await supabase
        .from('legal_acceptances')
        .insert({
          user_id: user.id,
          doc_type: docType,
          version: version,
          ip_address: null, // Can be set from backend if needed
          user_agent: navigator.userAgent,
        });

      if (error) {
        // Check if already accepted (unique constraint)
        if (error.code === '23505') {
          console.log('[Legal] Document already accepted');
          return true;
        }
        console.error('[Legal] Error accepting document:', error);
        return false;
      }

      // Refresh acceptance status
      await checkAcceptanceStatus();
      return true;
    } catch (error) {
      console.error('[Legal] Error accepting document:', error);
      return false;
    } finally {
      setAccepting(false);
    }
  }, [user, checkAcceptanceStatus]);

  // Accept all active documents
  const acceptAllDocuments = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setAccepting(true);
    try {
      const promises: Promise<boolean>[] = [];

      if (documents.terms) {
        promises.push(acceptDocument('terms', documents.terms.version));
      }
      if (documents.privacy) {
        promises.push(acceptDocument('privacy', documents.privacy.version));
      }

      const results = await Promise.all(promises);
      return results.every(r => r);
    } finally {
      setAccepting(false);
    }
  }, [user, documents, acceptDocument]);

  // Check if user needs to accept documents
  const needsAcceptance = acceptanceStatus && (
    !acceptanceStatus.terms_accepted || !acceptanceStatus.privacy_accepted
  );

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Check acceptance when user changes
  useEffect(() => {
    if (user) {
      checkAcceptanceStatus();
    }
  }, [user, checkAcceptanceStatus]);

  return {
    documents,
    acceptanceStatus,
    loading,
    accepting,
    needsAcceptance,
    fetchDocuments,
    checkAcceptanceStatus,
    acceptDocument,
    acceptAllDocuments,
  };
}

/**
 * Hook for fetching a single legal document by type
 */
export function useLegalDocument(docType: LegalDocType) {
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('legal_documents')
          .select('*')
          .eq('doc_type', docType)
          .eq('is_active', true)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // No document found
            setDocument(null);
          } else {
            setError('Failed to load document');
          }
        } else {
          setDocument(data);
        }
      } catch (err) {
        setError('Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [docType]);

  return { document, loading, error };
}
