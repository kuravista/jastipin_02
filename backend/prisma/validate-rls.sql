-- ==========================
-- RLS Validation Script
-- Run this to verify RLS policies are correctly applied
-- ==========================

-- 1. Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Count policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count,
  CASE WHEN COUNT(*) = 0 THEN '⚠️ NO POLICIES (DENY ALL)' 
       WHEN COUNT(*) < 3 THEN '⚠️ MINIMAL POLICIES'
       ELSE '✅ GOOD' END as status
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 3. List all policies by table
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  qual as policy_condition,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Check for tables with RLS enabled but NO policies (DENY ALL)
SELECT tablename
FROM pg_tables t
WHERE schemaname = 'public' 
  AND rowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p 
    WHERE p.tablename = t.tablename AND p.schemaname = 'public'
  )
ORDER BY tablename;

-- 5. Check role grants
SELECT 
  grantee,
  tablename,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public'
ORDER BY tablename, grantee;

-- 6. Verify RLS is enforced (should show tables with policies)
SELECT 
  COUNT(DISTINCT tablename) as tables_with_policies
FROM pg_policies
WHERE schemaname = 'public';

-- 7. Policy audit - count by operation type
SELECT 
  tablename,
  CASE 
    WHEN qual IS NOT NULL THEN 'SELECT/READ'
    WHEN with_check IS NOT NULL THEN 'INSERT/UPDATE/DELETE'
    ELSE 'UNKNOWN'
  END as operation,
  COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, operation
ORDER BY tablename;

-- Expected results for Jastipin:
-- ✅ 13 tables should have RLS enabled:
--    User, Trip, Product, Participant, Order, OrderItem, 
--    Address, NotificationLog, Guest, GuestAccessToken, 
--    BankAccount, SocialMedia, FeesConfig

-- ✅ FeesConfig: 1 policy (public read)
-- ✅ SocialMedia: 2 policies (public read, owner manage)
-- ✅ BankAccount: 1 policy (owner only)
-- ✅ User: 2 policies (self read, self update)
-- ✅ Trip: 3 policies (public read, owner full)
-- ✅ Product: 2 policies (public read, trip owner manage)
-- ✅ Participant: 1 policy (trip owner read)
-- ✅ Order: 1 policy (trip owner read)
-- ✅ OrderItem: 1 policy (trip owner read)
-- ✅ Address: 1 policy (trip owner read)
-- ✅ NotificationLog: 1 policy (trip owner read)
-- ✅ Guest: 0 policies (service_role only)
-- ✅ GuestAccessToken: 0 policies (service_role only)

-- Diagnostic: If query results don't match expectations, something might be wrong
