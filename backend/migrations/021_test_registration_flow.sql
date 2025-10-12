-- Migration: Create test registration for end-to-end flow testing
-- Purpose: Test customer activation when installation ticket completed

-- Insert test registration (approved status, ready to create customer)
INSERT INTO customer_registrations (
  registration_number,
  full_name,
  email,
  phone,
  address,
  kelurahan,
  kecamatan,
  city,
  service_type,
  package_id,
  status,
  verified_by,
  verified_at,
  approved_by,
  approved_at,
  preferred_installation_date,
  notes,
  created_at,
  updated_at
) VALUES (
  'REG20251010TEST',
  'Test Customer E2E',
  'test.e2e@email.com',
  '081234567999',
  'Jl. Test End-to-End No. 123',
  'Adiarsa',
  'Karawang Timur',
  'Karawang',
  'broadband',
  2, -- Home Silver 50 Mbps
  'approved',
  1, -- admin user
  NOW() - INTERVAL '1 hour',
  1, -- admin user
  NOW() - INTERVAL '30 minutes',
  NOW() + INTERVAL '1 day',
  'Test registration for end-to-end flow testing',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '30 minutes'
);

