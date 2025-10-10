-- Seed 18 Dummy Tickets for Testing
-- Various statuses, priorities, types, and technicians

INSERT INTO tickets (
  ticket_number,
  customer_id,
  type,
  category,
  title,
  description,
  priority,
  status,
  assigned_technician_id,
  scheduled_date,
  created_at,
  updated_at
) VALUES
-- Ticket 1: Installation - Open - High Priority
('TK000055', 1, 'installation', 'Instalasi FTTH Baru', 'Instalasi Baru - Taman Karawang Baru', 
 'Instalasi paket Home Silver 50 Mbps untuk pelanggan baru', 
 'high', 'open', NULL, '2025-10-10 09:00:00', '2025-10-09 08:30:00', '2025-10-09 08:30:00'),

-- Ticket 2: Repair - Assigned - Critical Priority
('TK000056', 2, 'repair', 'Perbaikan Koneksi Lambat', 'Perbaikan Koneksi Lambat - Telukjambe Timur',
 'Customer melaporkan kecepatan internet sangat lambat, perlu pengecekan kabel dan ODP',
 'critical', 'assigned', 1, '2025-10-09 14:00:00', '2025-10-09 07:15:00', '2025-10-09 09:00:00'),

-- Ticket 3: WiFi Setup - In Progress - Normal Priority
('TK000057', 3, 'wifi_setup', 'Konfigurasi WiFi Router', 'Konfigurasi WiFi Router - Adiarsa Barat',
 'Setting ulang router WiFi dan optimasi sinyal untuk coverage yang lebih baik',
 'normal', 'in_progress', 2, '2025-10-09 10:00:00', '2025-10-09 06:00:00', '2025-10-09 10:15:00'),

-- Ticket 4: Maintenance - Completed - Normal Priority
('TK000058', 4, 'maintenance', 'Pengecekan Kabel Fiber', 'Maintenance Rutin - Karawang Kulon',
 'Pengecekan rutin kabel fiber dan pembersihan ODP',
 'normal', 'completed', 3, '2025-10-08 11:00:00', '2025-10-08 08:00:00', '2025-10-08 15:30:00'),

-- Ticket 5: Upgrade - Open - High Priority
('TK000059', 5, 'upgrade', 'Upgrade Bandwidth', 'Upgrade Paket - Cikampek',
 'Upgrade dari Home Bronze 30 Mbps ke Home Gold 75 Mbps',
 'high', 'open', NULL, '2025-10-10 10:00:00', '2025-10-09 09:00:00', '2025-10-09 09:00:00'),

-- Ticket 6: Repair - Assigned - High Priority
('TK000060', 6, 'repair', 'Perbaikan Fiber Putus', 'Perbaikan Fiber Putus - Purwasari',
 'Kabel fiber putus akibat digali, perlu splicing',
 'high', 'assigned', 4, '2025-10-09 13:00:00', '2025-10-09 05:30:00', '2025-10-09 08:45:00'),

-- Ticket 7: Installation - In Progress - Normal Priority
('TK000061', 7, 'installation', 'Instalasi Perangkat Tambahan', 'Instalasi Baru - Tanjung Pura',
 'Instalasi paket Home Platinum 100 Mbps',
 'normal', 'in_progress', 5, '2025-10-09 11:00:00', '2025-10-09 07:00:00', '2025-10-09 11:20:00'),

-- Ticket 8: Downgrade - Open - Low Priority
('TK000062', 8, 'downgrade', 'Downgrade Bandwidth', 'Downgrade Paket - Klari',
 'Downgrade dari Home Gold 75 Mbps ke Home Silver 50 Mbps',
 'low', 'open', NULL, '2025-10-11 09:00:00', '2025-10-09 08:00:00', '2025-10-09 08:00:00'),

-- Ticket 9: Repair - On Hold - Normal Priority
('TK000063', 1, 'repair', 'Perbaikan Perangkat Rusak', 'Perbaikan Modem Rusak - Taman Karawang Baru',
 'Modem customer rusak, menunggu stock modem pengganti',
 'normal', 'on_hold', 6, NULL, '2025-10-08 14:00:00', '2025-10-08 16:30:00'),

-- Ticket 10: WiFi Setup - Completed - Low Priority
('TK000064', 2, 'wifi_setup', 'Optimasi Sinyal WiFi', 'Optimasi WiFi - Telukjambe Timur',
 'Setting channel WiFi dan password baru',
 'low', 'completed', 1, '2025-10-07 15:00:00', '2025-10-07 13:00:00', '2025-10-07 17:00:00'),

-- Ticket 11: Installation - Assigned - High Priority
('TK000065', 3, 'installation', 'Instalasi Express', 'Instalasi Express - Adiarsa Barat',
 'Instalasi urgent paket Home Bronze 30 Mbps',
 'high', 'assigned', 7, '2025-10-09 15:00:00', '2025-10-09 09:30:00', '2025-10-09 10:00:00'),

-- Ticket 12: Maintenance - In Progress - Normal Priority
('TK000066', 4, 'maintenance', 'Penggantian Komponen', 'Penggantian Konektor - Karawang Kulon',
 'Ganti konektor yang sudah aus untuk mencegah loss signal',
 'normal', 'in_progress', 8, '2025-10-09 12:00:00', '2025-10-09 08:45:00', '2025-10-09 12:10:00'),

-- Ticket 13: Repair - Completed - Critical Priority
('TK000067', 5, 'repair', 'Perbaikan No Signal', 'Perbaikan No Signal - Cikampek',
 'Customer tidak ada signal sama sekali, perbaikan kabel dari ODP',
 'critical', 'completed', 2, '2025-10-06 10:00:00', '2025-10-06 06:00:00', '2025-10-06 14:30:00'),

-- Ticket 14: Upgrade - In Progress - High Priority
('TK000068', 6, 'upgrade', 'Upgrade Kecepatan', 'Upgrade Bandwidth - Purwasari',
 'Upgrade dari Home Silver 50 Mbps ke Home Platinum 100 Mbps',
 'high', 'in_progress', 3, '2025-10-09 14:00:00', '2025-10-09 10:00:00', '2025-10-09 14:05:00'),

-- Ticket 15: Dismantle - Open - Low Priority
('TK000069', 7, 'dismantle', 'Pembongkaran Perangkat', 'Pembongkaran Perangkat - Tanjung Pura',
 'Customer pindah rumah, perlu pembongkaran perangkat',
 'low', 'open', NULL, '2025-10-12 10:00:00', '2025-10-09 11:00:00', '2025-10-09 11:00:00'),

-- Ticket 16: Repair - Cancelled - Normal Priority
('TK000070', 8, 'repair', 'Perbaikan Koneksi Intermittent', 'Perbaikan Intermittent - Klari',
 'Koneksi sering putus-putus, cancelled karena masalah dari router customer',
 'normal', 'cancelled', NULL, NULL, '2025-10-08 09:00:00', '2025-10-08 16:00:00'),

-- Ticket 17: Installation - Completed - Normal Priority
('TK000071', 1, 'installation', 'Instalasi Ulang', 'Instalasi Ulang - Taman Karawang Baru',
 'Reinstall karena pindah ruangan router',
 'normal', 'completed', 4, '2025-10-05 13:00:00', '2025-10-05 10:00:00', '2025-10-05 16:00:00'),

-- Ticket 18: WiFi Setup - Assigned - Normal Priority
('TK000072', 2, 'wifi_setup', 'Setup WiFi Extender', 'Setup WiFi Extender - Telukjambe Timur',
 'Install dan konfigurasi WiFi extender untuk coverage area yang lebih luas',
 'normal', 'assigned', 5, '2025-10-09 16:00:00', '2025-10-09 11:30:00', '2025-10-09 12:00:00');

-- Success message
SELECT 'Successfully created 18 dummy tickets for testing!' as message;

