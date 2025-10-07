-- Seed data for packages master
-- Migration 008: Insert sample internet packages

INSERT INTO packages_master (package_name, package_type, bandwidth_up, bandwidth_down, monthly_price, setup_fee, sla_level, description) VALUES
-- Broadband Packages (Residential)
('Home Basic 10M', 'broadband', 2, 10, 150000, 100000, 'bronze', 'Paket internet rumahan basic dengan kecepatan 10 Mbps'),
('Home Standard 20M', 'broadband', 5, 20, 250000, 100000, 'silver', 'Paket internet rumahan standard dengan kecepatan 20 Mbps'),
('Home Premium 50M', 'broadband', 10, 50, 450000, 150000, 'gold', 'Paket internet rumahan premium dengan kecepatan 50 Mbps'),
('Home Ultra 100M', 'broadband', 20, 100, 750000, 200000, 'gold', 'Paket internet rumahan ultra dengan kecepatan 100 Mbps'),

-- Corporate Packages
('Corporate Basic 50M', 'corporate', 25, 50, 1500000, 500000, 'silver', 'Paket internet korporat basic dengan SLA tinggi'),
('Corporate Standard 100M', 'corporate', 50, 100, 2500000, 750000, 'gold', 'Paket internet korporat standard dengan SLA premium'),
('Corporate Premium 200M', 'corporate', 100, 200, 4500000, 1000000, 'gold', 'Paket internet korporat premium dengan bandwidth besar'),

-- Dedicated Packages
('Dedicated 10M', 'dedicated', 10, 10, 2000000, 1000000, 'gold', 'Dedicated internet 10 Mbps symmetrical dengan SLA 99.9%'),
('Dedicated 20M', 'dedicated', 20, 20, 3500000, 1500000, 'gold', 'Dedicated internet 20 Mbps symmetrical dengan SLA 99.9%'),
('Dedicated 50M', 'dedicated', 50, 50, 7500000, 2000000, 'gold', 'Dedicated internet 50 Mbps symmetrical dengan SLA 99.9%'),

-- Mitra/Reseller Packages
('Mitra Basic 100M', 'mitra', 50, 100, 3000000, 500000, 'silver', 'Paket khusus mitra/reseller dengan harga spesial'),
('Mitra Premium 200M', 'mitra', 100, 200, 5000000, 750000, 'gold', 'Paket premium mitra/reseller dengan bandwidth besar'),

-- Special Packages
('SOHO 30M', 'broadband', 10, 30, 350000, 150000, 'silver', 'Small Office Home Office - cocok untuk usaha kecil'),
('Warnet 50M', 'corporate', 25, 50, 1200000, 300000, 'silver', 'Paket khusus warnet dengan harga kompetitif'),
('Cafe 100M', 'corporate', 50, 100, 2000000, 400000, 'gold', 'Paket khusus cafe dengan bandwidth stabil');

-- Update timestamps
UPDATE packages_master SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP;
