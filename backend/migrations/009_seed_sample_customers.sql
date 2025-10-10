-- Seed sample customer data
-- Migration 009: Insert sample customers for testing (FTTH/Broadband/Rumahan di Karawang)

-- Hapus data dummy yang ada
DELETE FROM customer_payments;
DELETE FROM customer_equipment;
DELETE FROM customers;

-- Reset sequence
ALTER SEQUENCE customers_id_seq RESTART WITH 1;
ALTER SEQUENCE customer_equipment_id_seq RESTART WITH 1;
ALTER SEQUENCE customer_payments_id_seq RESTART WITH 1;

-- Insert sample customers (Fokus pada pelanggan FTTH/Broadband/Rumahan di Karawang)
INSERT INTO customers (
    customer_id, name, ktp, phone, phone_alt, email, address,
    latitude, longitude, odp, pic_name, pic_position, pic_phone,
    business_type, operating_hours, username, password, client_area_password,
    customer_type, payment_type, service_type, package_id,
    subscription_start_date, billing_cycle, due_date, ip_address, ip_type,
    notes, registration_date, account_activation_date
) VALUES
-- Customer 1: Home Bronze di Karawang Barat
('CUST001', 'Budi Santoso', '3215234567890123', '081234567890', '0267654321', 'budi.santoso@email.com', 
 'Jl. Tuparev Raya No. 123, RT 01/RW 03, Adiarsa Barat, Karawang Barat, Karawang 41311',
 -6.318611, 107.301389, 'ODP-KRW-001-A12', 'Budi Santoso', 'Kepala Keluarga', '081234567890',
 'residential', '06:00-22:00', 'CUST001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'regular', 'postpaid', 'broadband', 1,
 '2025-01-01', 'monthly', '2025-02-01', '192.168.1.100', 'dynamic',
 'Pelanggan baru, paket Bronze - browsing dan streaming ringan', '2025-01-01 10:00:00', '2025-01-01 15:30:00'),

-- Customer 2: Home Silver di Telukjambe Timur
('CUST002', 'Siti Nurhaliza', '3215234567890124', '085234567890', NULL, 'siti.nurhaliza@gmail.com',
 'Jl. Panatayuda I No. 45, RT 02/RW 05, Telukjambe Timur, Karawang 41361',
 -6.291111, 107.297778, 'ODP-KRW-009-I14', 'Siti Nurhaliza', 'Ibu Rumah Tangga', '085234567890',
 'residential', '24/7', 'CUST002', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'regular', 'prepaid', 'broadband', 2,
 '2024-12-15', 'monthly', '2025-01-15', '192.168.2.150', 'dynamic',
 'Work from home, paket Silver - cocok untuk keluarga dan WFH', '2024-12-15 11:00:00', '2024-12-15 16:45:00'),

-- Customer 3: Home Gold di Karawang Timur
('CUST003', 'Ahmad Hidayat', '3215012345678901', '082345678901', '0267456789', 'ahmad.hidayat@yahoo.com',
 'Jl. Galuh Mas Blok C No. 12, RT 03/RW 06, Karawang Timur, Karawang 41314',
 -6.310833, 107.328611, 'ODP-KRW-006-F12', 'Ahmad Hidayat', 'Karyawan Swasta', '082345678901',
 'residential', '06:00-23:00', 'CUST003', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'regular', 'postpaid', 'broadband', 3,
 '2024-11-20', 'monthly', '2024-12-20', '192.168.3.180', 'dynamic',
 'Gamer dan content creator, paket Gold - gaming dan streaming HD', '2024-11-20 09:30:00', '2024-11-20 14:00:00'),

-- Customer 4: Home Platinum di Telukjambe Timur
('CUST004', 'Dewi Lestari', '3215023456789012', '083456789012', '0267567890', 'dewi.lestari@gmail.com',
 'Jl. Kota Baru Parahyangan Blok A5 No. 8, RT 01/RW 02, Telukjambe Timur, Karawang 41361',
 -6.287222, 107.302500, 'ODP-KRW-010-J22', 'Dewi Lestari', 'Pengusaha Online', '083456789012',
 'residential', '24/7', 'CUST004', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'regular', 'postpaid', 'broadband', 4,
 '2024-10-10', 'monthly', '2024-11-10', '192.168.4.200', 'dynamic',
 'Bisnis online shop, paket Platinum - kebutuhan maksimal untuk usaha', '2024-10-10 08:30:00', '2024-10-10 13:15:00'),

-- Customer 5: Home Bronze di Klari
('CUST005', 'Eko Prasetyo', '3215034567890123', '084567890123', NULL, 'eko.prasetyo@outlook.com',
 'Jl. Raya Klari No. 67, RT 02/RW 04, Klari, Karawang 41371',
 -6.268889, 107.362500, 'ODP-KRW-014-N12', 'Eko Prasetyo', 'Pensiunan', '084567890123',
 'residential', '08:00-20:00', 'CUST005', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'regular', 'postpaid', 'broadband', 1,
 '2024-09-05', 'monthly', '2024-10-05', '192.168.5.120', 'dynamic',
 'Pensiunan, paket Bronze - untuk browsing dan komunikasi', '2024-09-05 10:00:00', '2024-09-05 15:00:00'),

-- Customer 6: Home Silver di Cikampek
('CUST006', 'Rina Wijaya', '3215045678901234', '085678901234', '0267876543', 'rina.wijaya@gmail.com',
 'Jl. Ir. H. Juanda No. 89, RT 04/RW 07, Cikampek, Karawang 41373',
 -6.416667, 107.450000, 'ODP-KRW-016-P10', 'Rina Wijaya', 'Guru', '085678901234',
 'residential', '06:00-22:00', 'CUST006', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'regular', 'prepaid', 'broadband', 2,
 '2024-08-15', 'monthly', '2024-09-15', '192.168.6.145', 'dynamic',
 'Guru, paket Silver - untuk mengajar online dan video conference', '2024-08-15 11:30:00', '2024-08-15 16:00:00'),

-- Customer 7: Home Gold di Rengasdengklok
('CUST007', 'Faisal Rahman', '3215056789012345', '086789012345', '0267123456', 'faisal.rahman@yahoo.com',
 'Jl. Proklamasi No. 34, RT 03/RW 05, Rengasdengklok, Karawang 41352',
 -6.161111, 107.301667, 'ODP-KRW-019-S12', 'Faisal Rahman', 'Freelancer IT', '086789012345',
 'residential', '24/7', 'CUST007', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'regular', 'postpaid', 'broadband', 3,
 '2024-07-22', 'monthly', '2024-08-22', '192.168.7.165', 'dynamic',
 'Freelancer IT, paket Gold - untuk development dan meeting online', '2024-07-22 09:00:00', '2024-07-22 14:30:00'),

-- Customer 8: Home Platinum di Tirtajaya
('CUST008', 'Maya Anggraini', '3215067890123456', '087890123456', NULL, 'maya.anggraini@gmail.com',
 'Jl. Tirtajaya, Perumahan Tirtajaya Indah Blok B No. 15, RT 02/RW 03, Tirtajaya, Karawang 41316',
 -6.299444, 107.343056, 'ODP-KRW-021-U14', 'Maya Anggraini', 'Designer Grafis', '087890123456',
 'residential', '24/7', 'CUST008', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'regular', 'postpaid', 'broadband', 4,
 '2024-06-10', 'monthly', '2024-07-10', '192.168.8.185', 'dynamic',
 'Designer Grafis, paket Platinum - upload/download file besar', '2024-06-10 10:30:00', '2024-06-10 15:45:00');

-- Insert sample equipment for customers
INSERT INTO customer_equipment (
    customer_id, equipment_type, brand, model, serial_number, mac_address,
    installation_date, warranty_expiry, status, notes
) VALUES
-- Equipment for Customer 1 (Home Bronze)
(1, 'modem', 'TP-Link', 'Archer C6', 'TL001234567', '00:11:22:33:44:55', '2025-01-01', '2027-01-01', 'active', 'Modem WiFi dual band'),
(1, 'cable', 'Belden', 'Cat6 UTP', 'BLD-001', NULL, '2025-01-01', NULL, 'active', 'Kabel 50 meter dari ODP ke rumah'),

-- Equipment for Customer 2 (Home Silver)
(2, 'modem', 'Huawei', 'HG8245H', 'HW555666777', '00:22:33:44:55:66', '2024-12-15', '2026-12-15', 'active', 'ONT Fiber dengan WiFi AC'),
(2, 'cable', 'Belden', 'Cat6 UTP', 'BLD-002', NULL, '2024-12-15', NULL, 'active', 'Kabel 60 meter dari ODP'),

-- Equipment for Customer 3 (Home Gold)
(3, 'modem', 'ZTE', 'F670L', 'ZT888999000', '00:33:44:55:66:77', '2024-11-20', '2026-11-20', 'active', 'ONT Fiber dual band WiFi'),
(3, 'cable', 'Belden', 'Cat6 UTP', 'BLD-003', NULL, '2024-11-20', NULL, 'active', 'Kabel 45 meter dari ODP'),

-- Equipment for Customer 4 (Home Platinum)
(4, 'modem', 'Fiberhome', 'HG6245D', 'FH111222333', '00:44:55:66:77:88', '2024-10-10', '2026-10-10', 'active', 'ONT Fiber WiFi 5'),
(4, 'cable', 'Belden', 'Cat6 UTP', 'BLD-004', NULL, '2024-10-10', NULL, 'active', 'Kabel 70 meter dari ODP'),

-- Equipment for Customer 5 (Home Bronze)
(5, 'modem', 'TP-Link', 'Archer C50', 'TL444555666', '00:55:66:77:88:99', '2024-09-05', '2026-09-05', 'active', 'Modem WiFi standar'),
(5, 'cable', 'Belden', 'Cat6 UTP', 'BLD-005', NULL, '2024-09-05', NULL, 'active', 'Kabel 40 meter dari ODP'),

-- Equipment for Customer 6 (Home Silver)
(6, 'modem', 'Huawei', 'HG8245H5', 'HW777888999', '00:66:77:88:99:AA', '2024-08-15', '2026-08-15', 'active', 'ONT Fiber WiFi AC'),
(6, 'cable', 'Belden', 'Cat6 UTP', 'BLD-006', NULL, '2024-08-15', NULL, 'active', 'Kabel 55 meter dari ODP'),

-- Equipment for Customer 7 (Home Gold)
(7, 'modem', 'ZTE', 'F670', 'ZT000111222', '00:77:88:99:AA:BB', '2024-07-22', '2026-07-22', 'active', 'ONT Fiber dual band'),
(7, 'cable', 'Belden', 'Cat6 UTP', 'BLD-007', NULL, '2024-07-22', NULL, 'active', 'Kabel 65 meter dari ODP'),

-- Equipment for Customer 8 (Home Platinum)
(8, 'modem', 'Fiberhome', 'HG6245N', 'FH333444555', '00:88:99:AA:BB:CC', '2024-06-10', '2026-06-10', 'active', 'ONT Fiber WiFi 6'),
(8, 'cable', 'Belden', 'Cat6 UTP', 'BLD-008', NULL, '2024-06-10', NULL, 'active', 'Kabel 75 meter dari ODP');

-- Insert sample payment history
INSERT INTO customer_payments (
    customer_id, invoice_number, payment_date, amount, payment_method,
    payment_reference, billing_period_start, billing_period_end, payment_status, notes
) VALUES
-- Payments for Customer 1 (Home Bronze - Rp 149,900)
(1, 'INV-2025-000001', '2025-01-01', 149900.00, 'transfer', 'TRF-001-2025', '2025-01-01', '2025-01-31', 'completed', 'Pembayaran bulan pertama - Home Bronze'),
(1, 'INV-2025-000009', '2025-02-01', 149900.00, 'transfer', 'TRF-009-2025', '2025-02-01', '2025-02-28', 'completed', 'Pembayaran bulan kedua'),

-- Payments for Customer 2 (Home Silver - Rp 199,900)
(2, 'INV-2024-000002', '2024-12-15', 199900.00, 'cash', 'CASH-001-2024', '2024-12-15', '2025-01-15', 'completed', 'Pembayaran tunai - Home Silver'),
(2, 'INV-2025-000010', '2025-01-15', 199900.00, 'transfer', 'TRF-010-2025', '2025-01-15', '2025-02-15', 'completed', 'Pembayaran transfer'),

-- Payments for Customer 3 (Home Gold - Rp 249,900)
(3, 'INV-2024-000003', '2024-11-20', 249900.00, 'transfer', 'TRF-003-2024', '2024-11-20', '2024-12-20', 'completed', 'Pembayaran bulanan - Home Gold'),
(3, 'INV-2024-000011', '2024-12-20', 249900.00, 'transfer', 'TRF-011-2024', '2024-12-20', '2025-01-20', 'completed', 'Pembayaran berikutnya'),

-- Payments for Customer 4 (Home Platinum - Rp 289,900)
(4, 'INV-2024-000004', '2024-10-10', 289900.00, 'transfer', 'TRF-004-2024', '2024-10-10', '2024-11-10', 'completed', 'Pembayaran bulanan - Home Platinum'),
(4, 'INV-2024-000012', '2024-11-10', 289900.00, 'transfer', 'TRF-012-2024', '2024-11-10', '2024-12-10', 'completed', 'Pembayaran berikutnya'),
(4, 'INV-2024-000013', '2024-12-10', 289900.00, 'transfer', 'TRF-013-2024', '2024-12-10', '2025-01-10', 'completed', 'Pembayaran berikutnya'),

-- Payments for Customer 5 (Home Bronze - Rp 149,900)
(5, 'INV-2024-000005', '2024-09-05', 149900.00, 'transfer', 'TRF-005-2024', '2024-09-05', '2024-10-05', 'completed', 'Pembayaran bulanan - Home Bronze'),
(5, 'INV-2024-000014', '2024-10-05', 149900.00, 'transfer', 'TRF-014-2024', '2024-10-05', '2024-11-05', 'completed', 'Pembayaran berikutnya'),
(5, 'INV-2024-000015', '2024-11-05', 149900.00, 'transfer', 'TRF-015-2024', '2024-11-05', '2024-12-05', 'completed', 'Pembayaran berikutnya'),
(5, 'INV-2024-000016', '2024-12-05', 149900.00, 'transfer', 'TRF-016-2024', '2024-12-05', '2025-01-05', 'completed', 'Pembayaran berikutnya'),

-- Payments for Customer 6 (Home Silver - Rp 199,900)
(6, 'INV-2024-000006', '2024-08-15', 199900.00, 'transfer', 'TRF-006-2024', '2024-08-15', '2024-09-15', 'completed', 'Pembayaran bulanan - Home Silver'),
(6, 'INV-2024-000017', '2024-09-15', 199900.00, 'transfer', 'TRF-017-2024', '2024-09-15', '2024-10-15', 'completed', 'Pembayaran berikutnya'),
(6, 'INV-2024-000018', '2024-10-15', 199900.00, 'transfer', 'TRF-018-2024', '2024-10-15', '2024-11-15', 'completed', 'Pembayaran berikutnya'),
(6, 'INV-2024-000019', '2024-11-15', 199900.00, 'transfer', 'TRF-019-2024', '2024-11-15', '2024-12-15', 'completed', 'Pembayaran berikutnya'),
(6, 'INV-2024-000020', '2024-12-15', 199900.00, 'transfer', 'TRF-020-2024', '2024-12-15', '2025-01-15', 'completed', 'Pembayaran berikutnya'),

-- Payments for Customer 7 (Home Gold - Rp 249,900)
(7, 'INV-2024-000007', '2024-07-22', 249900.00, 'transfer', 'TRF-007-2024', '2024-07-22', '2024-08-22', 'completed', 'Pembayaran bulanan - Home Gold'),
(7, 'INV-2024-000021', '2024-08-22', 249900.00, 'transfer', 'TRF-021-2024', '2024-08-22', '2024-09-22', 'completed', 'Pembayaran berikutnya'),
(7, 'INV-2024-000022', '2024-09-22', 249900.00, 'transfer', 'TRF-022-2024', '2024-09-22', '2024-10-22', 'completed', 'Pembayaran berikutnya'),
(7, 'INV-2024-000023', '2024-10-22', 249900.00, 'transfer', 'TRF-023-2024', '2024-10-22', '2024-11-22', 'completed', 'Pembayaran berikutnya'),
(7, 'INV-2024-000024', '2024-11-22', 249900.00, 'transfer', 'TRF-024-2024', '2024-11-22', '2024-12-22', 'completed', 'Pembayaran berikutnya'),
(7, 'INV-2024-000025', '2024-12-22', 249900.00, 'transfer', 'TRF-025-2024', '2024-12-22', '2025-01-22', 'completed', 'Pembayaran berikutnya'),

-- Payments for Customer 8 (Home Platinum - Rp 289,900)
(8, 'INV-2024-000008', '2024-06-10', 289900.00, 'transfer', 'TRF-008-2024', '2024-06-10', '2024-07-10', 'completed', 'Pembayaran bulanan - Home Platinum'),
(8, 'INV-2024-000026', '2024-07-10', 289900.00, 'transfer', 'TRF-026-2024', '2024-07-10', '2024-08-10', 'completed', 'Pembayaran berikutnya'),
(8, 'INV-2024-000027', '2024-08-10', 289900.00, 'transfer', 'TRF-027-2024', '2024-08-10', '2024-09-10', 'completed', 'Pembayaran berikutnya'),
(8, 'INV-2024-000028', '2024-09-10', 289900.00, 'transfer', 'TRF-028-2024', '2024-09-10', '2024-10-10', 'completed', 'Pembayaran berikutnya'),
(8, 'INV-2024-000029', '2024-10-10', 289900.00, 'transfer', 'TRF-029-2024', '2024-10-10', '2024-11-10', 'completed', 'Pembayaran berikutnya'),
(8, 'INV-2024-000030', '2024-11-10', 289900.00, 'transfer', 'TRF-030-2024', '2024-11-10', '2024-12-10', 'completed', 'Pembayaran berikutnya'),
(8, 'INV-2024-000031', '2024-12-10', 289900.00, 'transfer', 'TRF-031-2024', '2024-12-10', '2025-01-10', 'completed', 'Pembayaran berikutnya');

-- Update customer statistics
UPDATE customers SET 
    total_tickets = 0,
    customer_rating = 4.5,
    service_quality_score = 85
WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8);

-- Update timestamps
UPDATE customers SET created_at = registration_date, updated_at = registration_date WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8);
UPDATE customer_equipment SET created_at = installation_date, updated_at = installation_date;
UPDATE customer_payments SET created_at = payment_date, updated_at = payment_date;
