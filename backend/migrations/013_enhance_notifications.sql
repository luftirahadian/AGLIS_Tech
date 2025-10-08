-- Enhance existing notifications table for real-time system
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS data JSONB,
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Update existing columns to match new schema
ALTER TABLE notifications 
ALTER COLUMN title TYPE VARCHAR(255),
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
ALTER COLUMN read_at TYPE TIMESTAMP WITH TIME ZONE;

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_archived ON notifications(is_archived);
CREATE INDEX IF NOT EXISTS idx_notifications_data ON notifications USING GIN(data);

-- Create notification settings table if not exists
CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sound_notifications BOOLEAN DEFAULT TRUE,
    notification_types JSONB DEFAULT '{}',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for notification settings
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- Insert default notification settings for existing users
INSERT INTO notification_settings (user_id, notification_types)
SELECT id, '{
    "ticket_assigned": true,
    "ticket_updated": true,
    "ticket_completed": true,
    "system_alert": true,
    "technician_status": true,
    "new_ticket": true
}'::jsonb
FROM users
ON CONFLICT (user_id) DO NOTHING;
