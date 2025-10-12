-- Migration: Seed 10 Test Registrations with Complete Data
-- Date: 2025-10-11
-- Description: Create diverse test data for workflow testing
-- Varied statuses: pending_verification, verified, survey_scheduled, survey_completed, approved, rejected

-- Insert 10 test registrations
INSERT INTO customer_registrations (
  registration_number, full_name, email, phone, id_card_number,
  address, rt, rw, kelurahan, kecamatan, city, postal_code,
  service_type, package_id, preferred_installation_date, status, notes
) VALUES
-- 1. PENDING VERIFICATION (Fast Track Path)
('REG20251011001', 'Andi Wijaya', 'andi.wijaya@email.com', '081234567001', '3216010101920001',
 'Jl. Raya Karawang Barat No. 123', '001', '005', 'Adiarsa Barat', 'Karawang Barat', 'Karawang', '41311',
 'broadband', 1, '2025-10-15', 'pending_verification', 'Registrasi via online form. Lokasi di area coverage ODP-KRW-001.'),

-- 2. PENDING VERIFICATION (Need Survey)
('REG20251011002', 'Siti Nurhaliza', 'siti.nurhaliza@gmail.com', '081234567002', '3216014502850002',
 'Perum Griya Indah Blok C No. 45', '003', '012', 'Nagasari', 'Karawang Barat', 'Karawang', '41312',
 'broadband', 2, '2025-10-16', 'pending_verification', 'Customer request paket Silver untuk keluarga. Area perumahan baru.'),

-- 3. PENDING VERIFICATION (High Priority)
('REG20251011003', 'Budi Santoso', 'budi.santoso88@yahoo.com', '081234567003', '3216011203880003',
 'Jl. Ahmad Yani No. 78, Komplek Ruko Sentral', '002', '008', 'Karawang Wetan', 'Karawang Timur', 'Karawang', '41314',
 'broadband', 4, '2025-10-13', 'pending_verification', 'Butuh koneksi cepat untuk usaha online. Prefer instalasi secepatnya.'),

-- 4. VERIFIED (Ready for Decision)
('REG20251011004', 'Dewi Lestari', 'dewi.lestari@email.com', '081234567004', '3216016708920004',
 'Jl. Tuparev No. 234, Dekat Pasar', '005', '003', 'Palumbonsari', 'Karawang Timur', 'Karawang', '41315',
 'broadband', 3, '2025-10-17', 'verified', 'Data sudah diverifikasi. Lokasi strategis dekat ODP.'),

-- 5. VERIFIED (Needs Survey Decision)
('REG20251011005', 'Eko Prasetyo', 'eko.prasetyo@outlook.com', '081234567005', '3216012504900005',
 'Perumahan Teluk Jambe Residence No. 89', '004', '015', 'Telukjambe Timur', 'Telukjambe Timur', 'Karawang', '41361',
 'broadband', 2, '2025-10-18', 'verified', 'Data verified. Area perumahan baru, perlu konfirmasi coverage ODP.'),

-- 6. SURVEY SCHEDULED (Survey Besok)
('REG20251011006', 'Fitri Handayani', 'fitri.handayani@gmail.com', '081234567006', '3216013103950006',
 'Jl. Kertabumi No. 156, Kawasan Industri', '001', '002', 'Margakaya', 'Telukjambe Barat', 'Karawang', '41362',
 'broadband', 3, '2025-10-19', 'survey_scheduled', 'Survey dijadwalkan untuk cek jarak ODP ke lokasi customer.'),

-- 7. SURVEY SCHEDULED (Survey Lusa)
('REG20251011007', 'Gunawan Setiawan', 'gunawan.setiawan@email.com', '081234567007', '3216010805870007',
 'Jl. Intercontinental No. 45, Komp. Green Garden', '006', '004', 'Lemahabang', 'Lemahabang', 'Karawang', '41364',
 'broadband', 1, '2025-10-20', 'survey_scheduled', 'Lokasi agak jauh dari pusat kota. Survey untuk confirm coverage.'),

-- 8. SURVEY COMPLETED (Ready to Approve)
('REG20251011008', 'Hendra Kusuma', 'hendra.kusuma@gmail.com', '081234567008', '3216011509910008',
 'Jl. Panatayuda No. 234, Dekat RS', '002', '006', 'Adiarsa Timur', 'Karawang Timur', 'Karawang', '41316',
 'broadband', 4, '2025-10-14', 'survey_completed', 'Survey completed: ODP distance 45m, feasible untuk instalasi.'),

-- 9. APPROVED (Ready to Create Customer)
('REG20251011009', 'Indah Permata Sari', 'indah.permata@yahoo.com', '081234567009', '3216012002930009',
 'Perum Karawang Baru Blok D No. 12', '003', '009', 'Karawang Kulon', 'Karawang Barat', 'Karawang', '41313',
 'broadband', 2, '2025-10-15', 'approved', 'Approved via fast track. Lokasi sudah pasti ada coverage.'),

-- 10. REJECTED (Test Rejection Flow)
('REG20251011010', 'Joko Susilo', 'joko.susilo@email.com', '081234567010', '3216010308890010',
 'Jl. Rengasdengklok Selatan No. 567', '001', '001', 'Rengasdengklok Selatan', 'Rengasdengklok', 'Karawang', '41352',
 'broadband', 3, '2025-10-21', 'rejected', 'Data rejected karena lokasi di luar coverage area.');

-- Update additional fields for specific statuses

-- Survey scheduled - add survey dates
UPDATE customer_registrations 
SET survey_scheduled_date = '2025-10-12 10:00:00'
WHERE registration_number = 'REG20251011006';

UPDATE customer_registrations 
SET survey_scheduled_date = '2025-10-13 14:00:00'
WHERE registration_number = 'REG20251011007';

-- Survey completed - add survey notes and result
UPDATE customer_registrations 
SET 
  survey_scheduled_date = '2025-10-11 09:00:00',
  survey_notes = 'Survey dilakukan pada 11 Okt 2025 pukul 09:00. Nearest ODP: ODP-KRW-003 (distance: 45 meter). Cable needed: 55 meter. No obstacles found. Signal strength: Excellent. CONCLUSION: Location is FEASIBLE for installation.',
  survey_result = 'feasible'
WHERE registration_number = 'REG20251011008';

-- Approved - set verified_by and approved_by
UPDATE customer_registrations 
SET 
  verified_by = 1,
  approved_by = 1,
  approved_at = CURRENT_TIMESTAMP
WHERE registration_number = 'REG20251011009';

-- Rejected - add rejection reason
UPDATE customer_registrations 
SET rejection_reason = 'Lokasi di luar jangkauan coverage ODP terdekat. Jarak ke ODP-KRW-012 lebih dari 500 meter. Tidak feasible untuk instalasi saat ini.'
WHERE registration_number = 'REG20251011010';

-- Verification: Show summary
SELECT 
  'Seed Complete!' as message,
  COUNT(*) as total_created,
  COUNT(CASE WHEN status = 'pending_verification' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified,
  COUNT(CASE WHEN status = 'survey_scheduled' THEN 1 END) as survey_scheduled,
  COUNT(CASE WHEN status = 'survey_completed' THEN 1 END) as survey_completed,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM customer_registrations;

-- Show all created registrations
SELECT 
  registration_number,
  full_name,
  email,
  phone,
  status,
  package_id
FROM customer_registrations
ORDER BY registration_number;

-- Migration complete
SELECT '✅ Migration 027: 10 test registrations with complete data - SUCCESS' as result;
