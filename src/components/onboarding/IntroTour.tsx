import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Play, Mic2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface IntroTourProps {
  open: boolean;
  onComplete: () => void;
}

interface Slide {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const slides: Slide[] = [
  {
    icon: <span className="text-5xl">👋</span>,
    title: 'Welcome to BisaFit',
    description: "Your personal AI-powered fitness companion. Let's take a quick tour.",
  },
  {
    icon: <Calendar className="h-12 w-12 text-primary" />,
    title: 'Your Weekly Schedule',
    description: 'Check your Plan tab to see your personalized workout schedule. Tap any day to start.',
  },
  {
    icon: <Play className="h-12 w-12 text-primary" />,
    title: 'Follow Along Workouts',
    description: "Press Start, follow the timer, and complete each exercise. We'll guide you through.",
  },
  {
    icon: <Mic2 className="h-12 w-12 text-primary" />,
    title: 'Personalize Your Coach',
    description: 'Choose your coach tone and voice in Settings. Make it feel like your own.',
  },
  {
    icon: <Settings className="h-12 w-12 text-primary" />,
    title: "You're in Control",
    description: 'Update your goals, equipment, and preferences anytime in Settings.',
  },
];

const AUTO_ADVANCE_DELAY = 8000; // 8 seconds

export function IntroTour({ open, onComplete }: IntroTourProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Reset slide when tour opens
  useEffect(() => {
    if (open) {
      setCurrentSlide(0);
      setIsPaused(false);
    }
  }, [open]);

  // Auto-advance slides
  useEffect(() => {
    if (!open || isPaused) return;

    const timer = setTimeout(() => {
      if (currentSlide < slides.length - 1) {
        setCurrentSlide((prev) => prev + 1);
      }
    }, AUTO_ADVANCE_DELAY);

    return () => clearTimeout(timer);
  }, [currentSlide, open, isPaused]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleClose = () => {
    onComplete();
  };

  // Pause auto-advance on interaction
  const handleInteraction = () => {
    setIsPaused(true);
  };

  const isLastSlide = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-background/95 backdrop-blur-sm" />
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
          onClick={handleInteraction}
        >
          {/* Close button - top left */}
          <button
            onClick={handleClose}
            className="absolute left-4 top-4 z-50 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close tour"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Skip button - top right */}
          <button
            onClick={handleSkip}
            className="absolute right-4 top-4 z-50 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip
          </button>

          {/* Slide content */}
          <div className="flex max-w-sm flex-1 flex-col items-center justify-center text-center">
            {/* Icon */}
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              {slide.icon}
            </div>

            {/* Title */}
            <h2 className="mb-3 text-2xl font-bold text-foreground">{slide.title}</h2>

            {/* Description */}
            <p className="text-base text-muted-foreground">{slide.description}</p>
          </div>

          {/* Bottom controls */}
          <div className="w-full max-w-sm space-y-6">
            {/* Progress dots */}
            <div className="flex justify-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentSlide(index);
                    handleInteraction();
                  }}
                  className={cn(
                    'h-2 w-2 rounded-full transition-all',
                    index === currentSlide
                      ? 'w-6 bg-primary'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentSlide === 0}
                className="flex-1"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>

              <Button onClick={handleNext} className="flex-1">
                {isLastSlide ? (
                  "Get Started"
                ) : (
                  <>
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
