-- Create user activity logs table for audit trail
-- Run: sudo -u postgres psql -d aglis_production -f database/migrations/create_user_activity_logs.sql

CREATE TABLE IF NOT EXISTS user_activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    target_username VARCHAR(50),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_target_user_id ON user_activity_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);

-- Add comments
COMMENT ON TABLE user_activity_logs IS 'Audit trail for user management actions';
COMMENT ON COLUMN user_activity_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN user_activity_logs.action IS 'Action type: created, updated, deleted, restored, password_reset';
COMMENT ON COLUMN user_activity_logs.target_user_id IS 'User who was affected by the action';
COMMENT ON COLUMN user_activity_logs.details IS 'Additional details about the action (JSON)';

