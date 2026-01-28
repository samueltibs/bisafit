import { useState, useRef, useEffect } from 'react';
import { Dumbbell, Play, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { lookupExerciseMedia, hasExerciseMedia } from '@/lib/exerciseMediaMap';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { FormTipsModal } from './FormTipsModal';

interface LargeDemoPanelProps {
  videoUrl?: string;
  imageUrl?: string;
  exerciseName: string;
  formTips?: string[];
  className?: string;
}

/**
 * Large exercise demonstration panel for normal workout mode.
 * Takes ~35-50% of screen height with 16:9 aspect ratio.
 * Matches TV Mode styling but sized for phone/laptop.
 */
export function LargeDemoPanel({
  videoUrl,
  imageUrl,
  exerciseName,
  formTips = [],
  className,
}: LargeDemoPanelProps) {
  const [mediaError, setMediaError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showFormTips, setShowFormTips] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Look up media from central map if not provided directly
  const mediaLookup = lookupExerciseMedia(exerciseName);
  
  // Priority: direct videoUrl > direct imageUrl > lookup video > lookup image
  const resolvedVideoUrl = videoUrl || mediaLookup?.video_url_optional || null;
  const resolvedImageUrl = imageUrl || mediaLookup?.image_url || null;
  const resolvedFormTips = formTips.length > 0 ? formTips : (mediaLookup?.default_cues || []);

  const hasMedia = (resolvedVideoUrl || resolvedImageUrl) && !mediaError;
  const hasFormTipsData = resolvedFormTips.length > 0;

  // Reset states when exercise changes
  useEffect(() => {
    setMediaError(false);
    setIsVideoLoaded(false);
    setIsImageLoaded(false);
  }, [resolvedVideoUrl, resolvedImageUrl, exerciseName]);

  // Handle video autoplay
  useEffect(() => {
    if (videoRef.current && resolvedVideoUrl && isVideoLoaded) {
      videoRef.current.play().catch(() => {
        // Autoplay failed silently
      });
    }
  }, [resolvedVideoUrl, isVideoLoaded]);

  const handleMediaError = () => {
    setMediaError(true);
  };

  // No media available - show subtle compact placeholder
  if (!hasMedia) {
    return (
      <div className={cn(
        "flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-muted/20",
        className
      )}>
        <Dumbbell className="h-4 w-4 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground/50">
          Form guide coming soon
        </p>
      </div>
    );
  }

  // Render the large demo panel
  return (
    <div className={cn("w-full", className)}>
      <AspectRatio ratio={16 / 9} className="w-full">
        <div className="absolute inset-0 rounded-2xl overflow-hidden bg-black/30 shadow-lg shadow-black/20 border border-white/5">
          {/* Video demo */}
          {resolvedVideoUrl && !mediaError && (
            <>
              {!isVideoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/20 z-10">
                  <Play className="h-10 w-10 text-primary/60 animate-pulse" />
                </div>
              )}
              <video
                ref={videoRef}
                src={resolvedVideoUrl}
                className={cn(
                  "w-full h-full object-contain transition-opacity duration-500",
                  isVideoLoaded ? "opacity-100" : "opacity-0"
                )}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onLoadedData={() => setIsVideoLoaded(true)}
                onError={handleMediaError}
                aria-label={`Exercise demonstration for ${exerciseName}`}
              />
            </>
          )}

          {/* Image demo (fallback if no video) */}
          {!resolvedVideoUrl && resolvedImageUrl && !mediaError && (
            <div className="w-full h-full flex items-center justify-center bg-white/5">
              {!isImageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/20 z-10">
                  <Dumbbell className="h-10 w-10 text-muted-foreground/50 animate-pulse" />
                </div>
              )}
              <img
                src={resolvedImageUrl}
                alt={`Form guide for ${exerciseName}`}
                className={cn(
                  "max-w-full max-h-full object-contain transition-opacity duration-500 p-2",
                  isImageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setIsImageLoaded(true)}
                onError={handleMediaError}
              />
            </div>
          )}

          {/* Form tips button overlay */}
          {hasFormTipsData && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-3 right-3 h-8 gap-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-sm border-white/10 text-white/90"
              onClick={() => setShowFormTips(true)}
            >
              <Info className="h-3.5 w-3.5" />
              Form Tips
            </Button>
          )}
        </div>
      </AspectRatio>

      {/* Form Tips Modal */}
      <FormTipsModal
        open={showFormTips}
        onOpenChange={setShowFormTips}
        exerciseName={exerciseName}
        tips={resolvedFormTips}
      />
    </div>
  );
}
