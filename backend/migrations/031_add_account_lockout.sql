-- Add account lockout fields to users table
-- Migration: 031_add_account_lockout.sql
-- Date: 2025-10-13
-- Purpose: Add account lockout functionality to prevent brute force attacks

-- Add lockout tracking fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN users.failed_login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN users.locked_until IS 'Account is locked until this timestamp (NULL = indefinite lock if attempts >= 15)';
COMMENT ON COLUMN users.last_failed_login IS 'Timestamp of last failed login attempt';

-- Create index for performance (checking locked accounts)
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);
CREATE INDEX IF NOT EXISTS idx_users_failed_attempts ON users(failed_login_attempts);

-- Create table to log all failed login attempts (for security monitoring)
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason VARCHAR(50) DEFAULT 'invalid_credentials',
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for failed_login_attempts
CREATE INDEX IF NOT EXISTS idx_failed_login_username ON failed_login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempted_at ON failed_login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_failed_login_user_id ON failed_login_attempts(user_id);

-- Add comment
COMMENT ON TABLE failed_login_attempts IS 'Logs all failed login attempts for security monitoring and analysis';

-- Sample queries for monitoring (documentation)
-- 
-- Check locked accounts:
-- SELECT id, username, email, failed_login_attempts, locked_until, last_failed_login
-- FROM users WHERE locked_until IS NOT NULL OR failed_login_attempts > 0;
--
-- Check recent failed attempts:
-- SELECT username, ip_address, COUNT(*) as attempts, MAX(attempted_at) as last_attempt
-- FROM failed_login_attempts
-- WHERE attempted_at > NOW() - INTERVAL '1 hour'
-- GROUP BY username, ip_address
-- ORDER BY attempts DESC;
--
-- Check suspicious IPs (many different usernames):
-- SELECT ip_address, COUNT(DISTINCT username) as different_users, COUNT(*) as total_attempts
-- FROM failed_login_attempts
-- WHERE attempted_at > NOW() - INTERVAL '24 hours'
-- GROUP BY ip_address
-- HAVING COUNT(DISTINCT username) > 5
-- ORDER BY total_attempts DESC;

-- Migration successful
SELECT 'Migration 031_add_account_lockout.sql completed successfully' as status;


