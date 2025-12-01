-- ==========================
-- RLS (Row Level Security) Policies for Jastipin
-- Run this ONLY on Supabase with service_role key
-- ==========================
-- BACKUP DATABASE FIRST! Use: pg_dump $DATABASE_URL > backup.sql
-- Then run this in Supabase SQL Editor
-- ==========================

-- ============================================
-- Phase 0: REVOKE public access (safety first)
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


-- ============================================
-- 1) USER table
-- Access: Users can read/update own profile only
-- Service role: full access (bypasses RLS)
-- ============================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User: self read" ON "User"
  FOR SELECT
  TO authenticated
  USING ( auth.uid() = id );

CREATE POLICY "User: self update" ON "User"
  FOR UPDATE
  TO authenticated
  USING ( auth.uid() = id )
  WITH CHECK ( auth.uid() = id );


-- ============================================
-- 2) TRIP table (Jastiper's trips)
-- Access: 
--   - Public: anyone can read ACTIVE trips
--   - Owner: jastiper can read/update/delete own trip
-- ============================================
ALTER TABLE "Trip" ENABLE ROW LEVEL SECURITY;

-- Public: anyone can browse active trips
CREATE POLICY "Trip: public read active" ON "Trip"
  FOR SELECT
  TO anon, authenticated
  USING ( "isActive" = true );

-- Owner: jastiper owns trip (can do anything)
CREATE POLICY "Trip: owner full access" ON "Trip"
  FOR ALL
  TO authenticated
  USING ( auth.uid() = "jastiperId" )
  WITH CHECK ( auth.uid() = "jastiperId" );


-- ============================================
-- 3) PRODUCT table (Items for sale in a trip)
-- Access:
--   - Public: can read ACTIVE products
--   - Owner: trip owner can manage products
-- ============================================
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;

-- Public: browse active products
CREATE POLICY "Product: public read active" ON "Product"
  FOR SELECT
  TO anon, authenticated
  USING ( status = 'active' );

-- Owner: trip owner can manage products in their trip
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


-- ============================================
-- 4) PARTICIPANT table (People joining a trip)
-- Access:
--   - Trip owner: can see all participants in own trip
--   - Participant: cannot read (via API) - managed server-side via webhook
--   - Service: full access
-- ============================================
ALTER TABLE "Participant" ENABLE ROW LEVEL SECURITY;

-- Trip owner: can see participants in own trip
CREATE POLICY "Participant: trip owner read" ON "Participant"
  FOR SELECT
  TO authenticated
  USING (
    "tripId" IN (
      SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
    )
  );

-- Restrict INSERT/UPDATE/DELETE to service_role only (no anon/auth writes)
-- This means participants are created via webhook/server, not API client


-- ============================================
-- 5) ORDER table
-- Access:
--   - Trip owner: can read orders for their trip
--   - Authenticated user: CANNOT read orders (privacy)
--   - Service: full access
-- Notes:
--   - Orders belong to Participants (not authenticated users typically)
--   - Guests place orders (anonymous)
--   - Use server-side queries for order validation
-- ============================================
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;

-- Trip owner: can see orders in their trip
CREATE POLICY "Order: trip owner read" ON "Order"
  FOR SELECT
  TO authenticated
  USING (
    "tripId" IN (
      SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
    )
  );

-- Restrict modifications to service_role (orders managed via webhook/backend)


-- ============================================
-- 6) ORDERITEM table
-- Access:
--   - Trip owner: can see order items (via order policy)
--   - Service: full access
-- ============================================
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;

-- Trip owner: can see items in orders (nested read)
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


-- ============================================
-- 7) ADDRESS table
-- Access:
--   - Only service_role (for server-side operations)
--   - NOT accessible via anon/authenticated (privacy)
-- ============================================
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;

-- Trip owner CAN see addresses for participants in their trip (for shipping)
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


-- ============================================
-- 8) NOTIFICATION LOG table
-- Access:
--   - Trip owner: can read logs for their trip
--   - Service: full access
--   - Write: service_role only
-- ============================================
ALTER TABLE "NotificationLog" ENABLE ROW LEVEL SECURITY;

-- Trip owner: can read notification logs
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
    -- OR if log is related to their trip
    EXISTS (
      SELECT 1 FROM "Participant" p
      WHERE p."tripId" IN (
        SELECT id FROM "Trip" WHERE "jastiperId" = auth.uid()
      )
    )
  );


-- ============================================
-- 9) GUEST table (Anonymous users)
-- Access:
--   - Service/Server only (via backend)
--   - NOT accessible via client auth
-- ============================================
ALTER TABLE "Guest" ENABLE ROW LEVEL SECURITY;

-- No SELECT policy = guests cannot read via anon/authenticated
-- Service role bypasses RLS and can access


-- ============================================
-- 10) GUESTACCESSTOKEN table
-- Access:
--   - Service/Server only
--   - Anonymous user can use token server-side (not via API)
-- ============================================
ALTER TABLE "GuestAccessToken" ENABLE ROW LEVEL SECURITY;

-- No policy = restricted to service_role


-- ============================================
-- 11) BANKACCOUNT table
-- Access:
--   - User: can see own bank accounts
--   - Service: full access
-- ============================================
ALTER TABLE "BankAccount" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "BankAccount: owner only" ON "BankAccount"
  FOR ALL
  TO authenticated
  USING ( auth.uid() = "userId" )
  WITH CHECK ( auth.uid() = "userId" );


-- ============================================
-- 12) SOCIALMEDIA table
-- Access:
--   - Public: can read social media profiles (for public profile pages)
--   - Owner: can manage own accounts
-- ============================================
ALTER TABLE "SocialMedia" ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can see social media links (for public profiles)
CREATE POLICY "SocialMedia: public read" ON "SocialMedia"
  FOR SELECT
  TO anon, authenticated
  USING ( true );

-- Owner update: user can manage own social media
CREATE POLICY "SocialMedia: owner manage" ON "SocialMedia"
  FOR ALL
  TO authenticated
  USING ( auth.uid() = "userId" )
  WITH CHECK ( auth.uid() = "userId" );


-- ============================================
-- 13) FEESCONFIG table (Admin managed)
-- Access:
--   - Public: can read (fee structure)
--   - Admin/Service: manage
-- ============================================
ALTER TABLE "FeesConfig" ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can see fee config
CREATE POLICY "FeesConfig: public read" ON "FeesConfig"
  FOR SELECT
  TO anon, authenticated
  USING ( true );

-- No INSERT/UPDATE/DELETE for regular users (service_role only)


-- ============================================
-- 14) Grant specific permissions to public
-- ============================================

-- Anon role: can read public products
GRANT SELECT ON "Product" TO anon;

-- Anon role: can read public trips
GRANT SELECT ON "Trip" TO anon;

-- Anon role: can read fee config
GRANT SELECT ON "FeesConfig" TO anon;

-- Anon role: can read social media
GRANT SELECT ON "SocialMedia" TO anon;


-- ============================================
-- 15) Test your policies (run these as different roles)
-- ============================================

-- TEST 1: As anon, should see active products
-- SELECT id, title, price FROM "Product" WHERE status = 'active' LIMIT 5;

-- TEST 2: As authenticated (jastiper), should see own trips
-- SELECT id, title FROM "Trip" WHERE "jastiperId" = auth.uid() LIMIT 5;

-- TEST 3: As authenticated, should NOT see other users' bank accounts
-- SELECT * FROM "BankAccount" LIMIT 1; -- Should be empty if no own bank account

-- TEST 4: As service_role, should see everything (bypasses RLS)
-- SELECT COUNT(*) FROM "User"; -- Should work


-- ============================================
-- Notes:
-- ============================================
-- 1. service_role ALWAYS bypasses RLS (use server-side only!)
-- 2. anon role = unauthenticated users (browser visitors)
-- 3. authenticated role = logged-in users (have valid JWT)
-- 4. Order/Participant/Guest creation/updates should be:
--    - Via backend with service_role (never expose client-side)
--    - Or via webhook with proper verification
-- 5. Use .select() in supabase-js client - RLS automatically filters
-- 6. Never create policies that allow auth.uid() IS NULL for write (security risk)
