-- Migration: Clean All Transactional Data & Reset Sequences
-- Date: 2025-10-11
-- Description: Reset tickets, customers, and registrations for fresh testing
-- WARNING: This will DELETE all transactional data!

-- Show counts before deletion
SELECT 
  'Before cleanup:' as stage,
  (SELECT COUNT(*) FROM tickets) as tickets_count,
  (SELECT COUNT(*) FROM customers) as customers_count,
  (SELECT COUNT(*) FROM customer_registrations) as registrations_count;

-- Step 1: Clean Customer Registrations FIRST (they reference tickets & customers)
-- Set FK to NULL first to avoid constraint violations
UPDATE customer_registrations SET customer_id = NULL, installation_ticket_id = NULL;
DELETE FROM customer_registrations;
SELECT '✅ Registrations deleted: ' || (SELECT COUNT(*) FROM customer_registrations) || ' remaining' as result;

-- Step 2: Clean Tickets (no more FK references from registrations)
DELETE FROM tickets;
SELECT '✅ Tickets deleted: ' || (SELECT COUNT(*) FROM tickets) || ' remaining' as result;

-- Step 3: Clean Customers (no more FK references from anywhere)
DELETE FROM customers;
SELECT '✅ Customers deleted: ' || (SELECT COUNT(*) FROM customers) || ' remaining' as result;

-- Step 4: Reset all sequences to start from 1
ALTER SEQUENCE tickets_id_seq RESTART WITH 1;
ALTER SEQUENCE customers_id_seq RESTART WITH 1;
ALTER SEQUENCE customer_registrations_id_seq RESTART WITH 1;
SELECT '✅ All sequences reset to 1' as result;

-- Step 5: Verify all tables are empty
SELECT 
  '=== VERIFICATION ===' as stage,
  (SELECT COUNT(*) FROM tickets) as tickets_count,
  (SELECT COUNT(*) FROM customers) as customers_count,
  (SELECT COUNT(*) FROM customer_registrations) as registrations_count;

-- Step 6: Show next IDs that will be generated
SELECT 
  '=== NEXT IDs ===' as info,
  'REG' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '001' as next_registration_id,
  'AGLS' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '0001' as next_customer_id,
  'TKT' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '001' as next_ticket_id;

-- Migration complete
SELECT '✅ Migration 026: All transactional data cleaned & sequences reset - SUCCESS' as result;

-- Notes for testing:
-- After this migration, you can test the full workflow:
-- 1. Public Registration Form -> Creates REG20251011001
-- 2. Admin Approval -> Changes status
-- 3. Create Customer -> Creates AGLS20251011001 + TKT20251011001
-- 4. Complete Installation -> Customer becomes active

