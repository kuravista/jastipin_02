-- ============================================
-- PHASE 1: REVOKE PUBLIC ACCESS
-- Copy-paste this to Supabase SQL Editor
-- Use: service_role key
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

-- ✅ Expected: Command completed successfully
-- If you see errors, STOP and contact architect
