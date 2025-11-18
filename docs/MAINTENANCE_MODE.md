# Maintenance Mode Implementation

**Status:** ✅ Complete & Tested  
**Last Updated:** November 17, 2025

## Overview

Maintenance mode allows you to temporarily disable the main website and show a professional "Under Maintenance" page to users while the backend remains operational for essential services (health checks and authentication).

## Architecture

### Frontend: Next.js Middleware + Maintenance Page

**Middleware (`/app/frontend/middleware.ts`):**
- Intercepts all requests and checks `MAINTENANCE_MODE` environment variable
- Redirects to `/maintenance` page when mode is enabled
- Whitelists static assets (`/_next`, `/favicon.ico`) and API routes (`/api`)
- Uses `NextResponse.rewrite()` for transparent redirect

**Maintenance Page (`/app/frontend/app/maintenance/page.tsx`):**
- Professional dark-themed UI with gradient backgrounds
- Displays maintenance status with animated progress indicator
- Contact information (email and social media links)
- Responsive design (mobile & desktop)

### Backend: Express Middleware + 503 Responses

**Maintenance Middleware (`/app/backend/src/middleware/maintenance.ts`):**
- Checks `MAINTENANCE_MODE` environment variable on each request
- Returns 503 Service Unavailable for public API endpoints
- Whitelists health check (`/health`) endpoints
- Whitelists authentication endpoints (`/api/auth/*`)
- Returns JSON response with timestamp

## Environment Configuration

### Frontend

#### `.env.local` (Development)
```dotenv
# Development - maintenance disabled
MAINTENANCE_MODE=false
```
- Used with `pnpm dev`
- Main page fully accessible
- Backend API calls work normally

#### `.env.production` (Production/Cloudflare Pages)
```dotenv
# Production - maintenance enabled/disabled as needed
MAINTENANCE_MODE=true
```
- Used when deployed to Cloudflare Pages
- Set to `true` to show maintenance page
- Set to `false` to restore normal service

### Backend

#### `.env` (Production)
```dotenv
# Maintenance Mode
MAINTENANCE_MODE=true
```
- Set to `true` to return 503 for API endpoints
- Set to `false` for normal API operation
- Health check always works (for monitoring)
- Auth endpoints always work (for login)

## Usage

### Enable Maintenance Mode

**For Production Deployment:**

1. Update frontend environment:
   ```bash
   # Edit /app/frontend/.env.production
   MAINTENANCE_MODE=true
   ```

2. Update backend environment:
   ```bash
   # Edit /app/backend/.env
   MAINTENANCE_MODE=true
   ```

3. Rebuild backend (if needed):
   ```bash
   cd /app/backend && pnpm build
   ```

4. Commit and push to trigger Cloudflare Pages deployment:
   ```bash
   git add -A
   git commit -m "feat: enable maintenance mode"
   git push origin master
   ```

5. Auto-deployment to `https://jastipin.me` happens automatically

**For Local Development Testing:**

```bash
# Enable maintenance in .env.local
echo "MAINTENANCE_MODE=true" >> /app/frontend/.env.local

# Next.js auto-reloads, visit http://localhost:3001
# Should see maintenance page
```

### Disable Maintenance Mode

1. Update environment files:
   ```bash
   # /app/frontend/.env.production
   MAINTENANCE_MODE=false
   
   # /app/backend/.env
   MAINTENANCE_MODE=false
   ```

2. Rebuild backend:
   ```bash
   cd /app/backend && pnpm build
   ```

3. Commit and push:
   ```bash
   git add -A
   git commit -m "chore: disable maintenance mode - service restored"
   git push origin master
   ```

## Testing Results

### Local Testing (Verified ✅)

| Test Case | Result | Status |
|-----------|--------|--------|
| Frontend maintenance page (MAINTENANCE_MODE=true) | Displays "Under Maintenance" UI | ✅ |
| Frontend normal page (MAINTENANCE_MODE=false) | Displays main landing page | ✅ |
| Backend /api/profile (maintenance mode) | Returns 503 Service Unavailable | ✅ |
| Backend /health (maintenance mode) | Returns 200 OK | ✅ |
| Backend /api/auth/login (maintenance mode) | Accessible (returns auth errors) | ✅ |
| Backend API (normal mode) | Normal responses | ✅ |
| Static assets + middleware | Not blocked during maintenance | ✅ |

### Response Examples

**Frontend - Maintenance Mode:**
- Status: 200 OK
- Header: `x-middleware-rewrite: /maintenance`
- Content: Maintenance page HTML with "Under Maintenance" heading

**Backend - API Endpoint (Maintenance Mode):**
```json
{
  "error": "Service Unavailable",
  "message": "The server is currently undergoing maintenance. Please try again later.",
  "timestamp": "2025-11-17T09:01:27.977Z"
}
```
- Status: 503 Service Unavailable
- JSON response with timestamp

**Backend - Health Endpoint (Maintenance Mode):**
```json
{
  "status": "ok",
  "timestamp": "2025-11-17T09:01:35.428Z"
}
```
- Status: 200 OK
- Always accessible

## Files Modified/Created

### Frontend
- ✅ `/app/frontend/middleware.ts` - Next.js routing middleware
- ✅ `/app/frontend/app/maintenance/page.tsx` - Maintenance UI page
- ✅ `/app/frontend/.env.local` - Development env (MAINTENANCE_MODE=false)
- ✅ `/app/frontend/.env.production` - Production env (MAINTENANCE_MODE=true)

### Backend
- ✅ `/app/backend/src/middleware/maintenance.ts` - Express maintenance middleware
- ✅ `/app/backend/src/index.ts` - Updated to use maintenance middleware
- ✅ `/app/backend/.env` - Production env (MAINTENANCE_MODE=true)

## How It Works

### Request Flow (Maintenance Mode Enabled)

```
User Request to https://jastipin.me
         ↓
Frontend Middleware checks MAINTENANCE_MODE=true
         ↓
Redirects to /maintenance page
         ↓
Shows "Under Maintenance" UI
         ↓
Static assets and API routes still accessible
         ↓
Backend receives API calls
         ↓
Maintenance middleware checks MAINTENANCE_MODE=true
         ↓
Returns 503 for public endpoints
Returns 200 for /health (monitoring)
Returns 200 for /api/auth (login available)
```

### Request Flow (Maintenance Mode Disabled)

```
User Request to https://jastipin.me
         ↓
Frontend Middleware checks MAINTENANCE_MODE=false
         ↓
Normal routing (main page loads)
         ↓
Backend receives API calls
         ↓
Maintenance middleware checks MAINTENANCE_MODE=false
         ↓
Process request normally
```

## Key Features

✅ **Non-Breaking:** Health checks remain accessible for monitoring  
✅ **Authentication Available:** Users can still login during maintenance  
✅ **Professional UI:** Dark-themed, responsive maintenance page  
✅ **Environment-Based:** Simple env variable toggle  
✅ **Fast Deployment:** Cloudflare Pages auto-deploys on git push  
✅ **Whitelisted Routes:** Static assets and critical endpoints bypass maintenance  
✅ **Timestamp Tracking:** Maintenance responses include timestamps  

## Troubleshooting

### Maintenance page still not showing?

1. Check `.env.production` has `MAINTENANCE_MODE=true`
2. Verify Cloudflare Pages deployment completed
3. Check browser cache: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. Verify middleware.ts is in frontend root directory

### API returning 503 but shouldn't?

1. Check `/app/backend/.env` has `MAINTENANCE_MODE=false`
2. Rebuild backend: `cd /app/backend && pnpm build`
3. Restart backend process
4. Verify backend is running: `curl http://localhost:4000/health`

### Health check not working?

1. Verify `/app/backend/src/routes/health.ts` exists
2. Check middleware is whitelisting `/health` correctly
3. Test directly: `curl http://localhost:4000/health`

## Nginx Hard Kill Switch (Optional)

If you need to block ALL traffic including Cloudflare (emergency):

1. Enable Nginx maintenance page at `/etc/nginx/html/maintenance.html`
2. Update Nginx config to return 503 for all requests
3. No code deployment needed - instant effect
4. Restore by updating Nginx config

This is a last-resort option for complete service shutdown.

## Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                          │
│                   https://jastipin.me                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌──────────────────────────┐
         │  Next.js Middleware      │
         │ Check MAINTENANCE_MODE   │
         └──────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │ true                      │ false
         ▼                           ▼
    /maintenance page        Main landing page
    (Under Maintenance)      (Normal operation)
                                    │
                                    ▼
                    ┌─────────────────────────────┐
                    │  Backend Express Server     │
                    │  http://localhost:4000      │
                    └─────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              true  │               │ false         │
                    ▼               ▼               ▼
            Maintenance        Normal API      Maintenance
            Middleware         Operation       Disabled
                │
        ┌───────┴──────────┐
        │                  │
    /health (✓)      /api/* (503)
    /api/auth (✓)
```

## Production Checklist

Before enabling maintenance mode in production:

- [ ] Update `.env.production` with `MAINTENANCE_MODE=true`
- [ ] Update backend `.env` with `MAINTENANCE_MODE=true`
- [ ] Rebuild backend: `pnpm build`
- [ ] Test locally with maintenance mode enabled
- [ ] Verify health endpoint is accessible
- [ ] Commit changes with clear message
- [ ] Push to master (Cloudflare Pages auto-deploys)
- [ ] Monitor deployment progress in Cloudflare dashboard
- [ ] Verify `https://jastipin.me` shows maintenance page

When disabling:

- [ ] Update `.env.production` with `MAINTENANCE_MODE=false`
- [ ] Update backend `.env` with `MAINTENANCE_MODE=false`
- [ ] Rebuild backend: `pnpm build`
- [ ] Commit and push
- [ ] Verify service is restored on `https://jastipin.me`

---

**Status:** Ready for Production Use  
**Tested on:** November 17, 2025  
**Version:** 1.0
