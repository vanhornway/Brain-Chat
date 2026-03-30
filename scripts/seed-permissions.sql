-- Seed permissions for your family
-- Run this AFTER users are created in auth.users
--
-- STEPS:
-- 1. Create accounts for each family member (signup or via Supabase dashboard)
-- 2. Get their user_id from Supabase Dashboard → Users
-- 3. Replace the UUIDs below with actual user IDs
-- 4. Run this script in Supabase SQL Editor

-- ============================================================
-- REPLACE THESE WITH ACTUAL USER IDS FROM SUPABASE
-- ============================================================

-- Get your user IDs from: https://app.supabase.com → Your Project → Auth → Users
-- Copy the "User ID" column for each

-- Example UUIDs (REPLACE WITH YOURS):
\set umair_id '00000000-0000-0000-0000-000000000001'
\set nyel_id '00000000-0000-0000-0000-000000000002'
\set emaad_id '00000000-0000-0000-0000-000000000003'
\set omer_id '00000000-0000-0000-0000-000000000004'

-- ============================================================
-- 1. GRANT FULL ACCESS TO UMAIR (PARENT)
-- ============================================================
-- Umair can see all subjects (Umair, Nyel, Emaad, Omer) with read/write to own

SELECT grant_full_access_to_user(:'umair_id'::uuid);

-- Update: Umair can only WRITE to his own data, READ (not write) kids' data
UPDATE user_subject_access SET can_write = false
WHERE user_id = :'umair_id'::uuid AND subject IN ('Nyel', 'Emaad', 'Omer');

-- ============================================================
-- 2. GRANT RESTRICTED ACCESS TO NYEL (CHILD)
-- ============================================================
-- Nyel can only see Nyel data, cannot access finance tables

SELECT grant_child_access_to_user(:'nyel_id'::uuid, 'Nyel');

-- ============================================================
-- 3. GRANT RESTRICTED ACCESS TO EMAAD (CHILD)
-- ============================================================
-- Emaad can only see Emaad data, cannot access finance tables

SELECT grant_child_access_to_user(:'emaad_id'::uuid, 'Emaad');

-- ============================================================
-- 4. GRANT RESTRICTED ACCESS TO OMER (YOUNGEST)
-- ============================================================
-- Omer can only see Omer data, cannot access finance tables

SELECT grant_child_access_to_user(:'omer_id'::uuid, 'Omer');

-- ============================================================
-- VERIFY (Check what you just created)
-- ============================================================

SELECT 'Subject Access Control' as section;
SELECT user_id, subject, can_read, can_write FROM user_subject_access ORDER BY user_id, subject;

SELECT 'Table Access Control' as section;
SELECT user_id, table_name, can_read, can_write FROM user_table_access ORDER BY user_id, table_name;
