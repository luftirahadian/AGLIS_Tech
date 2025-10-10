-- Migration: Add 70 dummy tickets for testing
-- Purpose: Populate tickets table with diverse test data

-- Insert 70 additional tickets with varied statuses, types, priorities, and dates
INSERT INTO tickets (
  ticket_number, customer_id, type, title, description, 
  priority, status, created_at, updated_at
) VALUES
-- CRITICAL PRIORITY TICKETS (10 tickets)
('TK000074', 1, 'repair', 'Internet Mati Total - Taman Karawang', 'Pelanggan komplain internet mati total sejak kemarin sore. Perlu pengecekan segera.', 'critical', 'open', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
('TK000075', 3, 'repair', 'Fiber Putus - Purwasari', 'Kabel fiber putus akibat pohon tumbang. Perlu penggantian kabel segera.', 'critical', 'assigned', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours'),
('TK000076', 5, 'repair', 'Signal Loss - Cikampek', 'Loss signal mencapai -40dB. Kualitas internet sangat buruk.', 'critical', 'in_progress', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '1 hour'),
('TK000077', 7, 'installation', 'Instalasi Urgent Kantor - Karawang Kulon', 'Instalasi urgent untuk kantor baru yang sudah mulai operasional besok.', 'critical', 'assigned', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '7 hours'),
('TK000078', 9, 'repair', 'Server Down - Telukjambe Timur', 'Pelanggan tidak bisa akses internet sama sekali. ONU mati.', 'critical', 'in_progress', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '2 hours'),
('TK000079', 11, 'repair', 'Kabel Fiber Damaged - Tanjung Pura', 'Kabel fiber rusak parah, perlu penggantian segera.', 'critical', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('TK000080', 2, 'repair', 'No Internet Access - Adiarsa Barat', 'Internet tidak bisa digunakan sejak pagi. ONT indikator merah.', 'critical', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
('TK000081', 4, 'installation', 'Instalasi Darurat - Klari', 'Pelanggan membutuhkan internet segera untuk meeting penting.', 'critical', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
('TK000082', 6, 'repair', 'Total Outage - Karawang Barat', 'Seluruh area mengalami gangguan. Perlu pengecekan core network.', 'critical', 'on_hold', NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours'),
('TK000083', 8, 'repair', 'Fiber Cut - Taman Karawang', 'Fiber terputus akibat galian jalan. Perlu koordinasi dengan dinas PU.', 'critical', 'on_hold', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),

-- HIGH PRIORITY TICKETS (20 tickets)
('TK000084', 1, 'repair', 'Koneksi Putus-Putus - Taman Karawang', 'Internet sering putus-putus sejak 2 hari lalu. Mengganggu WFH.', 'high', 'open', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('TK000085', 3, 'installation', 'Instalasi Paket Gold - Purwasari', 'Pelanggan baru upgrade ke paket 75Mbps. Perlu instalasi ONT baru.', 'high', 'open', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '10 hours'),
('TK000086', 5, 'upgrade', 'Upgrade 30 ke 100Mbps - Cikampek', 'Request upgrade bandwidth dari 30Mbps ke 100Mbps.', 'high', 'assigned', NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours'),
('TK000087', 7, 'repair', 'Speed Tidak Sesuai - Karawang Kulon', 'Speed test hanya 20Mbps padahal berlangganan 50Mbps.', 'high', 'assigned', NOW() - INTERVAL '15 hours', NOW() - INTERVAL '14 hours'),
('TK000088', 9, 'installation', 'Instalasi Rumah Baru - Telukjambe', 'Instalasi untuk rumah baru di perumahan Grand Telukjambe.', 'high', 'assigned', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('TK000089', 11, 'repair', 'WiFi Lemah Signal - Tanjung Pura', 'Signal WiFi sangat lemah di lantai 2. Perlu penambahan AP.', 'high', 'in_progress', NOW() - INTERVAL '1 day', NOW() - INTERVAL '10 hours'),
('TK000090', 12, 'maintenance', 'Preventive Maintenance - Taman Karawang', 'Scheduled maintenance untuk area Taman Karawang Baru.', 'high', 'in_progress', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 hours'),
('TK000091', 2, 'upgrade', 'Upgrade ke Platinum - Adiarsa', 'Customer request upgrade ke paket 100Mbps Platinum.', 'high', 'in_progress', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '6 hours'),
('TK000092', 4, 'installation', 'Instalasi Express - Klari', 'Instalasi dalam 24 jam untuk pelanggan corporate.', 'high', 'in_progress', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '8 hours'),
('TK000093', 6, 'repair', 'Attenuation Tinggi - Karawang Barat', 'Loss mencapai -30dB. Perlu pengecekan konektor dan splicing.', 'high', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
('TK000094', 8, 'installation', 'Instalasi Paket Silver - Taman Karawang', 'Instalasi baru untuk pelanggan paket 50Mbps.', 'high', 'completed', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
('TK000095', 10, 'upgrade', 'Upgrade 50 ke 75Mbps - Purwasari', 'Upgrade bandwidth karena kebutuhan meningkat.', 'high', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
('TK000096', 1, 'repair', 'ONT Restart Terus - Taman Karawang', 'ONT sering restart sendiri. Indikator berkedip merah.', 'high', 'completed', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days'),
('TK000097', 3, 'installation', 'Instalasi Ruko - Purwasari', 'Instalasi internet untuk ruko baru di area Purwasari.', 'high', 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'),
('TK000098', 5, 'repair', 'Ping Loss Tinggi - Cikampek', 'Packet loss mencapai 40%. Gaming dan video call terganggu.', 'high', 'completed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days'),
('TK000099', 7, 'wifi_setup', 'Setup WiFi Extender - Karawang Kulon', 'Pelanggan butuh WiFi coverage lebih luas. Install extender.', 'high', 'completed', NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days'),
('TK000100', 9, 'installation', 'Instalasi Kos-Kosan - Telukjambe', 'Instalasi untuk 12 kamar kos dengan shared connection.', 'high', 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),
('TK000101', 11, 'repair', 'Cable Damaged - Tanjung Pura', 'Kabel outdoor rusak dimakan tikus. Perlu penggantian.', 'high', 'cancelled', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days'),
('TK000102', 12, 'installation', 'Instalasi Area Baru - Taman Karawang', 'Ekspansi coverage area baru di cluster Taman Karawang.', 'high', 'on_hold', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
('TK000103', 2, 'upgrade', 'Upgrade Premium - Adiarsa', 'Pelanggan minta upgrade ke layanan premium dengan SLA.', 'high', 'on_hold', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),

-- NORMAL PRIORITY TICKETS (30 tickets)
('TK000104', 1, 'maintenance', 'Pembersihan ODP - Taman Karawang', 'Scheduled cleaning untuk ODP area Taman Karawang Baru.', 'normal', 'open', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('TK000105', 3, 'installation', 'Instalasi Standar - Purwasari', 'Instalasi baru paket Bronze 30Mbps untuk rumah tinggal.', 'normal', 'open', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('TK000106', 5, 'wifi_setup', 'Konfigurasi WiFi Router - Cikampek', 'Setting ulang WiFi router karena lupa password.', 'normal', 'open', NOW() - INTERVAL '18 hours', NOW() - INTERVAL '18 hours'),
('TK000107', 7, 'maintenance', 'Penggantian Konektor - Karawang Kulon', 'Preventive maintenance penggantian konektor yang sudah lama.', 'normal', 'open', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('TK000108', 9, 'installation', 'Instalasi Rumah Subsidi - Telukjambe', 'Instalasi untuk perumahan subsidi cluster baru.', 'normal', 'assigned', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
('TK000109', 11, 'repair', 'Koneksi Lambat Sore Hari - Tanjung Pura', 'Internet lambat khususnya jam 7-10 malam. Suspect congestion.', 'normal', 'assigned', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('TK000110', 12, 'maintenance', 'Checkup Rutin - Taman Karawang', 'Pemeriksaan rutin kondisi kabel dan perangkat pelanggan.', 'normal', 'assigned', NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours'),
('TK000111', 2, 'wifi_setup', 'Optimasi Channel WiFi - Adiarsa', 'WiFi sering disconnect. Perlu optimasi channel dan bandwidth.', 'normal', 'assigned', NOW() - INTERVAL '1 day', NOW() - INTERVAL '18 hours'),
('TK000112', 4, 'installation', 'Instalasi Perumahan - Klari', 'Instalasi di perumahan Klari Residence blok C.', 'normal', 'assigned', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
('TK000113', 6, 'maintenance', 'Cleaning ONT - Karawang Barat', 'Pembersihan dan pengecekan kondisi ONT pelanggan.', 'normal', 'in_progress', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '8 hours'),
('TK000114', 8, 'installation', 'Instalasi Paket Bronze - Taman Karawang', 'New installation paket entry level 30Mbps.', 'normal', 'in_progress', NOW() - INTERVAL '1 day', NOW() - INTERVAL '15 hours'),
('TK000115', 10, 'repair', 'Port ONT Rusak - Purwasari', 'Salah satu port LAN ONT tidak berfungsi. Perlu penggantian.', 'normal', 'in_progress', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '10 hours'),
('TK000116', 1, 'wifi_setup', 'Setup Guest Network - Taman Karawang', 'Pelanggan minta dibuatkan guest network terpisah.', 'normal', 'in_progress', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '6 hours'),
('TK000117', 3, 'maintenance', 'Update Firmware ONT - Purwasari', 'Update firmware ONT ke versi terbaru untuk stability.', 'normal', 'in_progress', NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours'),
('TK000118', 5, 'installation', 'Relokasi ONT - Cikampek', 'Pelanggan pindah ruangan, perlu relokasi perangkat ONT.', 'normal', 'in_progress', NOW() - INTERVAL '14 hours', NOW() - INTERVAL '10 hours'),
('TK000119', 7, 'repair', 'Connector Loose - Karawang Kulon', 'Konektor patch cord kendor. Internet sering putus sebentar.', 'normal', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
('TK000120', 9, 'installation', 'Instalasi Kontrakan - Telukjambe', 'Instalasi internet untuk kontrakan 4 kamar.', 'normal', 'completed', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days'),
('TK000121', 11, 'maintenance', 'Splicing Check - Tanjung Pura', 'Pengecekan kondisi splicing di closure ODP.', 'normal', 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'),
('TK000122', 12, 'wifi_setup', 'WiFi Mesh Setup - Taman Karawang', 'Setup sistem WiFi mesh untuk coverage rumah 2 lantai.', 'normal', 'completed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days'),
('TK000123', 2, 'installation', 'Instalasi Warung - Adiarsa', 'Instalasi internet untuk warung makan dan area hotspot.', 'normal', 'completed', NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days'),
('TK000124', 4, 'maintenance', 'Preventive Check - Klari', 'Pemeriksaan preventive untuk mencegah masalah di masa depan.', 'normal', 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),
('TK000125', 6, 'repair', 'Adaptor Power Rusak - Karawang Barat', 'Adaptor ONT rusak. Internet mati total.', 'normal', 'completed', NOW() - INTERVAL '11 days', NOW() - INTERVAL '10 days'),
('TK000126', 8, 'installation', 'Instalasi Apartemen - Taman Karawang', 'Instalasi untuk unit apartemen lantai 5.', 'normal', 'completed', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days'),
('TK000127', 10, 'wifi_setup', 'WiFi Security Setup - Purwasari', 'Setup keamanan WiFi dengan WPA3 dan MAC filtering.', 'normal', 'completed', NOW() - INTERVAL '13 days', NOW() - INTERVAL '12 days'),
('TK000128', 1, 'maintenance', 'Cable Management - Taman Karawang', 'Rapihkan kabel indoor yang berantakan.', 'normal', 'completed', NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days'),
('TK000129', 3, 'installation', 'Instalasi Rumah Type 36 - Purwasari', 'Instalasi standar untuk rumah type 36.', 'normal', 'completed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'),
('TK000130', 5, 'repair', 'Patchcord Damaged - Cikampek', 'Kabel patchcord putus. Perlu penggantian.', 'normal', 'on_hold', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
('TK000131', 7, 'installation', 'Instalasi Pending - Karawang Kulon', 'Instalasi pending menunggu pembayaran pelanggan.', 'normal', 'on_hold', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
('TK000132', 9, 'maintenance', 'Scheduled Maintenance - Telukjambe', 'Maintenance terjadwal menunggu approval area manager.', 'normal', 'on_hold', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('TK000133', 11, 'wifi_setup', 'WiFi Configuration - Tanjung Pura', 'Setup WiFi pending menunggu pelanggan tersedia.', 'normal', 'on_hold', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),

-- LOW PRIORITY TICKETS (10 tickets)
('TK000134', 12, 'maintenance', 'Label Cable - Taman Karawang', 'Pelabelan kabel untuk memudahkan identifikasi maintenance.', 'low', 'open', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('TK000135', 2, 'wifi_setup', 'WiFi Name Change - Adiarsa', 'Pelanggan ingin ganti nama SSID WiFi.', 'low', 'open', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('TK000136', 4, 'maintenance', 'Documentation Update - Klari', 'Update dokumentasi instalasi dan topology network.', 'low', 'assigned', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
('TK000137', 6, 'downgrade', 'Downgrade 50 ke 30Mbps - Karawang Barat', 'Pelanggan request downgrade untuk hemat biaya.', 'low', 'assigned', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
('TK000138', 8, 'wifi_setup', 'Password WiFi Reset - Taman Karawang', 'Pelanggan lupa password WiFi, minta direset.', 'low', 'in_progress', NOW() - INTERVAL '1 day', NOW() - INTERVAL '18 hours'),
('TK000139', 10, 'maintenance', 'Cosmetic Fix - Purwasari', 'Perbaikan estetika kabel yang kurang rapi.', 'low', 'in_progress', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('TK000140', 1, 'downgrade', 'Downgrade ke Bronze - Taman Karawang', 'Downgrade dari Silver ke Bronze karena budget.', 'low', 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),
('TK000141', 3, 'wifi_setup', 'Change WiFi Channel - Purwasari', 'Ganti channel WiFi karena interference dari tetangga.', 'low', 'completed', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days'),
('TK000142', 5, 'dismantle', 'Copot Perangkat - Cikampek', 'Pelanggan pindah rumah, minta copot semua perangkat.', 'low', 'cancelled', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'),
('TK000143', 7, 'downgrade', 'Temporary Downgrade - Karawang Kulon', 'Downgrade sementara selama 3 bulan.', 'low', 'cancelled', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days');

-- Update statistics
SELECT COUNT(*) as total_tickets FROM tickets;
SELECT status, COUNT(*) as count FROM tickets GROUP BY status ORDER BY status;
SELECT type, COUNT(*) as count FROM tickets GROUP BY type ORDER BY type;
SELECT priority, COUNT(*) as count FROM tickets GROUP BY priority ORDER BY priority;

COMMIT;

