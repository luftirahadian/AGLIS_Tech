-- Enhance Service Categories for Broadband/FTTH Residential
-- Migration 012: Menambahkan kategori service yang lebih spesifik untuk customer broadband rumahan
-- CATATAN: File ini MENAMBAHKAN kategori baru, TIDAK menghapus yang lama

-- Tambahkan kategori REPAIR yang lebih spesifik untuk keluhan broadband residential
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
-- Repair - Keluhan Spesifik Residential
('repair', 'slow_speed', 'Internet Lambat', 'Keluhan kecepatan internet lebih lambat dari paket yang dilanggan', 60, 6),
('repair', 'no_internet', 'Tidak Ada Internet', 'Internet mati total / tidak bisa akses sama sekali', 90, 7),
('repair', 'intermittent_connection', 'Koneksi Putus-Putus', 'Internet sering putus-nyambung secara berkala', 75, 8),
('repair', 'high_ping', 'Ping Tinggi / Lag', 'Gaming atau video call lag karena latency tinggi', 45, 9),
('repair', 'packet_loss', 'Packet Loss', 'Troubleshoot packet loss pada koneksi', 60, 10),
('repair', 'wifi_weak_signal', 'Sinyal WiFi Lemah', 'Sinyal WiFi tidak kuat / tidak sampai ke beberapa ruangan', 45, 11),
('repair', 'cant_connect_wifi', 'Tidak Bisa Konek WiFi', 'Device tidak bisa connect ke WiFi', 30, 12),
('repair', 'modem_restart', 'Modem Sering Restart', 'Modem/ONT sering restart sendiri', 60, 13),
('repair', 'red_light', 'Lampu Merah/LOS', 'Lampu indikator merah atau LOS pada modem/ONT', 90, 14)
ON CONFLICT (service_type_code, category_code) DO NOTHING;

-- Tambahkan kategori MAINTENANCE yang lebih spesifik
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('maintenance', 'fiber_cleaning', 'Cleaning Konektor Fiber', 'Pembersihan konektor fiber optic untuk menjaga signal quality', 30, 5),
('maintenance', 'speed_test', 'Speed Test & Verification', 'Test kecepatan dan verifikasi sesuai paket', 20, 6),
('maintenance', 'cable_management', 'Cable Management', 'Rapihkan kabel indoor untuk estetika dan keamanan', 30, 7),
('maintenance', 'firmware_update', 'Update Firmware Modem', 'Update firmware modem/ONT ke versi terbaru', 30, 8)
ON CONFLICT (service_type_code, category_code) DO NOTHING;

-- Tambahkan kategori INSTALLATION yang lebih detail
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('installation', 'new_registration', 'Instalasi Pelanggan Baru', 'Instalasi lengkap untuk pelanggan registrasi baru', 180, 5),
('installation', 'relocation_internal', 'Relokasi Internal Rumah', 'Pindah posisi modem dalam satu rumah yang sama', 60, 6)
ON CONFLICT (service_type_code, category_code) DO NOTHING;

-- Tambahkan kategori WIFI SETUP yang lebih spesifik
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('wifi_setup', 'change_password', 'Ganti Password WiFi', 'Mengganti password WiFi dan nama SSID', 15, 5),
('wifi_setup', 'dual_band_setup', 'Setup WiFi Dual Band', 'Konfigurasi WiFi 2.4GHz dan 5GHz optimal', 30, 6),
('wifi_setup', 'guest_network', 'Setup Guest Network', 'Membuat jaringan WiFi terpisah untuk tamu', 20, 7),
('wifi_setup', 'parental_control', 'Setup Parental Control', 'Konfigurasi kontrol orang tua untuk anak', 30, 8)
ON CONFLICT (service_type_code, category_code) DO NOTHING;

-- Tambahkan kategori UPGRADE yang lebih detail
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('upgrade', 'package_upgrade', 'Upgrade Paket Internet', 'Upgrade dari Bronze ke Silver/Gold/Platinum', 15, 5),
('upgrade', 'add_static_ip', 'Tambah Static IP', 'Upgrade ke static IP untuk kebutuhan khusus', 20, 6)
ON CONFLICT (service_type_code, category_code) DO NOTHING;

-- Tambahkan kategori DOWNGRADE yang lebih detail  
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('downgrade', 'package_downgrade', 'Downgrade Paket Internet', 'Downgrade dari paket tinggi ke paket lebih rendah', 15, 6),
('downgrade', 'remove_static_ip', 'Hapus Static IP', 'Kembali ke dynamic IP dari static IP', 15, 7)
ON CONFLICT (service_type_code, category_code) DO NOTHING;

-- Tambahkan kategori DISMANTLE yang lebih detail
INSERT INTO service_categories (service_type_code, category_code, category_name, description, estimated_duration, display_order) VALUES
('dismantle', 'voluntary_termination', 'Pemutusan Sukarela', 'Customer mengajukan pemutusan layanan sendiri', 90, 5),
('dismantle', 'non_payment', 'Pemutusan Karena Nunggak', 'Pemutusan layanan karena tidak bayar', 60, 6),
('dismantle', 'relocation_external', 'Pindah Alamat (Luar Area)', 'Customer pindah ke luar coverage area', 90, 7)
ON CONFLICT (service_type_code, category_code) DO NOTHING;

-- Update timestamps
UPDATE service_categories SET updated_at = CURRENT_TIMESTAMP 
WHERE category_code IN (
    'slow_speed', 'no_internet', 'intermittent_connection', 'high_ping', 'packet_loss',
    'wifi_weak_signal', 'cant_connect_wifi', 'modem_restart', 'red_light',
    'fiber_cleaning', 'speed_test', 'cable_management', 'firmware_update',
    'new_registration', 'relocation_internal',
    'change_password', 'dual_band_setup', 'guest_network', 'parental_control',
    'package_upgrade', 'add_static_ip',
    'package_downgrade', 'remove_static_ip',
    'voluntary_termination', 'non_payment', 'relocation_external'
);

-- Tampilkan ringkasan
SELECT '=== ENHANCED SERVICE CATEGORIES ===' as info;
SELECT service_type_code as tipe, COUNT(*) as jumlah_kategori 
FROM service_categories 
GROUP BY service_type_code 
ORDER BY service_type_code;

