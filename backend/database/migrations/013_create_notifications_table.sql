-- Migration: Create notifications table
-- Purpose: Store user notifications for notification center
-- Date: 2025-10-18

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,  -- 'ticket', 'registration', 'invoice', 'system', 'alert'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),  -- URL to navigate when clicked (e.g., /tickets/123)
  data JSONB,  -- Additional structured data (ticket_id, customer_name, etc.)
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  priority VARCHAR(20) DEFAULT 'normal',  -- 'low', 'normal', 'high', 'urgent'
  expires_at TIMESTAMP,  -- Auto-delete old notifications after this date
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_notifications_updated_at();

-- Add comment to table
COMMENT ON TABLE notifications IS 'User notifications for notification center';
COMMENT ON COLUMN notifications.type IS 'Type of notification: ticket, registration, invoice, system, alert';
COMMENT ON COLUMN notifications.link IS 'URL path to navigate when notification is clicked';
COMMENT ON COLUMN notifications.data IS 'Additional structured data in JSON format';
COMMENT ON COLUMN notifications.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN notifications.expires_at IS 'Auto-delete notification after this timestamp';

