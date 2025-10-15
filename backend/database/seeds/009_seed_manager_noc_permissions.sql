-- ═══════════════════════════════════════════════════════════════
-- 🔐 DEFAULT PERMISSIONS: Manager & NOC Roles
-- ═══════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MANAGER ROLE PERMISSIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Focus: Operational oversight, reporting, approval workflows

INSERT INTO role_permissions (role, permission_id, granted) 
SELECT 'manager', p.id, true
FROM permissions p
WHERE p.name IN (
  -- Dashboard & Analytics
  'dashboard.view', 'analytics.view', 'performance.view',
  
  -- Tickets (Full Manage)
  'tickets.view', 'tickets.create', 'tickets.edit', 'tickets.assign', 'tickets.close',
  
  -- Customers (View & Edit)
  'customers.view', 'customers.create', 'customers.edit', 'customers.export',
  
  -- Registrations (Full Workflow)
  'registrations.view', 'registrations.verify', 'registrations.approve', 
  'registrations.reject', 'registrations.export',
  
  -- Technicians (View & Status)
  'technicians.view',
  
  -- Invoices & Payments (View Only)
  'invoices.view', 'payments.view',
  
  -- Inventory (View)
  'inventory.view',
  
  -- Notifications
  'notifications.view'
)
ON CONFLICT (role, permission_id) DO UPDATE SET
  granted = EXCLUDED.granted,
  updated_at = CURRENT_TIMESTAMP;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- NOC ROLE PERMISSIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Focus: Technical monitoring, network operations, infrastructure

INSERT INTO role_permissions (role, permission_id, granted) 
SELECT 'noc', p.id, true
FROM permissions p
WHERE p.name IN (
  -- Dashboard & Analytics
  'dashboard.view', 'analytics.view', 'performance.view',
  
  -- Tickets (Technical Focus)
  'tickets.view', 'tickets.create', 'tickets.edit', 'tickets.assign',
  
  -- Customers (Technical Info)
  'customers.view', 'customers.edit',
  
  -- Technicians (Full Manage)
  'technicians.view', 'technicians.create', 'technicians.edit',
  
  -- Registrations (Technical Review)
  'registrations.view',
  
  -- Inventory (Full Access)
  'inventory.view', 'inventory.create', 'inventory.edit',
  
  -- Notifications
  'notifications.view', 'notifications.create'
)
ON CONFLICT (role, permission_id) DO UPDATE SET
  granted = EXCLUDED.granted,
  updated_at = CURRENT_TIMESTAMP;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VERIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
  'Manager permissions' as role_type,
  COUNT(*) as permission_count
FROM role_permissions 
WHERE role = 'manager' AND granted = true
UNION ALL
SELECT 
  'NOC permissions' as role_type,
  COUNT(*) as permission_count
FROM role_permissions 
WHERE role = 'noc' AND granted = true;
