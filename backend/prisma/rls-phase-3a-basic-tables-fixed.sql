-- ============================================
-- PHASE 3A: CREATE POLICIES - BASIC TABLES
-- Copy-paste this to Supabase SQL Editor
-- Use: service_role key
-- ============================================

-- === USER Table ===
CREATE POLICY "User: self read" ON "User"
  FOR SELECT
  TO authenticated
  USING ( auth.uid()::text = id );

CREATE POLICY "User: self update" ON "User"
  FOR UPDATE
  TO authenticated
  USING ( auth.uid()::text = id )
  WITH CHECK ( auth.uid()::text = id );


-- === BANKACCOUNT Table ===
CREATE POLICY "BankAccount: owner only" ON "BankAccount"
  FOR ALL
  TO authenticated
  USING ( auth.uid()::text = "userId" )
  WITH CHECK ( auth.uid()::text = "userId" );


-- === SOCIALMEDIA Table ===
CREATE POLICY "SocialMedia: public read" ON "SocialMedia"
  FOR SELECT
  TO anon, authenticated
  USING ( true );

CREATE POLICY "SocialMedia: owner manage" ON "SocialMedia"
  FOR ALL
  TO authenticated
  USING ( auth.uid()::text = "userId" )
  WITH CHECK ( auth.uid()::text = "userId" );


-- === FEESCONFIG Table ===
CREATE POLICY "FeesConfig: public read" ON "FeesConfig"
  FOR SELECT
  TO anon, authenticated
  USING ( true );

-- ✅ Expected: Command completed successfully (5 policies created)
