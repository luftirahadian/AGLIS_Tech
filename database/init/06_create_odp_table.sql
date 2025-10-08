-- Create ODP (Optical Distribution Point) table
CREATE TABLE IF NOT EXISTS odp (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  location TEXT NOT NULL,
  area VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  total_ports INTEGER NOT NULL DEFAULT 8,
  used_ports INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'full', 'maintenance', 'inactive')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_odp_area ON odp(area);
CREATE INDEX IF NOT EXISTS idx_odp_status ON odp(status);

-- Insert sample ODP data
INSERT INTO odp (name, location, area, latitude, longitude, total_ports, used_ports, status, notes) VALUES
('ODP-JKT-001', 'Jl. Sudirman No. 123, Jakarta Pusat', 'Jakarta Pusat', -6.208763, 106.845599, 8, 6, 'active', 'ODP utama area Jakarta Pusat'),
('ODP-JKT-002', 'Jl. Gatot Subroto No. 45, Jakarta Selatan', 'Jakarta Selatan', -6.238790, 106.799417, 16, 12, 'active', 'ODP area Gatot Subroto'),
('ODP-JKT-003', 'Jl. Thamrin No. 89, Jakarta Pusat', 'Jakarta Pusat', -6.195157, 106.822949, 8, 8, 'full', 'ODP penuh, perlu ekspansi'),
('ODP-BSD-001', 'BSD Green Office Park, Tangerang Selatan', 'BSD', -6.302103, 106.649324, 24, 18, 'active', 'ODP area BSD'),
('ODP-BSD-002', 'The Breeze BSD City, Tangerang Selatan', 'BSD', -6.301502, 106.652134, 16, 10, 'active', 'ODP residential BSD'),
('ODP-JKT-004', 'Jl. Kuningan, Jakarta Selatan', 'Jakarta Selatan', -6.224444, 106.828707, 8, 3, 'active', 'ODP area Kuningan'),
('ODP-JKT-005', 'Jl. Casablanca No. 88, Jakarta Selatan', 'Jakarta Selatan', -6.224720, 106.842812, 16, 14, 'active', 'ODP Casablanca'),
('ODP-BKS-001', 'Summarecon Bekasi, Bekasi', 'Bekasi', -6.226510, 107.001262, 24, 20, 'active', 'ODP Summarecon Bekasi'),
('ODP-JKT-006', 'Jl. Pluit Raya, Jakarta Utara', 'Jakarta Utara', -6.129650, 106.787682, 8, 2, 'maintenance', 'Sedang maintenance rutin'),
('ODP-TNG-001', 'Gading Serpong, Tangerang', 'Tangerang', -6.257445, 106.618156, 16, 8, 'active', 'ODP Gading Serpong')
ON CONFLICT (name) DO NOTHING;

