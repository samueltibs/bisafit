import { useState, useRef, useEffect } from 'react';
import { Dumbbell, Play, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExerciseMediaProps {
  videoUrl?: string;
  imageUrl?: string;
  exerciseName: string;
  bigMode?: boolean;
  className?: string;
}

export function ExerciseMedia({
  videoUrl,
  imageUrl,
  exerciseName,
  bigMode = false,
  className,
}: ExerciseMediaProps) {
  const [mediaError, setMediaError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasMedia = (videoUrl || imageUrl) && !mediaError;

  // Reset error state when URLs change
  useEffect(() => {
    setMediaError(false);
    setIsVideoLoaded(false);
  }, [videoUrl, imageUrl]);

  // Handle video autoplay on mount
  useEffect(() => {
    if (videoRef.current && videoUrl && isVideoLoaded) {
      videoRef.current.play().catch(() => {
        // Autoplay failed, that's okay
      });
    }
  }, [videoUrl, isVideoLoaded]);

  const handleMediaError = () => {
    setMediaError(true);
  };

  // No media available - show placeholder
  if (!hasMedia) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl bg-muted/50 border border-dashed border-muted-foreground/30",
          bigMode ? "p-6 gap-3" : "p-4 gap-2",
          className
        )}
      >
        <Dumbbell className={cn(
          "text-muted-foreground/50",
          bigMode ? "h-12 w-12" : "h-8 w-8"
        )} />
        <p className={cn(
          "text-muted-foreground/70 text-center",
          bigMode ? "text-base" : "text-xs"
        )}>
          Form guide coming soon
        </p>
      </div>
    );
  }

  // Video available
  if (videoUrl && !mediaError) {
    return (
      <div className={cn(
        "relative rounded-xl overflow-hidden bg-muted",
        className
      )}>
        {!isVideoLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Play className="h-8 w-8 text-muted-foreground/50 animate-pulse" />
          </div>
        )}
        <video
          ref={videoRef}
          src={videoUrl}
          className={cn(
            "w-full object-cover transition-opacity",
            bigMode ? "h-48" : "h-32",
            isVideoLoaded ? "opacity-100" : "opacity-0"
          )}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setIsVideoLoaded(true)}
          onError={handleMediaError}
          aria-label={`Exercise demonstration for ${exerciseName}`}
        />
      </div>
    );
  }

  // Image available
  if (imageUrl && !mediaError) {
    return (
      <div className={cn(
        "relative rounded-xl overflow-hidden bg-muted",
        className
      )}>
        <img
          src={imageUrl}
          alt={`Form guide for ${exerciseName}`}
          className={cn(
            "w-full object-cover",
            bigMode ? "h-48" : "h-32"
          )}
          loading="lazy"
          onError={handleMediaError}
        />
      </div>
    );
  }

  return null;
}
