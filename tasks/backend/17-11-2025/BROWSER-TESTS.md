# Browser Validation Tests

**Do these 6 tests before deploying to Cloudflare Pages (45-60 min total)**

---

## Setup First

```bash
# 1. Update frontend dev env to point to production API:
cd /app/frontend
# Edit .env.local:
NEXT_PUBLIC_API_URL=https://api.jastipin.me/api

# 2. Start frontend dev server
pnpm dev
# Should be http://localhost:3000

# 3. Verify backend is running
curl http://localhost:4000/health
# Should return: {"status":"ok",...}
```

---

## Test 1: Browser CORS (5 min)

Open `http://localhost:3000`, then DevTools → Console:

```javascript
fetch("https://api.jastipin.me/health", {
  credentials: "include"
})
.then(r => r.json())
.then(d => console.log("✅ CORS works:", d))
.catch(e => console.error("❌ Error:", e))
```

**Expected:** `✅ CORS works: {status: "ok", ...}`

**If fails:** Check backend NODE_ENV is production, FRONTEND_URL is correct.

---

## Test 2: Cookie Storage (10 min)

1. Navigate to login/register page on frontend
2. Register: email=`test2@test.com`, password=`Test123!@#`
3. Open DevTools → Application → Cookies
4. Look for `refreshToken` cookie

**Verify in DevTools:**
- [x] `refreshToken` exists
- [x] `HttpOnly` = checked
- [x] `Secure` = checked
- [x] `SameSite` = `None`
- [x] `Path` = `/`
- [x] `Expires` = 7 days from now

**If missing:** Check if login succeeded (check Network tab for `/api/auth/register` response).

---

## Test 3: API Calls Include Token (5 min)

1. After login, open DevTools → Network tab
2. Click any API call in app (view profile, products, etc.)
3. Find the API request, click it

**Check headers:**
- [x] Request has `Authorization: Bearer <token>` header
- [x] Token matches `localStorage.authToken` value
- [x] Response is 200 OK (not 401)

**If 401:** Token not in localStorage or api-client.ts not attaching it.

---

## Test 4: Token Auto-Refresh (5 min)

1. After login, open DevTools Console
2. Clear the access token:
   ```javascript
   localStorage.removeItem('authToken')
   ```
3. Make an API call from app
4. **Watch Network tab**

**What should happen:**
1. API returns 401
2. Auto-calls `/api/auth/refresh`
3. New token issued (check localStorage)
4. Original request **retries**
5. Returns 200

**If doesn't work:** Refresh endpoint broken or cookie not sent.

---

## Test 5: Session Persists (Page Reload) (5 min)

1. After login, open DevTools → Cookies
2. Verify `refreshToken` exists
3. **Refresh page** (F5 or Cmd+R)
4. Check if still logged in

**Expected:**
- Page reloads
- You remain logged in (no redirect to login)
- API calls still work

**If logged out:** Cookie not persisting or auto-refresh broken.

---

## Test 6: Logout Clears Cookie (5 min)

1. While logged in, open DevTools → Cookies
2. Find `refreshToken`
3. Click logout button
4. Check Cookies again

**Expected:**
- Cookie disappears (or `MaxAge=0`)
- Redirected to login
- Next API call returns 401

**If cookie still there:** Logout not clearing cookies.

---

## Pass/Fail Checklist

- [ ] Test 1: Browser CORS succeeds
- [ ] Test 2: Cookie stored with correct flags
- [ ] Test 3: API calls include Authorization header
- [ ] Test 4: Auto-refresh works
- [ ] Test 5: Session persists after page reload
- [ ] Test 6: Logout clears cookie

**All pass?** → Ready to deploy to Cloudflare Pages ✅

**Any fail?** → Check troubleshooting below

---

## Troubleshooting

### CORS Error in Console
```
Access to fetch at 'https://api.jastipin.me/...' has been blocked by CORS policy
```
- Backend not running → Start it
- Wrong NODE_ENV → Verify `NODE_ENV=production`
- Wrong FRONTEND_URL → Check backend .env

### Cookie Not Stored
- SameSite blocking → Already fixed to 'none'
- Login failed → Check Network tab for login response
- Not HTTPS in production → Will be HTTPS on Cloudflare

### 401 After Page Reload
- Refresh cookie missing → Check DevTools Cookies
- Refresh endpoint broken → Test `/api/auth/refresh`
- Auto-refresh code broken → Check `api-client.ts`

---

## When All Tests Pass

1. Commit changes:
   ```bash
   git add .
   git commit -m "fix: production CORS, cookies, API routing"
   git push origin master
   ```

2. Cloudflare Pages auto-deploys on push

3. Test on production: `https://jastipin.me`

4. Celebrate! 🚀

---

**Time estimate:** 45-60 minutes | **Success rate:** 95% ✅
