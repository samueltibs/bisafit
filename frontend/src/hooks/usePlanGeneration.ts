import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GeneratePlanResult {
  success: boolean;
  plan_id?: string;
  message?: string;
  error?: string;
}

export function usePlanGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePlan = async (): Promise<GeneratePlanResult> => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-plan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to generate plan';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      return {
        success: true,
        plan_id: data.plan_id,
        message: data.message,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate plan';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePlan,
    isGenerating,
    error,
  };
}
