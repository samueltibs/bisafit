import { useState, useRef, useEffect } from 'react';
import { Dumbbell, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { lookupExerciseMedia } from '@/lib/exerciseMediaMap';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface TVModeMediaProps {
  videoUrl?: string;
  imageUrl?: string;
  exerciseName: string;
  className?: string;
}

/**
 * Large-scale exercise media for TV Mode.
 * Occupies ~40-50% of screen height with 16:9 aspect ratio.
 * Designed to be clearly visible from 8-12 feet away.
 */
export function TVModeMedia({
  videoUrl,
  imageUrl,
  exerciseName,
  className,
}: TVModeMediaProps) {
  const [mediaError, setMediaError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Look up media from central map if not provided directly
  const mediaLookup = lookupExerciseMedia(exerciseName);
  
  // Priority: direct videoUrl > direct imageUrl > lookup video > lookup image
  const resolvedVideoUrl = videoUrl || mediaLookup?.video_url_optional || null;
  const resolvedImageUrl = imageUrl || mediaLookup?.image_url || null;

  const hasMedia = (resolvedVideoUrl || resolvedImageUrl) && !mediaError;

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

  // Fallback placeholder - text-only mode
  if (!hasMedia) {
    return (
      <div className={cn(
        "w-full flex items-center justify-center",
        className
      )}>
        <AspectRatio ratio={16 / 9} className="w-full max-w-4xl">
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-muted/20 border-2 border-dashed border-muted-foreground/20">
            <Dumbbell className="h-24 w-24 text-muted-foreground/30 mb-4" />
            <p className="text-2xl text-muted-foreground/50 font-medium">
              {exerciseName}
            </p>
            <p className="text-lg text-muted-foreground/30 mt-2">
              Visual guide unavailable
            </p>
          </div>
        </AspectRatio>
      </div>
    );
  }

  // Video available - primary choice
  if (resolvedVideoUrl && !mediaError) {
    return (
      <div className={cn(
        "w-full flex items-center justify-center",
        className
      )}>
        <AspectRatio ratio={16 / 9} className="w-full max-w-4xl">
          <div className="absolute inset-0 rounded-3xl overflow-hidden bg-black/50 shadow-2xl shadow-black/50">
            {/* Loading state */}
            {!isVideoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20 z-10">
                <div className="flex flex-col items-center gap-4">
                  <Play className="h-16 w-16 text-primary/60 animate-pulse" />
                  <p className="text-lg text-muted-foreground">Loading demo...</p>
                </div>
              </div>
            )}
            
            {/* Video element */}
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
          </div>
        </AspectRatio>
      </div>
    );
  }

  // Image available - fallback
  if (resolvedImageUrl && !mediaError) {
    return (
      <div className={cn(
        "w-full flex items-center justify-center",
        className
      )}>
        <AspectRatio ratio={16 / 9} className="w-full max-w-4xl">
          <div className="absolute inset-0 rounded-3xl overflow-hidden bg-white/5 shadow-2xl shadow-black/50 flex items-center justify-center">
            {/* Loading state */}
            {!isImageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20 z-10">
                <Dumbbell className="h-16 w-16 text-muted-foreground/50 animate-pulse" />
              </div>
            )}
            
            {/* Image element - contained to preserve aspect ratio */}
            <img
              src={resolvedImageUrl}
              alt={`Form guide for ${exerciseName}`}
              className={cn(
                "max-w-full max-h-full object-contain transition-opacity duration-500 p-4",
                isImageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setIsImageLoaded(true)}
              onError={handleMediaError}
            />
          </div>
        </AspectRatio>
      </div>
    );
  }

  return null;
}
