# ✅ DEVELOPER ACTION CHECKLIST

**Priority:** HIGH | **Estimated Time:** 30 minutes

---

## 🔴 CRITICAL FIX (1 MINUTE)

### [ ] Fix Bug #5: Async Params Error

**File:** `frontend/app/[username]/page.tsx`  
**Line:** ~155

```diff
- const fallback = demoProfiles[params.username as keyof typeof demoProfiles]
+ const fallback = demoProfiles[username as keyof typeof demoProfiles]
```

**Verify:** After fix, profile page should not show async params error in console

---

## 🔧 TESTING CHECKLIST (5 MINUTES EACH)

### [ ] Test Bug #1: Trip Dialog
```bash
1. Navigate to Dashboard → Akun → Kelola Trip
2. Click "Buat Trip Baru"
3. ✅ Dialog should open with form
4. ✅ Fields: slug, judul, deskripsi, deadline visible
5. ✅ Can close with Escape
6. ✅ No console errors
```

### [ ] Test Bug #2: Product Dialog
```bash
1. Navigate to Dashboard → Produk tab
2. Click "Tambah Produk"
3. ✅ Dialog should open with form
4. ✅ Fields: trip selection, title, price, stock, description visible
5. ✅ Can submit form
6. ✅ Product appears in list
```

### [ ] Test Bug #3: Profile Edit
```bash
1. Navigate to Dashboard → Akun → Edit Halaman Profil
2. ✅ Edit form should open
3. ✅ Fields: bio, avatar, cover, social links visible
4. ✅ Can save changes
5. ✅ No console errors
```

### [ ] Test Bug #4: API Integration
```bash
1. Create new user (register)
2. Create trip via UI
3. Navigate to Dashboard → Trips
4. ✅ Newly created trip should appear (not hardcoded data)
5. ✅ Loading state shows during fetch
```

### [ ] Test Bug #5: Profile Page (After Fix)
```bash
1. Navigate to /:username (e.g., /tina)
2. ✅ Profile should load (no 404)
3. ✅ No console errors
4. ✅ Shows user info & created data
5. ✅ Check browser console - should be clean
```

### [ ] Test Bug #6: Backend Profile Endpoint
```bash
# Manual test with curl:
curl -X GET http://localhost:4000/api/profile/tina

# Should return 200 with profile data like:
# {
#   "user": { "id": "...", "slug": "tina", ... },
#   "trips": [...],
#   "products": [...]
# }

# NOT 404
```

---

## 📋 SUBMISSION CHECKLIST

Before submitting for QA:

- [ ] All 6 bugs tested
- [ ] All tests passing
- [ ] Zero console errors
- [ ] Commit message clear
- [ ] Code reviewed
- [ ] Changes pushed

---

## 🧪 QUICK VERIFICATION SCRIPT

Run this to verify everything:

```bash
# Test 1: Check for console errors
npm run lint

# Test 2: Run existing tests
npm test

# Test 3: Check build
npm run build

# Test 4: Visual check - start dev server
npm run dev
# Then manually test all flows
```

---

## ⏱️ TIME BREAKDOWN

| Task | Time |
|------|------|
| Apply Bug #5 fix | 1 min |
| Test Bug #1 | 5 min |
| Test Bug #2 | 5 min |
| Test Bug #3 | 5 min |
| Test Bug #4 | 5 min |
| Test Bug #5 | 5 min |
| Test Bug #6 | 5 min |
| Final verification | 5 min |
| **TOTAL** | **36 min** |

---

## 📞 IF TESTS FAIL

**Error: Still see async params error**
→ Make sure you changed line 155 in `[username]/page.tsx`

**Error: Profile shows 404**
→ Check if backend profile endpoint `/api/profile/:slug` exists and returns data

**Error: Product dialog doesn't open**
→ Check if `create-product-dialog.tsx` component exists

**Error: Console has other errors**
→ Check browser console → report specific error

---

## ✅ SIGN-OFF

After completing all checks:

- Developer Name: _______________
- Date Completed: _______________
- All Tests Passing: [ ] YES [ ] NO
- Ready for QA: [ ] YES [ ] NO

---

**Last Updated:** 2025-11-13  
**Status:** Ready to Start
