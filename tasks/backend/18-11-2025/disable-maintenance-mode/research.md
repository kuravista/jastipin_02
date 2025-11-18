# Research: Disable Maintenance Mode in Production

## Problem
API endpoint `https://jastipin.me/api/trips` returns 503 Service Unavailable with maintenance error:
```json
{
  "error": "Service Unavailable",
  "message": "The server is currently undergoing maintenance. Please try again later.",
  "timestamp": "2025-11-18T01:24:15.053Z"
}
```

## Root Cause Analysis

### 1. Maintenance Middleware Implementation
**File:** `/app/backend/src/middleware/maintenance.ts`

The backend has a maintenance middleware that checks `MAINTENANCE_MODE` environment variable:
```typescript
export const maintenanceMiddleware = (_req: Request, res: Response, next: NextFunction) => {
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';

  if (maintenanceMode) {
    // Allow health checks
    if (_req.path.startsWith('/health')) {
      return next();
    }

    // Allow auth endpoints
    if (_req.path.startsWith('/api/auth')) {
      return next();
    }

    // Block all other public endpoints with 503
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'The server is currently undergoing maintenance. Please try again later.',
      timestamp: new Date().toISOString(),
    });
  }

  next();
};
```

### 2. Middleware Order
**File:** `/app/backend/src/index.ts` (line 44-45)

The maintenance middleware is applied BEFORE all routes:
```typescript
// Maintenance mode middleware (check before routes)
app.use(maintenanceMiddleware)

// Routes come after
app.use('/api', tripRoutes)
```

This means ALL API endpoints except `/health` and `/api/auth` will be blocked when maintenance mode is enabled.

### 3. Current Environment Configuration

**Local Development Files (NOT used in production):**
- `/app/backend/.env` - Local development environment
- `/app/frontend/.env.production` - Build-time configuration

**Production Environment:**
- Backend runs on VPS with PM2
- Environment variables are set on the VPS server, NOT from local files
- Production server reads `.env` file from VPS filesystem OR from PM2 environment config

### 4. Deployment Architecture

From `/app/docs/DEPLOYMENT_STRATEGY.md`:
```
Internet → Cloudflare → Nginx → Applications
                              ├─→ Next.js (port 3000)
                              └─→ Express (port 4000)
```

Backend is deployed using PM2:
```bash
pm2 start ecosystem.config.cjs --env production
```

## Why Local Changes Don't Work

1. **Local `.env` files are NOT deployed** - They are in `.gitignore`
2. **Production server has its own `.env` file** on the VPS
3. **PM2 must be restarted** after environment variable changes
4. **Environment variables are cached** by Node.js process until restart

## Solution Required

To disable maintenance mode in production, you must:

1. **SSH into the production VPS server**
2. **Edit the `.env` file on the VPS** (not local machine)
3. **Restart the PM2 process** to reload environment variables
4. **Verify the API is working**

## Whitelisted Endpoints (Working During Maintenance)

Even with maintenance mode enabled, these endpoints should work:
- ✅ `/health` - Health check
- ✅ `/api/auth/*` - Authentication endpoints

All other endpoints including `/api/trips` are blocked.

---

## IP Whitelist Bypass Implementation (2025-11-18)

### Requirement
Allow specific IP addresses to bypass maintenance mode for development/admin access while keeping maintenance active for public users.

### Approach Selected: IP Whitelist

**Rationale:**
- Simplest implementation (no cookies, sessions, or additional API needed)
- Secure (IP checked server-side)
- Works transparently (no user action required)
- Perfect for development/admin access during maintenance

### Implementation Strategy

1. **Environment Variables:**
   - Add `MAINTENANCE_BYPASS_IPS` to backend `.env`
   - Add `NEXT_PUBLIC_BYPASS_IPS` to frontend `.env.local` and `.env.production`
   - Support comma-separated list for multiple IPs

2. **Backend Middleware:**
   - Extract client IP from `x-forwarded-for` header (for proxy/Nginx)
   - Fallback to `socket.remoteAddress` or `req.ip`
   - Compare against whitelist array
   - If match → `next()` (bypass maintenance)
   - If no match → return 503

3. **Frontend Middleware:**
   - Extract client IP from `x-forwarded-for` header
   - Compare against `NEXT_PUBLIC_BYPASS_IPS`
   - If match → render normal pages
   - If no match → redirect to `/maintenance`

### Technical Details

**IP Detection Logic:**
```typescript
// Backend
const clientIP = (_req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                 _req.socket.remoteAddress || 
                 _req.ip;

// Frontend
const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                 request.ip;
```

**Why `x-forwarded-for`?**
- Application runs behind Nginx reverse proxy
- Nginx forwards real client IP in `x-forwarded-for` header
- Without this, backend sees Nginx IP (127.0.0.1) instead of client IP
- Format: `client-ip, proxy1-ip, proxy2-ip` (first is real client)

**Whitelist Check:**
```typescript
const bypassIPs = process.env.MAINTENANCE_BYPASS_IPS?.split(',').map(ip => ip.trim()) || [];

if (bypassIPs.length > 0 && clientIP && bypassIPs.includes(clientIP)) {
  return next(); // Bypass
}
```

### Deployment Architecture Considerations

**Current Setup:**
```
Internet → Cloudflare → Nginx (VPS) → Applications
                              ├─→ Next.js (port 3000)
                              └─→ Express (port 4000)
```

**IP Forwarding:**
1. Cloudflare adds `cf-connecting-ip` header (original client IP)
2. Nginx forwards request with `x-forwarded-for` header
3. Backend/Frontend middleware reads `x-forwarded-for`
4. Compares against whitelist

### Security Considerations

**Strengths:**
- IP check is server-side (cannot be bypassed by client manipulation)
- Works correctly behind reverse proxy/CDN
- Empty whitelist = safe default (no bypass)
- Whitelist stored in environment (not hardcoded)

**Limitations:**
- Dynamic IPs may change (home internet, mobile)
- VPN usage shows different IP
- Not suitable for long-term user authentication (use auth system instead)

### Alternative Approaches Considered

1. **Cookie-based Bypass:**
   - Pros: More flexible, works from any IP
   - Cons: Requires secret URL or initial setup, more complex
   - Decision: Rejected - IP whitelist is simpler for dev/admin use case

2. **Authentication-based Bypass:**
   - Pros: Most secure, role-based
   - Cons: Requires auth system, complex implementation
   - Decision: Rejected - overkill for maintenance bypass

3. **Secret Query Parameter:**
   - Pros: Easy to share links
   - Cons: Secret can leak in logs, browser history
   - Decision: Rejected - less secure than IP whitelist

### Configuration Example

**Single IP:**
```bash
MAINTENANCE_BYPASS_IPS=103.186.166.5
```

**Multiple IPs:**
```bash
MAINTENANCE_BYPASS_IPS=103.186.166.5,192.168.1.100,123.45.67.89
```

### Testing Strategy

1. **Verify IP detection works:**
   - Log detected IP on each request
   - Compare with actual public IP (`curl https://api.ipify.org`)

2. **Test bypass from whitelisted IP:**
   - Access frontend → should see normal page
   - Access backend API → should get 401 (not 503)

3. **Test block from other IP:**
   - Use VPN or mobile network
   - Access frontend → should see maintenance page
   - Access backend API → should get 503

### Maintenance

**How to Get Your IP:**
```bash
curl https://api.ipify.org
curl https://ifconfig.me
```

**How to Add New IP:**
1. Edit `.env` files (backend + frontend)
2. Add IP to comma-separated list
3. Restart backend: `pm2 restart jastipin-api --update-env`
4. Rebuild + restart frontend: `pnpm build && pm2 restart jastipin-frontend`

**How to Remove IP:**
1. Edit `.env` files
2. Remove IP from list
3. Restart services

### Known Issues & Edge Cases

1. **Cloudflare caching:** May cache responses, use cache bypass headers if needed
2. **IPv6 vs IPv4:** Ensure format matches (some users may have IPv6)
3. **Proxy chains:** `x-forwarded-for` may have multiple IPs, we take first one
4. **Empty whitelist:** Safe default, no bypass occurs

### Future Enhancements

1. **Admin UI for IP management:** Add/remove IPs without editing files
2. **IP range support:** Allow CIDR notation (e.g., `192.168.1.0/24`)
3. **Temporary bypass tokens:** Time-limited bypass for testing
4. **Audit logging:** Log all bypass attempts with IP and timestamp
