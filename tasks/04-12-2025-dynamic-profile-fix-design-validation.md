# Fix: Dynamic Profile Design Update Not Persisting

**Status**: ✅ FIXED  
**Date**: 2025-12-04  
**Issue**: Profile design (layout & theme) updates not saved to database

---

## Root Cause Analysis

### The Problem
When user updated profile design in EditProfileDialog → Design tab:
1. Selected layout (e.g., "store") and theme (e.g., "ocean")
2. Clicked "Terapkan Tampilan" (Apply Design)
3. Dialog closed ✅
4. **But** profile page still showed "classic" layout with "jastip" theme ❌

### Why It Happened
The validation middleware was **STRIPPING the `design` field** from the request!

**Flow:**
```
Frontend sends:
{
  "profileName": "...",
  "profileBio": "...",
  "slug": "...",
  "design": {          ← ❌ REJECTED!
    "layoutId": "store",
    "themeId": "ocean"
  }
}
     ↓
PATCH /api/profile with updateProfileSchema validator
     ↓
Zod Schema doesn't have "design" field defined
     ↓
Validator strips "design" field (not in schema)
     ↓
Backend only receives:
{
  "profileName": "...",
  "profileBio": "...",
  "slug": "..."
}
     ↓
ProfileDesign table NOT updated ❌
```

---

## The Fix

### File Changed
`/app/backend/src/utils/validators.ts`

### What Was Missing
The `updateProfileSchema` did NOT include the `design` field definition.

**Before:**
```typescript
export const updateProfileSchema = z.object({
  profileName: z.string().min(2).max(100).optional(),
  profileBio: z.string().max(500).optional(),
  slug: z.string().min(3).max(50).optional(),
  avatar: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  // ... more fields ...
  originAddressText: z.string().optional().or(z.literal('')),
  // ❌ NO design FIELD!
})
```

**After:**
```typescript
export const updateProfileSchema = z.object({
  profileName: z.string().min(2).max(100).optional(),
  profileBio: z.string().max(500).optional(),
  slug: z.string().min(3).max(50).optional(),
  avatar: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  // ... more fields ...
  originAddressText: z.string().optional().or(z.literal('')),
  // ✅ NOW ADDED:
  design: z.object({
    layoutId: z.enum(['classic', 'store', 'bento', 'editorial', 'immersive']).optional(),
    themeId: z.enum(['jastip', 'ocean', 'forest', 'midnight', 'sunset', 'gold', 'lavender', 'coffee', 'monochrome', 'cherry']).optional(),
  }).optional(),
})
```

### Why This Fixes It
1. Now Zod validator **recognizes** the `design` field
2. Field validation passes because values match enum constraints
3. AuthService receives the design object in profileData
4. AuthService.updateUserProfile() executes the upsert:
   ```typescript
   profileDesign: {
     upsert: {
       create: { layoutId, themeId },
       update: { layoutId, themeId }
     }
   }
   ```
5. Database is updated ✅
6. Frontend re-fetches profile and sees new layout ✅

---

## How It Works Now

### Step-by-Step Flow (FIXED)
1. **User Actions:**
   - Opens EditProfileDialog
   - Goes to "Tampilan" (Design) tab
   - Selects "Store" layout
   - Selects "Ocean" theme
   - Clicks "Terapkan Tampilan"

2. **Frontend (edit-profile-dialog.tsx):**
   ```typescript
   const payload = {
     profileName: "Budi Jastip",
     profileBio: "Travels to Japan",
     slug: "budi",
     design: {
       layoutId: "store",
       themeId: "ocean"
     }
   }
   await apiPatch("/profile", payload)
   ```

3. **Backend (routes/profile.ts):**
   ```typescript
   router.patch(
     '/profile',
     authMiddleware,
     validate(updateProfileSchema),  ← NOW VALIDATES design FIELD ✅
     async (req, res) => {
       const profile = await authService.updateUserProfile(userId, req.body)
       res.json(profile)
     }
   )
   ```

4. **AuthService (auth.service.ts):**
   ```typescript
   async updateUserProfile(userId, profileData) {
     const { design, ...userData } = profileData
     
     const user = await db.user.update({
       where: { id: userId },
       data: {
         ...userData,
         // ✅ NOW UPSERTS ProfileDesign:
         ...(design ? {
           profileDesign: {
             upsert: {
               create: { layoutId: design.layoutId, themeId: design.themeId },
               update: { layoutId: design.layoutId, themeId: design.themeId }
             }
           }
         } : {})
       }
     })
   }
   ```

5. **Database:**
   - ProfileDesign table updated with new layoutId and themeId ✅
   - Returns updated design object

6. **Frontend (page.tsx):**
   ```typescript
   // On mount, fetches profile
   const data = await apiGet(`/profile/${username}`)
   // data.user.profileDesign now has updated values ✅
   
   // In render:
   const layoutId = profile.user.profileDesign?.layoutId || 'classic'
   const layout = renderLayout() // Renders correct layout ✅
   ```

---

## Testing the Fix

### Manual Test
1. Start backend: `cd /app/backend && npm run dev`
2. Start frontend: `cd /app/frontend && npm run dev`
3. Navigate to profile (e.g., `/jastipin`)
4. Click "Edit Profil" → "Tampilan"
5. Select "Store" layout, "Ocean" theme
6. Click "Terapkan Tampilan"
7. **Verify**: Profile now shows Store layout with Ocean colors ✅

### API Test
```bash
# Check ProfileDesign in response
curl http://localhost:3000/api/profile/jastipin | jq '.user.profileDesign'

# Response should show:
# {
#   "id": "...",
#   "layoutId": "store",
#   "themeId": "ocean",
#   "updatedAt": "2025-12-04T..."
# }
```

### Database Check
```bash
# Connect to database and query
psql $DATABASE_URL

SELECT * FROM "ProfileDesign" WHERE "userId" = 'xxx';
# Should show updated layoutId and themeId
```

---

## Impact Analysis

### What This Fixes
- ✅ Design updates now persist to database
- ✅ Profile page reflects selected layout and theme
- ✅ EditProfileDialog "Terapkan Tampilan" button works correctly
- ✅ All 50 layout/theme combinations now accessible

### What This Doesn't Break
- ✅ Existing profile updates (name, bio, avatar, etc.) still work
- ✅ All other validation schemas unchanged
- ✅ No database schema changes
- ✅ No API endpoint changes
- ✅ No frontend logic changes

### Backward Compatibility
- ✅ Requests without `design` field still work (field is optional)
- ✅ Existing user profiles unaffected (have defaults)
- ✅ No migration needed

---

## Prevention

### Why This Wasn't Caught
1. **Validation Schema** was separate from **Upsert Logic**
   - Upsert logic in AuthService was correct ✅
   - But validator rejected data before it reached service ❌

2. **Testing Gap**
   - Backend unit tests might have tested service logic only
   - But not integration with middleware validation

### How to Prevent Similar Issues
1. **Add Integration Tests**
   ```typescript
   // Test full flow: validation → service → database
   it('should update profile design via PATCH /profile', async () => {
     const response = await patch('/profile', {
       design: { layoutId: 'store', themeId: 'ocean' }
     })
     expect(response.status).toBe(200)
     expect(response.body.profileDesign.layoutId).toBe('store')
   })
   ```

2. **Frontend E2E Tests**
   ```typescript
   // Test full user flow
   it('should update and display profile design', async () => {
     page.goto('/dashboard')
     page.click('[aria-label="Edit Profile"]')
     page.click('[value="store"]') // Select store layout
     page.click('button:has-text("Terapkan Tampilan")')
     page.waitForNavigation()
     
     // Verify layout changed
     expect(page.locator('[data-layout="store"]')).toBeVisible()
   })
   ```

3. **Schema Documentation**
   - Keep validator schemas in sync with service logic
   - Document when schemas need updating
   - Review validators during code reviews

---

## Files Changed

| File | Change | Lines |
|------|--------|-------|
| `backend/src/utils/validators.ts` | Added `design` field to `updateProfileSchema` | 80-84 (added) |

---

## Deployment Instructions

1. **Deploy Backend**
   ```bash
   git pull origin master
   npm run build  # Should pass with no errors
   npm run migrate  # No migrations needed
   npm run start  # Restart server
   ```

2. **No Frontend Changes Needed**
   - Frontend code already correct
   - Just restart dev server or redeploy

3. **Verify Fix**
   - Test design update as per "Testing the Fix" section
   - Monitor server logs for any validation errors

---

## Conclusion

The root cause was a **validation schema mismatch** - the Zod validator didn't recognize the `design` field that AuthService expected. By adding the field definition to the schema, the complete flow now works:

**User Input → Validator ✅ → Service ✅ → Database ✅ → Display ✅**

The fix is minimal (4 lines added), backward compatible, and production-ready.

---

**Fixed by**: Droid Diagnostic  
**Build Status**: ✅ PASSING  
**Ready for Deployment**: ✅ YES
