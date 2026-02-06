/**
 * Legal Gate Component
 * Wraps the app and shows acceptance modal when user needs to accept updated legal docs
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLegalDocuments } from '@/hooks/useLegalDocuments';
import { LegalAcceptanceModal } from './LegalAcceptanceModal';

interface LegalGateProps {
  children: React.ReactNode;
}

export function LegalGate({ children }: LegalGateProps) {
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
    <>
      {children}
      <LegalAcceptanceModal
        open={showModal}
        documents={documents}
        acceptanceStatus={acceptanceStatus}
        accepting={accepting}
        onAccept={handleAccept}
        onSignOut={handleSignOut}
      />
    </>
  );
}
