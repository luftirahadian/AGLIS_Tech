-- ============================================================================
-- Migration 038: Performance Optimization - Add Strategic Indexes
-- ============================================================================
-- Date: 2025-10-14
-- Purpose: Improve query performance for frequently accessed tables
-- Impact: Expected 3-10x query speed improvement
-- 
-- Background:
-- - PackageService timeout issues (>10s)
-- - Dashboard slow loading
-- - List pages with filters/sorting need optimization
--
-- Strategy:
-- - Add composite indexes for common WHERE + ORDER BY patterns
-- - Index foreign keys that aren't already indexed
-- - Index columns used in JOINs
-- - Index boolean flags used in WHERE clauses
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. PACKAGES_MASTER - Fix timeout issues
-- ============================================================================
-- Drop old indexes if exist to avoid conflicts
DROP INDEX IF EXISTS idx_packages_active;
DROP INDEX IF EXISTS idx_packages_type;

-- Composite index for most common query pattern: active + type + sorting
CREATE INDEX IF NOT EXISTS idx_packages_active_type_price 
  ON packages_master(is_active, package_type, monthly_price) 
  WHERE is_active = true;

-- Index for sorting by bandwidth (common in package selection)
CREATE INDEX IF NOT EXISTS idx_packages_bandwidth 
  ON packages_master(bandwidth_down DESC, bandwidth_up DESC) 
  WHERE is_active = true;

-- Comment for documentation
COMMENT ON INDEX idx_packages_active_type_price IS 
  'Composite index for package listing with filter by active status and type, sorted by price';

-- ============================================================================
-- 2. CUSTOMER_REGISTRATIONS - Speed up registration dashboard
-- ============================================================================
-- Composite index for status filtering + date sorting (most common pattern)
CREATE INDEX IF NOT EXISTS idx_registrations_status_created 
  ON customer_registrations(status, created_at DESC);

-- Index for phone number lookups (used in search)
CREATE INDEX IF NOT EXISTS idx_registrations_phone 
  ON customer_registrations(phone);

-- Partial index for pending/active registrations (exclude completed)
CREATE INDEX IF NOT EXISTS idx_registrations_pending 
  ON customer_registrations(status, created_at DESC) 
  WHERE status NOT IN ('customer_created', 'rejected', 'cancelled');

-- Index for package foreign key (JOIN optimization)
CREATE INDEX IF NOT EXISTS idx_registrations_package_fk 
  ON customer_registrations(package_id) 
  WHERE package_id IS NOT NULL;

COMMENT ON INDEX idx_registrations_status_created IS 
  'Primary index for registration list filtering and sorting';

-- ============================================================================
-- 3. CUSTOMERS - Optimize customer listing and searches
-- ============================================================================
-- Composite index for account status + service type (common filters)
CREATE INDEX IF NOT EXISTS idx_customers_status_service 
  ON customers(account_status, service_type, created_at DESC);

-- Index for payment status filtering
CREATE INDEX IF NOT EXISTS idx_customers_payment_status 
  ON customers(payment_status) 
  WHERE payment_status IN ('unpaid', 'pending');

-- Index for package foreign key (JOIN with packages_master)
CREATE INDEX IF NOT EXISTS idx_customers_package_fk 
  ON customers(package_id) 
  WHERE package_id IS NOT NULL;

-- Text search optimization for name, customer_id, phone, email
CREATE INDEX IF NOT EXISTS idx_customers_search_name 
  ON customers USING gin(to_tsvector('simple', name));

CREATE INDEX IF NOT EXISTS idx_customers_search_id 
  ON customers(customer_id varchar_pattern_ops);

CREATE INDEX IF NOT EXISTS idx_customers_phone 
  ON customers(phone varchar_pattern_ops);

-- Active customers index (most frequently accessed)
CREATE INDEX IF NOT EXISTS idx_customers_active 
  ON customers(id, name, customer_id, service_type) 
  WHERE account_status = 'active';

COMMENT ON INDEX idx_customers_status_service IS 
  'Composite index for customer filtering by status and service type';

-- ============================================================================
-- 4. TICKETS - Already has basic indexes, add composite ones
-- ============================================================================
-- Composite index for status + priority + date (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_tickets_status_priority_date 
  ON tickets(status, priority, created_at DESC);

-- Composite index for assigned technician + status (technician view)
CREATE INDEX IF NOT EXISTS idx_tickets_technician_status 
  ON tickets(assigned_technician_id, status, created_at DESC) 
  WHERE assigned_technician_id IS NOT NULL;

-- Partial index for open/active tickets only (exclude completed/cancelled)
CREATE INDEX IF NOT EXISTS idx_tickets_active 
  ON tickets(status, priority, created_at DESC) 
  WHERE status NOT IN ('completed', 'cancelled');

-- Index for SLA monitoring (overdue tickets)
CREATE INDEX IF NOT EXISTS idx_tickets_sla_breach 
  ON tickets(is_sla_breached, sla_due_date) 
  WHERE is_sla_breached = true OR status NOT IN ('completed', 'cancelled');

-- Index for customer foreign key + status (customer detail page)
CREATE INDEX IF NOT EXISTS idx_tickets_customer_status 
  ON tickets(customer_id, status, created_at DESC);

COMMENT ON INDEX idx_tickets_status_priority_date IS 
  'Composite index for ticket dashboard with status and priority filters';

-- ============================================================================
-- 5. EQUIPMENT_MASTER - Speed up equipment selection in forms
-- ============================================================================
-- Composite index for active equipment by category
CREATE INDEX IF NOT EXISTS idx_equipment_active_category 
  ON equipment_master(is_active, category, equipment_name) 
  WHERE is_active = true;

-- Index for equipment code lookups
CREATE INDEX IF NOT EXISTS idx_equipment_code 
  ON equipment_master(equipment_code) 
  WHERE is_active = true;

COMMENT ON INDEX idx_equipment_active_category IS 
  'Index for equipment dropdown filtering by category';

-- ============================================================================
-- 6. INVENTORY_STOCK - Optimize stock monitoring
-- ============================================================================
-- Index for low stock alerts
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock 
  ON inventory_stock(equipment_id, current_stock, minimum_stock) 
  WHERE current_stock <= minimum_stock;

-- Index for equipment foreign key
CREATE INDEX IF NOT EXISTS idx_inventory_equipment_fk 
  ON inventory_stock(equipment_id);

COMMENT ON INDEX idx_inventory_low_stock IS 
  'Partial index for low stock alerts and monitoring';

-- ============================================================================
-- 7. SERVICE_PRICELIST - Speed up ticket creation form
-- ============================================================================
-- Composite index for active pricelist by service type
CREATE INDEX IF NOT EXISTS idx_pricelist_active_service 
  ON service_pricelist(is_active, service_type_code, service_category_code) 
  WHERE is_active = true;

-- Index for package type filtering
CREATE INDEX IF NOT EXISTS idx_pricelist_package_type 
  ON service_pricelist(applies_to_package) 
  WHERE is_active = true;

COMMENT ON INDEX idx_pricelist_active_service IS 
  'Composite index for pricelist filtering in ticket creation';

-- ============================================================================
-- 8. SERVICE_TYPES & SERVICE_CATEGORIES - Master data optimization
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_service_types_active 
  ON service_types(is_active, display_order) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_service_categories_active 
  ON service_categories(is_active, service_type_code) 
  WHERE is_active = true;

-- ============================================================================
-- 9. NOTIFICATIONS - Speed up notification queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, is_read, created_at DESC) 
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_type 
  ON notifications(type, created_at DESC);

COMMENT ON INDEX idx_notifications_user_unread IS 
  'Index for unread notifications per user (notification center)';

-- ============================================================================
-- 10. TECHNICIANS - Optimize assignment queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_technicians_employment_status 
  ON technicians(employment_status, is_available) 
  WHERE employment_status = 'active';

CREATE INDEX IF NOT EXISTS idx_technicians_user_fk 
  ON technicians(user_id);
  
CREATE INDEX IF NOT EXISTS idx_technicians_availability 
  ON technicians(is_available, availability_status) 
  WHERE employment_status = 'active';

-- ============================================================================
-- 11. USERS - Optimize authentication and lookups
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_username 
  ON users(username) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_users_email 
  ON users(email) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_users_role 
  ON users(role, is_active);

-- ============================================================================
-- ANALYZE TABLES - Update query planner statistics
-- ============================================================================
ANALYZE packages_master;
ANALYZE customer_registrations;
ANALYZE customers;
ANALYZE tickets;
ANALYZE equipment_master;
ANALYZE inventory_stock;
ANALYZE service_pricelist;
ANALYZE service_types;
ANALYZE service_categories;
ANALYZE notifications;
ANALYZE technicians;
ANALYZE users;

-- ============================================================================
-- VERIFICATION - Show all new indexes created
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Show tables with index coverage
SELECT 
  t.tablename,
  COUNT(i.indexname) as index_count,
  pg_size_pretty(pg_total_relation_size(t.schemaname||'.'||t.tablename)) as table_size
FROM pg_tables t
LEFT JOIN pg_indexes i ON t.tablename = i.tablename AND i.schemaname = t.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.schemaname, t.tablename
ORDER BY pg_total_relation_size(t.schemaname||'.'||t.tablename) DESC;

COMMIT;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 
  '✅ Performance indexes created successfully!' as status,
  'Expected improvement: 3-10x faster queries' as impact,
  'Run EXPLAIN ANALYZE on slow queries to verify' as next_step;

