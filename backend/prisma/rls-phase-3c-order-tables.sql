-- ============================================
-- PHASE 3C: CREATE POLICIES - ORDER TABLES
-- Copy-paste this to Supabase SQL Editor
-- Use: service_role key
-- ============================================

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


-- === ADDRESS Table (Trip Owner) ===
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


-- === NOTIFICATIONLOG Table ===
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

-- ✅ Expected: Command completed successfully (5 policies created)
-- Note: Guest and GuestAccessToken have NO policies (service_role only)
