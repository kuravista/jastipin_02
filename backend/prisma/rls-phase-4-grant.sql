-- ============================================
-- PHASE 4: GRANT PERMISSIONS
-- Copy-paste this to Supabase SQL Editor
-- Use: service_role key
-- ============================================

GRANT SELECT ON "Product" TO anon;
GRANT SELECT ON "Trip" TO anon;
GRANT SELECT ON "FeesConfig" TO anon;
GRANT SELECT ON "SocialMedia" TO anon;

-- ✅ Expected: Command completed successfully (4 rows)
