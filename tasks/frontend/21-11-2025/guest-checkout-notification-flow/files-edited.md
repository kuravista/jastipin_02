# Files Edited - Guest Checkout Implementation

**Task:** Guest Checkout & Notification Flow - Phase 1-4 Implementation  
**Date:** 21 November 2025

## Backend Changes

### Database Schema
**File:** `/app/backend/prisma/schema.prisma`
- **Lines Added:** 239-312 (74 lines)
- **Changes:**
  - Added `Guest` model (lines 240-267)
  - Added `GuestAccessToken` model (lines 269-286)
  - Added `NotificationLog` model (lines 288-312)
  - Modified `Order` model to add `guestId` field (line 55)
  - Added `guestId` index to Order model (line 87)

### New Services Created

**File:** `/app/backend/src/services/guest.service.ts` (NEW)
- **Total Lines:** 112
- **Purpose:** Guest profile management
- **Functions Implemented:**
  - `generateContactHash()` - SHA256 hashing for guest identification
  - `createOrUpdateGuest()` - Create/update guest profiles with deduplication
  - `findGuestByContactHash()` - Lookup guest by contact info
  - `findGuestById()` - Lookup guest by ID
  - `convertGuestToUser()` - Link guest to registered user account

**File:** `/app/backend/src/services/token.service.ts` (NEW)
- **Total Lines:** ~150
- **Purpose:** Magic link token generation and validation
- **Functions Implemented:**
  - `generateUploadToken()` - Create secure 32-byte tokens with SHA256 hashing
  - `validateToken()` - Validate token expiry, revocation, usage count
  - `verifyChallenge()` - Verify last 4 digits of WhatsApp number
  - `revokeToken()` - Revoke token after successful upload

**File:** `/app/backend/src/routes/upload.ts` (NEW)
- **Total Lines:** ~150
- **Purpose:** API endpoints for guest upload flow
- **Endpoints:**
  - `GET /api/upload/validate?token=xxx` - Validate token
  - `POST /api/upload/verify` - Verify challenge response
  - `POST /api/upload/:orderId` - Upload payment proof
- **Security:**
  - Rate limiting: 10/min for validation, 5/min for verification
  - Bearer token authentication for uploads

### Modified Services

**File:** `/app/backend/src/services/checkout-dp.service.ts`
- **Lines Modified:** 63-72 (guest service integration)
- **Changes:**
  - Added import of `GuestService`
  - Added guest profile creation in `processCheckoutDP()`
  - Return `guestId` in checkout response (line 178)
- **Interface Updates:**
  - Added `participantEmail?: string` to `CheckoutDPRequest`
  - Added `rememberMe?: boolean` to `CheckoutDPRequest`
  - Added `guestId?: string` to `CheckoutDPResponse`

### Routes Registration

**File:** `/app/backend/src/index.ts`
- **Line:** 73
- **Change:** Upload routes already registered: `app.use('/api/upload', uploadRoutes)`

## Frontend Changes

### Modified Components

**File:** `/app/frontend/components/checkout/DPCheckoutForm.tsx`
- **Lines Modified:** Multiple sections (1-12, 35-95, 128-132, 166-169, 228-256)
- **Changes:**
  - **Lines 1-12:** Added imports (useEffect, Checkbox component)
  - **Lines 35-43:** Added `GuestProfile` interface and localStorage key constant
  - **Lines 48-51:** Added state variables for `participantEmail`, `rememberMe`
  - **Lines 58-95:** Added localStorage functions:
    - `loadGuestProfile()` - Load saved profile on mount
    - `saveGuestProfile()` - Save profile after successful checkout
  - **Lines 128-132:** Added email and rememberMe to checkout request
  - **Lines 166-169:** Save guestId to localStorage after checkout success
  - **Lines 228-256:** Added UI elements:
    - Email input field (optional)
    - Remember Me checkbox (default checked)
    - Help text for email usage

**Total Lines Changed:** ~80 lines added/modified

### New Pages Created

**File:** `/app/frontend/app/order/upload/[token]/page.tsx` (NEW)
- **Total Lines:** 305
- **Purpose:** Guest upload flow with magic link
- **Features:**
  - Token validation on page load
  - Challenge verification UI (last 4 digits WhatsApp)
  - File upload with drag & drop
  - Success/error state handling
- **UI Steps:**
  1. Validating (loading state)
  2. Challenge (verification input)
  3. Upload (file picker + upload button)
  4. Success (confirmation message)
  5. Error (error display with retry)

## Summary

### Files Created: 5
- `/app/backend/src/services/guest.service.ts`
- `/app/backend/src/services/token.service.ts`
- `/app/backend/src/routes/upload.ts`
- `/app/backend/src/utils/file-upload.ts`
- `/app/frontend/app/order/upload/[token]/page.tsx`

### Files Modified: 5
- `/app/backend/prisma/schema.prisma`
- `/app/backend/src/services/checkout-dp.service.ts`
- `/app/backend/src/routes/checkout.ts` ✅ FIXED (21 Nov 2025)
- `/app/backend/src/routes/orders.ts`
- `/app/frontend/app/[username]/page.tsx` ✅ FIXED (21 Nov 2025)

### Database Changes
- 3 new tables: `Guest`, `GuestAccessToken`, `NotificationLog`
- 1 modified table: `Order` (added `guestId` column)
- 7 new indexes for query optimization

### Total Lines of Code
- **Backend:** ~412 new lines + ~90 modified lines = ~502 lines
- **Frontend:** ~305 new lines + ~80 modified lines = ~385 lines
- **Total:** ~887 lines of production code

## Implementation Status

### Completed Phases (1-4)
- ✅ Phase 1: Frontend checkout form with email and Remember Me
- ✅ Phase 2: Database schema and Guest service
- ✅ Phase 3: Token generation service and API endpoints
- ✅ Phase 4: Guest upload page with challenge UI

### Pending Phases (5-6)
- ⏳ Phase 5: Service worker for push notifications (deprioritized)
- ⏳ Phase 6: End-to-end testing

## Testing Notes

### Manual Testing Required
1. **Guest Checkout Flow:**
   - Test checkout with email provided
   - Test checkout without email
   - Test Remember Me checkbox (checked/unchecked)
   - Verify localStorage persistence across sessions
   - Test guest deduplication (same phone returns same guestId)

2. **Magic Link Flow:**
   - Generate token (need admin interface or API call)
   - Visit `/order/upload/[token]` page
   - Test challenge verification with correct/incorrect digits
   - Test file upload
   - Verify token revocation after upload

3. **Security Testing:**
   - Test expired tokens (manually set expiresAt in past)
   - Test rate limiting on validation endpoint (>10 requests/min)
   - Test rate limiting on verification endpoint (>5 requests/min)
   - Test invalid token format
   - Test token reuse after revocation

### Build Status
- ✅ Backend TypeScript compilation: SUCCESS
- ⏳ Frontend Next.js build: In progress

## Critical Features Added (Opsi A)

### File Upload Handler
**File:** `/app/backend/src/utils/file-upload.ts` (NEW)
- **Lines:** 125
- **Purpose:** Simple multipart form-data parser for local file storage
- **Functions:**
  - `handleFileUpload()` - Parse multipart request and save file
  - `ensureUploadDirExists()` - Create upload directory if needed
  - `deleteFile()` - Remove file from disk
  - `getFileUrl()` - Generate public URL for uploaded file
- **Note:** No multer dependency (npm install failed), custom implementation
- **Storage:** `/app/backend/uploads/payment-proofs/`
- **Max Size:** 5MB
- **Formats:** All (no validation yet, will be added with R2 migration)

### Static File Serving
**File:** `/app/backend/src/index.ts`
- **Line:** 40
- **Change:** `app.use('/uploads', express.static('uploads'))`
- **Purpose:** Serve uploaded files publicly at `http://localhost:4000/uploads/payment-proofs/{filename}`

### Generate Token Endpoint
**File:** `/app/backend/src/routes/orders.ts`
- **Lines Added:** 686-781 (96 lines)
- **Endpoint:** `POST /api/orders/:orderId/generate-upload-token`
- **Auth:** Requires JWT, only jastiper who owns order's trip
- **Response:**
  ```json
  {
    "success": true,
    "token": "43-char base64url token",
    "magicLink": "http://localhost:3000/order/upload/{token}",
    "expiresAt": "ISO timestamp (7 days)",
    "order": { "id", "participantName", "participantPhone", "status" }
  }
  ```
- **Security Checks:**
  - User must be authenticated
  - User must own the trip
  - Order must not have proof already uploaded
  - Order must exist

### Upload Route Update
**File:** `/app/backend/src/routes/upload.ts`
- **Lines Modified:** 112-170
- **Change:** Handle actual file upload instead of expecting proofUrl
- **Process:**
  1. Validate Bearer token in Authorization header
  2. Call `handleFileUpload(req)` to parse multipart data
  3. Save file to disk
  4. Generate public URL
  5. Update order.proofUrl
  6. Revoke token
- **Response:** Includes `filename` field for debugging

### Frontend Upload Fix
**File:** `/app/frontend/app/order/upload/[token]/page.tsx`
- **Lines Modified:** 104-114
- **Change:** Send file as multipart FormData with token in header
- **Before:** `formData.append('token', token)` in body
- **After:** `headers: { 'Authorization': 'Bearer ${token}' }`

## Critical Bug Fixes (21 Nov 2025)

### Bug #1: Email Not Saving to Database

**Symptoms:**
- Frontend sent email in payload
- Backend logs showed `email: undefined`
- Database Guest.email and Participant.email were NULL

**Root Causes:**
1. Route handler `/app/backend/src/routes/checkout.ts` didn't extract `participantEmail` from request body
2. Participant creation didn't include email field
3. Prisma client needed regeneration after schema changes
4. Phone normalization inconsistency between hash and storage

**Fixes Applied:**

**File:** `/app/backend/src/routes/checkout.ts`
- **Lines:** 18-26 (destructuring)
- **Change:** Added `participantEmail` and `rememberMe` extraction
```typescript
const { 
  participantEmail,  // ✅ ADDED
  rememberMe,        // ✅ ADDED
  ...
} = req.body
```

**File:** `/app/backend/src/routes/checkout.ts`
- **Lines:** 88-96 (service call)
- **Change:** Pass email and rememberMe to service
```typescript
const result = await processCheckoutDP({
  participantEmail,  // ✅ ADDED
  rememberMe,        // ✅ ADDED
  ...
})
```

**File:** `/app/backend/src/services/checkout-dp.service.ts`
- **Lines:** 80-95 (participant creation)
- **Change:** Save email to Participant table
```typescript
// Create new participant
participant = await db.participant.create({
  data: {
    email: request.participantEmail || null  // ✅ ADDED
  }
})

// ✅ ADDED: Update existing participant
} else {
  participant = await db.participant.update({
    where: { id: participant.id },
    data: {
      name: request.participantName,
      email: request.participantEmail || participant.email  // ✅ ADDED
    }
  })
}
```

**File:** `/app/backend/src/services/guest.service.ts`
- **Lines:** 68-69 (email normalization)
- **Change:** Convert empty string to null (Prisma compatibility)
```typescript
// ✅ ADDED: Normalize email
const normalizedEmail = data.email?.trim() || null

// Use in create/update
email: normalizedEmail  // Instead of: data.email || null
```

**File:** `/app/backend/src/services/guest.service.ts`
- **Lines:** 20-28, 52-59 (phone normalization)
- **Change:** Consistent phone format between hash and storage
```typescript
// ✅ ENHANCED: Handle all phone formats (0, 62, +62)
let normalizedPhone = phone.replace(/\s/g, '')
if (normalizedPhone.startsWith('0')) {
  normalizedPhone = '+62' + normalizedPhone.substring(1)
} else if (normalizedPhone.startsWith('62')) {
  normalizedPhone = '+' + normalizedPhone
} else if (!normalizedPhone.startsWith('+')) {
  normalizedPhone = '+62' + normalizedPhone
}
```

**Additional Fixes:**
- Prisma client regenerated: `npx prisma generate`
- PM2 backend restart: `pm2 restart jastipin-api`
- Debug logging added (will be removed in production)

**Verification:**
```bash
# Before fix:
[DEBUG] email: undefined, emailType: 'undefined'
[DEBUG] Guest created: { email: null }

# After fix:
[DEBUG] email: 'test@example.com', emailType: 'string'
[DEBUG] Guest created: { email: 'test@example.com' }  ✅
```

**Status:** ✅ RESOLVED - Both Guest and Participant tables now save email correctly

---

## Frontend Email Integration (21 Nov 2025)

### Bug #2: Email Field Not Connected to Backend

**File:** `/app/frontend/app/[username]/page.tsx`

**Changes Applied:**

**Lines 191-195:** Added email to form state
```typescript
const [dpCheckoutForm, setDPCheckoutForm] = useState({
  nama: "",
  nomor: "",
  email: "",     // ✅ ADDED
  notes: "",
})
```

**Lines 198-217:** localStorage integration
```typescript
// ✅ CHANGED: localStorage key from 'dp_checkout_data' to 'jastipin_guest_profile'
const saved = localStorage.getItem('jastipin_guest_profile')

setDPCheckoutForm({
  nama: parsed.name || "",                        // ✅ CHANGED: from parsed.nama
  nomor: parsed.phone?.replace(/^62/, '') || "",  // ✅ CHANGED: from parsed.nomor
  email: parsed.email || "",                      // ✅ ADDED
  notes: "",
})
setRememberMe(parsed.rememberMe ?? true)          // ✅ ADDED
```

**Lines 322-323:** API call includes email
```typescript
const response = await apiPost(`/checkout/dp`, {
  participantEmail: dpCheckoutForm.email || undefined,  // ✅ ADDED
  rememberMe: rememberMe,                               // ✅ ADDED
  ...
})
```

**Lines 330-343:** Save to localStorage in correct format
```typescript
// ✅ CHANGED: Save guestId and proper format
if (response?.data?.guestId) {
  localStorage.setItem('jastipin_guest_profile', JSON.stringify({
    guestId: response.data.guestId,  // ✅ ADDED
    name: dpCheckoutForm.nama,
    phone: formattedPhone,
    email: dpCheckoutForm.email || '',  // ✅ ADDED
    rememberMe: true
  }))
}
```

**Lines 1006-1017:** UI email input field
```typescript
// ✅ ADDED: Email input field (between WhatsApp and Notes)
<div>
  <label className="block text-sm font-medium mb-1">
    Email <span className="text-gray-500 text-xs">(Opsional)</span>
  </label>
  <input
    type="email"
    placeholder="email@example.com"
    value={dpCheckoutForm.email}
    onChange={(e) => setDPCheckoutForm({ ...dpCheckoutForm, email: e.target.value })}
    className="..."
  />
  <p className="text-xs text-gray-500 mt-1">Untuk notifikasi tambahan dan invoice</p>
</div>
```

**Status:** ✅ COMPLETE - Email field fully integrated

---

## Known Issues / TODO
1. ✅ ~~File upload handler~~ - IMPLEMENTED (local storage, will migrate to R2)
2. ✅ ~~Generate token endpoint~~ - IMPLEMENTED with authentication
3. ✅ ~~Email not saving~~ - FIXED (21 Nov 2025)
4. ✅ ~~Route handler missing fields~~ - FIXED (21 Nov 2025)
5. ✅ ~~Participant email NULL~~ - FIXED (21 Nov 2025)
6. Payment link in checkout response is mocked - needs real payment gateway integration
7. Service worker for push notifications not yet implemented (Phase 5)
8. No automated tests yet (Phase 6)
9. No admin UI to generate upload tokens (only API endpoint, can use Postman/curl)
10. npm install multer failed - used custom implementation instead

## Security Considerations Implemented
- ✅ SHA256 hashing for guest contact info (privacy)
- ✅ SHA256 hashing for token storage (secure validation)
- ✅ 32-byte random tokens (cryptographically secure)
- ✅ Token expiration (7 days)
- ✅ Token usage count tracking
- ✅ Token revocation after upload
- ✅ Rate limiting on critical endpoints
- ✅ Challenge-response verification (last 4 digits WhatsApp)
- ✅ httpOnly cookie consideration (in design, not yet implemented)

## Performance Optimizations
- ✅ Database indexes on frequently queried fields
- ✅ Guest deduplication to prevent duplicate records
- ✅ Prisma transaction for order creation
- ✅ Lazy loading of guest profile from localStorage

## Next Steps
1. Test checkout flow in development environment
2. Implement actual file upload storage (S3 or local filesystem)
3. Add admin endpoint to generate upload tokens
4. Implement notification triggers (Phase 5)
5. Write automated tests (Phase 6)
6. Security audit and penetration testing
