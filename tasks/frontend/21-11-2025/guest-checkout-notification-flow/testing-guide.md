# Testing Guide - Guest Checkout & Upload Flow

**Last Updated:** 21 November 2025  
**Status:** Critical features complete, ready for manual testing

---

## 🎯 Complete Implementation Status

### ✅ Phase 1-4: COMPLETE
- Guest checkout with email & Remember Me
- Database schema (Guest, GuestAccessToken, NotificationLog)
- Token generation service with SHA256 security
- Magic link validation & verification API
- Guest upload page with challenge-response UI
- File upload with local storage

### ✅ Critical Features: COMPLETE
- File upload handler (simple multipart parser, no multer dependency)
- Generate token endpoint with authentication
- Static file serving for uploaded files

---

## 🧪 Manual Testing Flow

### Prerequisites
1. Backend running: `cd /app/backend && npm run dev`
2. Frontend running: `cd /app/frontend && npm run dev`
3. Database migrated: `npx prisma db push` (already done)

---

## Test Scenario 1: Guest Checkout

### Step 1: Create Guest Order

**Action:**
1. Go to jastiper profile page: `http://localhost:3000/{username}`
2. Browse products and add to cart
3. Click "Checkout Sekarang"
4. Navigate to: `http://localhost:3000/checkout/dp/{tripId}?items=...`

**Fill Form:**
```
Nama: John Doe
WhatsApp: 081234567890
Email: john@example.com (optional)
☑️ Remember Me checkbox (checked)
```

**Expected Results:**
- Form submits successfully
- Redirected to payment page
- `localStorage` contains `jastipin_guest_profile` key with saved data
- Check backend database:
  ```sql
  SELECT * FROM "Guest" WHERE phone = '62812345678';
  SELECT * FROM "Order" WHERE "guestId" IS NOT NULL;
  ```

**API Request Check:**
```bash
# Should see this in backend logs:
POST /api/checkout/dp
Response: { success: true, orderId: "...", guestId: "..." }
```

---

## Test Scenario 2: Generate Magic Link (Jastiper)

### Step 2A: Login as Jastiper

**Action:**
1. Login with jastiper account credentials
2. Note your JWT token from browser DevTools → Application → Cookies

### Step 2B: Generate Upload Token

**API Call:**
```bash
# Replace with actual orderId and JWT token
curl -X POST http://localhost:4000/api/orders/{orderId}/generate-upload-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "magicLink": "http://localhost:3000/order/upload/{token}",
  "expiresAt": "2025-11-28T...",
  "order": {
    "id": "...",
    "participantName": "John Doe",
    "participantPhone": "62812345678",
    "status": "pending_dp"
  }
}
```

**Database Check:**
```sql
SELECT * FROM "GuestAccessToken" 
WHERE "orderId" = 'YOUR_ORDER_ID';
-- Should see tokenHash (64 chars), verifyType = 'LAST4_WA'
```

**Auth Checks:**
- ✅ Without JWT → 401 Unauthorized
- ✅ Wrong jastiper (not owner) → 403 Forbidden
- ✅ Order not found → 404 Not Found
- ✅ Order already has proofUrl → 400 Bad Request

---

## Test Scenario 3: Magic Link Upload (Guest)

### Step 3A: Open Magic Link

**Action:**
1. Copy `magicLink` from Step 2B response
2. Open in browser: `http://localhost:3000/order/upload/{token}`

**Expected:**
- Page loads successfully
- Shows "Memvalidasi link..." briefly
- Transitions to "Verifikasi Identitas" step

**API Call Check:**
```bash
# Browser automatically calls:
GET /api/upload/validate?token={token}

# Expected response:
{
  "valid": true,
  "challenge": "LAST4_WA"
}
```

**Error Cases to Test:**
- Invalid token → "Link Tidak Valid"
- Expired token (manually set expiresAt in past) → "Token expired"
- Already revoked token → "Token revoked"

### Step 3B: Challenge Verification

**Action:**
1. Look at participant phone: `62812345678` → last 4 digits = `7890`
2. Enter `7890` in challenge input
3. Click "Verifikasi"

**Expected:**
- Success → Navigate to upload UI
- Wrong digits → Error: "Kode verifikasi salah"

**API Call Check:**
```bash
POST /api/upload/verify
Body: { "token": "...", "challengeResponse": "7890" }

# Expected response:
{
  "verified": true,
  "orderId": "..."
}
```

**Database Check:**
```sql
SELECT "usedCount" FROM "GuestAccessToken" 
WHERE "tokenHash" = sha256(token);
-- Should increment from 0 to 1
```

### Step 3C: File Upload

**Action:**
1. Click "Pilih file" or drag & drop
2. Select image (PNG/JPG) or PDF < 5MB
3. Preview shows filename and size
4. Click "Upload Bukti Pembayaran"

**Expected:**
- File uploads successfully
- Shows success screen: "Berhasil!"
- Token automatically revoked

**API Call Check:**
```bash
POST /api/upload/{orderId}
Headers: Authorization: Bearer {token}
Body: multipart/form-data with 'file' field

# Expected response:
{
  "success": true,
  "proofUrl": "/uploads/payment-proofs/1732168800000-abc123.jpg",
  "filename": "1732168800000-abc123.jpg",
  "message": "Payment proof uploaded successfully"
}
```

**Database Check:**
```sql
-- Order should have proofUrl
SELECT "proofUrl" FROM "Order" WHERE id = 'ORDER_ID';

-- Token should be revoked
SELECT "revokedAt" FROM "GuestAccessToken" 
WHERE "orderId" = 'ORDER_ID';
-- Should NOT be NULL
```

**File System Check:**
```bash
ls -lh /app/backend/uploads/payment-proofs/
# Should see uploaded file
```

**View Uploaded File:**
- Open browser: `http://localhost:4000/uploads/payment-proofs/{filename}`
- Image/PDF should display

---

## Test Scenario 4: Returning Guest

### Step 4A: Clear Session, Keep localStorage

**Action:**
1. Close browser tab (don't clear localStorage)
2. Reopen: `http://localhost:3000/checkout/dp/{tripId}`

**Expected:**
- Form auto-filled with saved data (name, phone, email)
- "Remember Me" checkbox still checked

### Step 4B: Clear localStorage

**Action:**
1. DevTools → Application → Local Storage → Clear `jastipin_guest_profile`
2. Reload checkout page

**Expected:**
- Form is empty (no auto-fill)

### Step 4C: Uncheck Remember Me

**Action:**
1. Checkout with "Remember Me" unchecked
2. Complete checkout
3. Reload page

**Expected:**
- localStorage does NOT contain guest profile
- Form is empty on next visit

---

## Security Tests

### Test 5A: Rate Limiting

**Validation Endpoint (10/min):**
```bash
# Run 11 times rapidly:
for i in {1..11}; do
  curl "http://localhost:4000/api/upload/validate?token=test" &
done

# 11th request should return:
{ "error": "Too many validation attempts, please try again later" }
```

**Verification Endpoint (5/min):**
```bash
# Run 6 times rapidly:
for i in {1..6}; do
  curl -X POST http://localhost:4000/api/upload/verify \
    -H "Content-Type: application/json" \
    -d '{"token":"test","challengeResponse":"1234"}' &
done

# 6th request should return:
{ "error": "Too many verification attempts, please try again later" }
```

### Test 5B: Token Reuse Prevention

**Action:**
1. Upload file successfully with token
2. Try using same token again

**Expected:**
- 2nd upload fails with "Token revoked" or "Token already used"

### Test 5C: Token Expiration

**Database Manipulation:**
```sql
-- Manually expire token
UPDATE "GuestAccessToken" 
SET "expiresAt" = NOW() - INTERVAL '1 day'
WHERE "orderId" = 'YOUR_ORDER_ID';
```

**Action:**
- Try validating expired token

**Expected:**
- Error: "Token expired"

---

## Edge Cases

### Test 6A: File Size Limit

**Action:**
- Try uploading file > 5MB

**Expected:**
- Error: "File size exceeds 5MB limit"

### Test 6B: Invalid File Types

**Action:**
- Try uploading .exe, .zip, etc

**Expected:**
- Browser might allow (no validation yet)
- Should still upload (validation on backend is mimetype only)
- **TODO:** Add file type validation

### Test 6C: Concurrent Uploads

**Action:**
- Generate token
- Open 2 browser windows with same magic link
- Both complete challenge
- Both try to upload

**Expected:**
- First upload succeeds
- Second upload fails (token revoked or maxUses=1 exceeded)

---

## Database Queries for Debugging

### Check Guest Records
```sql
SELECT 
  g.id,
  g.name,
  g.phone,
  g.email,
  g."rememberMe",
  g."totalOrders",
  COUNT(o.id) as actual_orders
FROM "Guest" g
LEFT JOIN "Order" o ON o."guestId" = g.id
GROUP BY g.id;
```

### Check Token Status
```sql
SELECT 
  gat."orderId",
  gat."verifyType",
  gat."usedCount",
  gat."maxUses",
  gat."expiresAt",
  gat."revokedAt",
  o."proofUrl"
FROM "GuestAccessToken" gat
JOIN "Order" o ON o.id = gat."orderId"
ORDER BY gat."createdAt" DESC;
```

### Check Upload Success
```sql
SELECT 
  o.id,
  o.status,
  o."proofUrl",
  p.name as participant_name,
  p.phone as participant_phone,
  g.name as guest_name
FROM "Order" o
JOIN "Participant" p ON p.id = o."participantId"
LEFT JOIN "Guest" g ON g.id = o."guestId"
WHERE o."proofUrl" IS NOT NULL
ORDER BY o."updatedAt" DESC;
```

---

## Known Issues / TODO

### 🔧 Technical Debt
1. **File Storage:** Using local filesystem, needs R2 Cloudflare migration
2. **File Type Validation:** No mimetype restriction yet
3. **Image Optimization:** No compression/resize before storage
4. **Token Delivery:** No automated WhatsApp/Email sending (manual copy-paste)

### 🚨 Missing Features
1. **Notification System:** Phase 5 (service worker, push notifications)
2. **Automated Tests:** Phase 6 (unit tests, integration tests)
3. **Admin UI:** No dashboard to generate tokens (only API endpoint)

### 🐛 Potential Bugs
1. **Concurrent Token Generation:** Multiple tokens for same order possible
2. **File Cleanup:** No automatic deletion of old files
3. **Token Cleanup:** Expired tokens not auto-deleted from database

---

## Success Criteria

### ✅ Phase 1-4 Complete When:
- [x] Guest can checkout with email & Remember Me
- [x] Data persists in localStorage
- [x] Jastiper can generate upload token via API
- [x] Guest can validate token via magic link
- [x] Guest can verify identity with last 4 digits
- [x] Guest can upload payment proof
- [x] Token revokes after upload
- [x] Both backend & frontend build successfully

### ⏳ Ready for Production When:
- [ ] File storage migrated to R2 Cloudflare
- [ ] Rate limiting tested and working
- [ ] All edge cases handled gracefully
- [ ] Admin UI for token generation
- [ ] Automated notifications implemented
- [ ] Comprehensive test suite (unit + integration)
- [ ] Security audit completed
- [ ] Load testing passed

---

## Quick Test Commands

```bash
# Backend build
cd /app/backend && npm run build

# Frontend build
cd /app/frontend && npm run build

# Database check
cd /app/backend && npx prisma studio

# View logs
# Backend: Check terminal where `npm run dev` is running
# Frontend: Check browser DevTools → Console & Network

# Clear all test data
cd /app/backend
npx prisma db push --force-reset  # WARNING: Deletes all data!
```

---

## Contact & Support

**Task ID:** guest-checkout-notification-flow  
**Date:** 21 November 2025  
**Status:** Phase 1-4 Complete, Ready for Manual Testing

For questions or issues, refer to:
- `/app/tasks/frontend/21-11-2025/guest-checkout-notification-flow/plan.md`
- `/app/tasks/frontend/21-11-2025/guest-checkout-notification-flow/files-edited.md`
- `/app/tasks/frontend/21-11-2025/guest-checkout-notification-flow/design-document.md`
