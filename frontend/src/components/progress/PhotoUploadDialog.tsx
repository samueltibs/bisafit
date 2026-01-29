/**
 * Photo Upload Dialog
 * 
 * Modal for capturing/uploading progress photos with optional notes.
 * Supports both camera capture (on mobile) and file selection.
 */

import { useState, useRef, ChangeEvent } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PhotoUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File, notes?: string) => Promise<boolean>;
  uploading: boolean;
}

export function PhotoUploadDialog({
  open,
  onClose,
  onUpload,
  uploading,
}: PhotoUploadDialogProps) {
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const success = await onUpload(selectedFile, notes);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setNotes('');
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onClose();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Progress Photo</DialogTitle>
          <DialogDescription>
            Take or upload a photo to track your fitness journey
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview or Upload Options */}
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                  setSelectedFile(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Camera Button */}
              <button
                onClick={handleCameraClick}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Camera className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">Take Photo</span>
              </button>

              {/* Gallery Button */}
              <button
                onClick={handleGalleryClick}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">Upload Photo</span>
              </button>
            </div>
          )}

          {/* Notes Input */}
          {selectedFile && (
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this photo..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={uploading}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Photo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
