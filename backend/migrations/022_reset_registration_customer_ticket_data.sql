-- Migration: Reset Registration, Customer, and Ticket Data
-- Purpose: Clean all transactional data and reset sequences
-- Date: October 10, 2025

-- WARNING: This will delete all customer registrations, customers, and tickets data
-- Master data (packages, ODPs, equipment, technicians, users) will be preserved

BEGIN;

-- Step 1: Delete all data (CASCADE will handle foreign keys)
TRUNCATE TABLE customer_registrations CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE tickets CASCADE;
TRUNCATE TABLE ticket_status_history CASCADE;
TRUNCATE TABLE notifications CASCADE;

-- Step 2: Reset sequences to start from 1
ALTER SEQUENCE customer_registrations_id_seq RESTART WITH 1;
ALTER SEQUENCE customers_id_seq RESTART WITH 1;
ALTER SEQUENCE tickets_id_seq RESTART WITH 1;
ALTER SEQUENCE ticket_status_history_id_seq RESTART WITH 1;
ALTER SEQUENCE notifications_id_seq RESTART WITH 1;

-- Step 3: Verify cleanup
SELECT 
  'customer_registrations' as table_name, 
  COUNT(*) as row_count 
FROM customer_registrations
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'ticket_status_history', COUNT(*) FROM ticket_status_history
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;

COMMIT;

-- Success message
SELECT 
  '✅ Data berhasil dibersihkan!' as status,
  'Sequences direset ke 1' as info,
  'Master data (packages, ODPs, equipment, technicians, users) tetap terjaga' as note;

