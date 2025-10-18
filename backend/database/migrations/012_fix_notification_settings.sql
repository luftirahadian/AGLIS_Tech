-- ===============================================
-- Fix Notification Settings Missing Data
-- Add desktop_notifications column and create default settings
-- ===============================================

-- Add desktop_notifications column if missing
ALTER TABLE notification_settings 
ADD COLUMN IF NOT EXISTS desktop_notifications BOOLEAN DEFAULT TRUE;

-- Create default settings for all existing users
INSERT INTO notification_settings (user_id, email_notifications, push_notifications, sound_notifications, desktop_notifications, whatsapp_notifications, notification_types)
SELECT 
  u.id,
  TRUE,
  TRUE, 
  TRUE,
  TRUE,
  TRUE,
  '{
    "ticket_assigned": true,
    "ticket_updated": true,
    "ticket_completed": true,
    "system_alert": true,
    "technician_status": true,
    "new_ticket": true,
    "new_registration": true,
    "payment_received": true,
    "sla_warning": true
  }'::jsonb
FROM users u
WHERE u.id NOT IN (SELECT user_id FROM notification_settings);

-- Update existing settings to include desktop_notifications if NULL
UPDATE notification_settings 
SET desktop_notifications = TRUE 
WHERE desktop_notifications IS NULL;

-- Verify the fix
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN desktop_notifications IS NOT NULL THEN 1 END) as with_desktop_settings
FROM notification_settings;
