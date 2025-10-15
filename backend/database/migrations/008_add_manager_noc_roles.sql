-- ═══════════════════════════════════════════════════════════════
-- 👔 ADD NEW ROLES: Manager & NOC
-- ═══════════════════════════════════════════════════════════════
-- Purpose: Add Manager and NOC roles to the system
-- Author: AGLIS Tech
-- Date: 2025-10-15
-- ═══════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Update users table role constraint
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'supervisor', 'technician', 'customer_service', 'manager', 'noc'));

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ROLE DEFINITIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMENT ON CONSTRAINT users_role_check ON users IS 
'Valid user roles:
- admin: Full system access
- supervisor: Manage operations, limited user management
- technician: Field technician, self-assign tickets
- customer_service: Customer support, ticket management
- manager: Operational manager, reporting & oversight
- noc: Network Operations Center, technical monitoring';

