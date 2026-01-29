/**
 * Progress Photos Hook
 * 
 * Manages progress photo uploads, storage, and retrieval.
 * Photos are stored in Supabase Storage and metadata in database.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_url: string; // Will store base64 here
  entry_date: string; // Date string (YYYY-MM-DD)
  pose?: string | null; // Using this for notes
  created_at: string | null;
}

interface UseProgressPhotosReturn {
  photos: ProgressPhoto[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  uploadPhoto: (file: File, notes?: string) => Promise<boolean>;
  deletePhoto: (photoId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useProgressPhotos(): UseProgressPhotosReturn {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's progress photos
  const fetchPhotos = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (fetchError) throw fetchError;

      setPhotos(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load photos';
      setError(message);
      console.error('Error fetching progress photos:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Upload a new progress photo
  const uploadPhoto = async (file: File, notes?: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to upload photos');
      return false;
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return false;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return false;
    }

    setUploading(true);
    setError(null);

    try {
      // Convert image to base64 for storage
      const base64 = await fileToBase64(file);
      
      // Save to database with base64 in photo_url field
      const { data: photoData, error: dbError } = await supabase
        .from('progress_photos')
        .insert({
          user_id: user.id,
          photo_url: base64, // Store base64 directly in photo_url
          entry_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          pose: notes || null, // Use pose field for notes
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Add to local state immediately
      setPhotos(prev => [photoData, ...prev]);

      toast.success('Photo uploaded successfully!');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload photo';
      setError(message);
      toast.error(message);
      console.error('Error uploading photo:', err);
      return false;
    } finally {
      setUploading(false);
    }
  };

  // Delete a progress photo
  const deletePhoto = async (photoId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const photo = photos.find(p => p.id === photoId);
      if (!photo) return false;

      // Delete from database
      const { error: dbError } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', photoId)
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      // Remove from local state
      setPhotos(prev => prev.filter(p => p.id !== photoId));

      toast.success('Photo deleted');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete photo';
      setError(message);
      toast.error(message);
      console.error('Error deleting photo:', err);
      return false;
    }
  };

  return {
    photos,
    loading,
    uploading,
    error,
    uploadPhoto,
    deletePhoto,
    refetch: fetchPhotos,
  };
}

/**
 * Convert a File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
}
