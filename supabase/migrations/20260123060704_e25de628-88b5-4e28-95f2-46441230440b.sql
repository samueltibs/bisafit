-- Create public storage bucket for exercise media
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise_media', 'exercise_media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to exercise media
CREATE POLICY "Exercise media is publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'exercise_media');

-- Allow authenticated users to upload (for admin purposes)
CREATE POLICY "Authenticated users can upload exercise media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'exercise_media' AND auth.role() = 'authenticated');