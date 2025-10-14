-- Convert to Legacy Service System
-- Migration 033: Convert dari sistem baru ke sistem lama yang sudah ada

-- 1. Backup existing data (optional - untuk safety)
CREATE TABLE IF NOT EXISTS service_types_backup AS SELECT * FROM service_types;

-- 2. Drop existing tables yang conflict
DROP TABLE IF EXISTS equipment_service_mapping CASCADE;
DROP TABLE IF EXISTS service_types CASCADE;

-- 3. Recreate service_types dengan schema lama
CREATE TABLE service_types (
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

-- 4. Create service_categories table
CREATE TABLE service_categories (
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

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_service_types_active ON service_types(is_active);
CREATE INDEX IF NOT EXISTS idx_service_types_order ON service_types(display_order);
CREATE INDEX IF NOT EXISTS idx_service_types_code ON service_types(type_code);
CREATE INDEX IF NOT EXISTS idx_service_categories_type ON service_categories(service_type_code);
CREATE INDEX IF NOT EXISTS idx_service_categories_active ON service_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_service_categories_order ON service_categories(display_order);

-- 6. Insert default Service Types (sistem lama)
INSERT INTO service_types (type_code, type_name, description, icon, default_duration, display_order) VALUES
('installation', 'Installation', 'New service installation and setup', 'wrench', 120, 1),
('repair', 'Repair', 'Fix existing service issues and problems', 'tool', 120, 2),
('maintenance', 'Maintenance', 'Scheduled maintenance and inspection', 'settings', 120, 3),
('upgrade', 'Upgrade', 'Service upgrade or enhancement', 'trending-up', 15, 4),
('wifi_setup', 'WiFi Setup', 'WiFi configuration and optimization', 'wifi', 15, 5),
('downgrade', 'Downgrade', 'Service plan downgrade or speed reduction', 'trending-down', 15, 6),
('dismantle', 'Dismantle', 'Service termination and equipment removal', 'trash-2', 60, 7);

-- 7. Insert Service Categories
-- Installation Categories
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('installation', 'fiber_installation', 'Fiber Installation', 'Install fiber optic cable and equipment', 180, 1),
('installation', 'copper_installation', 'Copper Installation', 'Install copper cable and equipment', 150, 2),
('installation', 'wireless_installation', 'Wireless Installation', 'Install wireless equipment and antenna', 120, 3),
('installation', 'hybrid_installation', 'Hybrid Installation', 'Install hybrid fiber-wireless setup', 200, 4),
('installation', 'new_registration', 'Instalasi Pelanggan Baru', 'Instalasi lengkap untuk pelanggan registrasi baru', 180, 5),
('installation', 'relocation_internal', 'Relokasi Internal Rumah', 'Pindah posisi modem dalam satu rumah yang sama', 60, 6);

-- Repair Categories
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('repair', 'cable_damage', 'Cable Damage', 'Repair damaged or cut cables', 120, 1),
('repair', 'equipment_failure', 'Equipment Failure', 'Fix or replace faulty equipment', 90, 2),
('repair', 'signal_issue', 'Signal Issue', 'Troubleshoot and fix signal problems', 60, 3),
('repair', 'connection_problem', 'Connection Problem', 'Fix internet connection issues', 45, 4),
('repair', 'port_issue', 'Port Issue', 'Fix port or splitter problems', 60, 5);

-- Maintenance Categories
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('maintenance', 'preventive_maintenance', 'Preventive Maintenance', 'Regular preventive maintenance check', 90, 1),
('maintenance', 'equipment_inspection', 'Equipment Inspection', 'Inspect equipment condition', 60, 2),
('maintenance', 'network_optimization', 'Network Optimization', 'Optimize network performance', 120, 3),
('maintenance', 'cleaning_service', 'Cleaning Service', 'Clean equipment and cable management', 45, 4),
('maintenance', 'fiber_cleaning', 'Cleaning Konektor Fiber', 'Pembersihan konektor fiber untuk signal optimal', 30, 5),
('maintenance', 'speed_test', 'Speed Test & Verification', 'Test kecepatan dan verifikasi sesuai paket', 20, 6),
('maintenance', 'cable_management', 'Cable Management', 'Rapihkan kabel indoor untuk estetika dan keamanan', 30, 7),
('maintenance', 'firmware_update', 'Update Firmware Modem', 'Update firmware modem/ONT ke versi terbaru', 30, 8);

-- Upgrade Categories
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('upgrade', 'speed_upgrade', 'Speed Upgrade', 'Upgrade internet speed', 15, 1),
('upgrade', 'equipment_upgrade', 'Equipment Upgrade', 'Upgrade to newer equipment', 30, 2),
('upgrade', 'plan_upgrade', 'Service Plan Upgrade', 'Change to higher service plan', 10, 3),
('upgrade', 'technology_upgrade', 'Technology Upgrade', 'Upgrade to new technology (e.g., fiber)', 120, 4),
('upgrade', 'package_upgrade', 'Upgrade Paket Internet', 'Upgrade dari Bronze ke Silver/Gold/Platinum', 15, 5),
('upgrade', 'add_static_ip', 'Tambah Static IP', 'Upgrade ke static IP untuk kebutuhan khusus', 20, 6);

-- WiFi Setup Categories
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('wifi_setup', 'new_wifi_config', 'New WiFi Configuration', 'Configure new WiFi settings', 15, 1),
('wifi_setup', 'wifi_extension', 'WiFi Range Extension', 'Extend WiFi coverage area', 30, 2),
('wifi_setup', 'wifi_security', 'WiFi Security Setup', 'Setup WiFi security and password', 20, 3),
('wifi_setup', 'mesh_network', 'Mesh Network Setup', 'Setup mesh WiFi network', 45, 4),
('wifi_setup', 'change_password', 'Ganti Password WiFi', 'Mengganti password WiFi dan nama SSID', 15, 5),
('wifi_setup', 'dual_band_setup', 'Setup WiFi Dual Band', 'Konfigurasi WiFi 2.4GHz dan 5GHz optimal', 30, 6),
('wifi_setup', 'guest_network', 'Setup Guest Network', 'Membuat jaringan WiFi terpisah untuk tamu', 20, 7),
('wifi_setup', 'parental_control', 'Setup Parental Control', 'Konfigurasi kontrol orang tua untuk anak', 30, 8);

-- Downgrade Categories
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('downgrade', 'package_downgrade', 'Downgrade Paket Internet', 'Downgrade dari paket tinggi ke paket rendah', 15, 1),
('downgrade', 'speed_reduction', 'Pengurangan Kecepatan', 'Mengurangi kecepatan internet', 15, 2),
('downgrade', 'feature_removal', 'Penghapusan Fitur', 'Menghapus fitur tambahan (static IP, dll)', 10, 3);

-- Dismantle Categories
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('dismantle', 'full_dismantle', 'Full Dismantle', 'Pencabutan lengkap semua equipment dan kabel', 180, 1),
('dismantle', 'partial_dismantle', 'Partial Dismantle', 'Pencabutan sebagian equipment', 90, 2),
('dismantle', 'equipment_return', 'Equipment Return', 'Pengembalian equipment ke warehouse', 60, 3);

-- 8. Recreate equipment_service_mapping dengan schema yang benar
CREATE TABLE equipment_service_mapping (
  id SERIAL PRIMARY KEY,
  equipment_id INT NOT NULL REFERENCES equipment_master(id) ON DELETE CASCADE,
  service_type_code VARCHAR(50) NOT NULL REFERENCES service_types(type_code) ON UPDATE CASCADE ON DELETE CASCADE,
  service_category_code VARCHAR(50), -- optional, if specific to category
  is_required BOOLEAN DEFAULT false,
  quantity_default INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(equipment_id, service_type_code, service_category_code)
);

-- 9. Show summary
SELECT '=== SERVICE SYSTEM CONVERTED ===' as info;

SELECT 
    'Service Types' as table_name,
    COUNT(*) as total_records
FROM service_types
UNION ALL
SELECT 
    'Service Categories',
    COUNT(*)
FROM service_categories
UNION ALL
SELECT 
    'Equipment Service Mapping',
    COUNT(*)
FROM equipment_service_mapping;

-- Show service types
SELECT 
    type_code,
    type_name,
    CONCAT(default_duration, ' min') as duration,
    CASE WHEN is_active THEN '✅' ELSE '❌' END as active,
    display_order as order
FROM service_types
ORDER BY display_order;
