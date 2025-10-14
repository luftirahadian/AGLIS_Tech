-- ═══════════════════════════════════════════════════════════════
-- 🔔 NOTIFICATION SYSTEM - ADVANCED FEATURES
-- ═══════════════════════════════════════════════════════════════
-- Migration: 039_notification_advanced_features.sql
-- Description: Add mobile push, templates, analytics, and advanced settings
-- Date: 2025-10-14
-- ═══════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📱 MOBILE PUSH NOTIFICATIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Device tokens table for push notifications
CREATE TABLE IF NOT EXISTS user_devices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_token VARCHAR(500) NOT NULL UNIQUE,
  device_type VARCHAR(50) NOT NULL, -- 'android', 'ios', 'web'
  device_name VARCHAR(255),
  device_model VARCHAR(255),
  os_version VARCHAR(100),
  app_version VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_active ON user_devices(is_active, user_id);
CREATE INDEX idx_user_devices_token ON user_devices(device_token);

COMMENT ON TABLE user_devices IS 'Stores device tokens for push notifications';
COMMENT ON COLUMN user_devices.device_token IS 'FCM/APNs device token';
COMMENT ON COLUMN user_devices.device_type IS 'Type: android, ios, or web';

-- Push notification delivery tracking
CREATE TABLE IF NOT EXISTS notification_push_log (
  id SERIAL PRIMARY KEY,
  notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  device_id INTEGER NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- 'pending', 'sent', 'delivered', 'failed', 'clicked'
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  clicked_at TIMESTAMP,
  error_message TEXT,
  fcm_message_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_push_log_notification ON notification_push_log(notification_id);
CREATE INDEX idx_notification_push_log_device ON notification_push_log(device_id);
CREATE INDEX idx_notification_push_log_status ON notification_push_log(status);

COMMENT ON TABLE notification_push_log IS 'Tracks push notification delivery status';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔔 NOTIFICATION TEMPLATES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Notification templates for consistent messaging
CREATE TABLE IF NOT EXISTS notification_templates (
  id SERIAL PRIMARY KEY,
  template_code VARCHAR(100) NOT NULL UNIQUE,
  template_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'ticket', 'customer', 'system', 'marketing', etc.
  type VARCHAR(100) NOT NULL, -- Same as notifications.type
  priority VARCHAR(50) DEFAULT 'normal',
  
  -- Template content with variables
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  
  -- Template variables (JSON array of variable names)
  variables JSONB DEFAULT '[]'::jsonb,
  
  -- Example data for preview
  example_data JSONB,
  
  -- Channels where this template can be used
  channels JSONB DEFAULT '["web", "mobile", "email"]'::jsonb,
  
  -- Metadata
  icon VARCHAR(100),
  color VARCHAR(50),
  action_url_template VARCHAR(500),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_templates_code ON notification_templates(template_code);
CREATE INDEX idx_notification_templates_type ON notification_templates(type);
CREATE INDEX idx_notification_templates_category ON notification_templates(category);
CREATE INDEX idx_notification_templates_active ON notification_templates(is_active);

COMMENT ON TABLE notification_templates IS 'Reusable notification templates with variable substitution';
COMMENT ON COLUMN notification_templates.title_template IS 'Title with {{variable}} placeholders';
COMMENT ON COLUMN notification_templates.message_template IS 'Message with {{variable}} placeholders';
COMMENT ON COLUMN notification_templates.variables IS 'Array of variable names used in templates';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📊 NOTIFICATION ANALYTICS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Notification engagement tracking
CREATE TABLE IF NOT EXISTS notification_analytics (
  id SERIAL PRIMARY KEY,
  notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Engagement events
  viewed_at TIMESTAMP,
  read_at TIMESTAMP,
  clicked_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  archived_at TIMESTAMP,
  deleted_at TIMESTAMP,
  
  -- Time to engage (in seconds)
  time_to_view INTEGER,
  time_to_read INTEGER,
  time_to_click INTEGER,
  
  -- Device and channel info
  device_type VARCHAR(50), -- 'web', 'mobile', 'desktop'
  browser VARCHAR(100),
  os VARCHAR(100),
  channel VARCHAR(50), -- 'web_push', 'mobile_push', 'in_app'
  
  -- Location (if available)
  ip_address VARCHAR(50),
  country VARCHAR(100),
  city VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_analytics_notification ON notification_analytics(notification_id);
CREATE INDEX idx_notification_analytics_user ON notification_analytics(user_id);
CREATE INDEX idx_notification_analytics_viewed ON notification_analytics(viewed_at);
CREATE INDEX idx_notification_analytics_read ON notification_analytics(read_at);
CREATE INDEX idx_notification_analytics_clicked ON notification_analytics(clicked_at);

COMMENT ON TABLE notification_analytics IS 'Tracks user engagement with notifications';

-- Aggregate analytics for reporting
CREATE TABLE IF NOT EXISTS notification_analytics_summary (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  type VARCHAR(100),
  priority VARCHAR(50),
  
  -- Delivery metrics
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  
  -- Engagement metrics
  total_viewed INTEGER DEFAULT 0,
  total_read INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_dismissed INTEGER DEFAULT 0,
  total_archived INTEGER DEFAULT 0,
  total_deleted INTEGER DEFAULT 0,
  
  -- Rates (calculated)
  delivery_rate DECIMAL(5,2),
  view_rate DECIMAL(5,2),
  read_rate DECIMAL(5,2),
  click_rate DECIMAL(5,2),
  
  -- Average times (in seconds)
  avg_time_to_view INTEGER,
  avg_time_to_read INTEGER,
  avg_time_to_click INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(date, type, priority)
);

CREATE INDEX idx_notification_analytics_summary_date ON notification_analytics_summary(date);
CREATE INDEX idx_notification_analytics_summary_type ON notification_analytics_summary(type);

COMMENT ON TABLE notification_analytics_summary IS 'Daily aggregated notification analytics';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ⚙️ ADVANCED NOTIFICATION SETTINGS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Enhanced notification settings with granular control
CREATE TABLE IF NOT EXISTS notification_settings_advanced (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Channel preferences
  web_notifications BOOLEAN DEFAULT true,
  mobile_push BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(100) DEFAULT 'Asia/Jakarta',
  
  -- Do not disturb
  dnd_enabled BOOLEAN DEFAULT false,
  dnd_until TIMESTAMP,
  
  -- Notification batching
  batch_notifications BOOLEAN DEFAULT false,
  batch_interval INTEGER DEFAULT 60, -- minutes
  
  -- Priority filtering
  show_low_priority BOOLEAN DEFAULT true,
  show_normal_priority BOOLEAN DEFAULT true,
  show_high_priority BOOLEAN DEFAULT true,
  show_urgent_priority BOOLEAN DEFAULT true,
  
  -- Type-specific settings (JSONB for flexibility)
  type_settings JSONB DEFAULT '{}'::jsonb,
  -- Example: {"new_ticket": {"enabled": true, "channels": ["web", "mobile"]}}
  
  -- Notification grouping
  group_by_type BOOLEAN DEFAULT true,
  group_by_priority BOOLEAN DEFAULT false,
  
  -- Auto-cleanup
  auto_archive_after_days INTEGER DEFAULT 30,
  auto_delete_after_days INTEGER DEFAULT 90,
  
  -- Digest settings
  daily_digest BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT false,
  digest_time TIME DEFAULT '08:00:00',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_settings_advanced_user ON notification_settings_advanced(user_id);

COMMENT ON TABLE notification_settings_advanced IS 'Advanced notification preferences per user';
COMMENT ON COLUMN notification_settings_advanced.type_settings IS 'JSON object with per-type notification settings';

-- Notification schedules (for scheduled notifications)
CREATE TABLE IF NOT EXISTS notification_schedules (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES notification_templates(id) ON DELETE SET NULL,
  
  -- Schedule details
  schedule_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Target audience
  target_type VARCHAR(50) NOT NULL, -- 'all_users', 'specific_users', 'role', 'department'
  target_criteria JSONB, -- Flexible targeting criteria
  
  -- Template data
  template_data JSONB,
  
  -- Schedule timing
  schedule_type VARCHAR(50) NOT NULL, -- 'once', 'recurring', 'cron'
  scheduled_at TIMESTAMP,
  cron_expression VARCHAR(100),
  timezone VARCHAR(100) DEFAULT 'Asia/Jakarta',
  
  -- Recurrence (if recurring)
  recurrence_rule VARCHAR(255), -- 'daily', 'weekly', 'monthly', etc.
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed', 'cancelled'
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  
  -- Stats
  total_runs INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  
  -- Audit
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_schedules_next_run ON notification_schedules(next_run_at, status);
CREATE INDEX idx_notification_schedules_status ON notification_schedules(status);

COMMENT ON TABLE notification_schedules IS 'Scheduled notification campaigns';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🎯 SEED DEFAULT TEMPLATES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO notification_templates (template_code, template_name, description, category, type, priority, title_template, message_template, variables, example_data, icon, color) VALUES

-- Ticket Templates
('TICKET_ASSIGNED', 'Tiket Ditugaskan', 'Notifikasi ketika tiket ditugaskan ke teknisi', 'ticket', 'ticket_assigned', 'high',
 'Tiket Baru #{{ticket_number}}',
 'Anda mendapat tiket baru {{ticket_type}} untuk {{customer_name}} di {{location}}',
 '["ticket_number", "ticket_type", "customer_name", "location"]',
 '{"ticket_number": "TK-001", "ticket_type": "instalasi", "customer_name": "John Doe", "location": "Jakarta"}',
 'clipboard', 'blue'),

('TICKET_UPDATED', 'Status Tiket Diperbarui', 'Notifikasi ketika status tiket berubah', 'ticket', 'ticket_updated', 'normal',
 'Tiket #{{ticket_number}} Diperbarui',
 'Status tiket berubah dari {{old_status}} ke {{new_status}}',
 '["ticket_number", "old_status", "new_status"]',
 '{"ticket_number": "TK-001", "old_status": "pending", "new_status": "in_progress"}',
 'refresh', 'yellow'),

('TICKET_COMPLETED', 'Tiket Selesai', 'Notifikasi ketika tiket diselesaikan', 'ticket', 'ticket_completed', 'normal',
 'Tiket #{{ticket_number}} Selesai',
 'Tiket {{ticket_type}} telah berhasil diselesaikan. Rating: {{rating}} ⭐',
 '["ticket_number", "ticket_type", "rating"]',
 '{"ticket_number": "TK-001", "ticket_type": "instalasi", "rating": "5"}',
 'check-circle', 'green'),

-- Customer Templates
('NEW_REGISTRATION', 'Pendaftaran Customer Baru', 'Notifikasi registrasi customer baru', 'customer', 'new_registration', 'normal',
 'Pendaftaran Customer Baru',
 '{{customer_name}} telah mendaftar sebagai customer baru. Nomor registrasi: {{registration_number}}',
 '["customer_name", "registration_number"]',
 '{"customer_name": "John Doe", "registration_number": "REG-20251014-001"}',
 'user-plus', 'blue'),

('CUSTOMER_ACTIVATED', 'Customer Diaktifkan', 'Notifikasi ketika customer diaktifkan', 'customer', 'customer_status', 'normal',
 'Customer Diaktifkan',
 'Customer {{customer_name}} dengan paket {{package_name}} telah diaktifkan',
 '["customer_name", "package_name"]',
 '{"customer_name": "John Doe", "package_name": "Premium 50Mbps"}',
 'check-circle', 'green'),

-- System Templates
('SYSTEM_ALERT', 'Peringatan Sistem', 'Notifikasi peringatan sistem', 'system', 'system_alert', 'urgent',
 'Peringatan Sistem: {{alert_type}}',
 '{{alert_message}}',
 '["alert_type", "alert_message"]',
 '{"alert_type": "Performance", "alert_message": "Server load tinggi, segera periksa"}',
 'alert-triangle', 'red'),

('SYSTEM_MAINTENANCE', 'Maintenance Terjadwal', 'Notifikasi maintenance sistem', 'system', 'system_maintenance', 'high',
 'Maintenance Sistem',
 'Sistem akan menjalani maintenance pada {{maintenance_date}} pukul {{maintenance_time}}. Durasi estimasi: {{duration}}',
 '["maintenance_date", "maintenance_time", "duration"]',
 '{"maintenance_date": "15 Oktober 2025", "maintenance_time": "02:00 WIB", "duration": "2 jam"}',
 'tool', 'orange'),

-- Technician Templates
('TECHNICIAN_STATUS', 'Status Teknisi', 'Notifikasi perubahan status teknisi', 'technician', 'technician_status', 'normal',
 'Status Teknisi Diperbarui',
 'Teknisi {{technician_name}} sekarang {{status}}',
 '["technician_name", "status"]',
 '{"technician_name": "Ahmad", "status": "tersedia"}',
 'user-check', 'green'),

-- Payment Templates
('PAYMENT_RECEIVED', 'Pembayaran Diterima', 'Notifikasi pembayaran customer', 'payment', 'payment_received', 'normal',
 'Pembayaran Diterima',
 'Pembayaran sebesar {{amount}} dari {{customer_name}} untuk periode {{period}} telah diterima',
 '["amount", "customer_name", "period"]',
 '{"amount": "Rp 500.000", "customer_name": "John Doe", "period": "November 2025"}',
 'dollar-sign', 'green'),

('PAYMENT_DUE', 'Tagihan Jatuh Tempo', 'Notifikasi tagihan mendekati jatuh tempo', 'payment', 'payment_due', 'high',
 'Tagihan Jatuh Tempo',
 'Customer {{customer_name}} memiliki tagihan sebesar {{amount}} yang jatuh tempo pada {{due_date}}',
 '["customer_name", "amount", "due_date"]',
 '{"customer_name": "John Doe", "amount": "Rp 500.000", "due_date": "20 Oktober 2025"}',
 'alert-circle', 'red')

ON CONFLICT (template_code) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔄 UPDATE EXISTING NOTIFICATIONS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Add template reference to notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS template_id INTEGER REFERENCES notification_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS template_data JSONB;

CREATE INDEX IF NOT EXISTS idx_notifications_template ON notifications(template_id);

COMMENT ON COLUMN notifications.template_id IS 'Reference to notification template used';
COMMENT ON COLUMN notifications.template_data IS 'Data used to render the template';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔄 TRIGGERS AND FUNCTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_user_devices_timestamp
  BEFORE UPDATE ON user_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_timestamp();

CREATE TRIGGER update_notification_templates_timestamp
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_timestamp();

CREATE TRIGGER update_notification_settings_advanced_timestamp
  BEFORE UPDATE ON notification_settings_advanced
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_timestamp();

CREATE TRIGGER update_notification_schedules_timestamp
  BEFORE UPDATE ON notification_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_timestamp();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ MIGRATION COMPLETE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Analyze tables for query optimization
ANALYZE user_devices;
ANALYZE notification_push_log;
ANALYZE notification_templates;
ANALYZE notification_analytics;
ANALYZE notification_analytics_summary;
ANALYZE notification_settings_advanced;
ANALYZE notification_schedules;

-- Summary
DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ NOTIFICATION ADVANCED FEATURES MIGRATION COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '📱 Mobile Push: user_devices, notification_push_log';
  RAISE NOTICE '🔔 Templates: notification_templates (% default templates)', (SELECT COUNT(*) FROM notification_templates);
  RAISE NOTICE '📊 Analytics: notification_analytics, notification_analytics_summary';
  RAISE NOTICE '⚙️  Settings: notification_settings_advanced, notification_schedules';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

