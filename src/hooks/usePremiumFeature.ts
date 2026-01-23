/**
 * Premium Feature Hook
 * 
 * Provides a simple way to gate premium features.
 * Returns a function that checks access and shows the modal if needed.
 */

import { useState, useCallback } from 'react';
import { useSubscription } from './useSubscription';

export function usePremiumFeature() {
  const { hasPremiumAccess, loading } = useSubscription();
  const [showModal, setShowModal] = useState(false);

  /**
   * Check if user has premium access.
   * If not, shows the premium modal and returns false.
   * If yes, returns true so the action can proceed.
   */
  const checkPremiumAccess = useCallback((): boolean => {
    if (loading) return false;
    
    if (!hasPremiumAccess) {
      setShowModal(true);
      return false;
    }
    
    return true;
  }, [hasPremiumAccess, loading]);

  /**
   * Wrap an async action with premium access check.
   * If user doesn't have access, shows modal instead of executing action.
   */
  const withPremiumCheck = useCallback(<T extends (...args: any[]) => any>(
    action: T
  ): ((...args: Parameters<T>) => ReturnType<T> | undefined) => {
    return (...args: Parameters<T>) => {
      if (!checkPremiumAccess()) {
        return undefined;
      }
      return action(...args);
    };
  }, [checkPremiumAccess]);

  return {
    hasPremiumAccess,
    loading,
    showModal,
    setShowModal,
    checkPremiumAccess,
    withPremiumCheck,
  };
}
