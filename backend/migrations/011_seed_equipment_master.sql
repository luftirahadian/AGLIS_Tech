-- Seed data for Equipment Master
-- Migration 011: Insert equipment data untuk broadband/FTTH residensial

-- Hapus data equipment mapping dan equipment master yang ada
DELETE FROM equipment_service_mapping;
DELETE FROM equipment_master;

-- Reset sequence
ALTER SEQUENCE equipment_master_id_seq RESTART WITH 1;

-- Insert equipment master data (fokus broadband/FTTH residensial)
INSERT INTO equipment_master (equipment_code, equipment_name, category, description, unit) VALUES
-- Devices untuk Customer Broadband/FTTH
('ont_huawei_hg8245h', 'ONT Huawei HG8245H', 'devices', 'ONT Fiber dengan WiFi AC - untuk paket Silver/Gold', 'unit'),
('ont_zte_f670l', 'ONT ZTE F670L', 'devices', 'ONT Fiber dual band WiFi - untuk paket Gold/Platinum', 'unit'),
('ont_fiberhome_hg6245d', 'ONT Fiberhome HG6245D', 'devices', 'ONT Fiber WiFi 5 - untuk paket Platinum', 'unit'),
('modem_tplink_c6', 'Modem TP-Link Archer C6', 'devices', 'Modem WiFi dual band - untuk paket Bronze/Silver', 'unit'),
('modem_tplink_c50', 'Modem TP-Link Archer C50', 'devices', 'Modem WiFi standar - untuk paket Bronze', 'unit'),
('access_point', 'WiFi Access Point', 'devices', 'Access Point untuk coverage tambahan', 'unit'),
('mesh_node', 'WiFi Mesh Node', 'devices', 'Node tambahan untuk mesh network', 'unit'),

-- Cables & Connectors untuk FTTH
('cable_fiber_sm', 'Kabel Fiber Optic Single Mode', 'cables', 'Kabel fiber optic untuk instalasi FTTH', 'meter'),
('cable_utp_cat6', 'Kabel UTP Cat6', 'cables', 'Kabel UTP kategori 6 untuk network indoor', 'meter'),
('cable_drop_ftth', 'Kabel Drop FTTH', 'cables', 'Kabel drop wire dari ODP ke rumah', 'meter'),
('patch_cord_sc_sc', 'Patch Cord SC-SC', 'cables', 'Patch cord SC-SC untuk koneksi ONT', 'pcs'),
('patch_cord_sc_upc', 'Patch Cord SC-UPC', 'cables', 'Patch cord SC-UPC single mode', 'pcs'),
('pigtail_sc', 'Pigtail SC/UPC', 'cables', 'Pigtail untuk splicing di ODP', 'pcs'),

-- Accessories untuk Instalasi Rumahan
('connector_rj45', 'Connector RJ45', 'accessories', 'Konektor RJ45 untuk kabel UTP', 'pcs'),
('splitter_1x2', 'Splitter Optical 1:2', 'accessories', 'Splitter 1:2 untuk pembagian signal', 'pcs'),
('splitter_1x4', 'Splitter Optical 1:4', 'accessories', 'Splitter 1:4 untuk ODP', 'pcs'),
('splitter_1x8', 'Splitter Optical 1:8', 'accessories', 'Splitter 1:8 untuk ODP besar', 'pcs'),
('closure_box', 'Closure Box', 'accessories', 'Box untuk sambungan fiber di luar', 'pcs'),
('rosette_box', 'Rosette Box', 'accessories', 'Terminal box untuk ONT di dalam rumah', 'pcs'),
('cable_clip', 'Cable Clip', 'accessories', 'Klip kabel untuk rapi instalasi', 'pcs'),
('cable_tie', 'Cable Tie', 'accessories', 'Pengikat kabel', 'pcs'),

-- Tools untuk Teknisi FTTH
('otdr', 'OTDR (Optical Time Domain Reflectometer)', 'tools', 'Alat ukur untuk testing fiber optic', 'unit'),
('power_meter', 'Optical Power Meter', 'tools', 'Pengukur daya optical signal', 'unit'),
('vfl', 'Visual Fault Locator', 'tools', 'Laser merah untuk deteksi putus fiber', 'unit'),
('cleaver', 'Fiber Cleaver', 'tools', 'Pemotong fiber dengan presisi tinggi', 'unit'),
('stripping_tool', 'Fiber Stripping Tool', 'tools', 'Tool untuk mengupas coating fiber', 'unit'),
('crimping_tool', 'Crimping Tool RJ45', 'tools', 'Tang crimping untuk kabel UTP', 'unit'),
('cable_tester', 'LAN Cable Tester', 'tools', 'Alat tes kabel UTP', 'unit'),
('multimeter', 'Multimeter Digital', 'tools', 'Pengukur listrik untuk cek power', 'unit'),
('fusion_splicer', 'Fusion Splicer', 'tools', 'Mesin sambung fiber optic (untuk teknisi senior)', 'unit'),

-- Consumables
('alcohol_cleaner', 'Alkohol Pembersih', 'accessories', 'Pembersih untuk konektor fiber', 'botol'),
('tape_isolasi', 'Isolasi Listrik', 'accessories', 'Isolasi untuk sambungan', 'roll'),
('label_cable', 'Label Kabel', 'accessories', 'Label identifikasi kabel', 'pcs');

-- Update timestamps
UPDATE equipment_master SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP;

-- Map equipment to service types (untuk broadband/FTTH)
INSERT INTO equipment_service_mapping (equipment_id, service_type_code, service_category_code, is_required, quantity_default) VALUES
-- Installation - Fiber (untuk FTTH Broadband)
((SELECT id FROM equipment_master WHERE equipment_code = 'ont_huawei_hg8245h'), 'installation', 'fiber_installation', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_drop_ftth'), 'installation', 'fiber_installation', true, 50),
((SELECT id FROM equipment_master WHERE equipment_code = 'patch_cord_sc_sc'), 'installation', 'fiber_installation', true, 2),
((SELECT id FROM equipment_master WHERE equipment_code = 'rosette_box'), 'installation', 'fiber_installation', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_clip'), 'installation', 'fiber_installation', false, 20),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_tie'), 'installation', 'fiber_installation', false, 10),
((SELECT id FROM equipment_master WHERE equipment_code = 'power_meter'), 'installation', 'fiber_installation', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'vfl'), 'installation', 'fiber_installation', true, 1),

-- Repair - Cable Damage
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_drop_ftth'), 'repair', 'cable_damage', false, 20),
((SELECT id FROM equipment_master WHERE equipment_code = 'patch_cord_sc_sc'), 'repair', 'cable_damage', false, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'vfl'), 'repair', 'cable_damage', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'power_meter'), 'repair', 'cable_damage', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'cleaver'), 'repair', 'cable_damage', false, 1),

-- Repair - Equipment Failure
((SELECT id FROM equipment_master WHERE equipment_code = 'ont_huawei_hg8245h'), 'repair', 'equipment_failure', false, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'modem_tplink_c6'), 'repair', 'equipment_failure', false, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'multimeter'), 'repair', 'equipment_failure', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_tester'), 'repair', 'equipment_failure', true, 1),

-- Repair - Signal Issue
((SELECT id FROM equipment_master WHERE equipment_code = 'otdr'), 'repair', 'signal_issue', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'power_meter'), 'repair', 'signal_issue', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'vfl'), 'repair', 'signal_issue', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'alcohol_cleaner'), 'repair', 'signal_issue', false, 1),

-- Repair - Connection Problem
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_tester'), 'repair', 'connection_problem', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'multimeter'), 'repair', 'connection_problem', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_utp_cat6'), 'repair', 'connection_problem', false, 10),
((SELECT id FROM equipment_master WHERE equipment_code = 'connector_rj45'), 'repair', 'connection_problem', false, 4),

-- Maintenance - Preventive
((SELECT id FROM equipment_master WHERE equipment_code = 'power_meter'), 'maintenance', 'preventive_maintenance', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_tester'), 'maintenance', 'preventive_maintenance', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'multimeter'), 'maintenance', 'preventive_maintenance', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'alcohol_cleaner'), 'maintenance', 'preventive_maintenance', false, 1),

-- Upgrade - Speed Upgrade (biasanya hanya config)
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_tester'), 'upgrade', 'speed_upgrade', false, 1),

-- Upgrade - Equipment Upgrade
((SELECT id FROM equipment_master WHERE equipment_code = 'ont_zte_f670l'), 'upgrade', 'equipment_upgrade', false, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'ont_fiberhome_hg6245d'), 'upgrade', 'equipment_upgrade', false, 1),

-- WiFi Setup - New Configuration
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_tester'), 'wifi_setup', 'new_wifi_config', true, 1),

-- WiFi Setup - Range Extension
((SELECT id FROM equipment_master WHERE equipment_code = 'access_point'), 'wifi_setup', 'wifi_extension', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_utp_cat6'), 'wifi_setup', 'wifi_extension', false, 20),
((SELECT id FROM equipment_master WHERE equipment_code = 'connector_rj45'), 'wifi_setup', 'wifi_extension', false, 4),

-- WiFi Setup - Mesh Network
((SELECT id FROM equipment_master WHERE equipment_code = 'mesh_node'), 'wifi_setup', 'mesh_network', true, 2),
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_utp_cat6'), 'wifi_setup', 'mesh_network', false, 10),

-- Dismantle - Full Dismantle
((SELECT id FROM equipment_master WHERE equipment_code = 'cable_tester'), 'dismantle', 'full_dismantle', true, 1),
((SELECT id FROM equipment_master WHERE equipment_code = 'vfl'), 'dismantle', 'full_dismantle', false, 1);

-- Update timestamps
UPDATE equipment_service_mapping SET created_at = CURRENT_TIMESTAMP;

