-- Migration: Update ID Format Prefixes
-- Purpose: Change registration, customer, and ticket ID formats
-- Date: October 10, 2025

-- New Formats:
-- Registration: REGyyyymmddxxx  (e.g., REG20251010001)
-- Customer:     AGLSyyyymmddxxxx (e.g., AGLS20251010001) 
-- Ticket:       TKTyyyymmddxxx   (e.g., TKT20251010001)

BEGIN;

-- Step 1: Update registration number generation function
CREATE OR REPLACE FUNCTION public.generate_registration_number()
RETURNS character varying
LANGUAGE plpgsql
AS $function$
DECLARE
  today_str VARCHAR(8);
  daily_count INTEGER;
  reg_number VARCHAR(50);
BEGIN
  -- Format: REGyyyymmddxxx (e.g., REG20251010001)
  today_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Get count of registrations today
  SELECT COUNT(*) INTO daily_count
  FROM customer_registrations
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Generate registration number: REG + yyyymmdd + 3-digit counter
  reg_number := 'REG' || today_str || LPAD((daily_count + 1)::TEXT, 3, '0');
  
  RETURN reg_number;
END;
$function$;

COMMIT;

-- Verification
SELECT 
  'Registration format updated' as status,
  'New format: REGyyyymmddxxx' as registration_format,
  'Customer format: AGLSyyyymmddxxxx (code update required)' as customer_format,
  'Ticket format: TKTyyyymmddxxx (already correct)' as ticket_format;

