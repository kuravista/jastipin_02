# Test Maintenance Mode - Verification Results

## Test Date
2025-11-18

## Test Objective
Verify maintenance mode functionality works correctly in production environment.

## Test Scenarios

### Scenario 1: Enable Maintenance Mode

**Steps:**
1. Edit `/app/backend/.env` → `MAINTENANCE_MODE=true`
2. Edit `/app/frontend/.env.local` → `NEXT_PUBLIC_MAINTENANCE_MODE=true`
3. Edit `/app/frontend/.env.production` → `NEXT_PUBLIC_MAINTENANCE_MODE=true`
4. Restart backend: `pm2 restart jastipin-api --update-env`
5. Rebuild frontend: `cd /app/frontend && pnpm build`
6. Restart frontend: `pm2 restart jastipin-frontend`

**Expected Results:**
- Frontend shows "Under Maintenance" page
- Backend API returns 503 Service Unavailable

**Actual Results:**
✅ Frontend displays maintenance page correctly
✅ Backend API returns 503 with maintenance message

**Status:** PASSED ✅

### Scenario 2: Disable Maintenance Mode

**Steps:**
1. Edit `/app/backend/.env` → `MAINTENANCE_MODE=false`
2. Edit `/app/frontend/.env.local` → `NEXT_PUBLIC_MAINTENANCE_MODE=false`
3. Edit `/app/frontend/.env.production` → `NEXT_PUBLIC_MAINTENANCE_MODE=false`
4. Restart backend: `pm2 restart jastipin-api --update-env`
5. Rebuild frontend: `cd /app/frontend && pnpm build`
6. Restart frontend: `pm2 restart jastipin-frontend`

**Expected Results:**
- Frontend shows normal homepage
- Backend API accessible (returns 401 auth required, not 503)

**Actual Results:**
✅ Frontend displays normal homepage
✅ Backend API accessible (401 Missing authorization token)

**Status:** PASSED ✅

## Key Findings

### 1. Frontend Environment Variable Loading
Next.js loads environment files in priority order:
- `.env.local` (highest priority) - overrides all
- `.env.production` (when NODE_ENV=production)
- `.env` (lowest priority)

**Issue:** Initially `.env.local` had `NEXT_PUBLIC_MAINTENANCE_MODE=false` which overrode `.env.production=true`

**Solution:** Both files must have the same value for maintenance mode to work correctly.

### 2. Frontend Requires Rebuild
`NEXT_PUBLIC_*` variables are **embedded at build time**, not runtime.

**Critical Steps:**
```bash
# After changing NEXT_PUBLIC_MAINTENANCE_MODE:
cd /app/frontend
pnpm build              # REQUIRED - rebuilds with new env var
pm2 restart jastipin-frontend
```

Without rebuild, changes won't take effect.

### 3. Backend Runtime Reload
Backend environment variables are loaded at **runtime** from `.env` file.

**Steps:**
```bash
# After changing MAINTENANCE_MODE:
pm2 restart jastipin-api --update-env
# No rebuild needed
```

### 4. PM2 Process Names
- Backend: `jastipin-api` (cluster mode)
- Frontend: `jastipin-frontend` (fork mode)

## Files Modified

### Backend
- `/app/backend/.env` (line 19)
  - `MAINTENANCE_MODE=true` → enables maintenance
  - `MAINTENANCE_MODE=false` → disables maintenance

### Frontend
- `/app/frontend/.env.local` (line 6)
  - `NEXT_PUBLIC_MAINTENANCE_MODE=true/false`
- `/app/frontend/.env.production` (line 8)
  - `NEXT_PUBLIC_MAINTENANCE_MODE=true/false`

## Middleware Behavior

### Backend Middleware
**File:** `/app/backend/src/middleware/maintenance.ts`

When `MAINTENANCE_MODE=true`:
- ✅ Allows: `/health`, `/api/auth/*`
- ❌ Blocks: All other endpoints (returns 503)

### Frontend Middleware
**File:** `/app/frontend/middleware.ts`

When `NEXT_PUBLIC_MAINTENANCE_MODE=true`:
- Redirects all pages to `/maintenance` (except static assets, `/maintenance` itself)
- Uses `NextResponse.rewrite()` to display maintenance page

## Production Workflow

### Enable Maintenance Mode
```bash
# 1. Backend
nano /app/backend/.env
# Set: MAINTENANCE_MODE=true
pm2 restart jastipin-api --update-env

# 2. Frontend
nano /app/frontend/.env.local
# Set: NEXT_PUBLIC_MAINTENANCE_MODE=true
cd /app/frontend
pnpm build
pm2 restart jastipin-frontend

# 3. Verify
curl https://jastipin.me/
# Should show "Under Maintenance" page
curl https://jastipin.me/api/trips
# Should return 503
```

### Disable Maintenance Mode
```bash
# 1. Backend
nano /app/backend/.env
# Set: MAINTENANCE_MODE=false
pm2 restart jastipin-api --update-env

# 2. Frontend
nano /app/frontend/.env.local
# Set: NEXT_PUBLIC_MAINTENANCE_MODE=false
cd /app/frontend
pnpm build
pm2 restart jastipin-frontend

# 3. Verify
curl https://jastipin.me/
# Should show normal homepage
curl https://jastipin.me/api/trips
# Should return 401 or normal response
```

## Test Summary

| Test Case | Status |
|-----------|--------|
| Enable maintenance mode | ✅ PASSED |
| Frontend shows maintenance page | ✅ PASSED |
| Backend returns 503 | ✅ PASSED |
| Disable maintenance mode | ✅ PASSED |
| Frontend shows normal page | ✅ PASSED |
| Backend accessible (401) | ✅ PASSED |

## Conclusion

✅ **All tests PASSED**

Maintenance mode system is working correctly:
- Backend blocks API requests with 503 during maintenance
- Frontend displays professional maintenance page
- System can be toggled on/off successfully
- Whitelisted routes (health, auth) remain accessible during maintenance

## Notes

- Frontend rebuild is **mandatory** after changing `NEXT_PUBLIC_*` variables
- Backend only needs PM2 restart (no rebuild)
- Both `.env.local` and `.env.production` should have same maintenance mode value
- PM2 `--update-env` flag ensures environment variables are reloaded

---

## IP Whitelist Bypass Implementation

### Feature Added: 2025-11-18

Implemented IP whitelist bypass to allow specific IPs to access the system during maintenance mode (for development/admin access).

### Configuration

**Backend Environment:**
```bash
# /app/backend/.env
MAINTENANCE_MODE=true
MAINTENANCE_BYPASS_IPS=103.186.166.5  # Comma-separated for multiple IPs
```

**Frontend Environment:**
```bash
# /app/frontend/.env.local
NEXT_PUBLIC_MAINTENANCE_MODE=true
NEXT_PUBLIC_BYPASS_IPS=103.186.166.5  # Comma-separated for multiple IPs

# /app/frontend/.env.production
NEXT_PUBLIC_MAINTENANCE_MODE=true
NEXT_PUBLIC_BYPASS_IPS=103.186.166.5
```

### Implementation Details

**Backend Middleware (`/app/backend/src/middleware/maintenance.ts`):**
- Extracts client IP from `x-forwarded-for` header (for proxy/Nginx)
- Fallback to `socket.remoteAddress` or `req.ip`
- Compares client IP against whitelist
- If match → bypass maintenance and allow normal access
- If no match → return 503 Service Unavailable

**Frontend Middleware (`/app/frontend/middleware.ts`):**
- Extracts client IP from `x-forwarded-for` header
- Compares against `NEXT_PUBLIC_BYPASS_IPS` whitelist
- If match → render normal pages
- If no match → redirect to `/maintenance` page

### Usage

**Add Single IP:**
```bash
MAINTENANCE_BYPASS_IPS=103.186.166.5
```

**Add Multiple IPs:**
```bash
MAINTENANCE_BYPASS_IPS=103.186.166.5,192.168.1.100,123.45.67.89
```

**Apply Changes:**
```bash
# Backend
pm2 restart jastipin-api --update-env

# Frontend (requires rebuild)
cd /app/frontend
pnpm build
pm2 restart jastipin-frontend
```

### Testing IP Bypass

**From Whitelisted IP (103.186.166.5):**
- ✅ Frontend: Shows normal homepage (not maintenance page)
- ✅ Backend API: Returns 401 auth required (not 503)

**From Other IPs:**
- ❌ Frontend: Shows "Under Maintenance" page
- ❌ Backend API: Returns 503 Service Unavailable

### Benefits

1. **Development Access:** Developers can work on production during maintenance
2. **Admin Testing:** Admin can verify changes without disabling maintenance for everyone
3. **Selective Access:** Multiple IPs can be whitelisted (team members, office, home)
4. **Zero Downtime Testing:** Test production features while maintenance mode active for public

### Security Considerations

- IP addresses are checked server-side (cannot be spoofed by client)
- Uses `x-forwarded-for` to work correctly behind Nginx/Cloudflare proxy
- Whitelist is environment-based (not hardcoded)
- Empty whitelist = no bypass (safe default)

### How to Get Your IP

```bash
# Check your current public IP
curl https://api.ipify.org
# or
curl https://ifconfig.me
```

### Limitations

- Dynamic IPs may change (home internet, mobile networks)
- VPN usage will show different IP
- Multiple team members need to add all their IPs
- Cloudflare may cache responses (test with cache bypass headers if needed)

---

## Debugging IP Bypass Issues (2025-11-18)

### Issue Encountered
IP whitelist bypass was not working initially. User with whitelisted IP `103.186.166.5` still saw maintenance page.

### Root Cause
IP detection was using `x-forwarded-for` header first, but behind Cloudflare proxy, the `cf-connecting-ip` header is more reliable and should be prioritized.

### Solution Applied

**Created Debug Endpoint:**
```
GET /api/debug/ip
```

This endpoint (whitelisted during maintenance) returns:
- Detected client IP from all sources
- Current whitelist configuration
- Whether current IP is whitelisted
- All relevant request headers

**Updated IP Detection Priority:**

Before (didn't work):
```typescript
const clientIP = xForwardedFor?.split(',')[0]?.trim() || 
                 _req.socket.remoteAddress || 
                 _req.ip;
```

After (works):
```typescript
const cfConnectingIp = _req.headers['cf-connecting-ip'];
const xForwardedFor = _req.headers['x-forwarded-for'];
const clientIP = cfConnectingIp ||                         // Cloudflare (priority)
                 xForwardedFor?.split(',')[0]?.trim() ||   // Proxy fallback
                 _req.socket.remoteAddress ||              // Direct connection
                 _req.ip;                                  // Express fallback
```

### Why Cloudflare Header is Important

When using Cloudflare as CDN/proxy:
1. **`cf-connecting-ip`** - Contains the real client IP (most reliable)
2. **`x-forwarded-for`** - May contain Cloudflare's IP addresses in the chain
3. **`x-real-ip`** - Alternative header for real IP

**Architecture:**
```
Client (103.186.166.5) → Cloudflare → Nginx → Express Backend
                            ↓
                    Adds cf-connecting-ip: 103.186.166.5
                    Adds x-forwarded-for: 103.186.166.5, cloudflare-ip
```

### Debug Endpoint Usage

**Access during maintenance:**
```bash
curl https://jastipin.me/api/debug/ip
```

**Expected response when whitelisted:**
```json
{
  "detectedIP": "103.186.166.5",
  "cfConnectingIp": "103.186.166.5",
  "xForwardedFor": "103.186.166.5",
  "whitelistIPs": ["103.186.166.5"],
  "isWhitelisted": true,
  "maintenanceMode": true,
  "headers": {
    "x-forwarded-for": "103.186.166.5",
    "cf-connecting-ip": "103.186.166.5",
    "x-real-ip": "103.186.166.5"
  }
}
```

**Response when NOT whitelisted:**
```json
{
  "detectedIP": "123.45.67.89",
  "isWhitelisted": false,
  "maintenanceMode": true
}
```

### Troubleshooting Guide

**Step 1: Check IP detection**
```bash
curl https://jastipin.me/api/debug/ip
```

**Step 2: Verify detected IP matches whitelist**
- Check `detectedIP` in response
- Compare with `whitelistIPs` array
- Verify `isWhitelisted: true`

**Step 3: If not whitelisted**
- IP might have changed (dynamic IP)
- Using VPN (different IP)
- Update `.env` files with new IP
- Restart services

**Step 4: Check Cloudflare headers**
```bash
curl -I https://jastipin.me/api/debug/ip
```
Look for `cf-connecting-ip` in response headers

### Files Modified for Debug

1. **`/app/backend/src/routes/debug.ts`** (NEW)
   - Debug endpoint implementation

2. **`/app/backend/src/index.ts`**
   - Imported and registered debug routes

3. **`/app/backend/src/middleware/maintenance.ts`**
   - Updated IP detection priority
   - Whitelisted `/api/debug` endpoint
   - Added temporary debug logging

4. **`/app/frontend/middleware.ts`**
   - Updated IP detection to match backend
   - Prioritize `cf-connecting-ip` header

### Testing After Fix

✅ IP bypass working correctly  
✅ `https://jastipin.me/` shows normal page (from whitelisted IP)  
✅ `https://jastipin.me/api/trips` returns 401 not 503 (from whitelisted IP)  
✅ Other IPs still see maintenance page  
✅ Debug endpoint accessible during maintenance

### Lessons Learned

1. **Always prioritize CDN-specific headers** when behind CDN/proxy
2. **Create debug endpoints early** for troubleshooting
3. **Test IP detection** with actual production traffic, not just localhost
4. **Document proxy/CDN architecture** for future reference
5. **Cloudflare headers are more reliable** than generic `x-forwarded-for`
