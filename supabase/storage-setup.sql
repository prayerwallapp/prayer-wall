-- Run once in Supabase Dashboard → SQL Editor
-- Creates the avatars bucket and sets a public read policy.
--
-- Uploads currently go through the service-role client in
-- app/api/users/avatar/route.ts (bypasses these policies entirely);
-- the insert policy below exists so a future client-side upload path
-- can work without service-role access.

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_auth_insert" ON storage.objects;
CREATE POLICY "avatars_auth_insert" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars');
