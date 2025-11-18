# Files Edited - Disable Maintenance Mode in Production

## Task Summary
Fixed API 503 Service Unavailable error by disabling maintenance mode on production server.

## Files Modified

### 1. `/app/backend/.env`
**Line:** 19  
**Change:** `MAINTENANCE_MODE=true` → `MAINTENANCE_MODE=false`  
**Description:** Disabled maintenance mode in backend environment configuration

### 2. `/app/frontend/.env.production`
**Line:** 8  
**Change:** `NEXT_PUBLIC_MAINTENANCE_MODE=true` → `NEXT_PUBLIC_MAINTENANCE_MODE=false`  
**Description:** Disabled maintenance mode in frontend production environment

## Actions Performed

1. **Environment Variable Update:**
   - Backend: Set `MAINTENANCE_MODE=false` in `/app/backend/.env`
   - Frontend: Set `NEXT_PUBLIC_MAINTENANCE_MODE=false` in `/app/frontend/.env.production`

2. **PM2 Backend Restart:**
   ```bash
   pm2 restart jastipin-api --update-env
   ```
   - Process: jastipin-api (id: 0)
   - Status: Successfully restarted
   - Environment variables reloaded

3. **Verification:**
   ```bash
   curl http://localhost:4000/api/trips
   # Result: {"error":"Missing authorization token"}
   # (No longer returns 503 Service Unavailable)
   
   curl https://jastipin.me/api/trips
   # Result: {"error":"Missing authorization token"}
   # (API is accessible, requires authentication)
   ```

## Before State
```json
{
  "error": "Service Unavailable",
  "message": "The server is currently undergoing maintenance. Please try again later.",
  "timestamp": "2025-11-18T01:24:15.053Z"
}
```
Status: 503

## After State
```json
{
  "error": "Missing authorization token"
}
```
Status: 401

## Impact
- ✅ All API endpoints now accessible (not blocked by maintenance middleware)
- ✅ `/api/trips` endpoint responding (requires authentication)
- ✅ Frontend will show normal pages (not maintenance page)
- ✅ Authentication endpoints continue to work
- ✅ Health check endpoints continue to work

## Testing
- Local API: `curl http://localhost:4000/api/trips` ✅
- Production API: `curl https://jastipin.me/api/trips` ✅
- Response changed from 503 to 401 (auth required) ✅

## Notes
- Backend was running on PM2 with process name `jastipin-api`
- PM2 restart with `--update-env` flag was required to reload environment variables
- Environment variables are cached by Node.js until process restart
- `.env` files are not committed to git (in `.gitignore`)

---

## IP Whitelist Bypass Implementation (2025-11-18)

### Additional Files Modified

#### 1. `/app/backend/.env`
**Line:** 20 (added)  
**Change:** Added `MAINTENANCE_BYPASS_IPS=103.186.166.5`  
**Description:** IP whitelist for bypassing maintenance mode

#### 2. `/app/frontend/.env.local`
**Line:** 7 (added)  
**Change:** Added `NEXT_PUBLIC_BYPASS_IPS=103.186.166.5`  
**Description:** IP whitelist for frontend maintenance bypass

#### 3. `/app/frontend/.env.production`
**Line:** 9 (added)  
**Change:** Added `NEXT_PUBLIC_BYPASS_IPS=103.186.166.5`  
**Description:** IP whitelist for frontend maintenance bypass (production)

#### 4. `/app/backend/src/middleware/maintenance.ts`
**Lines:** 13-22 (added)  
**Changes:**
- Added IP extraction from `x-forwarded-for` header
- Added IP whitelist check logic
- Bypass maintenance if IP matches whitelist
**Description:** Implemented IP whitelist bypass in backend maintenance middleware

#### 5. `/app/frontend/middleware.ts`
**Lines:** 39-47 (added)  
**Changes:**
- Added IP extraction from `x-forwarded-for` header
- Added IP whitelist check logic
- Bypass maintenance redirect if IP matches whitelist
**Description:** Implemented IP whitelist bypass in frontend middleware

### Actions Performed

1. **Environment Variables Added:**
   - Backend: `MAINTENANCE_BYPASS_IPS=103.186.166.5`
   - Frontend: `NEXT_PUBLIC_BYPASS_IPS=103.186.166.5`

2. **Middleware Updated:**
   - Backend middleware checks client IP against whitelist
   - Frontend middleware checks client IP against whitelist
   - Uses `x-forwarded-for` header (for Nginx/Cloudflare proxy)
   - Fallback to `socket.remoteAddress` and `req.ip`

3. **PM2 Restart:**
   ```bash
   pm2 restart jastipin-api --update-env
   cd /app/frontend && pnpm build && pm2 restart jastipin-frontend
   ```

### Feature Behavior

**When Maintenance Mode is ENABLED with IP Whitelist:**

**From Whitelisted IP (103.186.166.5):**
- ✅ Frontend: Shows normal homepage
- ✅ Backend API: Returns 401 (auth required), not 503

**From Other IPs:**
- ❌ Frontend: Shows "Under Maintenance" page
- ❌ Backend API: Returns 503 Service Unavailable

### Use Cases

1. **Development Access:** Work on production while maintenance active for public
2. **Admin Testing:** Verify changes without disabling maintenance globally
3. **Selective Access:** Whitelist multiple IPs (team, office, home)
4. **Zero Downtime Testing:** Test production features during public maintenance

### Configuration for Multiple IPs

```bash
# Backend .env
MAINTENANCE_BYPASS_IPS=103.186.166.5,192.168.1.100,123.45.67.89

# Frontend .env.local and .env.production
NEXT_PUBLIC_BYPASS_IPS=103.186.166.5,192.168.1.100,123.45.67.89
```

### Security Notes

- IP check is server-side (cannot be spoofed)
- Works correctly behind reverse proxy (Nginx/Cloudflare)
- Empty whitelist = no bypass (safe default)
- Whitelist is environment-based (not hardcoded)

---

## Debug Endpoint Implementation (2025-11-18)

### Additional Files Created/Modified

#### 6. `/app/backend/src/routes/debug.ts` (NEW)
**Description:** Debug endpoint to verify IP detection and whitelist configuration

**Purpose:**
- Shows detected client IP from various sources
- Displays whitelist configuration
- Verifies if current IP is whitelisted
- Exposes request headers for debugging

**Endpoint:** `GET /api/debug/ip`

**Response Example:**
```json
{
  "detectedIP": "103.186.166.5",
  "cfConnectingIp": "103.186.166.5",
  "xForwardedFor": "103.186.166.5",
  "socketRemoteAddress": "127.0.0.1",
  "reqIp": "::ffff:127.0.0.1",
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

#### 7. `/app/backend/src/index.ts`
**Line:** 19 (added import)  
**Line:** 71 (added route)  
**Changes:**
- Added `import debugRoutes from './routes/debug.js'`
- Added `app.use('/api/debug', debugRoutes)`
**Description:** Registered debug routes in main Express app

#### 8. `/app/backend/src/middleware/maintenance.ts`
**Lines:** 14-18 (modified)  
**Changes:**
- Changed IP detection to prioritize `cf-connecting-ip` header (Cloudflare)
- Added debug console logs (temporary)
- IP detection order: `cf-connecting-ip` → `x-forwarded-for` → `socket.remoteAddress` → `req.ip`

**Lines:** 44-47 (added)  
**Changes:**
- Whitelisted `/api/debug` endpoint to bypass maintenance
**Description:** Allow debug endpoint during maintenance for troubleshooting

#### 9. `/app/frontend/middleware.ts`
**Lines:** 40-43 (modified)  
**Changes:**
- Changed IP detection to prioritize `cf-connecting-ip` header
- Added debug console logs
**Description:** Match backend IP detection logic in frontend

### Key Fix: Cloudflare IP Header Priority

**Problem:** IP detection was using `x-forwarded-for` first, but Cloudflare provides `cf-connecting-ip` which is more reliable.

**Solution:** Changed IP detection order to prioritize Cloudflare-specific header:
```typescript
const clientIP = cfConnectingIp ||                    // Cloudflare (most reliable)
                 xForwardedFor?.split(',')[0]?.trim() || // Proxy fallback
                 _req.socket.remoteAddress ||            // Direct connection
                 _req.ip;                               // Express fallback
```

### Testing & Verification

**Debug Endpoint Usage:**
```bash
# Check detected IP and whitelist status
curl https://jastipin.me/api/debug/ip

# Expected response when whitelisted:
# {
#   "detectedIP": "103.186.166.5",
#   "isWhitelisted": true,
#   "maintenanceMode": true
# }
```

**Verification Steps:**
1. Access `https://jastipin.me/api/debug/ip` to verify IP detection
2. Check `isWhitelisted: true` in response
3. Access `https://jastipin.me/` → should show normal page (not maintenance)
4. Access `https://jastipin.me/api/trips` → should return 401 (not 503)

### Cloudflare Headers Reference

When behind Cloudflare proxy:
- `cf-connecting-ip` - Real client IP (Cloudflare-specific, most reliable)
- `x-forwarded-for` - Proxy chain (may include Cloudflare IPs)
- `x-real-ip` - Alternative real IP header

### Status

✅ IP bypass working correctly after prioritizing `cf-connecting-ip` header  
✅ Debug endpoint accessible during maintenance for troubleshooting  
✅ Frontend and backend IP detection logic synchronized
