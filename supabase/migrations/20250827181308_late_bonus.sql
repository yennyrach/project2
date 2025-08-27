-- Fix RLS policies to resolve "Database error granting user" authentication error
-- These policies need to be applied in your Supabase SQL Editor

-- First, ensure RLS is enabled on both tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (run these if you have existing policies)
-- DROP POLICY IF EXISTS "allow_anon_insert_own_profile" ON public.users;
-- DROP POLICY IF EXISTS "allow_self_insert_profile_on_signup" ON public.users;
-- DROP POLICY IF EXISTS "allow_self_update_profile" ON public.users;
-- DROP POLICY IF EXISTS "allow_self_select_profile" ON public.users;
-- DROP POLICY IF EXISTS "allow_admins_select_all_users" ON public.users;
-- DROP POLICY IF EXISTS "allow_anon_insert_own_role" ON public.user_roles;
-- DROP POLICY IF EXISTS "allow_self_insert_role_on_signup" ON public.user_roles;
-- DROP POLICY IF EXISTS "allow_admins_select_all_roles" ON public.user_roles;
-- DROP POLICY IF EXISTS "allow_admins_insert_any_role" ON public.user_roles;
-- DROP POLICY IF EXISTS "allow_admins_update_any_role" ON public.user_roles;
-- DROP POLICY IF EXISTS "allow_admins_delete_any_role" ON public.user_roles;

-- ===== RLS POLICIES FOR public.users TABLE =====

-- Policy 1: Allow anonymous users to insert their own profile during signup/login
-- This is CRITICAL for Supabase auth system to work properly
CREATE POLICY "allow_anon_insert_own_profile"
ON public.users
FOR INSERT
TO anon
WITH CHECK (auth.uid() = id);

-- Policy 2: Allow authenticated users to insert their own profile (fallback)
CREATE POLICY "allow_authenticated_insert_own_profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Allow authenticated users to update their own profile
CREATE POLICY "allow_authenticated_update_own_profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Allow authenticated users to select their own profile
CREATE POLICY "allow_authenticated_select_own_profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 5: Allow admins to view all user profiles
CREATE POLICY "allow_admins_select_all_users"
ON public.users
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_type = 'admin'));

-- ===== RLS POLICIES FOR public.user_roles TABLE =====

-- Policy 1: Allow anonymous users to insert their own default role during signup
-- This is CRITICAL for the initial role assignment during user creation
CREATE POLICY "allow_anon_insert_own_role"
ON public.user_roles
FOR INSERT
TO anon
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Allow authenticated users to insert their own role (fallback)
CREATE POLICY "allow_authenticated_insert_own_role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Allow admins to select all roles
CREATE POLICY "allow_admins_select_all_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_type = 'admin'));

-- Policy 4: Allow admins to insert roles for any user
CREATE POLICY "allow_admins_insert_any_role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_type = 'admin'));

-- Policy 5: Allow admins to update roles for any user
CREATE POLICY "allow_admins_update_any_role"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_type = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_type = 'admin'));

-- Policy 6: Allow admins to delete roles for any user
CREATE POLICY "allow_admins_delete_any_role"
ON public.user_roles
FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_type = 'admin'));

-- ===== IMPORTANT NOTES =====
-- 1. The key fix is allowing 'anon' role to INSERT into both tables
-- 2. This is required because Supabase's auth system creates user records
--    before the user is fully authenticated
-- 3. The 'anon' policies are restricted to only allow users to create
--    records for their own auth.uid()
-- 4. After applying these policies, the "Database error granting user" should be resolved