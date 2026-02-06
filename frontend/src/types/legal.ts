/**
 * Legal Documents Types
 * Types for Terms of Service and Privacy Policy system
 */

export type LegalDocType = 'terms' | 'privacy';

export interface LegalDocument {
  id: string;
  doc_type: LegalDocType;
  version: string;
  title: string;
  content_markdown: string;
  published_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LegalAcceptance {
  id: string;
  user_id: string;
  doc_type: LegalDocType;
  version: string;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface LegalAcceptanceStatus {
  terms_accepted: boolean;
  privacy_accepted: boolean;
  terms_version: string | null;
  privacy_version: string | null;
}

export interface ActiveLegalDocuments {
  terms: LegalDocument | null;
  privacy: LegalDocument | null;
}
