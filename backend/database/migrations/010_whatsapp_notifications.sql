-- Migration: WhatsApp Notification Integration
-- Created: 2025-10-15
-- Purpose: Add WhatsApp notification support to the system

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. Update notification_settings to include WhatsApp
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE notification_settings 
ADD COLUMN IF NOT EXISTS whatsapp_notifications BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN notification_settings.whatsapp_notifications IS 'Enable/disable WhatsApp notifications for user';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. Create WhatsApp Groups Master Data Table
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS whatsapp_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('technicians', 'supervisors', 'managers', 'noc', 'customer_service', 'all')),
  work_zone VARCHAR(50), -- 'karawang', 'bekasi', 'cikampek', 'purwakarta', 'subang', 'bandung', NULL for all zones
  
  -- WhatsApp Group Details
  group_chat_id VARCHAR(255), -- WhatsApp Group Chat ID (from provider)
  phone_number VARCHAR(20), -- Group phone number (if applicable)
  
  -- Notification Settings
  notification_types JSONB DEFAULT '[]', -- Array of notification types this group receives
  priority_filter VARCHAR(20), -- Only send notifications with this priority or higher ('normal', 'high', 'urgent')
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE, -- Whether group is verified/tested
  
  -- Metadata
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_category ON whatsapp_groups(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_work_zone ON whatsapp_groups(work_zone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_is_active ON whatsapp_groups(is_active);

COMMENT ON TABLE whatsapp_groups IS 'Master data for WhatsApp groups used for team notifications';
COMMENT ON COLUMN whatsapp_groups.notification_types IS 'JSON array of notification types: ["ticket_assigned", "sla_warning", "daily_summary"]';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. Create WhatsApp Notification Delivery Log
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS whatsapp_notifications (
  id SERIAL PRIMARY KEY,
  
  -- Reference
  notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  group_id INTEGER REFERENCES whatsapp_groups(id),
  
  -- Recipient
  recipient_type VARCHAR(20) CHECK (recipient_type IN ('individual', 'group')),
  phone_number VARCHAR(20) NOT NULL,
  
  -- Message
  message TEXT NOT NULL,
  template_name VARCHAR(100), -- If using template
  
  -- Delivery Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  provider VARCHAR(50), -- 'fonnte', 'wablas', 'woowa'
  provider_message_id VARCHAR(255), -- ID from provider
  provider_response JSONB, -- Full response from provider
  
  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  failed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_notification_id ON whatsapp_notifications(notification_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_user_id ON whatsapp_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_group_id ON whatsapp_notifications(group_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_status ON whatsapp_notifications(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_sent_at ON whatsapp_notifications(sent_at);

COMMENT ON TABLE whatsapp_notifications IS 'Delivery log for WhatsApp notifications';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. Create Notification Routing Rules
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS notification_routing_rules (
  id SERIAL PRIMARY KEY,
  
  -- Rule Definition
  notification_type VARCHAR(50) NOT NULL, -- 'ticket_assigned', 'sla_warning', etc.
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Routing
  send_to_individual BOOLEAN DEFAULT TRUE, -- Send to user's personal WhatsApp
  send_to_groups BOOLEAN DEFAULT FALSE, -- Send to WhatsApp groups
  target_groups INTEGER[], -- Array of whatsapp_groups.id
  
  -- Conditions
  conditions JSONB, -- When to trigger: {"priority": "urgent", "work_zone": "karawang"}
  
  -- Template
  message_template TEXT, -- Template with variables: "Ticket {ticket_id} assigned to {technician}"
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0, -- Routing rule priority (higher = checked first)
  
  -- Metadata
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_routing_rules_type ON notification_routing_rules(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_routing_rules_is_active ON notification_routing_rules(is_active);

COMMENT ON TABLE notification_routing_rules IS 'Rules for routing notifications to WhatsApp individuals and groups';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. Create Message Templates Table (Optional but Recommended)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS whatsapp_message_templates (
  id SERIAL PRIMARY KEY,
  
  -- Template Info
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'ticket', 'customer', 'system', 'report'
  
  -- Template Content
  template TEXT NOT NULL, -- Message template with {{variables}}
  variables JSONB, -- Available variables: ["ticket_id", "customer_name", "technician_name"]
  example_message TEXT, -- Example with filled variables
  
  -- Settings
  language VARCHAR(10) DEFAULT 'id', -- 'id', 'en'
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_code ON whatsapp_message_templates(code);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON whatsapp_message_templates(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_is_active ON whatsapp_message_templates(is_active);

COMMENT ON TABLE whatsapp_message_templates IS 'Reusable message templates for WhatsApp notifications';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration completed successfully
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 'WhatsApp notification tables created successfully!' as status;

