import { useState, useEffect, useCallback } from 'react';

export type IngredientMode = 'strict_only' | 'flexible_prefer';
export type ScanSource = 'fridge' | 'receipt' | 'manual';

export interface SessionIngredient {
  name: string;
  confidence: number;
}

interface IngredientSession {
  ingredients: SessionIngredient[];
  mode: IngredientMode;
  source: ScanSource;
  timestamp: number;
}

const SESSION_KEY = 'nutrition_session_ingredients';
const SESSION_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export function useIngredientSession() {
  const [ingredients, setIngredients] = useState<SessionIngredient[]>([]);
  const [mode, setMode] = useState<IngredientMode>('flexible_prefer');
  const [source, setSource] = useState<ScanSource>('fridge');
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
          setMode(session.mode || 'flexible_prefer');
          setSource(session.source || 'fridge');
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

  const saveIngredients = useCallback((
    newIngredients: SessionIngredient[], 
    newMode: IngredientMode = 'flexible_prefer',
    newSource: ScanSource = 'fridge'
  ) => {
    const session: IngredientSession = {
      ingredients: newIngredients,
      mode: newMode,
      source: newSource,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setIngredients(newIngredients);
    setMode(newMode);
    setSource(newSource);
    setHasActiveSession(newIngredients.length > 0);
  }, []);

  const clearIngredients = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIngredients([]);
    setMode('flexible_prefer');
    setSource('fridge');
    setHasActiveSession(false);
  }, []);

  const getIngredientNames = useCallback(() => {
    return ingredients.map(i => i.name);
  }, [ingredients]);

  return {
    ingredients,
    mode,
    source,
    hasActiveSession,
    saveIngredients,
    clearIngredients,
    getIngredientNames,
  };
}
