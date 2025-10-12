-- Migration 030: Add city and province fields to customers table
-- Date: 2025-10-13
-- Purpose: Separate city and province from address for better data structure

-- Add city and province columns
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS province VARCHAR(100);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);
CREATE INDEX IF NOT EXISTS idx_customers_province ON customers(province);

-- Backfill city from customer_registrations for existing customers
-- Note: province field not available in customer_registrations, will remain NULL
UPDATE customers c
SET 
  city = cr.city
FROM customer_registrations cr
WHERE c.email = cr.email
  AND c.phone = cr.phone
  AND c.city IS NULL;

-- Add comment
COMMENT ON COLUMN customers.city IS 'City/Kota from customer address';
COMMENT ON COLUMN customers.province IS 'Province/Provinsi from customer address';

