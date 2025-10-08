-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('broadband', 'dedicated', 'corporate')),
  speed_mbps INTEGER NOT NULL CHECK (speed_mbps > 0),
  price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample packages
INSERT INTO packages (name, type, speed_mbps, price, description) VALUES
('Paket Home 10 Mbps', 'broadband', 10, 250000, 'Paket internet rumahan ideal untuk browsing dan streaming'),
('Paket Home 20 Mbps', 'broadband', 20, 350000, 'Paket internet rumahan untuk keluarga dengan multiple devices'),
('Paket Home 50 Mbps', 'broadband', 50, 500000, 'Paket internet rumahan untuk streaming HD dan gaming'),
('Paket Home 100 Mbps', 'broadband', 100, 750000, 'Paket internet rumahan premium untuk 4K streaming'),
('Paket Dedicated 10 Mbps', 'dedicated', 10, 1500000, 'Dedicated bandwidth untuk bisnis kecil'),
('Paket Dedicated 50 Mbps', 'dedicated', 50, 5000000, 'Dedicated bandwidth untuk bisnis menengah'),
('Paket Dedicated 100 Mbps', 'dedicated', 100, 8500000, 'Dedicated bandwidth untuk bisnis besar'),
('Paket Corporate 100 Mbps', 'corporate', 100, 10000000, 'Solusi enterprise dengan SLA 99.9%'),
('Paket Corporate 500 Mbps', 'corporate', 500, 35000000, 'Solusi enterprise high-speed dengan SLA 99.9%'),
('Paket Corporate 1 Gbps', 'corporate', 1000, 60000000, 'Solusi enterprise premium dengan SLA 99.99%');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_packages_type ON packages(type);
CREATE INDEX IF NOT EXISTS idx_packages_name ON packages(name);

