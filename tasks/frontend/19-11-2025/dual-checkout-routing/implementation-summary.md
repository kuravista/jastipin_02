# Dual Checkout Flow Implementation Summary

## Task: Implement Smart Routing for Dual Checkout Flows

**Date**: 2025-11-19  
**Status**: ✅ Complete  
**Approach**: Additive - New DP flow coexists with existing full payment flow

---

## Overview

Implemented smart routing logic to support two checkout flows based on trip payment type:
- **OLD Flow**: Full payment checkout (inline dialog in profile page)
- **NEW Flow**: Down Payment (DP) checkout (dedicated page with DP-specific features)

---

## Technical Implementation

### 1. Type System Updates

**File**: `/app/frontend/app/[username]/page.tsx`

Added `paymentType` field to Trip interface:
```typescript
interface Trip {
  id: string
  title: string
  description?: string
  image?: string
  deadline?: string
  status: string
  spotsLeft: number
  paymentType?: 'full' | 'dp'  // NEW: Payment type field
}
```

### 2. Router Integration

**File**: `/app/frontend/app/[username]/page.tsx`

Added Next.js router for programmatic navigation:
```typescript
import { notFound, useRouter } from "next/navigation"

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const router = useRouter()
  // ... rest of component
}
```

### 3. Smart Routing Function

**File**: `/app/frontend/app/[username]/page.tsx` (Lines 392-432)

Created `handleCheckout()` function that:
1. Gets current trip and validates cart
2. Checks `trip.paymentType` field
3. Routes to appropriate checkout flow

```typescript
const handleCheckout = () => {
  const currentTrip = profile?.trips?.[currentTripIndex]
  const tripId = currentTrip?.id

  // Validation
  if (!tripId) {
    toast.error("Trip tidak ditemukan")
    return
  }
  if (!cartItems.length) {
    toast.error("Keranjang kosong")
    return
  }

  // Smart routing based on payment type
  if (currentTrip?.paymentType === 'dp') {
    // Route to NEW DP checkout page
    const items = cartItems
      .map(item => `${item.product.id}:${item.quantity}`)
      .join(',')
    router.push(`/checkout/dp/${tripId}?items=${items}`)
  } else {
    // Use OLD full payment checkout (default)
    setShowCheckoutForm(true)
    // Reset form states
    setCheckoutForm({ nama: "", email: "", nomor: "", alamat: "", cityId: "", cityName: "", districtId: "" })
    setLocationSearch("")
    setSelectedShipping(null)
    setShippingOptions([])
    setLocationResults([])
  }
}
```

### 4. Updated Checkout Button

**File**: `/app/frontend/app/[username]/page.tsx` (Line 878-882)

Simplified checkout button to use smart routing:
```typescript
<Button 
  onClick={handleCheckout}
  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
>
  Checkout Sekarang
</Button>
```

### 5. Fixed DP Checkout Page Bug

**File**: `/app/frontend/app/checkout/dp/[tripId]/page.tsx` (Line 36)

Fixed typo in state variable name:
```typescript
// BEFORE: const [cart Items, setCartItems] = ...  // ❌ Space in name
// AFTER:  const [cartItems, setCartItems] = ...   // ✅ Fixed
```

---

## Routing Logic Flow

```
User adds products to cart
       ↓
User clicks "Checkout Sekarang"
       ↓
handleCheckout() called
       ↓
Check trip.paymentType
       ↓
       ├─ paymentType === 'dp'
       │        ↓
       │  Route to: /checkout/dp/[tripId]?items=prod1:2,prod2:1
       │        ↓
       │  NEW DP Checkout Page
       │        ↓
       │  - DP percentage selection
       │  - Address form (if goods)
       │  - DP calculation
       │        ↓
       │  Submit → Payment gateway
       │
       └─ paymentType === 'full' OR undefined
                ↓
          Open inline dialog (OLD flow)
                ↓
          - Shipping calculation
          - Address form
          - Full payment
                ↓
          Submit → Backend checkout API
```

---

## Backward Compatibility

✅ **Default Behavior**: If `paymentType` is not set (undefined), system defaults to OLD full payment flow  
✅ **No Breaking Changes**: Existing trips without `paymentType` continue to work normally  
✅ **Progressive Enhancement**: DP flow only activates when explicitly enabled via `paymentType: 'dp'`

---

## URL Structure

### Full Payment Flow (OLD)
- **Stays on**: `/[username]` (profile page)
- **UI**: Inline checkout dialog
- **Query params**: None

### DP Flow (NEW)
- **Navigates to**: `/checkout/dp/[tripId]`
- **UI**: Dedicated checkout page
- **Query params**: `?items=productId1:quantity1,productId2:quantity2`
- **Example**: `/checkout/dp/abc123?items=prod1:2,prod2:1`

---

## Testing Scenarios

### Test Case 1: Full Payment Flow (Default)
1. Trip has `paymentType: 'full'` OR `paymentType: undefined`
2. Add products to cart
3. Click "Checkout Sekarang"
4. **Expected**: Inline checkout dialog opens
5. **Verify**: Shipping calculation works

### Test Case 2: DP Payment Flow
1. Trip has `paymentType: 'dp'`
2. Add products to cart
3. Click "Checkout Sekarang"
4. **Expected**: Navigates to `/checkout/dp/[tripId]?items=...`
5. **Verify**: DP checkout form loads with correct products

### Test Case 3: Empty Cart
1. Cart is empty
2. Click "Checkout Sekarang"
3. **Expected**: Toast error "Keranjang kosong"
4. **Verify**: No navigation or dialog opens

### Test Case 4: DP Checkout Validation
1. Navigate to DP checkout with valid items
2. **Expected**: Products load correctly
3. **Verify**: Quantities match cart state

---

## Files Modified

### 1. `/app/frontend/app/[username]/page.tsx`
- **Line 4**: Added `useRouter` import
- **Line 35**: Added `paymentType` field to Trip interface
- **Line 156**: Added `router` hook initialization
- **Lines 392-432**: Added `handleCheckout()` smart routing function
- **Lines 878-882**: Updated checkout button to use `handleCheckout`

### 2. `/app/frontend/app/checkout/dp/[tripId]/page.tsx`
- **Line 36**: Fixed typo `cart Items` → `cartItems`

---

## Future Maintenance

### Adding New Checkout Flow
To add a third checkout flow (e.g., installments):
1. Add new payment type to Trip interface: `paymentType?: 'full' | 'dp' | 'installment'`
2. Add case in `handleCheckout()` function
3. Create new route: `/app/checkout/installment/[tripId]/page.tsx`

### Modifying Routing Logic
All routing logic is centralized in `handleCheckout()` function at lines 392-432 of `[username]/page.tsx`.

### Backend Integration
Ensure backend API returns `paymentType` field in:
- `GET /profile/{username}` → trips array
- `GET /trips/{tripId}` → trip object

---

## Known Limitations

1. **No A/B Testing**: Cannot show both flows to same user simultaneously
2. **Cart State**: Cart doesn't persist between flows (intentional)
3. **Back Navigation**: DP flow uses browser back (not custom handling)

---

## Success Metrics

✅ Build completes with no TypeScript errors  
✅ Routing logic works for both payment types  
✅ Backward compatible with existing trips  
✅ No breaking changes to OLD flow  
✅ Clean code separation between flows  

---

## Next Steps (If Needed)

1. **Testing**: Run E2E tests for both flows
2. **Migration**: Update existing trips to set `paymentType: 'full'` explicitly
3. **Feature Flag**: Add admin UI to toggle payment type per trip
4. **Analytics**: Track which flow is used more frequently
5. **Optimization**: Consider prefetching DP checkout page for faster navigation

---

## Developer Notes

- **Principle**: ADDITIVE approach - never remove OLD flow until DP flow is battle-tested
- **Default**: Always fall back to OLD flow if `paymentType` is missing
- **Performance**: Router navigation is client-side (fast, no full page reload)
- **UX**: Consider adding loading state during navigation for slower connections
