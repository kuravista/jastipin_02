# Testing Guide: Profile Trip Filtering

## Manual Testing

### Prerequisite Setup
1. Ensure backend is running: `cd /app/backend && npm run dev`
2. Create test data with one jastiper user who has:
   - Trip A: Active, deadline in future
   - Trip B: Inactive, deadline in future
   - Trip C: Active, deadline in past
   - Trip D: Inactive, deadline in past

### Test Case 1: Public Profile View
**Endpoint:** `GET /api/profile/{jastiper-slug}`

**Expected Result:**
- Response should include only Trip A
- Trips B, C, D should NOT appear in the trips array
- Products should only belong to Trip A

**Test Command:**
```bash
curl -X GET "http://localhost:3000/api/profile/{jastiper-slug}"
```

**Verify:**
```json
{
  "user": { ... },
  "trips": [
    {
      "id": "trip-a-id",
      "title": "Active Future Trip",
      "status": "Buka",
      ...
    }
    // Only 1 trip, not 4
  ],
  "catalog": [
    // Only products from Trip A
  ]
}
```

### Test Case 2: Product Detail View
**Endpoint:** `GET /api/profile/{jastiper-slug}/products/{product-slug}?tripId={trip-id}`

**Scenarios:**

#### 2a. Product from Active+Future Trip (Trip A)
```bash
curl -X GET "http://localhost:3000/api/profile/{jastiper-slug}/products/{product-slug}?tripId={trip-a-id}"
```
**Expected:** 200 OK with product data

#### 2b. Product from Inactive Trip (Trip B)
```bash
curl -X GET "http://localhost:3000/api/profile/{jastiper-slug}/products/{product-slug}?tripId={trip-b-id}"
```
**Expected:** 404 Not Found

#### 2c. Product from Past Deadline Trip (Trip C)
```bash
curl -X GET "http://localhost:3000/api/profile/{jastiper-slug}/products/{product-slug}?tripId={trip-c-id}"
```
**Expected:** 404 Not Found

#### 2d. Product from Inactive+Past Trip (Trip D)
```bash
curl -X GET "http://localhost:3000/api/profile/{jastiper-slug}/products/{product-slug}?tripId={trip-d-id}"
```
**Expected:** 404 Not Found

## Unit Testing (Optional)

Create test file: `/app/backend/src/services/auth.service.test.ts`

```typescript
describe('AuthService.getPublicProfile', () => {
  it('should only return active trips with future deadlines', async () => {
    const jastiperId = 'test-user-id'
    
    // Setup: Create test trips
    // Trip A: active, future deadline
    // Trip B: inactive, future deadline
    // Trip C: active, past deadline
    // Trip D: inactive, past deadline
    
    const profile = await authService.getPublicProfile('test-user-slug')
    
    // Assert: Only Trip A returned
    expect(profile.trips.length).toBe(1)
    expect(profile.trips[0].id).toBe('trip-a-id')
  })
  
  it('should only return products from active trips with future deadlines', async () => {
    const profile = await authService.getPublicProfile('test-user-slug')
    
    // Assert: Only products from Trip A
    const productTripIds = profile.catalog.map(p => p.tripId)
    expect(new Set(productTripIds).size).toBe(1)
    expect([...new Set(productTripIds)][0]).toBe('trip-a-id')
  })
})
```

## API Testing with Postman/Insomnia

### Collection Setup
```
Base URL: http://localhost:3000

GET /api/profile/{{jastiper-slug}}
- No auth required
- Should return filtered trips

GET /api/profile/{{jastiper-slug}}/products/{{product-slug}}
- Query param: tripId={{trip-id}}
- No auth required
- Should return 404 for expired/inactive trips
```

## Database Query Verification

To verify the filtering is working at the database level:

```sql
-- Run against database after calling API
-- This should show only the trips returned in API response

SELECT id, title, isActive, deadline, jastiperId
FROM "Trip"
WHERE jastiperId = '{user-id}'
AND isActive = true
AND deadline >= CURRENT_DATE;
```

## Expected Behavior After Fix

| Trip Status | Deadline | Shows in Profile? |
|-------------|----------|------------------|
| Active | Future | ✅ YES |
| Active | Today | ✅ YES |
| Active | Past | ❌ NO |
| Inactive | Future | ❌ NO |
| Inactive | Today | ❌ NO |
| Inactive | Past | ❌ NO |
| Active | NULL | ❌ NO |
| Inactive | NULL | ❌ NO |

## Regression Testing

After fix, verify these scenarios still work:

1. **Authenticated user can still see their own trips** (not affected by this change)
   - `GET /api/trips` - Should return ALL trips (no filtering for owner)

2. **Trip creation still works** 
   - `POST /api/trips` - Should still create trip successfully

3. **Checkout flow still works for valid trips**
   - `GET /api/profile/{jastiper}/products/{product-slug}` - Should work for active future trips

4. **Product detail still includes trip info**
   - Response should include trip title, status, payment type
