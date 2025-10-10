-- Migration: Add 20 dummy customers for testing
-- Purpose: Populate customers table with diverse test data

INSERT INTO customers (
  customer_id, name, phone, email, address, 
  package_id, account_status, installation_date, 
  odp, username, password, client_area_password,
  notes, created_at, updated_at
) VALUES
-- Active Customers (15 customers)
('CST00013', 'Agus Setiawan', '081298765432', 'agus.setiawan@email.com', 'Jl. Ahmad Yani No. 45, Karawang Wetan', 2, 'active', NOW() - INTERVAL '3 months', 'ODP-KRW-01', 'agus.setiawan', '$2a$10$hashedpassword1', 'clientpass1', 'Pelanggan lancar, pembayaran tepat waktu', NOW() - INTERVAL '3 months', NOW()),
('CST00014', 'Sri Wahyuni', '082187654321', 'sri.wahyuni@email.com', 'Jl. Tuparev No. 123, Telukjambe Timur', 1, 'active', NOW() - INTERVAL '6 months', 'ODP-TJ-02', 'sri.wahyuni', '$2a$10$hashedpassword2', 'clientpass2', 'Rumah 2 lantai, sinyal stabil', NOW() - INTERVAL '6 months', NOW()),
('CST00015', 'Bambang Hermawan', '083176543210', 'bambang.h@email.com', 'Perumahan Green Garden Blok A1 No. 8, Karawang Barat', 3, 'active', NOW() - INTERVAL '2 months', 'ODP-KRW-03', 'bambang.hermawan', '$2a$10$hashedpassword3', 'clientpass3', 'Paket Gold, sering WFH', NOW() - INTERVAL '2 months', NOW()),
('CST00016', 'Rina Kusumawati', '085265432109', 'rina.kusuma@email.com', 'Jl. Proklamasi No. 67, Purwasari', 2, 'active', NOW() - INTERVAL '8 months', 'ODP-PWS-04', 'rina.kusuma', '$2a$10$hashedpassword4', 'clientpass4', 'Pelanggan setia, pernah referral 2 teman', NOW() - INTERVAL '8 months', NOW()),
('CST00017', 'Hendra Gunawan', '087654321098', 'hendra.gun@email.com', 'Ruko Klari Plaza No. 12, Klari', 4, 'active', NOW() - INTERVAL '1 month', 'ODP-KLR-05', 'hendra.gunawan', '$2a$10$hashedpassword5', 'clientpass5', 'Untuk usaha warnet kecil', NOW() - INTERVAL '1 month', NOW()),
('CST00018', 'Siti Maryam', '089543210987', 'siti.maryam@email.com', 'Jl. Kertabumi No. 34, Cikampek', 1, 'active', NOW() - INTERVAL '5 months', 'ODP-CK-06', 'siti.maryam', '$2a$10$hashedpassword6', 'clientpass6', 'Pelanggan ibu rumah tangga, internet untuk anak sekolah', NOW() - INTERVAL '5 months', NOW()),
('CST00019', 'Dedi Kurniawan', '081387654321', 'dedi.kurnia@email.com', 'Komplek Taman Melati Blok C No. 15, Tanjung Pura', 2, 'active', NOW() - INTERVAL '4 months', 'ODP-TP-07', 'dedi.kurniawan', '$2a$10$hashedpassword7', 'clientpass7', 'Koneksi stabil, jarang komplain', NOW() - INTERVAL '4 months', NOW()),
('CST00020', 'Yuni Astuti', '082276543210', 'yuni.astuti@email.com', 'Jl. Raya Adiarsa No. 89, Adiarsa Barat', 3, 'active', NOW() - INTERVAL '7 months', 'ODP-AD-08', 'yuni.astuti', '$2a$10$hashedpassword8', 'clientpass8', 'Upgrade dari Bronze ke Gold bulan lalu', NOW() - INTERVAL '7 months', NOW()),
('CST00021', 'Rudi Hartono', '083165432109', 'rudi.hartono@email.com', 'Perumahan Bumi Telukjambe Blok D No. 22, Telukjambe Timur', 4, 'active', NOW() - INTERVAL '2 weeks', 'ODP-TJ-02', 'rudi.hartono', '$2a$10$hashedpassword9', 'clientpass9', 'Pelanggan baru, paket Platinum', NOW() - INTERVAL '2 weeks', NOW()),
('CST00022', 'Indah Permatasari', '085254321098', 'indah.permata@email.com', 'Jl. Pancasila No. 156, Karawang Kulon', 2, 'active', NOW() - INTERVAL '9 months', 'ODP-KK-09', 'indah.permata', '$2a$10$hashedpassword10', 'clientpass10', 'Pelanggan lama, tidak pernah telat bayar', NOW() - INTERVAL '9 months', NOW()),
('CST00023', 'Arief Budiman', '087643210987', 'arief.budiman@email.com', 'Jl. Veteran No. 78, Purwasari', 1, 'active', NOW() - INTERVAL '3 weeks', 'ODP-PWS-04', 'arief.budiman', '$2a$10$hashedpassword11', 'clientpass11', 'Instalasi baru, masih trial period', NOW() - INTERVAL '3 weeks', NOW()),
('CST00024', 'Lina Marlina', '089432109876', 'lina.marlina@email.com', 'Komplek Karawang Residence Blok E No. 9, Karawang Barat', 3, 'active', NOW() - INTERVAL '10 months', 'ODP-KRW-03', 'lina.marlina', '$2a$10$hashedpassword12', 'clientpass12', 'Gaming enthusiast, butuh ping rendah', NOW() - INTERVAL '10 months', NOW()),
('CST00025', 'Wahyu Pratama', '081276543210', 'wahyu.pratama@email.com', 'Jl. Merdeka No. 234, Cikampek', 2, 'active', NOW() - INTERVAL '1 month', 'ODP-CK-06', 'wahyu.pratama', '$2a$10$hashedpassword13', 'clientpass13', 'Kontraktor, butuh internet untuk kantor', NOW() - INTERVAL '1 month', NOW()),
('CST00026', 'Sari Wulandari', '082165432109', 'sari.wulan@email.com', 'Perumahan Harmoni Blok F No. 11, Tanjung Pura', 1, 'active', NOW() - INTERVAL '6 weeks', 'ODP-TP-07', 'sari.wulan', '$2a$10$hashedpassword14', 'clientpass14', 'Pelanggan paket Bronze, cukup puas', NOW() - INTERVAL '6 weeks', NOW()),
('CST00027', 'Ferry Setiawan', '083154321098', 'ferry.setiawan@email.com', 'Jl. Siliwangi No. 45, Telukjambe Timur', 4, 'active', NOW() - INTERVAL '4 weeks', 'ODP-TJ-02', 'ferry.setiawan', '$2a$10$hashedpassword15', 'clientpass15', 'Pelanggan premium, minta dedicated support', NOW() - INTERVAL '4 weeks', NOW()),

-- Suspended Customers (3 customers)
('CST00028', 'Putri Ayu Lestari', '085243210987', 'putri.ayu@email.com', 'Jl. Gatot Subroto No. 67, Klari', 1, 'suspended', NOW() - INTERVAL '5 months', 'ODP-KLR-05', 'putri.ayu', '$2a$10$hashedpassword16', 'clientpass16', 'Suspend karena tunggakan 2 bulan', NOW() - INTERVAL '5 months', NOW()),
('CST00029', 'Iwan Hermanto', '087632109876', 'iwan.hermanto@email.com', 'Ruko Karawang Central No. 8, Karawang Kulon', 2, 'suspended', NOW() - INTERVAL '4 months', 'ODP-KK-09', 'iwan.hermanto', '$2a$10$hashedpassword17', 'clientpass17', 'Usaha tutup, suspend sementara', NOW() - INTERVAL '4 months', NOW()),
('CST00030', 'Maya Sari', '089321098765', 'maya.sari@email.com', 'Jl. Diponegoro No. 123, Adiarsa Barat', 3, 'suspended', NOW() - INTERVAL '3 months', 'ODP-AD-08', 'maya.sari', '$2a$10$hashedpassword18', 'clientpass18', 'Pelanggan keluar kota, minta suspend 3 bulan', NOW() - INTERVAL '3 months', NOW()),

-- Pending Customers (2 customers)
('CST00031', 'Taufik Hidayat', '081165432109', 'taufik.hidayat@email.com', 'Perumahan Citra Garden Blok G No. 18, Purwasari', 2, 'inactive', NULL, 'ODP-PWS-04', 'taufik.hidayat', '$2a$10$hashedpassword19', 'clientpass19', 'Menunggu jadwal instalasi minggu depan', NOW() - INTERVAL '3 days', NOW()),
('CST00032', 'Nurul Fadilah', '082154321098', 'nurul.fadilah@email.com', 'Jl. Sudirman No. 89, Cikampek', 1, 'inactive', NULL, 'ODP-CK-06', 'nurul.fadilah', '$2a$10$hashedpassword20', 'clientpass20', 'Pending approval credit check', NOW() - INTERVAL '2 days', NOW());

-- Summary statistics
SELECT 
  account_status,
  COUNT(*) as count
FROM customers 
GROUP BY account_status 
ORDER BY account_status;

SELECT 
  p.name as package_name,
  COUNT(c.id) as customer_count
FROM customers c
LEFT JOIN packages p ON c.package_id = p.id
GROUP BY p.name
ORDER BY customer_count DESC;

COMMIT;
