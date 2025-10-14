-- Seed Service Types
-- Migration 032: Insert common service types untuk ticketing system

-- Clear existing data (jika ada)
DELETE FROM service_types;

-- Reset sequence
ALTER SEQUENCE service_types_id_seq RESTART WITH 1;

-- Insert service types untuk ISP operations
INSERT INTO service_types (service_code, service_name, category, description, estimated_duration, base_price, is_active, display_order) VALUES
-- Installation Services
('install_new', 'New Installation', 'installation', 'Instalasi baru untuk customer baru', 180, 0, true, 1),
('install_relocation', 'Relocation/Move', 'installation', 'Relokasi/pindah alamat customer', 120, 150000, true, 2),
('install_upgrade', 'Upgrade Package', 'installation', 'Upgrade ke paket yang lebih tinggi', 90, 0, true, 3),

-- Repair Services
('repair_signal', 'Signal Issue/Weak', 'repair', 'Perbaikan masalah signal lemah atau tidak stabil', 120, 0, true, 10),
('repair_connection', 'Connection Lost/Down', 'repair', 'Perbaikan masalah koneksi internet mati', 90, 0, true, 11),
('repair_slow_speed', 'Slow Speed', 'repair', 'Perbaikan masalah internet lambat', 60, 0, true, 12),
('repair_equipment', 'Equipment Malfunction', 'repair', 'Perbaikan/ganti equipment rusak', 90, 0, true, 13),
('repair_cable', 'Cable Damaged', 'repair', 'Perbaikan kabel putus/rusak', 120, 50000, true, 14),
('repair_port', 'Port Problem', 'repair', 'Perbaikan masalah port/konektor', 60, 0, true, 15),

-- Maintenance Services  
('maintenance_preventive', 'Preventive Maintenance', 'maintenance', 'Maintenance rutin preventif', 60, 0, true, 20),
('maintenance_cleaning', 'Equipment Cleaning', 'maintenance', 'Pembersihan dan perawatan equipment', 45, 0, true, 21),
('maintenance_signal_check', 'Signal Quality Check', 'maintenance', 'Pengecekan kualitas signal', 30, 0, true, 22),

-- Upgrade Services
('upgrade_speed', 'Speed Upgrade', 'upgrade', 'Upgrade kecepatan internet', 60, 0, true, 30),
('upgrade_equipment', 'Equipment Upgrade', 'upgrade', 'Upgrade/ganti equipment ke yang lebih baru', 90, 0, true, 31),
('upgrade_fiber', 'Fiber Upgrade', 'upgrade', 'Upgrade dari copper ke fiber', 180, 500000, true, 32),

-- Support Services
('support_config', 'Configuration Support', 'support', 'Bantuan setting/konfigurasi', 45, 0, true, 40),
('support_troubleshoot', 'Troubleshooting', 'support', 'Diagnosa dan troubleshooting masalah', 60, 0, true, 41),
('support_consultation', 'Technical Consultation', 'support', 'Konsultasi teknis', 30, 0, true, 42),

-- Other Services
('survey_site', 'Site Survey', 'survey', 'Survey lokasi untuk instalasi baru', 90, 0, true, 50),
('disconnect', 'Service Disconnection', 'disconnection', 'Pemutusan layanan (cancel)', 60, 0, true, 60),
('reconnect', 'Service Reconnection', 'reconnection', 'Penyambungan kembali layanan', 60, 100000, true, 61);

-- Show inserted data
SELECT 
    '=== SERVICE TYPES SEEDED ===' as info;

SELECT 
    service_code,
    service_name,
    category,
    CONCAT(estimated_duration, ' min') as duration,
    CONCAT('Rp ', to_char(base_price, 'FM999,999,999')) as price,
    CASE WHEN is_active THEN '✅' ELSE '❌' END as active
FROM service_types
ORDER BY display_order;

-- Summary
SELECT 
    '=== SUMMARY ===' as info;

SELECT 
    category,
    COUNT(*) as total_types,
    COUNT(*) FILTER (WHERE is_active = true) as active_types
FROM service_types
GROUP BY category
ORDER BY category;

