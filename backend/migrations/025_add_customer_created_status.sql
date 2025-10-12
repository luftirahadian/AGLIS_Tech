-- Migration: Add 'customer_created' status to customer_registrations
-- Date: 2025-10-11
-- Description: Add new status after customer & ticket successfully created

-- Step 1: Drop existing status check constraint
ALTER TABLE customer_registrations DROP CONSTRAINT IF EXISTS valid_status;

-- Step 2: Add new constraint with 'customer_created' status
ALTER TABLE customer_registrations ADD CONSTRAINT valid_status CHECK (
  status IN (
    'pending_verification',
    'verified',
    'survey_scheduled',
    'survey_completed',
    'approved',
    'customer_created',
    'rejected',
    'cancelled'
  )
);

-- Step 3: Update any existing approved registrations that have customer_id to customer_created
UPDATE customer_registrations
SET status = 'customer_created'
WHERE status = 'approved' 
  AND customer_id IS NOT NULL
  AND installation_ticket_id IS NOT NULL;

-- Step 4: Add comment for documentation
COMMENT ON COLUMN customer_registrations.status IS 
'Valid statuses: pending_verification, verified, survey_scheduled, survey_completed, approved, customer_created, rejected, cancelled';

-- Migration complete
SELECT 'Migration 025: Added customer_created status - SUCCESS' as result;

