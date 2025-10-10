-- Seed data for ODP Master (Optical Distribution Point)
-- Migration 010: Insert ODP data untuk area residensial/broadband di Karawang

-- Hapus data ODP yang ada
DELETE FROM odp;

-- Reset sequence
ALTER SEQUENCE odp_id_seq RESTART WITH 1;

-- Insert ODP data untuk area residensial Karawang (FTTH/Broadband)
INSERT INTO odp (name, location, area, latitude, longitude, total_ports, used_ports, status, notes) VALUES
-- Karawang Barat
('ODP-KRW-001-A12', 'Jl. Tuparev Raya, RT 01/RW 03, Karawang Barat', 'Karawang Barat', -6.318611, 107.301389, 16, 8, 'active', 'ODP perumahan Tuparev'),
('ODP-KRW-002-B08', 'Jl. Kertabumi, Perumahan Griya Asri, Karawang Barat', 'Karawang Barat', -6.322500, 107.295833, 24, 12, 'active', 'ODP cluster Griya Asri'),
('ODP-KRW-003-C15', 'Jl. Interchange Tol, Perumahan Taman Karawang, Karawang Barat', 'Karawang Barat', -6.315278, 107.288889, 16, 6, 'active', 'ODP Taman Karawang'),
('ODP-KRW-004-D20', 'Jl. Arteri Taman Karawang, Karawang Barat', 'Karawang Barat', -6.319444, 107.292778, 32, 18, 'active', 'ODP area residensial Arteri'),

-- Karawang Timur
('ODP-KRW-005-E10', 'Jl. Pancasila, RT 05/RW 08, Karawang Timur', 'Karawang Timur', -6.306111, 107.322222, 16, 10, 'active', 'ODP area Pancasila'),
('ODP-KRW-006-F12', 'Jl. Galuh Mas, Perumahan Galuh Mas, Karawang Timur', 'Karawang Timur', -6.310833, 107.328611, 24, 15, 'active', 'ODP cluster Galuh Mas'),
('ODP-KRW-007-G18', 'Jl. Tarumanegara, RT 03/RW 05, Karawang Timur', 'Karawang Timur', -6.303889, 107.330000, 16, 8, 'active', 'ODP Tarumanegara residensial'),
('ODP-KRW-008-H05', 'Jl. Syech Quro, Karawang Timur', 'Karawang Timur', -6.309722, 107.325556, 16, 5, 'active', 'ODP area Syech Quro'),

-- Telukjambe Timur
('ODP-KRW-009-I14', 'Jl. Panatayuda I, Telukjambe Timur', 'Telukjambe Timur', -6.291111, 107.297778, 24, 14, 'active', 'ODP Panatayuda cluster'),
('ODP-KRW-010-J22', 'Jl. Kota Baru Parahyangan, Telukjambe Timur', 'Telukjambe Timur', -6.287222, 107.302500, 32, 20, 'active', 'ODP Kota Baru Parahyangan'),
('ODP-KRW-011-K08', 'Jl. Surotokunto, RT 02/RW 04, Telukjambe Timur', 'Telukjambe Timur', -6.293889, 107.305833, 16, 6, 'active', 'ODP Surotokunto'),

-- Telukjambe Barat
('ODP-KRW-012-L15', 'Jl. Wirasaba, Telukjambe Barat', 'Telukjambe Barat', -6.290556, 107.285000, 16, 8, 'active', 'ODP Wirasaba residensial'),
('ODP-KRW-013-M20', 'Jl. Bumi Telukjambe, Perumahan Bumi Telukjambe Indah', 'Telukjambe Barat', -6.286667, 107.280833, 24, 12, 'active', 'ODP Bumi Telukjambe Indah'),

-- Klari
('ODP-KRW-014-N12', 'Jl. Raya Klari, RT 01/RW 02, Klari', 'Klari', -6.268889, 107.362500, 16, 10, 'active', 'ODP area Klari'),
('ODP-KRW-015-O18', 'Jl. Cikampek Karawang, Perumahan Klari Asri, Klari', 'Klari', -6.265278, 107.368889, 24, 16, 'active', 'ODP Klari Asri cluster'),

-- Cikampek
('ODP-KRW-016-P10', 'Jl. Ir. H. Juanda, RT 03/RW 06, Cikampek', 'Cikampek', -6.416667, 107.450000, 16, 8, 'active', 'ODP Cikampek pusat'),
('ODP-KRW-017-Q15', 'Jl. Raya Cikampek, Perumahan Cikampek Indah', 'Cikampek', -6.420000, 107.455556, 24, 12, 'active', 'ODP Cikampek Indah'),

-- Rengasdengklok
('ODP-KRW-018-R08', 'Jl. Raya Rengasdengklok, RT 02/RW 03', 'Rengasdengklok', -6.158889, 107.297222, 16, 6, 'active', 'ODP Rengasdengklok'),
('ODP-KRW-019-S12', 'Jl. Proklamasi, Rengasdengklok', 'Rengasdengklok', -6.161111, 107.301667, 16, 8, 'active', 'ODP area Proklamasi'),

-- Ciampel
('ODP-KRW-020-T10', 'Jl. Ciampel Raya, RT 04/RW 07, Ciampel', 'Ciampel', -6.348611, 107.420000, 16, 5, 'active', 'ODP Ciampel residensial'),

-- Tirtajaya
('ODP-KRW-021-U14', 'Jl. Tirtajaya, Perumahan Tirtajaya Indah', 'Tirtajaya', -6.299444, 107.343056, 24, 14, 'active', 'ODP Tirtajaya cluster'),

-- Purwakarta (area sekitar Karawang)
('ODP-KRW-022-V12', 'Jl. Veteran, RT 01/RW 02, Purwakarta', 'Purwakarta', -6.547778, 107.443611, 16, 10, 'active', 'ODP Purwakarta pusat'),
('ODP-KRW-023-W08', 'Jl. Raya Sadang, Perumahan Sadang Indah, Purwakarta', 'Purwakarta', -6.552222, 107.450000, 16, 6, 'active', 'ODP Sadang Indah'),

-- Jatisari
('ODP-KRW-024-X15', 'Jl. Raya Jatisari, RT 02/RW 05, Jatisari', 'Jatisari', -6.331944, 107.337500, 16, 8, 'active', 'ODP Jatisari'),

-- Area dengan status khusus
('ODP-KRW-025-Y20', 'Jl. Industri Karawang, Perumahan Graha Industri', 'Karawang Barat', -6.325000, 107.298889, 24, 22, 'active', 'ODP Graha Industri, hampir penuh'),
('ODP-KRW-026-Z08', 'Jl. Pasar Baru, Karawang Timur', 'Karawang Timur', -6.308333, 107.320000, 8, 8, 'full', 'ODP penuh, perlu ekspansi'),
('ODP-KRW-027-AA12', 'Jl. Tarumanegara Raya, Karawang Timur', 'Karawang Timur', -6.305556, 107.326667, 16, 0, 'maintenance', 'Sedang maintenance dan upgrade port');

-- Update timestamps
UPDATE odp SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP;
