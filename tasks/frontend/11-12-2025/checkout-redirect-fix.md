# Checkout Redirect Fix

## Problem
Clicking "Checkout Sekarang" button on profile page would silently redirect back to the profile without showing the checkout form.

## Root Cause
The checkout page (`/checkout/dp/[tripId]/page.tsx`) had an overly restrictive validation check:

```typescript
if (tripData.paymentType !== "dp") {
  router.push(`/${tripData.jastiper?.slug || ""}`)
  return
}
```

This check would redirect users back to the profile if the trip's `paymentType` was not exactly `"dp"`. Since most trips default to `paymentType: "full"`, the checkout page would immediately redirect back.

## Solution Applied
Removed the restrictive validation check from `/checkout/dp/[tripId]/page.tsx` (lines 56-61).

The checkout page now accepts trips with ANY payment type:
- `"full"` - full payment checkout
- `"dp"` - down payment checkout  
- Any other custom payment types

## Files Modified
- `frontend/app/checkout/dp/[tripId]/page.tsx` - Removed paymentType validation

## Testing Steps
1. Go to jastiper profile page
2. Add product to cart
3. Click "Checkout Sekarang" button
4. Should now navigate to `/checkout/dp/{tripId}` and show checkout form
5. Form should work regardless of trip's paymentType setting

## Notes
- The checkout form uses `trip.dpPercentage` to calculate DP amount
- Default DP percentage is 20% if not set on trip
- Both payment types can coexist on same checkout page
