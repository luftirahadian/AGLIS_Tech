-- ===============================================
-- Fix Notification Settings Advanced Missing Column
-- Add whatsapp_notifications column to notification_settings_advanced table
-- ===============================================

-- Add whatsapp_notifications column if missing
ALTER TABLE notification_settings_advanced 
ADD COLUMN IF NOT EXISTS whatsapp_notifications BOOLEAN DEFAULT TRUE;

-- Update existing records to enable whatsapp notifications by default
UPDATE notification_settings_advanced 
SET whatsapp_notifications = TRUE 
WHERE whatsapp_notifications IS NULL;

-- Create default settings for all existing users who don't have advanced settings
INSERT INTO notification_settings_advanced (
  user_id, web_notifications, mobile_push, email_notifications, 
  sms_notifications, whatsapp_notifications, quiet_hours_enabled,
  show_low_priority, show_normal_priority, show_high_priority, show_urgent_priority
) 
SELECT 
  u.id, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE
FROM users u 
WHERE u.id NOT IN (SELECT user_id FROM notification_settings_advanced);

-- Verify the fix
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN whatsapp_notifications IS NOT NULL THEN 1 END) as with_whatsapp_settings,
  COUNT(CASE WHEN web_notifications = TRUE THEN 1 END) as web_enabled,
  COUNT(CASE WHEN mobile_push = TRUE THEN 1 END) as mobile_enabled,
  COUNT(CASE WHEN email_notifications = TRUE THEN 1 END) as email_enabled
FROM notification_settings_advanced;
