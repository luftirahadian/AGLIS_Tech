-- Create Service Price List Master
-- Migration 016: Buat master data harga untuk berbagai service

-- Buat tabel service price list
CREATE TABLE IF NOT EXISTS service_pricelist (
    id SERIAL PRIMARY KEY,
    service_type_code VARCHAR(50) NOT NULL REFERENCES service_types(type_code) ON UPDATE CASCADE ON DELETE CASCADE,
    service_category_code VARCHAR(50),
    price_name VARCHAR(150) NOT NULL,
    description TEXT,
    base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    is_free BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    applies_to_package VARCHAR(50), -- 'all', 'bronze', 'silver', 'gold', 'platinum'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_type_code, service_category_code) 
        REFERENCES service_categories(service_type_code, category_code) 
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pricelist_type ON service_pricelist(service_type_code);
CREATE INDEX IF NOT EXISTS idx_pricelist_category ON service_pricelist(service_category_code);
CREATE INDEX IF NOT EXISTS idx_pricelist_active ON service_pricelist(is_active);
CREATE INDEX IF NOT EXISTS idx_pricelist_package ON service_pricelist(applies_to_package);

-- Insert price list data

-- ===== INSTALLATION PRICES =====
INSERT INTO service_pricelist (service_type_code, service_category_code, price_name, description, base_price, is_free, applies_to_package, notes) VALUES
('installation', 'fiber_installation', 'Biaya Instalasi Bronze', 'Biaya instalasi + setup untuk paket Bronze 30M', 100000, false, 'bronze', 'Sudah termasuk kabel s.d 50m'),
('installation', 'fiber_installation', 'Biaya Instalasi Silver', 'Biaya instalasi + setup untuk paket Silver 50M', 100000, false, 'silver', 'Sudah termasuk kabel s.d 50m'),
('installation', 'fiber_installation', 'Biaya Instalasi Gold', 'Biaya instalasi + setup untuk paket Gold 75M', 150000, false, 'gold', 'Sudah termasuk kabel s.d 75m'),
('installation', 'fiber_installation', 'Biaya Instalasi Platinum', 'Biaya instalasi + setup untuk paket Platinum 100M', 150000, false, 'platinum', 'Sudah termasuk kabel s.d 100m'),
('installation', 'new_registration', 'Biaya Registrasi Pelanggan Baru', 'Biaya administrasi pendaftaran pelanggan baru', 0, true, 'all', 'GRATIS untuk semua paket'),
('installation', 'relocation_internal', 'Biaya Relokasi Dalam Rumah', 'Pindah posisi modem dalam satu rumah', 150000, false, 'all', 'Kabel tambahan dikenakan biaya terpisah');

-- ===== REPAIR PRICES =====
INSERT INTO service_pricelist (service_type_code, service_category_code, price_name, description, base_price, is_free, applies_to_package, notes) VALUES
-- Repair umum
('repair', NULL, 'Biaya Visit Teknisi (Garansi)', 'Visit teknisi untuk troubleshooting dalam masa garansi', 0, true, 'all', 'GRATIS dalam 30 hari pertama atau garansi aktif'),
('repair', NULL, 'Biaya Visit Teknisi (Luar Garansi)', 'Visit teknisi untuk troubleshooting di luar garansi', 75000, false, 'all', 'Jika butuh spare part, dikenakan biaya terpisah'),

-- Cable damage
('repair', 'cable_damage', 'Perbaikan Kabel (s.d 10m)', 'Perbaikan atau penggantian kabel rusak hingga 10 meter', 100000, false, 'all', 'Termasuk material dan tenaga'),
('repair', 'cable_damage', 'Perbaikan Kabel (11-30m)', 'Perbaikan atau penggantian kabel rusak 11-30 meter', 250000, false, 'all', 'Termasuk material dan tenaga'),
('repair', 'cable_damage', 'Perbaikan Kabel (>30m)', 'Perbaikan kabel rusak lebih dari 30 meter', 400000, false, 'all', 'Termasuk material dan tenaga'),

-- Equipment failure
('repair', 'equipment_failure', 'Ganti Modem/ONT (Dalam Garansi)', 'Penggantian modem/ONT rusak dalam masa garansi', 0, true, 'all', 'GRATIS jika rusak bukan karena kesalahan customer'),
('repair', 'equipment_failure', 'Ganti Modem/ONT (Luar Garansi)', 'Penggantian modem/ONT rusak di luar garansi', 350000, false, 'all', 'Harga modem standar, ONT premium lebih mahal'),
('repair', 'equipment_failure', 'Ganti Adapter/Power Supply', 'Penggantian adapter modem yang rusak', 75000, false, 'all', 'Termasuk material dan tenaga'),

-- Signal & Connection issues (biasanya gratis troubleshooting)
('repair', 'signal_issue', 'Troubleshooting Signal', 'Perbaikan masalah signal/redaman', 0, true, 'all', 'GRATIS troubleshooting dan perbaikan'),
('repair', 'connection_problem', 'Troubleshooting Koneksi', 'Perbaikan masalah koneksi internet', 0, true, 'all', 'GRATIS troubleshooting dan perbaikan'),
('repair', 'slow_speed', 'Troubleshooting Kecepatan', 'Pengecekan dan perbaikan kecepatan lambat', 0, true, 'all', 'GRATIS troubleshooting dan optimasi'),
('repair', 'no_internet', 'Troubleshooting No Internet', 'Perbaikan tidak ada internet', 0, true, 'all', 'GRATIS troubleshooting dan perbaikan'),
('repair', 'intermittent_connection', 'Perbaikan Koneksi Putus-Putus', 'Troubleshooting koneksi tidak stabil', 0, true, 'all', 'GRATIS troubleshooting dan perbaikan'),
('repair', 'high_ping', 'Optimasi Latency/Ping', 'Troubleshooting dan optimasi ping tinggi', 0, true, 'all', 'GRATIS optimasi network'),
('repair', 'red_light', 'Perbaikan LOS/Lampu Merah', 'Troubleshooting lampu LOS merah pada ONT', 0, true, 'all', 'GRATIS perbaikan, kecuali butuh ganti kabel');

-- ===== MAINTENANCE PRICES =====
INSERT INTO service_pricelist (service_type_code, service_category_code, price_name, description, base_price, is_free, applies_to_package, notes) VALUES
('maintenance', 'preventive_maintenance', 'Maintenance Rutin Tahunan', 'Pemeriksaan dan maintenance rutin tahunan', 0, true, 'all', 'GRATIS untuk pelanggan aktif'),
('maintenance', 'fiber_cleaning', 'Cleaning Konektor Fiber', 'Pembersihan konektor fiber untuk signal optimal', 0, true, 'all', 'GRATIS service'),
('maintenance', 'speed_test', 'Speed Test & Verifikasi', 'Test kecepatan dan verifikasi sesuai paket', 0, true, 'all', 'GRATIS service'),
('maintenance', 'cable_management', 'Rapihkan Kabel', 'Rapihkan instalasi kabel indoor', 50000, false, 'all', 'Biaya tenaga saja'),
('maintenance', 'firmware_update', 'Update Firmware Modem', 'Update firmware modem/ONT', 0, true, 'all', 'GRATIS service');

-- ===== UPGRADE PRICES =====
INSERT INTO service_pricelist (service_type_code, service_category_code, price_name, description, base_price, is_free, applies_to_package, notes) VALUES
('upgrade', 'package_upgrade', 'Biaya Upgrade Paket', 'Biaya admin upgrade ke paket lebih tinggi', 0, true, 'all', 'GRATIS upgrade, langsung berlaku bulan depan'),
('upgrade', 'speed_upgrade', 'Biaya Upgrade Kecepatan', 'Biaya admin upgrade kecepatan', 0, true, 'all', 'GRATIS, hanya perlu config'),
('upgrade', 'equipment_upgrade', 'Upgrade ke Modem/ONT Lebih Baik', 'Upgrade modem ke spec lebih tinggi', 150000, false, 'all', 'Selisih harga modem baru dengan lama'),
('upgrade', 'add_static_ip', 'Tambah Static IP', 'Biaya setup static IP', 100000, false, 'all', 'Biaya setup + bulanan Rp 50.000');

-- ===== WIFI SETUP PRICES =====
INSERT INTO service_pricelist (service_type_code, service_category_code, price_name, description, base_price, is_free, applies_to_package, notes) VALUES
('wifi_setup', 'change_password', 'Ganti Password WiFi', 'Mengganti password dan nama WiFi', 0, true, 'all', 'GRATIS service'),
('wifi_setup', 'new_wifi_config', 'Konfigurasi WiFi Baru', 'Setup WiFi dari awal', 0, true, 'all', 'GRATIS untuk instalasi baru'),
('wifi_setup', 'dual_band_setup', 'Setup WiFi Dual Band', 'Konfigurasi optimal WiFi 2.4GHz & 5GHz', 0, true, 'all', 'GRATIS service'),
('wifi_setup', 'wifi_extension', 'Pasang Access Point Tambahan', 'Instalasi AP untuk extend coverage', 250000, false, 'all', 'Harga AP + instalasi, AP belum termasuk'),
('wifi_setup', 'mesh_network', 'Setup Mesh WiFi Network', 'Instalasi mesh network (2-3 node)', 350000, false, 'all', 'Biaya setup, mesh device belum termasuk'),
('wifi_setup', 'guest_network', 'Setup Guest Network', 'Buat WiFi terpisah untuk tamu', 0, true, 'all', 'GRATIS service'),
('wifi_setup', 'parental_control', 'Setup Parental Control', 'Konfigurasi kontrol untuk anak', 50000, false, 'all', 'Biaya setup dan training');

-- ===== DOWNGRADE PRICES =====
INSERT INTO service_pricelist (service_type_code, service_category_code, price_name, description, base_price, is_free, applies_to_package, notes) VALUES
('downgrade', 'package_downgrade', 'Biaya Downgrade Paket', 'Biaya admin downgrade paket', 0, true, 'all', 'GRATIS, berlaku bulan depan'),
('downgrade', 'speed_downgrade', 'Downgrade Kecepatan', 'Downgrade kecepatan internet', 0, true, 'all', 'GRATIS, hanya config'),
('downgrade', 'remove_static_ip', 'Hapus Static IP', 'Kembali ke dynamic IP', 0, true, 'all', 'GRATIS service');

-- ===== DISMANTLE PRICES =====
INSERT INTO service_pricelist (service_type_code, service_category_code, price_name, description, base_price, is_free, applies_to_package, notes) VALUES
('dismantle', 'full_dismantle', 'Biaya Pemutusan Layanan', 'Biaya admin pemutusan sukarela', 0, true, 'all', 'GRATIS jika sudah berlangganan >3 bulan'),
('dismantle', 'voluntary_termination', 'Pencabutan & Pengembalian Alat', 'Biaya pencabutan instalasi', 150000, false, 'all', 'Jika berlangganan <3 bulan'),
('dismantle', 'temporary_disconnect', 'Suspend Sementara', 'Biaya suspend layanan sementara (max 3 bulan)', 50000, false, 'all', 'Per bulan suspend'),
('dismantle', 'relocation_external', 'Pindah Alamat (Luar Area)', 'Biaya cabut + instalasi ulang', 250000, false, 'all', 'Jika area baru masih ter-cover');

-- ===== BIAYA TAMBAHAN =====
INSERT INTO service_pricelist (service_type_code, service_category_code, price_name, description, base_price, is_free, applies_to_package, notes) VALUES
-- Biaya kabel tambahan
('installation', NULL, 'Kabel Tambahan (per meter)', 'Biaya kabel drop tambahan di atas quota', 5000, false, 'all', 'Per meter kelebihan dari quota paket'),

-- Biaya keterlambatan
('maintenance', NULL, 'Denda Keterlambatan Pembayaran', 'Denda jika terlambat bayar >7 hari', 50000, false, 'all', 'Per bulan keterlambatan'),

-- Biaya reaktivasi
('installation', NULL, 'Biaya Reaktivasi', 'Reaktivasi layanan setelah suspend', 100000, false, 'all', 'Biaya reconnect + admin');

-- Update timestamps
UPDATE service_pricelist SET updated_at = CURRENT_TIMESTAMP;

-- Tampilkan ringkasan
SELECT '=== SERVICE PRICE LIST ===' as info;
SELECT 
    st.type_name,
    spl.price_name,
    CASE 
        WHEN spl.is_free THEN 'GRATIS'
        ELSE CONCAT('Rp ', TO_CHAR(spl.base_price, 'FM999,999,999'))
    END as harga,
    spl.applies_to_package as paket,
    spl.notes
FROM service_pricelist spl
JOIN service_types st ON spl.service_type_code = st.type_code
WHERE spl.is_active = true
ORDER BY st.display_order, spl.base_price DESC;

-- Summary berapa yang gratis vs berbayar
SELECT '=== PRICING SUMMARY ===' as info;
SELECT 
    CASE WHEN is_free THEN 'GRATIS' ELSE 'BERBAYAR' END as kategori,
    COUNT(*) as jumlah_item
FROM service_pricelist
WHERE is_active = true
GROUP BY is_free;

