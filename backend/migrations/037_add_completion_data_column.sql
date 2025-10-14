-- Migration 037: Add completion_data Column to Tickets
-- Date: 2025-10-14
-- Purpose: Store completion evidence (photos, measurements, checklist)

-- ============================================
-- STEP 1: Add completion_data column
-- ============================================

ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS completion_data JSONB;

-- Add comment for documentation
COMMENT ON COLUMN tickets.completion_data IS 'Store completion evidence: OTDR photo, attenuation photo, modem SN photo, signal measurements, speed test results, installation checklist';

-- Create index for JSONB queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_tickets_completion_data ON tickets USING gin (completion_data);

-- ============================================
-- STEP 2: Verification
-- ============================================

SELECT 
    '=== COMPLETION DATA COLUMN ADDED ===' as info;

-- Verify column exists
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tickets' 
  AND column_name = 'completion_data';

-- Show column comment
SELECT 
    obj_description('tickets'::regclass, 'pg_class') as table_comment,
    col_description('tickets'::regclass, 
        (SELECT ordinal_position FROM information_schema.columns 
         WHERE table_name = 'tickets' AND column_name = 'completion_data')
    ) as column_comment;

SELECT '✅ Migration 037: completion_data column added - SUCCESS' as result;

-- ============================================
-- NOTES
-- ============================================

-- completion_data JSONB structure example:
-- {
--   "otdr_photo": {
--     "filename": "otdr_ticket_123.jpg",
--     "path": "/uploads/tickets/otdr/ticket_123/...",
--     "url": "/uploads/tickets/otdr/ticket_123/..."
--   },
--   "attenuation_photo": {
--     "filename": "attenuation_ticket_123.jpg",
--     "path": "/uploads/tickets/attenuation/ticket_123/...",
--     "url": "/uploads/tickets/attenuation/ticket_123/..."
--   },
--   "modem_sn_photo": {
--     "filename": "modem_sn_ticket_123.jpg",
--     "path": "/uploads/tickets/modem_sn/ticket_123/...",
--     "url": "/uploads/tickets/modem_sn/ticket_123/..."
--   },
--   "signal_strength": "-25dB",
--   "download_speed": "75.5 Mbps",
--   "upload_speed": "75.2 Mbps",
--   "installation_checklist": {
--     "cable_installed": true,
--     "ont_configured": true,
--     "wifi_tested": true,
--     "customer_briefed": true
--   }
-- }

