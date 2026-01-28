import { useState, useEffect, useCallback } from 'react';

export type IngredientMode = 'strict_only' | 'flexible_prefer';
export type ScanSource = 'fridge' | 'receipt' | 'manual';
export type SessionStatus = 'ready' | 'generating' | 'used';

export interface SessionIngredient {
  name: string;
  confidence: number;
}

interface IngredientSession {
  ingredients: SessionIngredient[];
  mode: IngredientMode;
  source: ScanSource;
  status: SessionStatus;
  includeStaples: boolean;
  timestamp: number;
}

const SESSION_KEY = 'nutrition_session_ingredients';
const SESSION_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export function useIngredientSession() {
  const [ingredients, setIngredients] = useState<SessionIngredient[]>([]);
  const [mode, setMode] = useState<IngredientMode>('flexible_prefer');
  const [source, setSource] = useState<ScanSource>('fridge');
  const [status, setStatus] = useState<SessionStatus>('ready');
  const [includeStaples, setIncludeStaples] = useState(true);
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
          setStatus(session.status || 'ready');
          setIncludeStaples(session.includeStaples ?? true);
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

  // Helper to persist session
  const persistSession = useCallback((
    newIngredients: SessionIngredient[],
    newMode: IngredientMode,
    newSource: ScanSource,
    newStatus: SessionStatus,
    newIncludeStaples: boolean
  ) => {
    const session: IngredientSession = {
      ingredients: newIngredients,
      mode: newMode,
      source: newSource,
      status: newStatus,
      includeStaples: newIncludeStaples,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setIngredients(newIngredients);
    setMode(newMode);
    setSource(newSource);
    setStatus(newStatus);
    setIncludeStaples(newIncludeStaples);
    setHasActiveSession(newIngredients.length > 0);
  }, []);

  const saveIngredients = useCallback((
    newIngredients: SessionIngredient[], 
    newMode: IngredientMode = 'flexible_prefer',
    newSource: ScanSource = 'fridge',
    newIncludeStaples: boolean = true
  ) => {
    persistSession(newIngredients, newMode, newSource, 'ready', newIncludeStaples);
  }, [persistSession]);

  const updateMode = useCallback((newMode: IngredientMode, newIncludeStaples?: boolean) => {
    persistSession(ingredients, newMode, source, status, newIncludeStaples ?? includeStaples);
  }, [ingredients, source, status, includeStaples, persistSession]);

  const updateStatus = useCallback((newStatus: SessionStatus) => {
    persistSession(ingredients, mode, source, newStatus, includeStaples);
  }, [ingredients, mode, source, includeStaples, persistSession]);

  const updateIncludeStaples = useCallback((newIncludeStaples: boolean) => {
    persistSession(ingredients, mode, source, status, newIncludeStaples);
  }, [ingredients, mode, source, status, persistSession]);

  const clearIngredients = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIngredients([]);
    setMode('flexible_prefer');
    setSource('fridge');
    setStatus('ready');
    setIncludeStaples(true);
    setHasActiveSession(false);
  }, []);

  const getIngredientNames = useCallback(() => {
    return ingredients.map(i => i.name);
  }, [ingredients]);

  return {
    ingredients,
    mode,
    source,
    status,
    includeStaples,
    hasActiveSession,
    saveIngredients,
    updateMode,
    updateStatus,
    updateIncludeStaples,
    clearIngredients,
    getIngredientNames,
  };
}
