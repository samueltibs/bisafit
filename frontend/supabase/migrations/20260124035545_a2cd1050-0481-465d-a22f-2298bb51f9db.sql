-- Add is_read column to notifications_log for tracking read status
ALTER TABLE public.notifications_log 
ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- Add index for faster queries on unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_log_user_unread 
ON public.notifications_log (user_id, is_read, created_at DESC);

-- Allow users to update their own notifications (for marking as read)
CREATE POLICY "Users can update own notifications" 
ON public.notifications_log 
FOR UPDATE 
USING (user_id = auth.uid());