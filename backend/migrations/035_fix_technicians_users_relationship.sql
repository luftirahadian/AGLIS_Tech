-- Migration 035: Fix Technicians-Users Relationship
-- Date: 2025-10-14
-- Purpose: Ensure all technicians are properly linked to user accounts

-- ============================================
-- STEP 1: Create missing user accounts
-- ============================================

-- Create user accounts for technicians that don't have them yet
-- Password for all: tech123
INSERT INTO users (username, email, password_hash, role, full_name) 
SELECT 
    'tech' || t.employee_id,
    t.email,
    '$2b$10$r3ZhKAbT/sRvzu0XicuM7.0V./kx/CbcYZK8DDZoUpZzMV7z2cXW.', -- bcrypt hash for 'tech123'
    'technician',
    t.full_name
FROM technicians t
LEFT JOIN users u ON t.email = u.email
WHERE u.id IS NULL
  AND t.email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- Show created users
SELECT 
    'Users created for technicians:' as info,
    COUNT(*) as users_created
FROM users 
WHERE role = 'technician' 
  AND created_at > NOW() - INTERVAL '1 minute';

-- ============================================
-- STEP 2: Link technicians to users
-- ============================================

-- Update technicians.user_id with matching users based on email
UPDATE technicians t
SET user_id = u.id,
    updated_at = CURRENT_TIMESTAMP
FROM users u
WHERE t.email = u.email 
  AND u.role = 'technician'
  AND t.user_id IS NULL;

-- Show linking results
SELECT 
    'Technicians linked to users:' as info,
    COUNT(*) as technicians_linked
FROM technicians
WHERE user_id IS NOT NULL;

-- ============================================
-- STEP 3: Add foreign key constraint (if missing)
-- ============================================

-- Check if tickets has FK to technicians
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tickets_assigned_technician_id_fkey'
        AND table_name = 'tickets'
    ) THEN
        ALTER TABLE tickets 
        ADD CONSTRAINT tickets_assigned_technician_id_fkey 
        FOREIGN KEY (assigned_technician_id) 
        REFERENCES technicians(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Foreign key constraint added: tickets → technicians';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- ============================================
-- STEP 4: Verification
-- ============================================

-- Verify technicians-users relationship
SELECT 
    '=== TECHNICIANS-USERS RELATIONSHIP ===' as verification;

SELECT 
    COUNT(*) as total_technicians,
    COUNT(user_id) as with_user_account,
    COUNT(*) - COUNT(user_id) as missing_user_account
FROM technicians;

-- Show technicians with user info
SELECT 
    t.id as tech_id,
    t.employee_id,
    t.full_name as tech_name,
    t.user_id,
    u.username,
    u.role,
    CASE WHEN t.user_id IS NOT NULL THEN '✅' ELSE '❌' END as status
FROM technicians t
LEFT JOIN users u ON t.user_id = u.id
ORDER BY t.id;

-- Verify tickets can reference technicians (FK exists)
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'tickets'
    AND kcu.column_name = 'assigned_technician_id';

SELECT '✅ Migration 035: Technicians-Users relationship fixed - SUCCESS' as result;

