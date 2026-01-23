import { useState, useEffect, useCallback } from 'react';

export interface SessionIngredient {
  name: string;
  confidence: number;
}

interface IngredientSession {
  ingredients: SessionIngredient[];
  timestamp: number;
}

const SESSION_KEY = 'nutrition_session_ingredients';
const SESSION_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export function useIngredientSession() {
  const [ingredients, setIngredients] = useState<SessionIngredient[]>([]);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  // Load session from storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const session: IngredientSession = JSON.parse(stored);
        const isExpired = Date.now() - session.timestamp > SESSION_EXPIRY_MS;
        
        if (!isExpired && session.ingredients.length > 0) {
          setIngredients(session.ingredients);
          setHasActiveSession(true);
        } else {
          // Clear expired session
          sessionStorage.removeItem(SESSION_KEY);
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const saveIngredients = useCallback((newIngredients: SessionIngredient[]) => {
    const session: IngredientSession = {
      ingredients: newIngredients,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setIngredients(newIngredients);
    setHasActiveSession(newIngredients.length > 0);
  }, []);

  const clearIngredients = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIngredients([]);
    setHasActiveSession(false);
  }, []);

  const getIngredientNames = useCallback(() => {
    return ingredients.map(i => i.name);
  }, [ingredients]);

  return {
    ingredients,
    hasActiveSession,
    saveIngredients,
    clearIngredients,
    getIngredientNames,
  };
}
