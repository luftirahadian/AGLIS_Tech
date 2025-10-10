-- Update Users with Professional Names
-- Migration 014: Update users dan tambah CS staff untuk operasional Karawang

-- Update existing users dengan nama profesional
UPDATE users SET 
    full_name = 'Rizki Maulana',
    email = 'rizki.maulana@aglisnet.id',
    phone = '0267800001',
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'admin';

UPDATE users SET 
    full_name = 'Candra Wijaya',
    email = 'candra.wijaya@aglisnet.id',
    phone = '0267811003',
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'supervisor';

UPDATE users SET 
    full_name = 'Ahmad Fauzi',
    email = 'ahmad.fauzi@aglisnet.id',
    phone = '0267811001',
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'tech1';

UPDATE users SET 
    full_name = 'Budi Santoso',
    email = 'budi.santoso@aglisnet.id',
    phone = '0267811002',
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'tech2';

UPDATE users SET 
    full_name = 'Dedi Hermawan',
    email = 'dedi.hermawan@aglisnet.id',
    phone = '0267811004',
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'tech4';

UPDATE users SET 
    full_name = 'Sari Purnama',
    email = 'sari.purnama@aglisnet.id',
    phone = '0267800101',
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'cs1';

-- Tambah user untuk teknisi baru (yang belum punya user account)
INSERT INTO users (username, password_hash, email, full_name, role, phone, is_active, last_login) VALUES
-- Tech 5
('tech5', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'eko.prasetyo@aglisnet.id', 'Eko Prasetyo', 'technician', '0267811005', true, NULL),
-- Tech 6
('tech6', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faisal.rahman@aglisnet.id', 'Faisal Rahman', 'technician', '0267811006', true, NULL),
-- Tech 7
('tech7', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'gilang.ramadhan@aglisnet.id', 'Gilang Ramadhan', 'technician', '0267811007', true, NULL),
-- Tech 8
('tech8', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hendra.gunawan@aglisnet.id', 'Hendra Gunawan', 'technician', '0267811008', true, NULL),

-- Customer Service Staff tambahan
('cs2', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'tika.lestari@aglisnet.id', 'Tika Lestari', 'customer_service', '0267800102', true, NULL),
('cs3', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'wulan.sari@aglisnet.id', 'Wulan Sari', 'customer_service', '0267800103', true, NULL),

-- Billing Staff
('billing1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'indah.permata@aglisnet.id', 'Indah Permata', 'customer_service', '0267800104', true, NULL),

-- NOC (Network Operations Center) Staff
('noc1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'wahyu.hidayat@aglisnet.id', 'Wahyu Hidayat', 'supervisor', '0267800201', true, NULL)

ON CONFLICT (username) DO NOTHING;

-- Update timestamps
UPDATE users SET updated_at = CURRENT_TIMESTAMP;

-- Tampilkan ringkasan
SELECT '=== USERS UPDATED ===' as info;
SELECT username, full_name, role, phone, email 
FROM users 
WHERE role != 'customer'
ORDER BY 
    CASE role
        WHEN 'admin' THEN 1
        WHEN 'supervisor' THEN 2
        WHEN 'technician' THEN 3
        WHEN 'customer_service' THEN 4
        ELSE 5
    END,
    username;

