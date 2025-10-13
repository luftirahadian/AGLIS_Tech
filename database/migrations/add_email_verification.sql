-- Add email verification support to users table
-- Run: sudo -u postgres psql -d aglis_production -f database/migrations/add_email_verification.sql

-- Add email verification columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP DEFAULT NULL;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255) DEFAULT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Update existing users (set admin/supervisor as verified by default)
UPDATE users 
SET email_verified = TRUE, 
    email_verified_at = CURRENT_TIMESTAMP
WHERE role IN ('admin', 'supervisor') 
  AND email_verified = FALSE;

-- Add comments
COMMENT ON COLUMN users.email_verified IS 'Whether user email has been verified';
COMMENT ON COLUMN users.email_verified_at IS 'Timestamp when email was verified';
COMMENT ON COLUMN users.email_verification_token IS 'Token for email verification (hashed)';

