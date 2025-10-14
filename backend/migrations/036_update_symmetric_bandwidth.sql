-- Migration 036: Update Packages to Symmetric Bandwidth
-- Date: 2025-10-14
-- Purpose: Make upload bandwidth equal to download bandwidth for all packages

-- ============================================
-- STEP 1: Show current bandwidth configuration
-- ============================================

SELECT 
    '=== BEFORE UPDATE ===' as info,
    id, 
    package_name, 
    bandwidth_down, 
    bandwidth_up,
    CASE 
        WHEN bandwidth_down = bandwidth_up THEN '✅ Simetris' 
        ELSE '❌ Tidak Simetris' 
    END as status
FROM packages_master 
ORDER BY id;

-- ============================================
-- STEP 2: Update to symmetric bandwidth
-- ============================================

-- Update all packages: bandwidth_up = bandwidth_down
UPDATE packages_master 
SET 
    bandwidth_up = bandwidth_down,
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (1, 2, 3, 4);

-- ============================================
-- STEP 3: Verify symmetric bandwidth
-- ============================================

SELECT 
    '=== AFTER UPDATE ===' as info,
    id, 
    package_name, 
    bandwidth_down as download_mbps, 
    bandwidth_up as upload_mbps,
    bandwidth_down || ' Mbps / ' || bandwidth_up || ' Mbps' as bandwidth_display,
    CASE 
        WHEN bandwidth_down = bandwidth_up THEN '✅ Simetris' 
        ELSE '❌ Tidak Simetris' 
    END as status
FROM packages_master 
ORDER BY id;

-- ============================================
-- STEP 4: Summary
-- ============================================

SELECT 
    '=== SUMMARY ===' as info;

SELECT 
    'Package Updates:' as description,
    COUNT(*) as total_packages,
    COUNT(CASE WHEN bandwidth_down = bandwidth_up THEN 1 END) as symmetric_packages,
    COUNT(CASE WHEN bandwidth_down != bandwidth_up THEN 1 END) as asymmetric_packages
FROM packages_master;

-- Show final bandwidth configuration
SELECT 
    package_name,
    bandwidth_down || ' Mbps ↓↑ ' || bandwidth_up || ' Mbps' as bandwidth,
    monthly_price
FROM packages_master
ORDER BY bandwidth_down;

SELECT '✅ Migration 036: Bandwidth updated to symmetric - SUCCESS' as result;

-- ============================================
-- NOTES
-- ============================================

-- Previous Configuration (Asymmetric):
-- - Bronze 30M:   30 Mbps download / 5 Mbps upload
-- - Silver 50M:   50 Mbps download / 10 Mbps upload
-- - Gold 75M:     75 Mbps download / 15 Mbps upload
-- - Platinum 100M: 100 Mbps download / 20 Mbps upload

-- New Configuration (Symmetric):
-- - Bronze 30M:   30 Mbps download / 30 Mbps upload
-- - Silver 50M:   50 Mbps download / 50 Mbps upload
-- - Gold 75M:     75 Mbps download / 75 Mbps upload
-- - Platinum 100M: 100 Mbps download / 100 Mbps upload

-- Benefits of Symmetric Bandwidth:
-- 1. Better for video conferencing (upload same as download)
-- 2. Faster file uploads (cloud storage, backups)
-- 3. Better for content creators (streaming, YouTube)
-- 4. More competitive with modern ISP offerings
-- 5. Simpler for customers to understand

