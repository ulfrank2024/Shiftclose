-- Migration: Add photo_url to users table
-- Date: 2026-02-24

ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- NOTE: Create 'avatars' storage bucket in Supabase Dashboard:
--   Storage > New bucket > Name: avatars > Public: YES
--   Or the backend will try to create it automatically on first upload.
