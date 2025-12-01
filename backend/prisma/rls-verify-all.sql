-- ============================================
-- VERIFICATION: Check all RLS policies
-- Copy-paste this AFTER all phases complete
-- ============================================

-- Verification 1: RLS Status on All Tables
SELECT 
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verification 2: Policy Count
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Verification 3: All Policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- 13 tables with RLS enabled
-- Total ~18 policies created
-- No errors

-- TABLE                POLICY_COUNT
-- Address              1
-- BankAccount          1
-- FeesConfig           1
-- Guest                0 (service_role only)
-- GuestAccessToken     0 (service_role only)
-- NotificationLog      1
-- Order                1
-- OrderItem            1
-- Participant          1
-- Product              2
-- SocialMedia          2
-- Trip                 2
-- User                 2
-- ====================
-- TOTAL               18 policies
