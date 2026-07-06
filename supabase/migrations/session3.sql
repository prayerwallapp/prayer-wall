-- RUN IN SUPABASE DASHBOARD → SQL EDITOR
--
-- Session 3: user profile support. Avatar images live in the "avatars"
-- storage bucket (see supabase/storage-setup.sql); this column stores the
-- public URL.

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url text;
