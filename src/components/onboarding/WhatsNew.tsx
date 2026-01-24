import { useEffect, useState } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { APP_VERSION } from '@/lib/branding';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/appStorage';

interface WhatsNewProps {
  onDismiss?: () => void;
}

interface ReleaseNote {
  version: string;
  items: string[];
}

// Define release notes for each version
// Only add entries when there are user-visible changes
const releaseNotes: ReleaseNote[] = [
  {
    version: '1.0.0',
    items: [
      'AI-powered personalized workout plans',
      'Voice-guided workout timer with coach cues',
      'Nutrition tracking and meal planning',
      'Progress tracking with photos and stats',
    ],
  },
  // Add new versions here as they're released
  // {
  //   version: '1.1.0',
  //   items: [
  //     'New feature description',
  //     'Improved feature description',
  //   ],
  // },
];

function getCurrentReleaseNotes(): ReleaseNote | null {
  return releaseNotes.find((note) => note.version === APP_VERSION) || null;
}

export function WhatsNew({ onDismiss }: WhatsNewProps) {
  const [open, setOpen] = useState(false);
  const currentNotes = getCurrentReleaseNotes();

  useEffect(() => {
    // Check if we should show the popup
    const lastSeenVersion = getStorageItem<string>(STORAGE_KEYS.LAST_SEEN_VERSION, '');
    
    // Only show if:
    // 1. Version is different from last seen
    // 2. There are release notes for the current version
    if (lastSeenVersion !== APP_VERSION && currentNotes) {
      setOpen(true);
    }
  }, [currentNotes]);

  const handleDismiss = () => {
    // Mark this version as seen
    setStorageItem(STORAGE_KEYS.LAST_SEEN_VERSION, APP_VERSION);
    setOpen(false);
    onDismiss?.();
  };

  // Don't render if no notes for current version
  if (!currentNotes) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleDismiss()}>
      <DialogPortal>
        <DialogOverlay className="bg-background/80 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="relative w-full max-w-sm rounded-[20px] border border-border/50 bg-card p-6 shadow-card-lg">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">What's New</h2>
              <p className="mt-1 text-sm text-muted-foreground">Version {currentNotes.version}</p>
            </div>

            {/* Release notes list */}
            <ul className="mb-6 space-y-3">
              {currentNotes.items.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{item}</span>
                </li>
              ))}
            </ul>

            {/* Action button */}
            <Button onClick={handleDismiss} className="w-full">
              Got it
            </Button>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
