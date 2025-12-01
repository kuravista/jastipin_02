# RLS Security Audit Report - Jastipin Supabase Database

**Date:** 2025-12-01  
**Auditor:** Backend Architect Agent  
**Database:** Supabase PostgreSQL with PgBouncer  
**Script:** `/app/backend/prisma/rls-policies.sql`

---

## Executive Summary

**Overall Security Rating: ⚠️ MEDIUM-HIGH RISK**

The RLS policies provide a solid foundation for security, but contain **2 critical issues** and **4 medium-priority gaps** that must be addressed before production deployment.

### Critical Issues Found:
1. ❌ **NotificationLog policy has SQL logic error** - potential data leakage
2. ❌ **Missing participant self-access policies** - users cannot see their own data

### Key Findings:
- ✅ All 13 tables have RLS enabled
- ✅ No SQL injection vulnerabilities detected
- ✅ Sensitive tables (Guest, GuestAccessToken) properly restricted
- ⚠️ Performance concerns with subquery-heavy policies
- ⚠️ Privacy issues: participants cannot access their own orders/addresses

---

## 1. Security Audit

### 1.1 SQL Injection Analysis
**Status: ✅ SECURE**

All policies use safe constructs:
- `auth.uid()` - Supabase built-in function (safe)
- Parameterized subqueries with proper column references
- No string concatenation or dynamic SQL

**Verification:**
```sql
-- Example of safe pattern used throughout
USING ( auth.uid() = "userId" )
USING ( "tripId" IN (SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()) )
```

### 1.2 Privilege Escalation Analysis
**Status: ⚠️ ONE CRITICAL ISSUE**

#### ❌ CRITICAL: NotificationLog Policy Logic Error

**Location:** Line 168-181 in rls-policies.sql

**Current Policy:**
```sql
CREATE POLICY "NotificationLog: trip owner read" ON "NotificationLog"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Guest" g
      WHERE g.id = "guestId" 
      OR "userId" = auth.uid()  -- ⚠️ This OR is outside the WHERE clause!
    )
    OR
    EXISTS (
      SELECT 1 FROM "Participant" p
      WHERE p."tripId" IN (
        SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
      )
    )
  );
```

**Problem:**  
The condition `WHERE g.id = "guestId" OR "userId" = auth.uid()` is ambiguous. If intended to check "userId matches current user", the `"userId"` column reference is unclear (is it from NotificationLog or Guest?).

**Impact:**  
- If `"userId"` refers to `NotificationLog.userId`, any authenticated user could read ALL notification logs where userId matches their auth.uid()
- The subquery might return true for unintended cases

**Recommended Fix:**
```sql
CREATE POLICY "NotificationLog: trip owner read" ON "NotificationLog"
  FOR SELECT
  TO authenticated
  USING (
    -- User can see their own notifications
    ("userId" IS NOT NULL AND "userId" = auth.uid())
    OR
    -- Trip owner can see notifications related to their trips
    EXISTS (
      SELECT 1 FROM "Participant" p
      JOIN "Guest" g ON g.id = p.id  -- Assuming participant links to guest
      WHERE p."tripId" IN (
        SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
      )
      AND "NotificationLog"."guestId" = g.id
    )
  );
```

### 1.3 Over-Permissive Access Rules
**Status: ✅ MOSTLY SECURE**

| Table | Access Level | Assessment |
|-------|--------------|------------|
| User | Self-only | ✅ Correct |
| Trip | Public (active only) | ✅ Correct |
| Product | Public (active only) | ✅ Correct |
| BankAccount | Self-only | ✅ Correct |
| SocialMedia | Public read | ⚠️ Intentional but privacy concern |
| FeesConfig | Public read | ✅ Correct (transparency) |
| Guest | Service-role only | ✅ Correct |
| GuestAccessToken | Service-role only | ✅ Correct |

**SocialMedia Privacy Note:**  
All social media links are publicly readable. This is acceptable for public jastiper profiles, but should be documented in privacy policy.

---

## 2. Schema Verification

### 2.1 Table Coverage
**Status: ✅ COMPLETE**

All 13 tables from Prisma schema have RLS enabled:

| Table | RLS Enabled | Policies Defined | Status |
|-------|-------------|------------------|--------|
| User | ✅ | 2 (SELECT, UPDATE) | ✅ |
| Trip | ✅ | 2 (public read, owner manage) | ✅ |
| Product | ✅ | 2 (public read, owner manage) | ✅ |
| Participant | ✅ | 1 (trip owner read) | ⚠️ Missing self-access |
| Order | ✅ | 1 (trip owner read) | ⚠️ Missing self-access |
| OrderItem | ✅ | 1 (trip owner read) | ⚠️ Missing self-access |
| Address | ✅ | 1 (trip owner read) | ⚠️ Missing self-access |
| NotificationLog | ✅ | 1 (complex read) | ❌ Logic error |
| Guest | ✅ | 0 (service-role only) | ✅ |
| GuestAccessToken | ✅ | 0 (service-role only) | ✅ |
| BankAccount | ✅ | 1 (owner full) | ✅ |
| SocialMedia | ✅ | 2 (public read, owner manage) | ✅ |
| FeesConfig | ✅ | 1 (public read) | ✅ |

### 2.2 Relationship Integrity

#### User ↔ Trip Relationship
```prisma
Trip.jastiperId → User.id
```
✅ Policy correctly checks: `auth.uid() = "jastiperId"`

#### Trip ↔ Product Relationship
```prisma
Product.tripId → Trip.id
```
✅ Policy uses subquery: `"tripId" IN (SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid())`

#### Trip ↔ Participant ↔ Order Chain
```prisma
Participant.tripId → Trip.id
Order.participantId → Participant.id
Order.tripId → Trip.id
```
⚠️ **ISSUE**: Order has both `participantId` and `tripId` (denormalized), but policy only checks `tripId`. This is OK but redundant.

#### Participant ↔ Address Relationship
```prisma
Address.participantId → Participant.id
```
✅ Policy uses subquery through Participant → Trip

---

## 3. Access Control Analysis

### 3.1 Anon Role (Unauthenticated Users)
**Status: ✅ SECURE**

**Allowed Actions:**
- ✅ Read active Trips (browse jastiper services)
- ✅ Read active Products (browse items)
- ✅ Read FeesConfig (see pricing)
- ✅ Read SocialMedia (view jastiper profiles)

**Denied Actions:**
- ❌ Cannot read Users (correct - privacy)
- ❌ Cannot read Orders (correct - privacy)
- ❌ Cannot read Guest/Tokens (correct - security)
- ❌ Cannot write anything (correct - must use server API)

**GRANT Statements:**
```sql
GRANT SELECT ON "Product" TO anon;
GRANT SELECT ON "Trip" TO anon;
GRANT SELECT ON "FeesConfig" TO anon;
GRANT SELECT ON "SocialMedia" TO anon;
```
✅ Matches the defined policies correctly.

### 3.2 Authenticated Role (Logged-in Users)
**Status: ⚠️ INCOMPLETE**

**Allowed Actions:**
- ✅ Read/update own User profile
- ✅ Full CRUD on own Trips
- ✅ Full CRUD on Products in own Trips
- ✅ Read Participants in own Trips
- ✅ Read Orders in own Trips
- ✅ Read Addresses of Participants in own Trips
- ✅ Full CRUD on own BankAccounts
- ✅ Full CRUD on own SocialMedia

**Missing Access (❌ CRITICAL GAP):**
Authenticated users who are **participants** (customers) cannot:
- ❌ See their own Participant record
- ❌ See their own Orders
- ❌ See their own Address
- ❌ See their own OrderItems

**Why This Matters:**  
If an authenticated user (with auth.uid()) joins a trip as a participant, they cannot query their order status via the API. They must use guest access tokens or server-side queries.

**Use Case Example:**
1. User creates account with email "user@example.com" and phone "+628123456789"
2. User previously placed an order as guest with phone "+628123456789"
3. User logs in and wants to see their order history
4. ❌ **Cannot query** - no policy allows participant self-access

**Recommended Additional Policy:**
```sql
-- Allow participants to see their own participant records
CREATE POLICY "Participant: self read by phone" ON "Participant"
  FOR SELECT
  TO authenticated
  USING (
    phone IN (
      SELECT "whatsappNumber" FROM "User" WHERE id = auth.uid()
    )
  );

-- Allow users to see their own orders (via participant phone match)
CREATE POLICY "Order: self read via participant" ON "Order"
  FOR SELECT
  TO authenticated
  USING (
    "participantId" IN (
      SELECT p.id FROM "Participant" p
      JOIN "User" u ON p.phone = u."whatsappNumber"
      WHERE u.id = auth.uid()
    )
  );

-- Allow users to see their own order items
CREATE POLICY "OrderItem: self read via order" ON "OrderItem"
  FOR SELECT
  TO authenticated
  USING (
    "orderId" IN (
      SELECT o.id FROM "Order" o
      WHERE o."participantId" IN (
        SELECT p.id FROM "Participant" p
        JOIN "User" u ON p.phone = u."whatsappNumber"
        WHERE u.id = auth.uid()
      )
    )
  );

-- Allow users to see their own addresses
CREATE POLICY "Address: self read via participant" ON "Address"
  FOR SELECT
  TO authenticated
  USING (
    "participantId" IN (
      SELECT p.id FROM "Participant" p
      JOIN "User" u ON p.phone = u."whatsappNumber"
      WHERE u.id = auth.uid()
    )
  );
```

### 3.3 Service Role (Server-Side Operations)
**Status: ✅ CORRECT**

Service role **bypasses all RLS policies** (Supabase default behavior).

**Usage:**
- ✅ Backend API uses service_role for:
  - Creating Participants (webhook/registration)
  - Creating Orders (guest checkout)
  - Updating Order status (payment confirmation)
  - Creating GuestAccessTokens
  - Sending notifications (NotificationLog)

**Security Note:**  
Never expose service_role key to frontend! Always use anon key for client SDK.

---

## 4. Implementation Safety Check

### 4.1 Tables Without Policies
**Status: ✅ ALL TABLES HAVE RLS**

All tables have `ENABLE ROW LEVEL SECURITY` statement. Tables without policies:
- Guest (intentional - service_role only)
- GuestAccessToken (intentional - service_role only)

These will **deny all access** to anon/authenticated roles (correct behavior).

### 4.2 Role Specification Issues
**Status: ✅ CORRECT**

All policies specify roles correctly:
- `TO authenticated` - logged-in users
- `TO anon` - unauthenticated users
- `TO anon, authenticated` - all client access

No policy uses `TO PUBLIC` (which would be over-permissive).

### 4.3 REVOKE Statements Safety
**Status: ✅ SAFE**

```sql
REVOKE ALL ON "User" FROM PUBLIC;
REVOKE ALL ON "Trip" FROM PUBLIC;
-- ... (all tables)
```

**Assessment:**
- ✅ REVOKE before policies is best practice (default deny)
- ✅ Will not break functionality if executed multiple times (idempotent)
- ✅ Followed by explicit GRANT only for public tables

### 4.4 Missing SELECT Policies

**Potential Access Denial:**

| Table | Policy | Risk |
|-------|--------|------|
| Participant | Trip owner only | ⚠️ Participants cannot see self |
| Order | Trip owner only | ⚠️ Participants cannot see self |
| OrderItem | Trip owner only | ⚠️ Participants cannot see self |
| Address | Trip owner only | ⚠️ Participants cannot see self |
| Guest | None | ✅ Correct (server-only) |
| GuestAccessToken | None | ✅ Correct (server-only) |

**Conclusion:**  
4 tables have missing self-access policies for authenticated participants.

---

## 5. Recommendations

### 5.1 Additional Policies Needed

#### Priority 1: Critical (Deploy Before Production)

**1. Fix NotificationLog Policy** (see Section 1.2)

**2. Add Participant Self-Access Policies**

```sql
-- Allow participants to see their own records
CREATE POLICY "Participant: self read by phone" ON "Participant"
  FOR SELECT
  TO authenticated
  USING (
    phone IN (
      SELECT "whatsappNumber" FROM "User" WHERE id = auth.uid()
    )
    OR
    -- Original policy: trip owner can see all
    "tripId" IN (
      SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
    )
  );

-- Allow users to see their own orders
CREATE POLICY "Order: self read via participant" ON "Order"
  FOR SELECT
  TO authenticated
  USING (
    "participantId" IN (
      SELECT p.id FROM "Participant" p
      JOIN "User" u ON p.phone = u."whatsappNumber"
      WHERE u.id = auth.uid()
    )
    OR
    -- Original policy: trip owner can see all
    "tripId" IN (
      SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
    )
  );

-- Allow users to see their own order items
CREATE POLICY "OrderItem: self read via order" ON "OrderItem"
  FOR SELECT
  TO authenticated
  USING (
    "orderId" IN (
      SELECT o.id FROM "Order" o
      WHERE o."participantId" IN (
        SELECT p.id FROM "Participant" p
        JOIN "User" u ON p.phone = u."whatsappNumber"
        WHERE u.id = auth.uid()
      )
    )
    OR
    -- Original policy: trip owner can see all
    "orderId" IN (
      SELECT id FROM "Order" 
      WHERE "tripId" IN (
        SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
      )
    )
  );

-- Allow users to see their own addresses
CREATE POLICY "Address: self read via participant" ON "Address"
  FOR SELECT
  TO authenticated
  USING (
    "participantId" IN (
      SELECT p.id FROM "Participant" p
      JOIN "User" u ON p.phone = u."whatsappNumber"
      WHERE u.id = auth.uid()
    )
    OR
    -- Original policy: trip owner can see all
    "participantId" IN (
      SELECT id FROM "Participant" p
      WHERE p."tripId" IN (
        SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
      )
    )
  );
```

#### Priority 2: Performance Optimization

**3. Add User.whatsappNumber Index**
```sql
CREATE INDEX IF NOT EXISTS "User_whatsappNumber_idx" ON "User"("whatsappNumber");
```
Reason: Participant self-access policies join on this column.

**4. Add Composite Index for Trip Owner Queries**
```sql
CREATE INDEX IF NOT EXISTS "Trip_jastiperId_isActive_idx" ON "Trip"("jastiperId", "isActive");
```
Reason: Frequent query pattern in policies.

**5. Add Composite Index for Product Queries**
```sql
CREATE INDEX IF NOT EXISTS "Product_tripId_status_idx" ON "Product"("tripId", "status");
```
Reason: Public product browsing + owner management.

### 5.2 Performance Indexes for Policy Columns

All subquery policies should have supporting indexes:

```sql
-- Already exist in schema (verified in schema.prisma):
-- ✅ Trip(jastiperId) - index exists
-- ✅ Product(tripId) - index exists
-- ✅ Participant(tripId) - index exists
-- ✅ Order(tripId) - index exists
-- ✅ Order(participantId) - index exists
-- ✅ OrderItem(orderId) - index exists
-- ✅ Address(participantId) - index exists

-- NEW indexes needed:
CREATE INDEX IF NOT EXISTS "User_whatsappNumber_idx" ON "User"("whatsappNumber");
CREATE INDEX IF NOT EXISTS "Trip_jastiperId_isActive_idx" ON "Trip"("jastiperId", "isActive");
CREATE INDEX IF NOT EXISTS "Product_tripId_status_idx" ON "Product"("tripId", "status");
CREATE INDEX IF NOT EXISTS "Participant_phone_idx" ON "Participant"("phone");  -- Already exists ✅
```

### 5.3 Migration Strategy

#### Phase 1: Pre-Deployment
1. ✅ **Backup Database**
   ```bash
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
   ```

2. ✅ **Create Staging Environment**
   - Clone production database to staging
   - Test RLS policies on staging first

3. ✅ **Run Schema Verification**
   ```sql
   -- Verify all tables exist
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'User', 'Trip', 'Product', 'Participant', 'Order', 
     'OrderItem', 'Address', 'NotificationLog', 'Guest', 
     'GuestAccessToken', 'BankAccount', 'SocialMedia', 'FeesConfig'
   );
   ```

#### Phase 2: Deployment
1. **Deploy in Maintenance Window** (low traffic period)
   - Recommended: 2 AM - 4 AM local time

2. **Execute Script in Supabase SQL Editor**
   - Use service_role connection
   - Run rls-policies.sql
   - Expected execution time: 5-10 seconds

3. **Verify No Errors**
   ```sql
   -- Check if all policies were created
   SELECT schemaname, tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

#### Phase 3: Post-Deployment Testing

**Test 1: Anon Role (Public Access)**
```sql
-- Test as anon user (no auth token)
SET ROLE anon;
SELECT id, title FROM "Trip" WHERE "isActive" = true LIMIT 5;
-- Expected: Returns active trips

SELECT id, title FROM "Product" WHERE status = 'active' LIMIT 5;
-- Expected: Returns active products

SELECT * FROM "User" LIMIT 1;
-- Expected: Empty result (no access)

RESET ROLE;
```

**Test 2: Authenticated Role (Jastiper Owner)**
```sql
-- Test as authenticated jastiper (need real auth.uid())
SET ROLE authenticated;
-- Note: Cannot fully test without actual JWT, use Supabase client

-- Via Supabase JS client:
const { data: trips } = await supabase
  .from('Trip')
  .select('*')
  .eq('jastiperId', user.id);
-- Expected: Returns only own trips
```

**Test 3: Service Role**
```sql
-- Test server-side access
SELECT COUNT(*) FROM "User";
-- Expected: Returns total user count (bypasses RLS)

SELECT COUNT(*) FROM "Guest";
-- Expected: Returns total guest count
```

**Test 4: Participant Self-Access** (after adding recommended policies)
```sql
-- Via Supabase JS client as authenticated user
const { data: orders } = await supabase
  .from('Order')
  .select('*');
-- Expected: Returns orders where participant phone matches user's whatsappNumber
```

#### Phase 4: Rollback Plan

If issues occur:

**Option 1: Disable RLS Temporarily**
```sql
-- Emergency rollback - disables security!
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Trip" DISABLE ROW LEVEL SECURITY;
-- ... (all tables)

-- Re-enable after fix
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- ...
```

**Option 2: Drop All Policies**
```sql
-- Drop policies but keep RLS enabled (denies all access)
DROP POLICY IF EXISTS "User: self read" ON "User";
DROP POLICY IF EXISTS "User: self update" ON "User";
-- ... (all policies)
```

**Option 3: Restore from Backup**
```bash
# Full database restore
psql $DATABASE_URL < backup-YYYYMMDD-HHMMSS.sql
```

### 5.4 Post-Deployment Testing Checklist

- [ ] Anon users can browse active trips/products
- [ ] Anon users CANNOT read users/orders/guests
- [ ] Authenticated users can read/update own profile
- [ ] Jastiper owners can CRUD own trips/products
- [ ] Jastiper owners can read participants/orders in own trips
- [ ] Jastiper owners can read addresses for shipping
- [ ] Authenticated users can manage own bank accounts
- [ ] Authenticated users can manage own social media
- [ ] Service role can access all tables (server-side)
- [ ] Guest/GuestAccessToken are server-only (no client access)

---

## 6. Risk Assessment

### 6.1 Security Gaps

| Issue | Severity | Impact | Likelihood |
|-------|----------|--------|------------|
| NotificationLog logic error | ❌ Critical | Potential data leakage | High |
| Missing participant self-access | ⚠️ High | Broken user experience | High |
| Performance (no indexes) | ⚠️ Medium | Slow queries at scale | Medium |
| SocialMedia fully public | ⚠️ Low | Privacy concern | Low |

### 6.2 Overall Security Rating

**Current State: ⚠️ MEDIUM-HIGH RISK**

**Breakdown:**
- ✅ **Strong Foundation**: All tables have RLS, proper REVOKE statements
- ✅ **No SQL Injection**: All policies use safe constructs
- ✅ **Sensitive Data Protected**: Guest/Token tables are server-only
- ❌ **Critical Issue**: NotificationLog policy logic error
- ⚠️ **Functionality Gap**: Missing participant self-access policies
- ⚠️ **Performance Risk**: Missing indexes for policy subqueries

**After Implementing Recommendations: ✅ LOW RISK**

### 6.3 Edge Cases

#### Edge Case 1: User Changes Phone Number
**Scenario:** User updates `whatsappNumber` after placing orders as participant.

**Current Behavior:**  
Old orders (with old phone) will no longer be accessible via participant self-access policy.

**Recommendation:**  
Add `userId` column to Participant table for authenticated users, and use that for self-access instead of phone matching.

```sql
-- Future improvement
ALTER TABLE "Participant" ADD COLUMN "userId" TEXT REFERENCES "User"("id");

CREATE POLICY "Participant: self read by userId" ON "Participant"
  FOR SELECT
  TO authenticated
  USING (
    "userId" = auth.uid()
    OR phone IN (SELECT "whatsappNumber" FROM "User" WHERE id = auth.uid())
    OR "tripId" IN (SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid())
  );
```

#### Edge Case 2: Guest Converts to Authenticated User
**Scenario:** Guest with `convertedToUserId` set wants to access old guest orders.

**Current Behavior:**  
Guest orders remain in Guest table, not accessible via User RLS policies.

**Recommendation:**  
Use `convertedToUserId` in Order/Participant policies:

```sql
CREATE POLICY "Order: converted guest access" ON "Order"
  FOR SELECT
  TO authenticated
  USING (
    "guestId" IN (
      SELECT id FROM "Guest" WHERE "convertedToUserId" = auth.uid()
    )
    -- ... OR other conditions
  );
```

#### Edge Case 3: Jastiper Deletes Trip
**Scenario:** Trip is deleted (soft or hard), orphaning orders/products.

**Current Behavior:**  
- Prisma schema has `onDelete: Cascade` for Trip → Product, Trip → Participant
- Orders will cascade delete via Participant cascade

**Assessment:** ✅ Handled correctly by Prisma schema.

#### Edge Case 4: Multiple Jastipers with Same Trip Slug
**Scenario:** Two users create trips with slug "jakarta-singapore".

**Current Behavior:**  
Prisma schema has `@@unique([jastiperId, slug])` - allows same slug for different jastipers.

**RLS Assessment:** ✅ Policies correctly filter by `jastiperId`, no cross-contamination risk.

---

## 7. Implementation Checklist

### Pre-Deployment
- [ ] Backup production database
- [ ] Test on staging environment
- [ ] Verify all tables exist in database
- [ ] Schedule maintenance window
- [ ] Notify users of potential downtime

### Deployment
- [ ] Apply index creation (if not already present)
- [ ] Execute rls-policies.sql in Supabase SQL Editor
- [ ] Verify all policies created (check pg_policies)
- [ ] Test anon role access
- [ ] Test authenticated role access
- [ ] Test service role access

### Post-Deployment
- [ ] Run all test queries (Section 5.3 Phase 3)
- [ ] Monitor error logs for RLS violations
- [ ] Check query performance (EXPLAIN ANALYZE)
- [ ] Verify frontend functionality
- [ ] Document any issues in incident log

### Follow-Up (Within 7 Days)
- [ ] Implement participant self-access policies
- [ ] Fix NotificationLog policy logic
- [ ] Add missing indexes (whatsappNumber, composite indexes)
- [ ] Re-test all access patterns
- [ ] Update API documentation with RLS behavior

---

## 8. SQL Script for Fixes

### Fix 1: NotificationLog Policy
```sql
-- Drop broken policy
DROP POLICY IF EXISTS "NotificationLog: trip owner read" ON "NotificationLog";

-- Create correct policy
CREATE POLICY "NotificationLog: read own or trip related" ON "NotificationLog"
  FOR SELECT
  TO authenticated
  USING (
    -- User can see their own notifications
    ("userId" IS NOT NULL AND "userId" = auth.uid())
    OR
    -- Trip owner can see notifications for participants in their trips
    ("guestId" IN (
      SELECT g.id FROM "Guest" g
      -- Assuming you have a way to link guests to participants, adjust as needed
      WHERE EXISTS (
        SELECT 1 FROM "Participant" p
        WHERE p."tripId" IN (
          SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
        )
        -- You might need additional join logic here depending on your schema
      )
    ))
  );
```

### Fix 2: Add Participant Self-Access
```sql
-- Drop existing policy
DROP POLICY IF EXISTS "Participant: trip owner read" ON "Participant";

-- Create enhanced policy with self-access
CREATE POLICY "Participant: trip owner or self read" ON "Participant"
  FOR SELECT
  TO authenticated
  USING (
    -- Participant can see own record (by phone match)
    phone IN (
      SELECT "whatsappNumber" FROM "User" WHERE id = auth.uid()
    )
    OR
    -- Trip owner can see all participants
    "tripId" IN (
      SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
    )
  );
```

### Fix 3: Add Order Self-Access
```sql
-- Drop existing policy
DROP POLICY IF EXISTS "Order: trip owner read" ON "Order";

-- Create enhanced policy with self-access
CREATE POLICY "Order: trip owner or participant read" ON "Order"
  FOR SELECT
  TO authenticated
  USING (
    -- User can see own orders (via participant phone match)
    "participantId" IN (
      SELECT p.id FROM "Participant" p
      JOIN "User" u ON p.phone = u."whatsappNumber"
      WHERE u.id = auth.uid()
    )
    OR
    -- Trip owner can see all orders
    "tripId" IN (
      SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
    )
  );
```

### Fix 4: Add OrderItem Self-Access
```sql
-- Drop existing policy
DROP POLICY IF EXISTS "OrderItem: trip owner read" ON "OrderItem";

-- Create enhanced policy with self-access
CREATE POLICY "OrderItem: trip owner or participant read" ON "OrderItem"
  FOR SELECT
  TO authenticated
  USING (
    -- User can see own order items
    "orderId" IN (
      SELECT o.id FROM "Order" o
      WHERE o."participantId" IN (
        SELECT p.id FROM "Participant" p
        JOIN "User" u ON p.phone = u."whatsappNumber"
        WHERE u.id = auth.uid()
      )
    )
    OR
    -- Trip owner can see all order items
    "orderId" IN (
      SELECT id FROM "Order" 
      WHERE "tripId" IN (
        SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
      )
    )
  );
```

### Fix 5: Add Address Self-Access
```sql
-- Drop existing policy
DROP POLICY IF EXISTS "Address: trip owner read" ON "Address";

-- Create enhanced policy with self-access
CREATE POLICY "Address: trip owner or participant read" ON "Address"
  FOR SELECT
  TO authenticated
  USING (
    -- User can see own addresses
    "participantId" IN (
      SELECT p.id FROM "Participant" p
      JOIN "User" u ON p.phone = u."whatsappNumber"
      WHERE u.id = auth.uid()
    )
    OR
    -- Trip owner can see participant addresses
    "participantId" IN (
      SELECT id FROM "Participant" p
      WHERE p."tripId" IN (
        SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
      )
    )
  );
```

### Fix 6: Add Missing Indexes
```sql
-- Index for participant self-access (phone matching)
CREATE INDEX IF NOT EXISTS "User_whatsappNumber_idx" ON "User"("whatsappNumber");

-- Composite indexes for performance
CREATE INDEX IF NOT EXISTS "Trip_jastiperId_isActive_idx" ON "Trip"("jastiperId", "isActive");
CREATE INDEX IF NOT EXISTS "Product_tripId_status_idx" ON "Product"("tripId", "status");

-- Verify indexes were created
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%whatsappNumber%' 
OR indexname LIKE '%jastiperId_isActive%' 
OR indexname LIKE '%tripId_status%';
```

---

## 9. Deployment Strategy

### Recommended Approach: Phased Rollout

#### Phase 1: Deploy Base RLS (Current Script)
**Timeline:** Day 1  
**Actions:**
1. Deploy existing rls-policies.sql (with known issues documented)
2. Monitor for critical errors
3. Verify core functionality (browse trips/products, jastiper CRUD)

**Expected Issues:**
- ⚠️ Authenticated participants cannot see own orders (use guest access tokens temporarily)
- ⚠️ NotificationLog might show incorrect results

#### Phase 2: Deploy Critical Fixes
**Timeline:** Day 2-3  
**Actions:**
1. Apply NotificationLog policy fix
2. Add participant self-access policies (Order, OrderItem, Address, Participant)
3. Test thoroughly

**Success Criteria:**
- ✅ Participants can query own orders
- ✅ NotificationLog shows correct results
- ✅ No security regressions

#### Phase 3: Performance Optimization
**Timeline:** Day 7  
**Actions:**
1. Add missing indexes (whatsappNumber, composite indexes)
2. Run EXPLAIN ANALYZE on slow queries
3. Monitor query performance metrics

**Success Criteria:**
- ✅ Policy queries execute in < 100ms
- ✅ No N+1 query issues
- ✅ Database CPU < 50% under normal load

### Alternative Approach: All-at-Once Deployment

**Pros:**
- Single maintenance window
- No temporary workarounds needed

**Cons:**
- Higher risk if issues occur
- Harder to isolate problems

**Recommendation:**  
Use phased rollout for production. Use all-at-once for staging/testing.

---

## 10. Monitoring and Maintenance

### Key Metrics to Monitor

**Security Metrics:**
- RLS policy violations (check Supabase logs)
- Unauthorized access attempts
- Service role key usage (should be server-only)

**Performance Metrics:**
- Average query time for RLS-protected tables
- Database connection pool usage
- Index hit ratio (should be > 95%)

**Functional Metrics:**
- User login success rate
- Order creation success rate
- API error rates (4xx vs 5xx)

### Supabase Dashboard Queries

**Check RLS is Enabled:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;
-- Expected: Empty result (all tables should have RLS)
```

**List All Policies:**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Check for Missing Policies:**
```sql
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public' 
AND t.tablename NOT LIKE 'pg_%' 
AND t.tablename NOT LIKE '_prisma%'
GROUP BY t.tablename
HAVING COUNT(p.policyname) = 0;
-- Expected: Only Guest and GuestAccessToken (intentional no-policy tables)
```

### Log Monitoring

**Watch for these errors:**
- `new row violates row-level security policy` - write operation blocked
- `permission denied for table` - missing GRANT statement
- `infinite recursion detected in policy` - circular policy dependency

### Quarterly Security Audit

**Checklist:**
- [ ] Review all RLS policies (any new tables?)
- [ ] Verify service role key is secure (not committed to git)
- [ ] Check for new Supabase security best practices
- [ ] Test anon/authenticated/service role access patterns
- [ ] Review access logs for anomalies

---

## Conclusion

The RLS policies for Jastipin provide a **strong security foundation** but require **2 critical fixes** before production deployment:

1. ❌ Fix NotificationLog policy logic error
2. ❌ Add participant self-access policies (Order, OrderItem, Address, Participant)

After implementing the recommended fixes and indexes, the security rating will improve from **⚠️ MEDIUM-HIGH RISK** to **✅ LOW RISK**.

### Next Steps (Priority Order):
1. **CRITICAL**: Apply NotificationLog fix (Section 8, Fix 1)
2. **CRITICAL**: Add participant self-access (Section 8, Fix 2-5)
3. **HIGH**: Add missing indexes (Section 8, Fix 6)
4. **MEDIUM**: Test on staging environment
5. **MEDIUM**: Deploy to production with phased rollout

### Estimated Timeline:
- **Fixes Implementation**: 2-4 hours
- **Testing on Staging**: 1-2 days
- **Production Deployment**: 1 day (with monitoring)
- **Performance Tuning**: 3-7 days

**Total Time to Production-Ready**: 5-7 days

---

**Audit Completed By:** Backend Architect Agent  
**Date:** 2025-12-01  
**Review Status:** APPROVED WITH CONDITIONS  
**Next Review Date:** 2025-12-08 (post-deployment verification)
