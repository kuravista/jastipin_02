# Prisma Singleton & PgBouncer Fix

## Problem
The API was returning error 500 with: `prepared statement "sX" already exists` when accessing endpoints like `/api/profile/qwe`.

### Root Causes
1. **Multiple PrismaClient instances**: Each route/service file was creating a new `new PrismaClient()` instead of reusing one
2. **PgBouncer incompatibility**: Supabase pooler (port 6543) uses PgBouncer which doesn't support prepared statements

## Solution Implemented

### 1. Created Prisma Singleton ✅
- Created `/app/backend/src/lib/prisma.ts` - single instance of PrismaClient
- Uses global singleton pattern to ensure only one connection pool
- NODE_ENV check to attach to global in development

### 2. Updated All Route Files ✅
- Replaced `new PrismaClient()` with `import db from '../lib/prisma.js'`
- Files updated: profile, auth, orders, trips, products, participants, bank-accounts, social-media, upload, webhooks

### 3. Updated All Service Files ✅
- Replaced `new PrismaClient()` in services:
  - analytics.service.ts
  - checkout.service.ts
  - checkout-dp.service.ts
  - health.service.ts
  - price-calculator.service.ts
  - stock-lock.service.ts
  - validation.service.ts
  - queue.service.ts
  - email-trigger.service.ts

### 4. Updated Worker Files ✅
- queue-worker.ts
- job-handlers.ts
- order-workers.ts

### 5. Fixed PgBouncer Configuration ✅
- Added `?pgbouncer=true&connection_limit=1` to DATABASE_URL in `.env`
  - `pgbouncer=true`: Disables Prisma prepared statements for PgBouncer compatibility
  - `connection_limit=1`: Ensures single connection per pooled connection

## Testing
```bash
# Test multiple calls to verify fix
curl http://localhost:4000/api/profile/qwe
curl http://localhost:4000/api/auth/register
```

✅ All endpoints now working without "prepared statement already exists" errors

## Files Modified
- `/app/backend/src/lib/prisma.ts` (NEW)
- `/app/backend/.env` (DATABASE_URL query params)
- 15+ route files (replaced PrismaClient instantiation)
- 8+ service files (replaced PrismaClient instantiation)  
- 3+ worker files (replaced PrismaClient instantiation)
