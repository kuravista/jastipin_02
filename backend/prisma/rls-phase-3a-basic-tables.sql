-- ============================================
-- PHASE 3A: CREATE POLICIES - BASIC TABLES
-- Copy-paste this to Supabase SQL Editor
-- Use: service_role key
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


-- === BANKACCOUNT Table ===
CREATE POLICY "BankAccount: owner only" ON "BankAccount"
  FOR ALL
  TO authenticated
  USING ( auth.uid() = "userId" )
  WITH CHECK ( auth.uid() = "userId" );


-- === SOCIALMEDIA Table ===
CREATE POLICY "SocialMedia: public read" ON "SocialMedia"
  FOR SELECT
  TO anon, authenticated
  USING ( true );

CREATE POLICY "SocialMedia: owner manage" ON "SocialMedia"
  FOR ALL
  TO authenticated
  USING ( auth.uid() = "userId" )
  WITH CHECK ( auth.uid() = "userId" );


-- === FEESCONFIG Table ===
CREATE POLICY "FeesConfig: public read" ON "FeesConfig"
  FOR SELECT
  TO anon, authenticated
  USING ( true );

-- ✅ Expected: Command completed successfully (5 policies created)
