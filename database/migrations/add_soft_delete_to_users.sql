-- Add soft delete support to users table
-- Run this migration: psql -U aglis_user -d aglis_production -f database/migrations/add_soft_delete_to_users.sql

-- Add deleted_at column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Add deleted_by column to track who deleted the user
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Add comment
COMMENT ON COLUMN users.deleted_at IS 'Timestamp when user was soft deleted (NULL = not deleted)';
COMMENT ON COLUMN users.deleted_by IS 'User ID who performed the deletion';

-- Update existing queries to exclude deleted users by default
-- Note: Application code should handle this with WHERE deleted_at IS NULL

