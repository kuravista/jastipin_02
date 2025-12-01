# RLS Implementation Guide untuk Jastipin

**Status**: Ready for Deployment ✅  
**Date**: 2025-12-01  
**Risk Level**: Medium (requires careful execution)

---

## 📋 Pre-Deployment Checklist

- [ ] **Database Backup** (CRITICAL!)
  - Go to: Supabase Dashboard → Backups
  - Click "Create a backup now"
  - Wait 2-3 minutes
  - Confirm backup created successfully

- [ ] **Team Notification**
  - Notify: Backend team, QA, Support
  - Maintenance window: 30 min
  - Rollback plan ready

- [ ] **Maintenance Mode** (Optional but recommended)
  - Set `MAINTENANCE_MODE=true` in backend/.env
  - Restart API: `pm2 restart jastipin-api`
  - This prevents user data changes during RLS deployment

---

## 🚀 Step-by-Step Implementation

### **Phase 1: Backup (Manual in Supabase Dashboard)**

1. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com/project/YOUR_PROJECT_ID/database/backups
   - Click "Create a backup now"
   - Wait for completion (~3 min)
   - **Note the backup ID/timestamp**

2. **Verify Backup**
   - See new backup in list
   - Confirm size is reasonable (10MB+)
   - Test restore (optional for dev projects)

---

### **Phase 2: Deploy RLS Policies (Manual in SQL Editor)**

**⚠️ CRITICAL: Must use SERVICE_ROLE key, NOT anon!**

1. **Open Supabase SQL Editor**
   - URL: https://app.supabase.com/project/YOUR_PROJECT_ID/sql/new
   - Confirm dropdown says **"service_role"** (not anon)
   - Clear any existing query

2. **Copy-Paste Script Below** (in order)

---

## 📝 RLS Deployment Script

### **Block 1: REVOKE PUBLIC ACCESS** (Safe to run first)

```sql
-- ============================================
-- PHASE 1: Revoke public access (safety first)
-- ============================================
REVOKE ALL ON "User" FROM PUBLIC;
REVOKE ALL ON "Trip" FROM PUBLIC;
REVOKE ALL ON "Product" FROM PUBLIC;
REVOKE ALL ON "Participant" FROM PUBLIC;
REVOKE ALL ON "Order" FROM PUBLIC;
REVOKE ALL ON "OrderItem" FROM PUBLIC;
REVOKE ALL ON "NotificationLog" FROM PUBLIC;
REVOKE ALL ON "Guest" FROM PUBLIC;
REVOKE ALL ON "GuestAccessToken" FROM PUBLIC;
REVOKE ALL ON "BankAccount" FROM PUBLIC;
REVOKE ALL ON "FeesConfig" FROM PUBLIC;
REVOKE ALL ON "Address" FROM PUBLIC;
REVOKE ALL ON "SocialMedia" FROM PUBLIC;
```

✅ **Run this first** → Should complete without errors

---

### **Block 2: ENABLE RLS ON ALL TABLES**

```sql
-- ============================================
-- PHASE 2: Enable RLS on all tables
-- ============================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trip" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Participant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Guest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GuestAccessToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BankAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FeesConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialMedia" ENABLE ROW LEVEL SECURITY;
```

✅ **Run this second** → Should complete without errors

---

### **Block 3: CREATE RLS POLICIES**

```sql
-- ============================================
-- PHASE 3: Create RLS Policies
-- ============================================

-- === USER Table ===
CREATE POLICY "User: self read" ON "User"
  FOR SELECT
  TO authenticated
  USING ( auth.uid() = id );

CREATE POLICY "User: self update" ON "User"
  FOR UPDATE
  TO authenticated
  USING ( auth.uid() = id )
  WITH CHECK ( auth.uid() = id );


-- === TRIP Table (Public + Owner) ===
CREATE POLICY "Trip: public read active" ON "Trip"
  FOR SELECT
  TO anon, authenticated
  USING ( "isActive" = true );

CREATE POLICY "Trip: owner full access" ON "Trip"
  FOR ALL
  TO authenticated
  USING ( auth.uid() = "jastiperId" )
  WITH CHECK ( auth.uid() = "jastiperId" );


-- === PRODUCT Table (Public + Owner) ===
CREATE POLICY "Product: public read active" ON "Product"
  FOR SELECT
  TO anon, authenticated
  USING ( status = 'active' );

CREATE POLICY "Product: trip owner manage" ON "Product"
  FOR ALL
  TO authenticated
  USING (
    "tripId" IN (
      SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
    )
  )
  WITH CHECK (
    "tripId" IN (
      SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
    )
  );


-- === PARTICIPANT Table (Trip Owner Only) ===
CREATE POLICY "Participant: trip owner read" ON "Participant"
  FOR SELECT
  TO authenticated
  USING (
    "tripId" IN (
      SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
    )
  );


-- === ORDER Table (Trip Owner Only) ===
CREATE POLICY "Order: trip owner read" ON "Order"
  FOR SELECT
  TO authenticated
  USING (
    "tripId" IN (
      SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
    )
  );


-- === ORDERITEM Table (Trip Owner Only) ===
CREATE POLICY "OrderItem: trip owner read" ON "OrderItem"
  FOR SELECT
  TO authenticated
  USING (
    "orderId" IN (
      SELECT id FROM "Order" 
      WHERE "tripId" IN (
        SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
      )
    )
  );


-- === ADDRESS Table (Trip Owner + Privacy) ===
CREATE POLICY "Address: trip owner read" ON "Address"
  FOR SELECT
  TO authenticated
  USING (
    "participantId" IN (
      SELECT id FROM "Participant" p
      WHERE p."tripId" IN (
        SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
      )
    )
  );


-- === NOTIFICATIONLOG Table (Trip Owner + User) ===
CREATE POLICY "NotificationLog: trip owner read" ON "NotificationLog"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Guest" g
      WHERE g.id = "guestId" 
      OR "userId" = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM "Participant" p
      WHERE p."tripId" IN (
        SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
      )
    )
  );


-- === GUEST Table (Service Only - No Policy) ===
-- No policy = accessible only to service_role


-- === GUESTACCESSTOKEN Table (Service Only - No Policy) ===
-- No policy = accessible only to service_role


-- === BANKACCOUNT Table (Owner Only) ===
CREATE POLICY "BankAccount: owner only" ON "BankAccount"
  FOR ALL
  TO authenticated
  USING ( auth.uid() = "userId" )
  WITH CHECK ( auth.uid() = "userId" );


-- === SOCIALMEDIA Table (Public + Owner) ===
CREATE POLICY "SocialMedia: public read" ON "SocialMedia"
  FOR SELECT
  TO anon, authenticated
  USING ( true );

CREATE POLICY "SocialMedia: owner manage" ON "SocialMedia"
  FOR ALL
  TO authenticated
  USING ( auth.uid() = "userId" )
  WITH CHECK ( auth.uid() = "userId" );


-- === FEESCONFIG Table (Public Read) ===
CREATE POLICY "FeesConfig: public read" ON "FeesConfig"
  FOR SELECT
  TO anon, authenticated
  USING ( true );
```

✅ **Run this third** → Should complete without errors

---

### **Block 4: GRANT PERMISSIONS**

```sql
-- ============================================
-- PHASE 4: Grant SELECT permissions to anon role
-- ============================================
GRANT SELECT ON "Product" TO anon;
GRANT SELECT ON "Trip" TO anon;
GRANT SELECT ON "FeesConfig" TO anon;
GRANT SELECT ON "SocialMedia" TO anon;
```

✅ **Run this fourth** → Should complete without errors

---

## 🔍 Verification Queries

After all phases complete, run these queries to verify:

```sql
-- Verification 1: Check RLS enabled on all tables
SELECT 
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅' ELSE '❌' END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verification 2: Count policies
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Verification 3: List all policies
SELECT 
  tablename,
  policyname,
  permissive
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected Results:**
- 13 tables with RLS enabled
- ~18 total policies created
- No errors

---

## 🧪 API Testing (Post-Deployment)

### **Test 1: Anonymous User - Browse Products**
```bash
# Should work (public data)
curl -X GET "http://localhost:4000/api/products?status=active" \
  -H "apikey: YOUR_ANON_KEY"

# Expected: 200 OK, products list
```

### **Test 2: Authenticated User - View Own Profile**
```bash
# Should work (own data)
curl -X GET "http://localhost:4000/api/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK, user profile
```

### **Test 3: Authenticated User - View Own Trips**
```bash
# Should work (own data)
curl -X GET "http://localhost:4000/api/trips" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK, user's trips only
```

### **Test 4: User Bank Accounts - Own Only**
```bash
# Should work (own data)
curl -X GET "http://localhost:4000/api/bank-accounts" \
  -H "Authorization: Bearer USER_A_JWT"

# Expected: 200 OK, user A's accounts

# Different JWT:
curl -X GET "http://localhost:4000/api/bank-accounts" \
  -H "Authorization: Bearer USER_B_JWT"

# Expected: 200 OK, user B's accounts (NOT user A's)
```

---

## 🆘 Rollback Plan

If anything breaks:

### **Option 1: Quick Disable RLS** (Keep policies)
```sql
-- Disable RLS on all tables (fast, 1 min)
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Trip" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" DISABLE ROW LEVEL SECURITY;
-- ... (rest of tables)

-- Then restart API
-- pm2 restart jastipin-api
```

### **Option 2: Full Restore** (From Backup)
```bash
# In Supabase Dashboard:
# Backups → Select backup → Click "Restore"
# Wait 5-10 minutes for full restore
```

---

## 📊 Success Criteria

✅ **Deployment is successful if:**

1. All 4 phases complete without errors
2. Verification queries show all RLS enabled
3. API tests pass (see Test 1-4 above)
4. No 500 errors in logs
5. No user complaints about access
6. Performance still good (< 5% slower)

---

## 📝 Post-Deployment Checklist

- [ ] All 4 phases completed
- [ ] Verification queries passed
- [ ] 4 API tests completed successfully
- [ ] No errors in logs
- [ ] Maintenance mode disabled: `MAINTENANCE_MODE=false`
- [ ] Restart API: `pm2 restart jastipin-api`
- [ ] Monitor for 24 hours
- [ ] Document results

---

## 🔗 Related Files

- Implementation script: `/app/backend/prisma/rls-policies.sql`
- Validation queries: `/app/backend/prisma/validate-rls.sql`
- Deployment checklist: `/app/backend/prisma/rls-deployment-checklist.md`

---

## ⏱️ Timeline

- **Pre-deployment**: 5 min (backup)
- **Deployment**: 15-20 min (run all 4 blocks)
- **Verification**: 5-10 min (run queries + API tests)
- **Total**: ~30-40 minutes

**Total with monitoring**: 1-2 hours

