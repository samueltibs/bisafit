/**
 * Legal Gate Component
 * Shows acceptance modal when user needs to accept updated legal docs
 * Renders as a sibling to the main app content
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLegalDocuments } from '@/hooks/useLegalDocuments';
import { LegalAcceptanceModal } from './LegalAcceptanceModal';

export function LegalGate() {
  const { user, signOut } = useAuth();
  const { 
    documents, 
    acceptanceStatus, 
    accepting, 
    needsAcceptance,
    acceptAllDocuments,
    checkAcceptanceStatus,
  } = useLegalDocuments();
  
  const [showModal, setShowModal] = useState(false);

  // Check if user needs to accept documents after login
  useEffect(() => {
    if (user && needsAcceptance) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [user, needsAcceptance]);

  const handleAccept = async () => {
    const success = await acceptAllDocuments();
    if (success) {
      setShowModal(false);
      await checkAcceptanceStatus();
    }
    return success;
  };

  const handleSignOut = async () => {
    await signOut();
    setShowModal(false);
  };

  return (
    <LegalAcceptanceModal
      open={showModal}
      documents={documents}
      acceptanceStatus={acceptanceStatus}
      accepting={accepting}
      onAccept={handleAccept}
      onSignOut={handleSignOut}
    />
  );
}
