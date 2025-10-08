-- Create Service Types Master Table
CREATE TABLE IF NOT EXISTS service_types (
  id SERIAL PRIMARY KEY,
  type_code VARCHAR(50) NOT NULL UNIQUE,
  type_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  default_duration INT DEFAULT 120, -- in minutes
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Service Categories Master Table
CREATE TABLE IF NOT EXISTS service_categories (
  id SERIAL PRIMARY KEY,
  service_type_code VARCHAR(50) NOT NULL REFERENCES service_types(type_code) ON UPDATE CASCADE ON DELETE CASCADE,
  category_code VARCHAR(50) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  description TEXT,
  estimated_duration INT DEFAULT 120, -- in minutes
  sla_multiplier DECIMAL(3,2) DEFAULT 1.0,
  requires_checklist BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service_type_code, category_code)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_service_types_active ON service_types(is_active);
CREATE INDEX IF NOT EXISTS idx_service_types_order ON service_types(display_order);
CREATE INDEX IF NOT EXISTS idx_service_categories_type ON service_categories(service_type_code);
CREATE INDEX IF NOT EXISTS idx_service_categories_active ON service_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_service_categories_order ON service_categories(display_order);

-- Insert default Service Types
INSERT INTO service_types (type_code, type_name, description, icon, default_duration, display_order) VALUES
('installation', 'Installation', 'New service installation and setup', 'wrench', 120, 1),
('repair', 'Repair', 'Fix existing service issues and problems', 'tool', 120, 2),
('maintenance', 'Maintenance', 'Scheduled maintenance and inspection', 'settings', 120, 3),
('upgrade', 'Upgrade', 'Service upgrade or enhancement', 'trending-up', 15, 4),
('wifi_setup', 'WiFi Setup', 'WiFi configuration and optimization', 'wifi', 15, 5),
('dismantle', 'Dismantle', 'Service termination and equipment removal', 'trash-2', 60, 6)
ON CONFLICT (type_code) DO UPDATE SET
  type_name = EXCLUDED.type_name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  default_duration = EXCLUDED.default_duration,
  display_order = EXCLUDED.display_order,
  updated_at = CURRENT_TIMESTAMP;

-- Insert default Service Categories for Installation
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('installation', 'fiber_installation', 'Fiber Installation', 'Install fiber optic cable and equipment', 180, 1),
('installation', 'copper_installation', 'Copper Installation', 'Install copper cable and equipment', 150, 2),
('installation', 'wireless_installation', 'Wireless Installation', 'Install wireless equipment and antenna', 120, 3),
('installation', 'hybrid_installation', 'Hybrid Installation', 'Install hybrid fiber-wireless setup', 200, 4)
ON CONFLICT (service_type_code, category_code) DO NOTHING;

-- Insert default Service Categories for Repair
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('repair', 'cable_damage', 'Cable Damage', 'Repair damaged or cut cables', 120, 1),
('repair', 'equipment_failure', 'Equipment Failure', 'Fix or replace faulty equipment', 90, 2),
('repair', 'signal_issue', 'Signal Issue', 'Troubleshoot and fix signal problems', 60, 3),
('repair', 'connection_problem', 'Connection Problem', 'Fix internet connection issues', 45, 4),
('repair', 'port_issue', 'Port Issue', 'Fix port or splitter problems', 60, 5)
ON CONFLICT (service_type_code, category_code) DO NOTHING;

-- Insert default Service Categories for Maintenance
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('maintenance', 'preventive_maintenance', 'Preventive Maintenance', 'Regular preventive maintenance check', 90, 1),
('maintenance', 'equipment_inspection', 'Equipment Inspection', 'Inspect equipment condition', 60, 2),
('maintenance', 'network_optimization', 'Network Optimization', 'Optimize network performance', 120, 3),
('maintenance', 'cleaning_service', 'Cleaning Service', 'Clean equipment and cable management', 45, 4)
ON CONFLICT (service_type_code, category_code) DO NOTHING;

-- Insert default Service Categories for Upgrade
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('upgrade', 'speed_upgrade', 'Speed Upgrade', 'Upgrade internet speed', 15, 1),
('upgrade', 'equipment_upgrade', 'Equipment Upgrade', 'Upgrade to newer equipment', 30, 2),
('upgrade', 'plan_upgrade', 'Service Plan Upgrade', 'Change to higher service plan', 10, 3),
('upgrade', 'technology_upgrade', 'Technology Upgrade', 'Upgrade to new technology (e.g., fiber)', 120, 4)
ON CONFLICT (service_type_code, category_code) DO NOTHING;

-- Insert default Service Categories for WiFi Setup
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('wifi_setup', 'new_wifi_config', 'New WiFi Configuration', 'Configure new WiFi settings', 15, 1),
('wifi_setup', 'wifi_extension', 'WiFi Range Extension', 'Extend WiFi coverage area', 30, 2),
('wifi_setup', 'wifi_security', 'WiFi Security Setup', 'Setup WiFi security and password', 20, 3),
('wifi_setup', 'mesh_network', 'Mesh Network Setup', 'Setup mesh WiFi network', 45, 4)
ON CONFLICT (service_type_code, category_code) DO NOTHING;

-- Insert default Service Categories for Dismantle
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('dismantle', 'full_dismantle', 'Full Dismantle', 'Complete service termination and equipment removal', 90, 1),
('dismantle', 'temporary_disconnect', 'Temporary Disconnect', 'Temporary service suspension', 30, 2),
('dismantle', 'equipment_return', 'Equipment Return', 'Return leased equipment', 45, 3),
('dismantle', 'relocation', 'Service Relocation', 'Move service to new location', 120, 4)
ON CONFLICT (service_type_code, category_code) DO NOTHING;

