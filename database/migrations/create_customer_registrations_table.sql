-- Migration: Create customer_registrations table
-- Description: Table untuk menyimpan data pendaftaran customer baru dari public form
-- Created: 2025-01-09

-- Drop table if exists
DROP TABLE IF EXISTS customer_registrations CASCADE;

-- Create customer_registrations table
CREATE TABLE customer_registrations (
  id SERIAL PRIMARY KEY,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Personal Information
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  id_card_number VARCHAR(50), -- Nomor KTP/Identitas
  id_card_photo VARCHAR(255), -- Path ke foto KTP
  
  -- Address Information
  address TEXT NOT NULL,
  rt VARCHAR(10),
  rw VARCHAR(10),
  kelurahan VARCHAR(100),
  kecamatan VARCHAR(100),
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10),
  latitude DECIMAL(10, 8), -- Untuk map location
  longitude DECIMAL(11, 8),
  address_notes TEXT, -- Catatan alamat (patokan, dll)
  
  -- Service Information (Fokus Broadband)
  service_type VARCHAR(20) DEFAULT 'broadband' NOT NULL,
  package_id INTEGER REFERENCES packages_master(id), -- Paket yang dipilih
  preferred_installation_date DATE, -- Tanggal instalasi yang diinginkan
  preferred_time_slot VARCHAR(20), -- morning/afternoon/evening
  
  -- Registration Status
  status VARCHAR(30) DEFAULT 'pending_verification' NOT NULL,
  -- Status flow: pending_verification -> verified -> survey_scheduled -> survey_completed -> approved -> rejected
  rejection_reason TEXT, -- Alasan jika ditolak
  
  -- Verification & Approval
  verified_by INTEGER REFERENCES users(id), -- User yang melakukan verifikasi
  verified_at TIMESTAMP,
  verification_notes TEXT,
  
  approved_by INTEGER REFERENCES users(id), -- User yang melakukan approval
  approved_at TIMESTAMP,
  approval_notes TEXT,
  
  -- Survey Information
  survey_ticket_id INTEGER REFERENCES tickets(id), -- Ticket survey lokasi
  survey_scheduled_date TIMESTAMP,
  survey_completed_date TIMESTAMP,
  survey_notes TEXT,
  survey_result VARCHAR(20), -- feasible/not_feasible
  
  -- Customer Creation
  customer_id INTEGER REFERENCES customers(id), -- ID customer setelah di-approve & dibuat
  installation_ticket_id INTEGER REFERENCES tickets(id), -- Ticket instalasi setelah approved
  
  -- Additional Information
  referral_code VARCHAR(50), -- Kode referral jika ada
  notes TEXT, -- Catatan dari customer
  utm_source VARCHAR(100), -- Tracking marketing campaign
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN (
    'pending_verification', 
    'verified', 
    'survey_scheduled', 
    'survey_completed', 
    'approved', 
    'rejected',
    'cancelled'
  )),
  CONSTRAINT valid_service_type CHECK (service_type = 'broadband'),
  CONSTRAINT valid_time_slot CHECK (preferred_time_slot IN ('morning', 'afternoon', 'evening') OR preferred_time_slot IS NULL),
  CONSTRAINT valid_survey_result CHECK (survey_result IN ('feasible', 'not_feasible') OR survey_result IS NULL)
);

-- Create indexes for better performance
CREATE INDEX idx_registrations_status ON customer_registrations(status);
CREATE INDEX idx_registrations_email ON customer_registrations(email);
CREATE INDEX idx_registrations_phone ON customer_registrations(phone);
CREATE INDEX idx_registrations_created_at ON customer_registrations(created_at);
CREATE INDEX idx_registrations_registration_number ON customer_registrations(registration_number);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON customer_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate registration number
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  today_str VARCHAR(8);
  daily_count INTEGER;
  reg_number VARCHAR(50);
BEGIN
  -- Format: REG-YYYYMMDD-NNNN
  today_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Get count of registrations today
  SELECT COUNT(*) INTO daily_count
  FROM customer_registrations
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Generate registration number
  reg_number := 'REG-' || today_str || '-' || LPAD((daily_count + 1)::TEXT, 4, '0');
  
  RETURN reg_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate registration number
CREATE OR REPLACE FUNCTION set_registration_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.registration_number IS NULL OR NEW.registration_number = '' THEN
    NEW.registration_number := generate_registration_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_registration_number
  BEFORE INSERT ON customer_registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_registration_number();

-- Add comments to table and columns
COMMENT ON TABLE customer_registrations IS 'Stores customer registration requests from public form';
COMMENT ON COLUMN customer_registrations.status IS 'Registration workflow status: pending_verification, verified, survey_scheduled, survey_completed, approved, rejected, cancelled';
COMMENT ON COLUMN customer_registrations.registration_number IS 'Unique registration number: REG-YYYYMMDD-NNNN';
COMMENT ON COLUMN customer_registrations.service_type IS 'Currently only supports broadband service';

-- Insert sample data for testing (optional)
-- INSERT INTO customer_registrations (
--   full_name, email, phone, address, city, 
--   package_id, preferred_installation_date, notes
-- ) VALUES (
--   'John Doe', 'john.doe@example.com', '081234567890',
--   'Jl. Contoh No. 123, RT 01/RW 02', 'Jakarta',
--   1, CURRENT_DATE + INTERVAL '7 days', 'Mohon survey secepatnya'
-- );

