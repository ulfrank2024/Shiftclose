-- Add reset password columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ;

-- Create index for faster token lookup
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
