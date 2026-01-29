import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a progress photo to the progress_photos bucket
 */
export async function uploadProgressPhoto(
  userId: string,
  file: File,
  pose: 'front' | 'side' | 'back'
): Promise<{ path: string; url: string } | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${pose}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('progress_photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Error uploading progress photo:', uploadError);
    return null;
  }

  // Get a signed URL for private bucket access
  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from('progress_photos')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (urlError) {
    console.error('Error getting signed URL:', urlError);
    return null;
  }

  return {
    path: filePath,
    url: signedUrlData.signedUrl,
  };
}

/**
 * Get a signed URL for a progress photo
 */
export async function getProgressPhotoUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('progress_photos')
    .createSignedUrl(filePath, 3600);

  if (error) {
    console.error('Error getting progress photo URL:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Delete a progress photo
 */
export async function deleteProgressPhoto(filePath: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from('progress_photos')
    .remove([filePath]);

  if (error) {
    console.error('Error deleting progress photo:', error);
    return false;
  }

  return true;
}

/**
 * Upload a health file to the health_uploads bucket
 */
export async function uploadHealthFile(
  userId: string,
  file: File
): Promise<{ path: string; url: string; fileType: string } | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('health_uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Error uploading health file:', uploadError);
    return null;
  }

  // Get a signed URL for private bucket access
  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from('health_uploads')
    .createSignedUrl(filePath, 3600);

  if (urlError) {
    console.error('Error getting signed URL:', urlError);
    return null;
  }

  return {
    path: filePath,
    url: signedUrlData.signedUrl,
    fileType: file.type,
  };
}

/**
 * Get a signed URL for a health file
 */
export async function getHealthFileUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('health_uploads')
    .createSignedUrl(filePath, 3600);

  if (error) {
    console.error('Error getting health file URL:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Delete a health file
 */
export async function deleteHealthFile(filePath: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from('health_uploads')
    .remove([filePath]);

  if (error) {
    console.error('Error deleting health file:', error);
    return false;
  }

  return true;
}

/**
 * List all progress photos for a user
 */
export async function listProgressPhotos(userId: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from('progress_photos')
    .list(userId, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('Error listing progress photos:', error);
    return [];
  }

  return data?.map((file) => `${userId}/${file.name}`) || [];
}

/**
 * List all health uploads for a user
 */
export async function listHealthUploads(userId: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from('health_uploads')
    .list(userId, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('Error listing health uploads:', error);
    return [];
  }

  return data?.map((file) => `${userId}/${file.name}`) || [];
}
