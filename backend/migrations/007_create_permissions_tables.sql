-- Migration: Create Permissions System Tables
-- Created: 2025-10-13
-- Description: Granular permission system for role-based access control

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions table (junction table)
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role, permission_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_granted ON role_permissions(granted);

-- Insert default permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  -- Dashboard
  ('dashboard.view', 'dashboard', 'view', 'View dashboard'),
  ('analytics.view', 'analytics', 'view', 'View analytics'),
  
  -- Tickets
  ('tickets.view', 'tickets', 'view', 'View tickets'),
  ('tickets.create', 'tickets', 'create', 'Create new tickets'),
  ('tickets.edit', 'tickets', 'edit', 'Edit tickets'),
  ('tickets.delete', 'tickets', 'delete', 'Delete tickets'),
  ('tickets.assign', 'tickets', 'assign', 'Assign tickets to technicians'),
  ('tickets.close', 'tickets', 'close', 'Close tickets'),
  
  -- Customers
  ('customers.view', 'customers', 'view', 'View customers'),
  ('customers.create', 'customers', 'create', 'Create new customers'),
  ('customers.edit', 'customers', 'edit', 'Edit customer information'),
  ('customers.delete', 'customers', 'delete', 'Delete customers'),
  ('customers.export', 'customers', 'export', 'Export customer data'),
  
  -- Registrations
  ('registrations.view', 'registrations', 'view', 'View registrations'),
  ('registrations.verify', 'registrations', 'verify', 'Verify registrations'),
  ('registrations.approve', 'registrations', 'approve', 'Approve registrations'),
  ('registrations.reject', 'registrations', 'reject', 'Reject registrations'),
  ('registrations.delete', 'registrations', 'delete', 'Delete registrations'),
  ('registrations.export', 'registrations', 'export', 'Export registration data'),
  
  -- Technicians
  ('technicians.view', 'technicians', 'view', 'View technicians'),
  ('technicians.edit', 'technicians', 'edit', 'Edit technician information'),
  ('technicians.schedule', 'technicians', 'schedule', 'Manage technician schedules'),
  
  -- Inventory
  ('inventory.view', 'inventory', 'view', 'View inventory'),
  ('inventory.create', 'inventory', 'create', 'Add new inventory items'),
  ('inventory.edit', 'inventory', 'edit', 'Edit inventory items'),
  ('inventory.delete', 'inventory', 'delete', 'Delete inventory items'),
  ('inventory.transactions', 'inventory', 'transactions', 'Manage inventory transactions'),
  
  -- Users
  ('users.view', 'users', 'view', 'View users'),
  ('users.create', 'users', 'create', 'Create new users'),
  ('users.edit', 'users', 'edit', 'Edit user information'),
  ('users.delete', 'users', 'delete', 'Delete users'),
  ('users.reset_password', 'users', 'reset_password', 'Reset user passwords'),
  
  -- Permissions (Admin only)
  ('permissions.view', 'permissions', 'view', 'View permissions'),
  ('permissions.manage', 'permissions', 'manage', 'Manage role permissions'),
  
  -- Reports
  ('reports.view', 'reports', 'view', 'View reports'),
  ('reports.export', 'reports', 'export', 'Export reports')
ON CONFLICT (name) DO NOTHING;

-- Set default permissions for each role
-- ADMIN: Full access to everything
INSERT INTO role_permissions (role, permission_id, granted)
SELECT 'admin', id, true FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- SUPERVISOR: Most access except user management and permissions
INSERT INTO role_permissions (role, permission_id, granted)
SELECT 'supervisor', id, true FROM permissions
WHERE name NOT IN (
  'users.create', 'users.delete', 'users.reset_password',
  'permissions.view', 'permissions.manage'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- TECHNICIAN: Limited to tickets, view customers, view inventory
INSERT INTO role_permissions (role, permission_id, granted)
SELECT 'technician', id, true FROM permissions
WHERE name IN (
  'dashboard.view',
  'tickets.view', 'tickets.edit', 'tickets.close',
  'customers.view',
  'inventory.view',
  'technicians.view'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- CUSTOMER_SERVICE: Tickets, customers, registrations
INSERT INTO role_permissions (role, permission_id, granted)
SELECT 'customer_service', id, true FROM permissions
WHERE name IN (
  'dashboard.view',
  'tickets.view', 'tickets.create', 'tickets.edit',
  'customers.view', 'customers.create', 'customers.edit',
  'registrations.view', 'registrations.verify', 'registrations.approve', 'registrations.reject',
  'technicians.view'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_role_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER role_permissions_updated_at
BEFORE UPDATE ON role_permissions
FOR EACH ROW
EXECUTE FUNCTION update_role_permissions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE permissions IS 'Available permissions in the system';
COMMENT ON TABLE role_permissions IS 'Junction table linking roles to permissions';
COMMENT ON COLUMN permissions.name IS 'Unique permission identifier (e.g., tickets.view)';
COMMENT ON COLUMN permissions.resource IS 'Resource category (e.g., tickets, customers)';
COMMENT ON COLUMN permissions.action IS 'Action type (e.g., view, create, edit, delete)';
COMMENT ON COLUMN role_permissions.granted IS 'Whether the permission is granted (true) or revoked (false)';

