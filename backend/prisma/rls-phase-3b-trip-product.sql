-- ============================================
-- PHASE 3B: CREATE POLICIES - TRIP & PRODUCT
-- Copy-paste this to Supabase SQL Editor
-- Use: service_role key
-- ============================================

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

-- ✅ Expected: Command completed successfully (4 policies created)
