# Frontend-Backend Integration: Production API Setup

**Status:** ✅ Complete

## Configuration Summary

### Frontend Environment Files

#### `.env.local` (Development)
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```
- Used when running locally with `pnpm dev`
- Backend must be running on `http://localhost:4000`

#### `.env.production` (Production/Cloudflare Pages)
```
NEXT_PUBLIC_API_URL=https://api.jastipin.me
```
- Used when deployed to Cloudflare Pages
- Connects to production API endpoint

### Backend Configuration

#### `.env` (Production CORS)
```
FRONTEND_URL="https://jastipin.me"
```
- Allows requests from `https://jastipin.me` (Cloudflare Pages domain)
- Enables CORS for cross-origin requests
- Credentials included (httpOnly cookies for refresh tokens)

## How It Works

### Local Development
1. Frontend runs on `http://localhost:3000`
2. Frontend uses `.env.local` → API calls to `http://localhost:4000/api`
3. Backend running locally accepts from `http://localhost:3000` (fallback)

### Production (Cloudflare Pages)
1. Frontend deployed to `https://jastipin.me`
2. Frontend uses `.env.production` → API calls to `https://api.jastipin.me`
3. Backend accepts CORS requests from `https://jastipin.me`

## API Client Implementation

The frontend uses a centralized API client (`lib/api-client.ts`):
- Reads `NEXT_PUBLIC_API_URL` from environment
- Automatically attaches JWT tokens from localStorage
- Auto-refreshes tokens on 401 responses
- Type-safe API methods (GET, POST, PATCH, DELETE)

## Verification

### Local Testing
```bash
# Backend health check
curl http://localhost:4000/health

# Frontend environment variables
cat /app/frontend/.env.local
cat /app/frontend/.env.production

# Backend CORS configuration
grep FRONTEND_URL /app/backend/.env
```

### Results
- ✅ Backend health: Running on port 4000
- ✅ Frontend dev environment: `http://localhost:4000/api`
- ✅ Frontend prod environment: `https://api.jastipin.me`
- ✅ Backend CORS: Accepts `https://jastipin.me`

## Next Steps for Cloudflare Pages Deployment

1. **Verify Git Connection:**
   - Ensure GitHub repo is connected to Cloudflare Pages
   - Check for auto-deploy on `master` branch

2. **Environment Variables in Cloudflare Pages:**
   - Go to Pages project settings
   - Add any additional env vars if needed (currently using `.env.production` from repo)

3. **Build Command:**
   - Default: `pnpm build` (configured in `package.json`)
   - Build command should pick up `.env.production` automatically

4. **Deploy & Test:**
   - Push to `master` branch triggers auto-deploy
   - Test on `https://jastipin.me`
   - Check browser console for API calls to `https://api.jastipin.me`

## Architecture Pattern

```
┌─────────────────────────┐
│   Cloudflare Pages      │
│  https://jastipin.me    │
│   (Next.js Frontend)    │
└──────────────┬──────────┘
               │
               │ API Calls
               │ (CORS Enabled)
               ↓
┌─────────────────────────────┐
│  Cloudflare (Proxy)         │
│  https://api.jastipin.me    │
│  (Points to Backend)        │
└──────────────┬──────────────┘
               │
               ↓
┌─────────────────────────┐
│   Backend Server        │
│   Express.js            │
│   (JWT, Prisma, DB)     │
└─────────────────────────┘
```

## Environment Variables Used

| Variable | Location | Value | Purpose |
|----------|----------|-------|---------|
| `NEXT_PUBLIC_API_URL` | Frontend `.env.local` | `http://localhost:4000/api` | Dev API endpoint |
| `NEXT_PUBLIC_API_URL` | Frontend `.env.production` | `https://api.jastipin.me` | Prod API endpoint |
| `FRONTEND_URL` | Backend `.env` | `https://jastipin.me` | CORS origin |
| `API_PORT` | Backend `.env` | `4000` | Backend port |

## Authentication Flow

1. **Login:** Frontend → `POST /api/auth/login` → Backend issues JWT + refresh token
2. **Token Storage:** JWT in localStorage, refresh token in httpOnly cookie
3. **API Requests:** Frontend attaches JWT header automatically via `api-client.ts`
4. **Token Refresh:** On 401, `api-client.ts` auto-refreshes via `POST /api/auth/refresh`
5. **CORS:** Backend validates `Origin` header matches `FRONTEND_URL`

---

**Last Updated:** 2025-11-17  
**Status:** Ready for Cloudflare Pages deployment
