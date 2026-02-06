-- =====================================================
-- BISAFIT LEGAL DOCUMENTS SYSTEM
-- Database Schema for Terms of Service and Privacy Policy
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. LEGAL DOCUMENTS TABLE
-- Stores versioned legal documents (Terms, Privacy)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.legal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_type TEXT NOT NULL CHECK (doc_type IN ('terms', 'privacy')),
    version TEXT NOT NULL,
    title TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    published_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique version per doc_type
    UNIQUE (doc_type, version)
);

-- Index for fast lookup of active documents
CREATE INDEX IF NOT EXISTS idx_legal_documents_active 
    ON public.legal_documents(doc_type, is_active) 
    WHERE is_active = true;

-- Function to ensure only ONE active document per doc_type
CREATE OR REPLACE FUNCTION ensure_single_active_legal_doc()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting is_active to true, deactivate all others of same type
    IF NEW.is_active = true THEN
        UPDATE public.legal_documents 
        SET is_active = false, updated_at = NOW()
        WHERE doc_type = NEW.doc_type 
        AND id != NEW.id 
        AND is_active = true;
        
        -- Also set published_at if not already set
        IF NEW.published_at IS NULL THEN
            NEW.published_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single active document
DROP TRIGGER IF EXISTS trigger_single_active_legal_doc ON public.legal_documents;
CREATE TRIGGER trigger_single_active_legal_doc
    BEFORE INSERT OR UPDATE ON public.legal_documents
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_legal_doc();

-- =====================================================
-- 2. LEGAL ACCEPTANCES TABLE
-- Records when users accept legal documents
-- =====================================================

CREATE TABLE IF NOT EXISTS public.legal_acceptances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL CHECK (doc_type IN ('terms', 'privacy')),
    version TEXT NOT NULL,
    accepted_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- User can only accept each version once
    UNIQUE (user_id, doc_type, version)
);

-- Index for checking user acceptances
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user 
    ON public.legal_acceptances(user_id, doc_type, version);

CREATE INDEX IF NOT EXISTS idx_legal_acceptances_doc 
    ON public.legal_acceptances(doc_type, version);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

-- Legal Documents: Public can read active documents
DROP POLICY IF EXISTS "Public can view active legal documents" ON public.legal_documents;
CREATE POLICY "Public can view active legal documents" 
    ON public.legal_documents 
    FOR SELECT 
    USING (is_active = true);

-- Legal Documents: Only service role can modify (handled by default)
-- No INSERT/UPDATE/DELETE policies for regular users

-- Legal Acceptances: Users can insert their own records
DROP POLICY IF EXISTS "Users can insert own acceptances" ON public.legal_acceptances;
CREATE POLICY "Users can insert own acceptances" 
    ON public.legal_acceptances 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Legal Acceptances: Users can view their own records
DROP POLICY IF EXISTS "Users can view own acceptances" ON public.legal_acceptances;
CREATE POLICY "Users can view own acceptances" 
    ON public.legal_acceptances 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- =====================================================
-- 4. HELPER FUNCTIONS (Database Level)
-- =====================================================

-- Function to get active legal documents
CREATE OR REPLACE FUNCTION get_active_legal_documents()
RETURNS TABLE (
    doc_type TEXT,
    version TEXT,
    title TEXT,
    content_markdown TEXT,
    published_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ld.doc_type,
        ld.version,
        ld.title,
        ld.content_markdown,
        ld.published_at
    FROM public.legal_documents ld
    WHERE ld.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has accepted latest versions
CREATE OR REPLACE FUNCTION user_has_accepted_latest(p_user_id UUID)
RETURNS TABLE (
    terms_accepted BOOLEAN,
    privacy_accepted BOOLEAN,
    terms_version TEXT,
    privacy_version TEXT
) AS $$
DECLARE
    v_terms_version TEXT;
    v_privacy_version TEXT;
    v_terms_accepted BOOLEAN := false;
    v_privacy_accepted BOOLEAN := false;
BEGIN
    -- Get active versions
    SELECT version INTO v_terms_version 
    FROM public.legal_documents 
    WHERE doc_type = 'terms' AND is_active = true;
    
    SELECT version INTO v_privacy_version 
    FROM public.legal_documents 
    WHERE doc_type = 'privacy' AND is_active = true;
    
    -- Check if user accepted terms
    IF v_terms_version IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.legal_acceptances 
            WHERE user_id = p_user_id 
            AND doc_type = 'terms' 
            AND version = v_terms_version
        ) INTO v_terms_accepted;
    ELSE
        v_terms_accepted := true; -- No terms document exists
    END IF;
    
    -- Check if user accepted privacy
    IF v_privacy_version IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.legal_acceptances 
            WHERE user_id = p_user_id 
            AND doc_type = 'privacy' 
            AND version = v_privacy_version
        ) INTO v_privacy_accepted;
    ELSE
        v_privacy_accepted := true; -- No privacy document exists
    END IF;
    
    RETURN QUERY SELECT v_terms_accepted, v_privacy_accepted, v_terms_version, v_privacy_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Legal Documents System schema created successfully!';
    RAISE NOTICE '  - legal_documents table: Ready';
    RAISE NOTICE '  - legal_acceptances table: Ready';
    RAISE NOTICE '  - RLS policies: Configured';
    RAISE NOTICE '  - Helper functions: Created';
END $$;
