# RLS Deployment Checklist untuk Jastipin

## Pre-Deployment (WAJIB)

- [ ] **1. Backup Database**
  ```bash
  pg_dump $DATABASE_URL > jastipin_rls_backup_$(date +%Y%m%d_%H%M%S).sql
  ```
  - Simpan file backup di tempat aman
  - Verify backup valid: `pg_restore --list backup.sql | wc -l`

- [ ] **2. Schedule Maintenance Window**
  - Waktu: Off-peak hours (bukan jam ramai)
  - Duration: 15-30 menit (untuk testing)
  - Notify users: Pesan di app/email

- [ ] **3. Review Script Again**
  - Baca `/app/backend/prisma/rls-policies.sql` line-by-line
  - Pastikan semua column names match schema
  - Verify tidak ada typo SQL

- [ ] **4. Test di Development Environment (Jika Ada)**
  - Jalankan script di dev Supabase project dulu
  - Test API endpoints dengan dev data
  - Verify tidak ada broken functionality

---

## Deployment Steps (DEV → PROD)

### Step 1: Connect ke Supabase Console
```bash
# Get credentials from .env
echo $DATABASE_URL  # should show pooler URL
echo $DIRECT_URL    # should show direct URL
```

### Step 2: Open Supabase SQL Editor
- [ ] Login ke Supabase Dashboard
- [ ] Select Project: Jastipin
- [ ] Go to SQL Editor
- [ ] **CRITICAL: Select "service_role" from dropdown** (NOT anon!)

### Step 3: Run REVOKE Statements First (Safe)
```sql
-- Copy only this block first to Supabase:
REVOKE ALL ON "User" FROM PUBLIC;
REVOKE ALL ON "Trip" FROM PUBLIC;
REVOKE ALL ON "Product" FROM PUBLIC;
-- ... (all REVOKE statements)
```
- [ ] Click Run
- [ ] Should complete without errors

### Step 4: Enable RLS on Each Table
```sql
-- Copy these one by one:
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trip" ENABLE ROW LEVEL SECURITY;
-- ... etc
```
- [ ] Run
- [ ] Check for errors

### Step 5: Create Policies
```sql
-- Copy policy blocks one at a time
-- Start with least-critical tables first:
-- 1. FeesConfig (read-only)
-- 2. SocialMedia (public read)
-- 3. BankAccount (owner only)
-- 4. User (owner only)
-- 5. Trip (public read + owner access)
-- 6. Product (public read + owner access)
-- 7. Order, OrderItem, Address, etc.
```
- [ ] Run
- [ ] Monitor for errors

### Step 6: Grant Permissions
```sql
GRANT SELECT ON "Product" TO anon;
GRANT SELECT ON "Trip" TO anon;
GRANT SELECT ON "FeesConfig" TO anon;
GRANT SELECT ON "SocialMedia" TO anon;
```
- [ ] Run
- [ ] Check status

---

## Post-Deployment Testing (CRITICAL)

### Test 1: API Access (Anonymous User)
```bash
# Should work (public data)
curl https://jastipin.me/api/products?status=active

# Should return 200 OK and products
```
- [ ] Result: ✅ PASS / ❌ FAIL

### Test 2: API Access (Authenticated User)
```bash
# Should work (own data)
curl -H "Authorization: Bearer $JWT" \
  https://jastipin.me/api/profile

# Should return own profile
```
- [ ] Result: ✅ PASS / ❌ FAIL

### Test 3: API Access (Other User's Data)
```bash
# Should FAIL (other user's data)
curl -H "Authorization: Bearer $JWT_USER_A" \
  https://jastipin.me/api/user/user_b_id

# Should return 403 Forbidden
```
- [ ] Result: ✅ PASS / ❌ FAIL

### Test 4: Bank Account Access
```bash
# Should work (own account)
curl -H "Authorization: Bearer $JWT" \
  https://jastipin.me/api/bank-accounts

# Should work (return own accounts)

# With different JWT:
curl -H "Authorization: Bearer $JWT_OTHER" \
  https://jastipin.me/api/bank-accounts

# Should FAIL or return empty (not other user's)
```
- [ ] Result: ✅ PASS / ❌ FAIL

### Test 5: Service Role (Backend)
```bash
# Using service_role key, should access all data
# This is only available to backend, never to client
```
- [ ] Result: ✅ PASS / ❌ FAIL

---

## Monitoring (Post-Deployment)

### First 24 Hours
- [ ] Check API error logs (should no 500 errors related to RLS)
- [ ] Monitor user complaints in support
- [ ] Watch database performance (RLS might slow queries)
- [ ] Check Supabase logs for RLS denials

### Commands to Monitor
```bash
# Check RLS policies created
SELECT tablename, policyname, permissive 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;

# Check if any queries blocked by RLS
-- Monitor Supabase dashboard → Database → Logs
```

---

## Rollback Plan (IF SOMETHING BREAKS)

### Emergency Rollback
```bash
# Restore from backup (15 min downtime)
pg_restore --clean --if-exists -d $DATABASE_URL < jastipin_rls_backup_TIMESTAMP.sql

# Disable RLS on all tables (if partial issue)
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Trip" DISABLE ROW LEVEL SECURITY;
-- ... (all tables)
```

- [ ] Backup restored
- [ ] Verify data integrity
- [ ] Test API endpoints
- [ ] Notify users

---

## Verification Checklist

### Before Clicking Run:
- [ ] Database backup created and verified
- [ ] Maintenance window scheduled
- [ ] Using service_role key (NOT anon)
- [ ] Script reviewed by architect
- [ ] Team notified
- [ ] Rollback plan ready

### After Deployment:
- [ ] All tests pass
- [ ] No API errors in logs
- [ ] Users can access their data
- [ ] Performance acceptable (< 5% slowdown)
- [ ] Admin functions still work

---

## Success Criteria

✅ **Deployment is successful if:**
1. No critical errors during RLS enablement
2. Anonymous users can browse public data (trips, products)
3. Authenticated users access only own data
4. Administrators/backend can bypass RLS via service_role
5. No performance degradation (< 5% increase in query time)
6. No user-facing API changes needed

⚠️ **Warnings to watch for:**
- Slow queries on large tables (add indexes if needed)
- Unexpected 403 errors for legitimate users
- Increased API latency > 5%

---

## Documentation

- [ ] Record deployment timestamp
- [ ] Document any issues encountered
- [ ] Update team with results
- [ ] Archive backup location
- [ ] Update security audit trail

---

**Timeline Estimate: 30-45 minutes**

Total including tests & monitoring: 1-2 hours
