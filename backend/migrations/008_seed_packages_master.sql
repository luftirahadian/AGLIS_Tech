-- Seed data for packages master
-- Migration 008: Insert internet packages (FTTH/Broadband/Rumahan)

-- Hapus data paket yang ada (jika ada)
DELETE FROM customer_registrations WHERE package_id IS NOT NULL;
DELETE FROM customer_payments;
DELETE FROM customer_equipment;
DELETE FROM customers;
DELETE FROM packages_master;

-- Reset sequence untuk memastikan ID dimulai dari 1
ALTER SEQUENCE packages_master_id_seq RESTART WITH 1;
ALTER SEQUENCE customers_id_seq RESTART WITH 1;

-- Insert paket internet rumahan (FTTH/Broadband)
INSERT INTO packages_master (package_name, package_type, bandwidth_up, bandwidth_down, monthly_price, setup_fee, sla_level, description) VALUES
('Home Bronze 30M', 'broadband', 5, 30, 149900, 100000, 'bronze', 'Paket internet rumahan Bronze dengan kecepatan 30 Mbps - cocok untuk browsing dan streaming'),
('Home Silver 50M', 'broadband', 10, 50, 199900, 100000, 'silver', 'Paket internet rumahan Silver dengan kecepatan 50 Mbps - cocok untuk keluarga dan WFH'),
('Home Gold 75M', 'broadband', 15, 75, 249900, 150000, 'gold', 'Paket internet rumahan Gold dengan kecepatan 75 Mbps - cocok untuk gaming dan streaming HD'),
('Home Platinum 100M', 'broadband', 20, 100, 289900, 150000, 'gold', 'Paket internet rumahan Platinum dengan kecepatan 100 Mbps - cocok untuk kebutuhan maksimal');

-- Update timestamps
UPDATE packages_master SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP;
