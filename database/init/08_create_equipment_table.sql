-- Create Equipment Master Table
CREATE TABLE IF NOT EXISTS equipment_master (
  id SERIAL PRIMARY KEY,
  equipment_code VARCHAR(50) NOT NULL UNIQUE,
  equipment_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL, -- tools, cables, devices, accessories
  description TEXT,
  unit VARCHAR(20) DEFAULT 'pcs',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Equipment Service Type Mapping (which equipment needed for which service type)
CREATE TABLE IF NOT EXISTS equipment_service_mapping (
  id SERIAL PRIMARY KEY,
  equipment_id INT NOT NULL REFERENCES equipment_master(id) ON DELETE CASCADE,
  service_type_code VARCHAR(50) NOT NULL REFERENCES service_types(type_code) ON UPDATE CASCADE ON DELETE CASCADE,
  service_category_code VARCHAR(50), -- optional, if specific to category
  is_required BOOLEAN DEFAULT false,
  quantity_default INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(equipment_id, service_type_code, service_category_code)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment_master(category);
CREATE INDEX IF NOT EXISTS idx_equipment_active ON equipment_master(is_active);
CREATE INDEX IF NOT EXISTS idx_equipment_mapping_service ON equipment_service_mapping(service_type_code);

-- Insert equipment data
INSERT INTO equipment_master (equipment_code, equipment_name, category, description, unit) VALUES
-- Devices
('modem_wifi', 'Modem WiFi', 'devices', 'Modem dengan WiFi router terintegrasi', 'unit'),
('router_enterprise', 'Router Enterprise', 'devices', 'Router kelas enterprise untuk dedicated/corporate', 'unit'),
('ont_fiber', 'ONT Fiber', 'devices', 'Optical Network Terminal untuk fiber connection', 'unit'),
('access_point', 'Access Point', 'devices', 'WiFi Access Point untuk coverage area luas', 'unit'),
('network_switch', 'Network Switch', 'devices', 'Managed switch untuk network management', 'unit'),
('firewall', 'Firewall', 'devices', 'Hardware firewall untuk security', 'unit'),
('ups', 'UPS', 'devices', 'Uninterruptible Power Supply', 'unit'),

-- Cables
('cable_utp_cat6', 'Kabel UTP Cat6', 'cables', 'Kabel UTP kategori 6 untuk network', 'meter'),
('cable_fiber', 'Kabel Fiber Optic', 'cables', 'Kabel fiber optic single/multi mode', 'meter'),
('patch_cord', 'Patch Cord', 'cables', 'Kabel patch cord untuk koneksi', 'pcs'),
('adapter_fiber', 'Fiber Adapter', 'cables', 'Adapter untuk sambungan fiber', 'pcs'),
('pigtail', 'Pigtail Fiber', 'cables', 'Pigtail untuk splicing fiber', 'pcs'),

-- Connectors & Accessories
('connector_rj45', 'Connector RJ45', 'accessories', 'Konektor RJ45 untuk kabel UTP', 'pcs'),
('splitter', 'Splitter Optical', 'accessories', 'Splitter 1:2 atau 1:4 untuk fiber', 'pcs'),
('sfp_module', 'SFP Module', 'accessories', 'Small Form-factor Pluggable transceiver', 'pcs'),
('patch_panel', 'Patch Panel', 'accessories', 'Panel untuk terminasi kabel', 'pcs'),

-- Tools
('crimping_tool', 'Crimping Tool', 'tools', 'Tang crimping untuk kabel', 'pcs'),
('cable_tester', 'Cable Tester', 'tools', 'Alat tes kabel UTP/coaxial', 'pcs'),
('otdr', 'OTDR', 'tools', 'Optical Time Domain Reflectometer', 'pcs'),
('power_meter', 'Optical Power Meter', 'tools', 'Pengukur daya optical', 'pcs'),
('fusion_splicer', 'Fusion Splicer', 'tools', 'Mesin sambung fiber optic', 'pcs'),
('multimeter', 'Multimeter Digital', 'tools', 'Pengukur listrik multifungsi', 'pcs'),
('stripping_tool', 'Fiber Stripping Tool', 'tools', 'Tool untuk stripping fiber', 'pcs'),
('cleaver', 'Fiber Cleaver', 'tools', 'Pemotong fiber presisi', 'pcs')
ON CONFLICT (equipment_code) DO NOTHING;

-- Map equipment to service types
INSERT INTO equipment_service_mapping (equipment_id, service_type_code, service_category_code, is_required, quantity_default) VALUES
-- Installation - Fiber
((SELECT id FROM equipment_master WHERE equipment_code = 'ont_fiber'), 'installation', 'fiber_installation', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_fiber'), 'installation', 'fiber_installation', true, 50),
((SELECT id FROM equipment_master WHERE equipment_code = 'patch_cord'), 'installation', 'fiber_installation', true, 2),
((SELECT id FROM equipment_master WHERE equipment_code = 'splitter'), 'installation', 'fiber_installation', false, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'otdr'), 'installation', 'fiber_installation', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'power_meter'), 'installation', 'fiber_installation', true, 1),

-- Installation - Copper
((SELECT id FROM equipment_master WHERE equipment_code = 'modem_wifi'), 'installation', 'copper_installation', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_utp_cat6'), 'installation', 'copper_installation', true, 20),
((SELECT id FROM equipment_master WHERE equipment_code = 'connector_rj45'), 'installation', 'copper_installation', true, 4),
((SELECT id FROM equipment_master WHERE equipment_code = 'crimping_tool'), 'installation', 'copper_installation', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_tester'), 'installation', 'copper_installation', true, 1),

-- Repair - General
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_tester'), 'repair', null, true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'multimeter'), 'repair', null, true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_utp_cat6'), 'repair', null, false, 10),
((SELECT id FROM equipment_master WHERE equipment_code = 'connector_rj45'), 'repair', null, false, 2),

-- Maintenance
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_tester'), 'maintenance', null, true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'power_meter'), 'maintenance', 'preventive_maintenance', false, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'multimeter'), 'maintenance', null, true, 1),

-- WiFi Setup
((SELECT id FROM equipment_master WHERE equipment_code = 'access_point'), 'wifi_setup', 'wifi_extension', false, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_utp_cat6'), 'wifi_setup', null, false, 10)
ON CONFLICT (equipment_id, service_type_code, service_category_code) DO NOTHING;

