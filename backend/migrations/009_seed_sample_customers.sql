-- Seed sample customer data
-- Migration 009: Insert sample customers for testing

-- Insert sample customers
INSERT INTO customers (
    customer_id, name, ktp, phone, phone_alt, email, address,
    latitude, longitude, odp, pic_name, pic_position, pic_phone,
    business_type, operating_hours, username, password, client_area_password,
    customer_type, payment_type, service_type, package_id,
    subscription_start_date, billing_cycle, due_date, ip_address, ip_type,
    notes, registration_date, account_activation_date
) VALUES
-- Customer 1: Home Basic
('CUST001', 'Budi Santoso', '3201234567890123', '081234567890', '0217654321', 'budi.santoso@email.com', 
 'Jl. Merdeka No. 123, RT 01/RW 05, Kelurahan Merdeka, Kecamatan Pusat, Jakarta Pusat 10110',
 -6.200000, 106.816666, 'ODP-JKT-001-A12', 'Budi Santoso', 'Kepala Keluarga', '081234567890',
 'residential', '06:00-22:00', 'CUST001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'regular', 'postpaid', 'broadband', 1,
 '2025-01-01', 'monthly', '2025-01-31', '192.168.1.100', 'dynamic',
 'Pelanggan baru, instalasi lancar', '2025-01-01 10:00:00', '2025-01-01 15:30:00'),

-- Customer 2: Corporate Standard
('CORP001', 'PT Maju Jaya', '1234567890123456', '02187654321', '081987654321', 'admin@majujaya.co.id',
 'Jl. Sudirman No. 456, Lantai 5, Gedung Plaza Bisnis, Jakarta Selatan 12190',
 -6.225000, 106.800000, 'ODP-JKT-002-B15', 'Sari Dewi', 'IT Manager', '081987654321',
 'office', '08:00-17:00', 'CORP001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'regular', 'postpaid', 'corporate', 6,
 '2024-12-01', 'monthly', '2025-01-01', '203.142.1.50', 'static',
 'Perusahaan IT, butuh koneksi stabil', '2024-12-01 09:00:00', '2024-12-01 14:00:00'),

-- Customer 3: Home Premium
('CUST002', 'Siti Nurhaliza', '3301234567890124', '085234567890', NULL, 'siti.nurhaliza@gmail.com',
 'Jl. Diponegoro No. 789, RT 03/RW 07, Kelurahan Diponegoro, Kecamatan Timur, Surabaya 60111',
 -7.250000, 112.750000, 'ODP-SBY-001-C08', 'Siti Nurhaliza', 'Ibu Rumah Tangga', '085234567890',
 'residential', '24/7', 'CUST002', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'regular', 'prepaid', 'broadband', 3,
 '2024-11-15', 'monthly', '2024-12-15', '192.168.2.150', 'dynamic',
 'Work from home, butuh bandwidth besar', '2024-11-15 11:00:00', '2024-11-15 16:45:00'),

-- Customer 4: Dedicated
('DED001', 'CV Digital Kreatif', '5678901234567890', '0318765432', '081876543210', 'info@digitalkreatif.id',
 'Jl. Gatot Subroto No. 321, Ruko Digital Center Blok A-5, Bandung 40262',
 -6.900000, 107.600000, 'ODP-BDG-003-D20', 'Ahmad Fauzi', 'CEO', '081876543210',
 'shop', '09:00-21:00', 'DED001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'regular', 'postpaid', 'dedicated', 8,
 '2024-10-01', 'monthly', '2024-11-01', '203.142.2.100', 'static',
 'Agensi digital, butuh koneksi dedicated', '2024-10-01 08:30:00', '2024-10-01 13:15:00'),

-- Customer 5: Mitra
('MITRA001', 'Warnet Galaxy', '9876543210987654', '0274567890', '082567890123', 'owner@warnetgalaxy.com',
 'Jl. Malioboro No. 567, Yogyakarta 55213',
 -7.795000, 110.365000, 'ODP-YGY-001-E12', 'Bambang Sutrisno', 'Pemilik', '082567890123',
 'shop', '08:00-24:00', 'MITRA001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'regular', 'postpaid', 'mitra', 11,
 '2024-09-01', 'monthly', '2024-10-01', '192.168.3.200', 'dynamic',
 'Warnet dengan 20 unit PC, mitra reseller', '2024-09-01 10:00:00', '2024-09-01 15:00:00');

-- Insert sample equipment for customers
INSERT INTO customer_equipment (
    customer_id, equipment_type, brand, model, serial_number, mac_address,
    installation_date, warranty_expiry, status, notes
) VALUES
-- Equipment for Customer 1
(1, 'modem', 'TP-Link', 'Archer C6', 'TL001234567', '00:11:22:33:44:55', '2025-01-01', '2027-01-01', 'active', 'Modem WiFi dual band'),
(1, 'cable', 'Belden', 'Cat6 UTP', 'BLD-001', NULL, '2025-01-01', NULL, 'active', 'Kabel 50 meter dari ODP ke rumah'),

-- Equipment for Customer 2
(2, 'router', 'Cisco', 'ISR4321', 'CSC987654321', '00:AA:BB:CC:DD:EE', '2024-12-01', '2027-12-01', 'active', 'Router enterprise grade'),
(2, 'switch', 'HP', 'ProCurve 2524', 'HP123456789', '00:FF:EE:DD:CC:BB', '2024-12-01', '2027-12-01', 'active', 'Switch 24 port managed'),

-- Equipment for Customer 3
(3, 'modem', 'Huawei', 'HG8245H', 'HW555666777', '00:22:33:44:55:66', '2024-11-15', '2026-11-15', 'active', 'ONT Fiber dengan WiFi AC'),

-- Equipment for Customer 4
(4, 'router', 'MikroTik', 'RB4011iGS+', 'MT111222333', '00:33:44:55:66:77', '2024-10-01', '2026-10-01', 'active', 'Router dedicated dengan load balancing'),

-- Equipment for Customer 5
(5, 'router', 'Ubiquiti', 'EdgeRouter X', 'UB444555666', '00:44:55:66:77:88', '2024-09-01', '2026-09-01', 'active', 'Router untuk warnet dengan bandwidth management');

-- Insert sample payment history
INSERT INTO customer_payments (
    customer_id, invoice_number, payment_date, amount, payment_method,
    payment_reference, billing_period_start, billing_period_end, payment_status, notes
) VALUES
-- Payments for Customer 1
(1, 'INV-2025-000001', '2025-01-01', 150000.00, 'transfer', 'TRF-001-2025', '2025-01-01', '2025-01-31', 'completed', 'Pembayaran bulan pertama'),

-- Payments for Customer 2
(2, 'INV-2024-000001', '2024-12-01', 2500000.00, 'transfer', 'TRF-002-2024', '2024-12-01', '2024-12-31', 'completed', 'Pembayaran corporate bulanan'),

-- Payments for Customer 3
(3, 'INV-2024-000002', '2024-11-15', 450000.00, 'cash', 'CASH-001-2024', '2024-11-15', '2024-12-15', 'completed', 'Pembayaran tunai'),

-- Payments for Customer 4
(4, 'INV-2024-000003', '2024-10-01', 2000000.00, 'transfer', 'TRF-003-2024', '2024-10-01', '2024-10-31', 'completed', 'Pembayaran dedicated line'),

-- Payments for Customer 5
(5, 'INV-2024-000004', '2024-09-01', 3000000.00, 'transfer', 'TRF-004-2024', '2024-09-01', '2024-09-30', 'completed', 'Pembayaran mitra bulanan');

-- Update customer statistics
UPDATE customers SET 
    total_tickets = 0,
    customer_rating = 4.5,
    service_quality_score = 85
WHERE id IN (1, 2, 3, 4, 5);

-- Update timestamps
UPDATE customers SET created_at = registration_date, updated_at = registration_date WHERE id IN (1, 2, 3, 4, 5);
UPDATE customer_equipment SET created_at = installation_date, updated_at = installation_date;
UPDATE customer_payments SET created_at = payment_date, updated_at = payment_date;
