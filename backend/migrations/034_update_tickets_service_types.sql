-- Update Tickets Service Types Constraint
-- Migration 034: Update tickets table untuk support 7 service types baru

-- 1. Drop existing constraint
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_type_check;

-- 2. Add new constraint dengan 7 service types
ALTER TABLE tickets ADD CONSTRAINT tickets_type_check 
CHECK (type IN (
  'installation', 
  'repair', 
  'maintenance', 
  'upgrade', 
  'wifi_setup', 
  'downgrade', 
  'dismantle'
));

-- 3. Verify constraint
SELECT 
    '=== TICKETS SERVICE TYPES UPDATED ===' as info;

-- Show current constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tickets'::regclass 
AND conname = 'tickets_type_check';

-- Show allowed service types
SELECT 
    'Allowed ticket types:' as info,
    unnest(enum_range(NULL::text)) as allowed_type
FROM (
  SELECT enum_range(NULL::text) 
  FROM pg_type 
  WHERE typname = 'text'
) t
WHERE unnest(enum_range(NULL::text)) IN (
  'installation', 'repair', 'maintenance', 'upgrade', 
  'wifi_setup', 'downgrade', 'dismantle'
);

-- Show current tickets by type
SELECT 
    'Current tickets by type:' as info;

SELECT 
    type,
    COUNT(*) as ticket_count
FROM tickets 
GROUP BY type 
ORDER BY type;
