-- Update Technicians for Karawang Area
-- Migration 013: Update dan tambah teknisi dengan zona kerja Karawang

-- Hapus data teknisi lama
DELETE FROM technicians;

-- Reset sequence
ALTER SEQUENCE technicians_id_seq RESTART WITH 1;

-- Insert teknisi baru dengan zona Karawang
INSERT INTO technicians (
    user_id, employee_id, full_name, phone, phone_alt, email, address,
    emergency_contact_name, emergency_contact_phone,
    hire_date, employment_status, position, department,
    skill_level, specializations, work_zone, max_daily_tickets,
    preferred_shift, total_tickets_completed, customer_rating, sla_compliance_rate,
    is_available, availability_status
) VALUES
-- Teknisi 1: Senior FTTH - Karawang Barat
((SELECT id FROM users WHERE username = 'tech1'), 'TECH001', 'Ahmad Fauzi', '0267811001', '081234567890', 'ahmad.fauzi@aglisnet.id',
 'Jl. Tuparev No. 45, Karawang Barat, Karawang',
 'Siti Aminah', '081234567891',
 '2023-01-15', 'active', 'senior_technician', 'field_operations',
 'senior', ARRAY['ftth_installation', 'fiber_splicing', 'troubleshooting', 'otdr_testing'], 
 'Karawang Barat', 10, 'day', 156, 4.7, 94.50, true, 'available'),

-- Teknisi 2: Senior FTTH - Karawang Timur
((SELECT id FROM users WHERE username = 'tech2'), 'TECH002', 'Budi Santoso', '0267811002', '082345678901', 'budi.santoso@aglisnet.id',
 'Jl. Pancasila No. 67, Karawang Timur, Karawang',
 'Ani Budi', '082345678902',
 '2023-03-20', 'active', 'senior_technician', 'field_operations',
 'senior', ARRAY['ftth_installation', 'repair', 'wifi_setup', 'customer_service'],
 'Karawang Timur', 10, 'day', 142, 4.6, 92.30, true, 'available'),

-- Teknisi 3: Expert/Supervisor - Mobile (All Area)
((SELECT id FROM users WHERE username = 'supervisor'), 'TECH003', 'Candra Wijaya', '0267811003', '083456789012', 'candra.wijaya@aglisnet.id',
 'Jl. Arteri Taman Karawang No. 12, Karawang Barat',
 'Dewi Candra', '083456789013',
 '2022-06-10', 'active', 'field_supervisor', 'field_operations',
 'expert', ARRAY['ftth_installation', 'fiber_splicing', 'otdr_testing', 'network_design', 'team_management'],
 'Karawang (Mobile)', 6, 'flexible', 203, 4.8, 96.70, true, 'available'),

-- Teknisi 4: Junior - Telukjambe Timur
((SELECT id FROM users WHERE username = 'tech4'), 'TECH004', 'Dedi Hermawan', '0267811004', '084567890123', 'dedi.hermawan@aglisnet.id',
 'Jl. Panatayuda I No. 23, Telukjambe Timur, Karawang',
 'Rina Dedi', '084567890124',
 '2024-02-15', 'active', 'junior_technician', 'field_operations',
 'junior', ARRAY['ftth_installation', 'basic_repair', 'wifi_setup'],
 'Telukjambe Timur', 8, 'day', 45, 4.3, 88.20, true, 'available'),

-- Teknisi 5: Senior - Telukjambe Barat & Klari
(NULL, 'TECH005', 'Eko Prasetyo', '0267811005', '085678901234', 'eko.prasetyo@aglisnet.id',
 'Jl. Wirasaba No. 56, Telukjambe Barat, Karawang',
 'Sri Eko', '085678901235',
 '2023-05-12', 'active', 'senior_technician', 'field_operations',
 'senior', ARRAY['ftth_installation', 'repair', 'troubleshooting', 'fiber_splicing'],
 'Telukjambe Barat-Klari', 9, 'day', 128, 4.5, 91.80, true, 'available'),

-- Teknisi 6: Junior - Cikampek & Rengasdengklok
(NULL, 'TECH006', 'Faisal Rahman', '0267811006', '086789012345', 'faisal.rahman@aglisnet.id',
 'Jl. Ir. H. Juanda No. 78, Cikampek, Karawang',
 'Nurul Faisal', '086789012346',
 '2024-04-01', 'active', 'junior_technician', 'field_operations',
 'junior', ARRAY['ftth_installation', 'basic_repair', 'customer_service'],
 'Cikampek-Rengasdengklok', 8, 'day', 32, 4.2, 86.50, true, 'available'),

-- Teknisi 7: Specialist - Network Engineer (Support)
(NULL, 'TECH007', 'Gilang Ramadhan', '0267811007', '087890123456', 'gilang.ramadhan@aglisnet.id',
 'Jl. Galuh Mas Blok D No. 9, Karawang Timur',
 'Maya Gilang', '087890123457',
 '2022-11-20', 'active', 'network_engineer', 'technical_support',
 'specialist', ARRAY['network_troubleshooting', 'otdr_testing', 'splicing', 'core_network', 'odp_management'],
 'Karawang (Mobile)', 5, 'flexible', 178, 4.7, 95.40, true, 'available'),

-- Teknisi 8: Junior - Area Purwakarta & Sekitar
(NULL, 'TECH008', 'Hendra Gunawan', '0267811008', '088901234567', 'hendra.gunawan@aglisnet.id',
 'Jl. Veteran No. 34, Purwakarta',
 'Linda Hendra', '088901234568',
 '2024-05-15', 'active', 'junior_technician', 'field_operations',
 'junior', ARRAY['ftth_installation', 'basic_repair', 'wifi_setup'],
 'Purwakarta-Tirtajaya', 8, 'day', 28, 4.1, 85.30, true, 'available');

-- Update supervisor relationship (Candra sebagai supervisor untuk junior techs)
UPDATE technicians SET supervisor_id = (SELECT id FROM technicians WHERE employee_id = 'TECH003')
WHERE employee_id IN ('TECH004', 'TECH006', 'TECH008');

-- Update timestamps
UPDATE technicians SET created_at = hire_date, updated_at = CURRENT_TIMESTAMP;

-- Tampilkan ringkasan
SELECT '=== TECHNICIANS KARAWANG ===' as info;
SELECT employee_id, full_name, skill_level, work_zone, employment_status 
FROM technicians 
ORDER BY id;

