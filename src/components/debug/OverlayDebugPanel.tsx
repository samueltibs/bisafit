import { useState } from 'react';
import { Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Development-only debug panel for detecting invisible overlay blockers.
 * When enabled, applies red outlines to any fixed/absolute inset-0 elements.
 */
export const OverlayDebugPanel = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  // Only render in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const toggleDebugMode = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    
    if (newState) {
      document.body.classList.add('debug-overlays');
    } else {
      document.body.classList.remove('debug-overlays');
    }
  };

  return (
    <Button
      variant={isEnabled ? "destructive" : "outline"}
      size="icon"
      onClick={toggleDebugMode}
      className="fixed bottom-4 left-4 z-50 h-10 w-10 rounded-full shadow-lg"
      title={isEnabled ? "Disable overlay debug mode" : "Enable overlay debug mode"}
    >
      <Bug className="h-4 w-4" />
    </Button>
  );
};
