/**
 * Progress Photos Grid
 * 
 * Displays user's progress photos in a grid with comparison slider.
 */

import { useState } from 'react';
import { Camera, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { ProgressPhoto } from '@/hooks/useProgressPhotos';

interface ProgressPhotosGridProps {
  photos: ProgressPhoto[];
  loading: boolean;
  onDelete: (photoId: string) => Promise<boolean>;
  onAddPhoto: () => void;
}

export function ProgressPhotosGrid({
  photos,
  loading,
  onDelete,
  onAddPhoto,
}: ProgressPhotosGridProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleDeleteClick = (photoId: string) => {
    setPhotoToDelete(photoId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (photoToDelete) {
      await onDelete(photoToDelete);
      setDeleteDialogOpen(false);
      setPhotoToDelete(null);
      // Adjust selected index if needed
      if (selectedIndex >= photos.length - 1 && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Camera className="h-10 w-10 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">No Progress Photos Yet</p>
          <p className="text-sm text-muted-foreground">
            Start tracking your journey with progress photos
          </p>
        </div>
        <Button onClick={onAddPhoto} className="gap-2">
          <Camera className="h-4 w-4" />
          Add First Photo
        </Button>
      </div>
    );
  }

  // Get photos to display (current and up to 2 more)
  const displayPhotos = photos.slice(selectedIndex, selectedIndex + 3);
  const canGoPrevious = selectedIndex > 0;
  const canGoNext = selectedIndex < photos.length - 1;

  return (
    <div className="space-y-4">
      {/* Photo Carousel */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          className="flex-shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex gap-2 overflow-hidden flex-1 justify-center">
          {displayPhotos.map((photo, index) => {
            const actualIndex = selectedIndex + index;
            const isSelected = actualIndex === selectedIndex;

            return (
              <div
                key={photo.id}
                className={cn(
                  "relative flex-shrink-0 rounded-xl border-2 transition-all overflow-hidden group",
                  isSelected
                    ? "border-primary w-32 h-44"
                    : "border-border w-24 h-36 opacity-60"
                )}
              >
                {photo.photo_base64 ? (
                  <>
                    <img
                      src={photo.photo_base64}
                      alt={`Progress ${format(new Date(photo.taken_at), 'MMM d, yyyy')}`}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-2 space-y-1">
                          <p className="text-xs font-medium text-white">
                            {format(new Date(photo.taken_at), 'MMM d, yyyy')}
                          </p>
                          {photo.notes && (
                            <p className="text-xs text-white/80 line-clamp-2">
                              {photo.notes}
                            </p>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full mt-1"
                            onClick={() => handleDeleteClick(photo.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-muted">
                    <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">No image</p>
                  </div>
                )}
                
                {!isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                    <p className="text-xs font-medium text-white text-center">
                      {format(new Date(photo.taken_at), 'MMM d')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          disabled={!canGoNext}
          className="flex-shrink-0"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Photo Count */}
      <p className="text-center text-sm text-muted-foreground">
        {selectedIndex + 1} of {photos.length} photos
      </p>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Progress Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this progress photo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
