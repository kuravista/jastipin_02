# Files Edited - Profile Trip Filtering Fix

## Summary
Fixed profile API to only return active trips with deadline today or in the future.

## Changes Made

### 1. `/app/backend/src/services/auth.service.ts`

#### Change 1: Add date filtering to trips query (Lines 371-381)
- **What:** Added filters to the trips query in `getPublicProfile` method
- **Before:** No filters, returns all trips
- **After:** Filters by `isActive: true` AND (deadline >= today OR deadline is null)
- **Lines:** 371-381
- **Details:**
  - Added `const today = new Date()` to get start of current day
  - Updated WHERE clause to include:
    - `isActive: true` - Only active trips
    - `OR: [{ deadline: { gte: today } }, { deadline: null }]` - Future/today OR lifetime trips

#### Change 2: Add date filtering to products query (Lines 398-421)
- **What:** Added filters to the products query in `getPublicProfile` method
- **Before:** Only filtered by user trip ownership
- **After:** Also filters by trip's `isActive` and (deadline >= today OR deadline is null)
- **Lines:** 398-421
- **Details:**
  - Updated Trip relationship filter to include:
    - `isActive: true` - Only products from active trips
    - `OR: [{ deadline: { gte: today } }, { deadline: null }]` - Future/today OR lifetime trips

### 2. `/app/backend/src/routes/profile.ts`

#### Change 3: Add date filtering to product detail endpoint (Lines 169-181)
- **What:** Added filters to prevent viewing products from inactive/past trips
- **Before:** Shows products from any trip belonging to user
- **After:** Only shows products from active trips with (deadline today/beyond OR lifetime)
- **Lines:** 169-181
- **Details:**
  - Added `const today = new Date()` to get start of current day
  - Updated productWhere.Trip filter to include:
    - `isActive: true` - Only products from active trips
    - `OR: [{ deadline: { gte: today } }, { deadline: null }]` - Future/today OR lifetime trips
  - Prevents products from inactive/expired trips from being shown in public product detail view
  - Allows lifetime products to be viewed and ordered

## Build Status
- TypeScript compilation: ✓ PASSED (no errors)
- No breaking changes to API response structure
- Backward compatible (response format unchanged, only filtered data)

## Database Impact
- ✓ No schema changes required
- ✓ No migrations needed
- ✓ Query-level filtering only
- ✓ No data modifications

## API Response Impact
- Endpoint: `GET /api/profile/:slug`
- Response structure: Unchanged
- Data returned: Filtered (only active trips with future/today deadlines)
- Backward compatible: Yes (fewer items, same structure)

## Testing
- Manual API test recommended:
  ```
  GET https://jastipin.me/api/profile/qwe
  ```
  - Should only show active trips
  - Should only show trips with deadline >= today
  - Should exclude past trips

## Pattern Applied
- Database query optimization using WHERE clause
- Date comparison at start of day (00:00:00)
- Relationship-based filtering through Prisma nested queries
