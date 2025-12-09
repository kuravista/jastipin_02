# Profile Trip Filtering Implementation Plan

## Objective
Fix the profile API to only return:
- Active trips with deadline today or in the future
- **OR** Active trips with no deadline (lifetime trips)
- But exclude: Inactive trips or trips with past deadlines

## Changes Required

### 1. Update getPublicProfile Method in AuthService
File: `/app/backend/src/services/auth.service.ts`

**What:** Add filters to the trips query
- Filter by `isActive: true`
- Filter by `deadline >= today (start of day)`

**Why:** 
- Users should only see trips that are actively open
- Past trips should not appear in the profile
- Maintains data consistency with business logic

### 2. Update Products Query in getPublicProfile
File: `/app/backend/src/services/auth.service.ts`

**What:** Also filter products to only show those from active, future-deadline trips
- Products are associated with trips
- Should follow same filtering rules as trips

**Why:**
- Prevent showing products from inactive/past trips
- Maintain consistency between trips and products display

### 3. Update Product Detail Endpoint  
File: `/app/backend/src/routes/profile.ts` (GET /profile/:slug/products/:productSlug)

**What:** Filter product detail view to prevent viewing products from inactive/past trips
- Applied same filtering logic to the product detail endpoint
- Ensures users cannot view or order products from expired trips

**Why:**
- Complete filtering across all profile-related endpoints
- Prevents checkout workflow from starting on expired trips

## Implementation Details

### Date Comparison
```typescript
const today = new Date()
today.setHours(0, 0, 0, 0)  // Start of today

// Filter: deadline >= today
deadline: {
  gte: today
}
```

This ensures:
- Trips with deadline today are included
- Only future dates after today are included
- Trips with null deadline are excluded

## Verification
- TypeScript compilation passes ✓
- No breaking changes to API response structure
- Response data will just be filtered (fewer items)

## Database Impact
- No schema changes
- No migrations required
- Only query logic changes
- Existing data remains unchanged
