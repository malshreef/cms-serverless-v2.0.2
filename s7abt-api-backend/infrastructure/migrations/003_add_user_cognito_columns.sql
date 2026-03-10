-- =====================================================
-- Migration: Add Cognito Integration Columns to Users Table
-- Version: 003
-- Description: Adds email, role, cognito_id and deleted_at columns
-- =====================================================

USE s7abt;

-- Add email column (copy from username initially if needed)
ALTER TABLE s7b_user
ADD COLUMN IF NOT EXISTS s7b_user_email VARCHAR(200) DEFAULT NULL AFTER s7b_user_password;

-- Add role column (default to 'viewer', migrate admin=1 to 'admin')
ALTER TABLE s7b_user
ADD COLUMN IF NOT EXISTS s7b_user_role VARCHAR(50) DEFAULT 'viewer' AFTER s7b_user_brief;

-- Add Cognito ID column
ALTER TABLE s7b_user
ADD COLUMN IF NOT EXISTS s7b_user_cognito_id VARCHAR(100) DEFAULT NULL AFTER s7b_user_role;

-- Add deleted_at column for soft deletes
ALTER TABLE s7b_user
ADD COLUMN IF NOT EXISTS s7b_user_deleted_at DATETIME DEFAULT NULL AFTER s7b_user_updated_at;

-- Add index on email
ALTER TABLE s7b_user
ADD INDEX IF NOT EXISTS idx_user_email (s7b_user_email);

-- Add index on cognito_id
ALTER TABLE s7b_user
ADD INDEX IF NOT EXISTS idx_user_cognito_id (s7b_user_cognito_id);

-- Migrate existing data: copy username to email if email is null
UPDATE s7b_user
SET s7b_user_email = s7b_user_username
WHERE s7b_user_email IS NULL;

-- Migrate existing data: set role based on admin flag
UPDATE s7b_user
SET s7b_user_role = 'admin'
WHERE s7b_user_admin = 1 AND s7b_user_role = 'viewer';

SELECT 'Migration 003 completed: User table updated for Cognito integration' AS status;
