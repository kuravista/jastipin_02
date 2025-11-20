# Test Plan - Dual Checkout Routing

## Test Environment Setup

### Prerequisites
1. Backend API running with trip data
2. Frontend dev server running
3. At least 2 trips configured:
   - Trip A: `paymentType: 'full'`
   - Trip B: `paymentType: 'dp'`
4. Products configured for both trips

---

## Manual Testing Checklist

### Test Suite 1: Full Payment Flow (OLD)

#### TC1.1: Full Payment - Happy Path
**Setup**: Navigate to profile with trip where `paymentType === 'full'`

1. ✅ Add products to cart
2. ✅ Click "Checkout Sekarang" button
3. ✅ **Expected**: Inline checkout dialog appears
4. ✅ **Verify**: Dialog contains:
   - Name input field
   - Email input field
   - Phone number input field
   - Address search
   - Shipping options (after address selected)
   - Order summary with cart items
5. ✅ Fill in all required fields
6. ✅ Select shipping option
7. ✅ Submit form
8. ✅ **Expected**: Checkout success message
9. ✅ **Verify**: Cart cleared, dialog closed

**Priority**: HIGH  
**Impact**: Core functionality for existing users

---

#### TC1.2: Full Payment - Default Behavior (No paymentType)
**Setup**: Navigate to profile with trip where `paymentType === undefined`

1. ✅ Add products to cart
2. ✅ Click "Checkout Sekarang"
3. ✅ **Expected**: Inline checkout dialog appears (same as TC1.1)
4. ✅ **Verify**: System defaults to full payment flow

**Purpose**: Ensure backward compatibility  
**Priority**: HIGH

---

#### TC1.3: Full Payment - Empty Cart
**Setup**: Navigate to profile, ensure cart is empty

1. ✅ Click "Checkout Sekarang" without adding products
2. ✅ **Expected**: Toast error message "Keranjang kosong"
3. ✅ **Verify**: No dialog appears, no navigation occurs

**Priority**: MEDIUM

---

### Test Suite 2: DP Payment Flow (NEW)

#### TC2.1: DP Payment - Happy Path
**Setup**: Navigate to profile with trip where `paymentType === 'dp'`

1. ✅ Add products to cart (at least 2 items)
2. ✅ Note cart items: Product IDs and quantities
3. ✅ Click "Checkout Sekarang"
4. ✅ **Expected**: Navigation to `/checkout/dp/[tripId]?items=...`
5. ✅ **Verify**: 
   - URL contains correct tripId
   - URL query string matches cart items format: `prod1:2,prod2:1`
   - Page loads without errors
6. ✅ **Verify**: DP Checkout page displays:
   - Trip title
   - "Checkout dengan sistem DP" subtitle
   - All cart products with correct quantities
   - DP percentage options
   - Address form (if products require shipping)
   - Total calculations
7. ✅ Fill in participant details
8. ✅ Select DP percentage
9. ✅ Fill in address (if required)
10. ✅ Submit form
11. ✅ **Expected**: Order created, redirect to payment or success page

**Priority**: HIGH  
**Impact**: New feature functionality

---

#### TC2.2: DP Payment - Single Product
**Setup**: Navigate to profile with DP-enabled trip

1. ✅ Add only 1 product to cart
2. ✅ Click "Checkout Sekarang"
3. ✅ **Expected**: Navigation to `/checkout/dp/[tripId]?items=prodId:1`
4. ✅ **Verify**: Single product displays correctly with quantity 1

**Priority**: MEDIUM

---

#### TC2.3: DP Payment - Multiple Quantities
**Setup**: Navigate to profile with DP-enabled trip

1. ✅ Add product A to cart (quantity: 1)
2. ✅ Add product B to cart (quantity: 3)
3. ✅ Add product C to cart (quantity: 2)
4. ✅ Click "Checkout Sekarang"
5. ✅ **Verify URL**: `?items=prodA:1,prodB:3,prodC:2`
6. ✅ **Verify**: All products display with correct quantities

**Priority**: HIGH

---

#### TC2.4: DP Payment - Empty Cart
**Setup**: Navigate to profile with DP-enabled trip, empty cart

1. ✅ Click "Checkout Sekarang" without adding products
2. ✅ **Expected**: Toast error "Keranjang kosong"
3. ✅ **Verify**: No navigation occurs

**Priority**: MEDIUM

---

#### TC2.5: DP Payment - Back Navigation
**Setup**: Complete TC2.1 up to step 5 (on DP checkout page)

1. ✅ Click browser back button OR "← Kembali" link
2. ✅ **Expected**: Return to profile page
3. ✅ **Verify**: Cart state persists (items still in cart)

**Priority**: MEDIUM

---

### Test Suite 3: Edge Cases

#### TC3.1: Trip Without ID
**Setup**: Mock profile data with trip where `id === undefined`

1. ✅ Add products to cart
2. ✅ Click "Checkout Sekarang"
3. ✅ **Expected**: Toast error "Trip tidak ditemukan"
4. ✅ **Verify**: No navigation or dialog

**Priority**: LOW

---

#### TC3.2: Invalid Payment Type
**Setup**: Trip with `paymentType: 'invalid'` (typo or unsupported value)

1. ✅ Add products to cart
2. ✅ Click "Checkout Sekarang"
3. ✅ **Expected**: Falls back to full payment flow (OLD)
4. ✅ **Verify**: Inline checkout dialog appears

**Priority**: LOW

---

#### TC3.3: Switching Between Trips
**Setup**: Profile with multiple trips (Trip A: full, Trip B: dp)

1. ✅ On Trip A, add products to cart
2. ✅ Navigate to Trip B (using arrow buttons)
3. ✅ **Verify**: Cart state (should be cleared or preserved - check current behavior)
4. ✅ Add products from Trip B to cart
5. ✅ Click "Checkout Sekarang"
6. ✅ **Expected**: Routes to DP checkout for Trip B
7. ✅ Switch back to Trip A
8. ✅ Add products, checkout
9. ✅ **Expected**: Opens full payment dialog for Trip A

**Priority**: MEDIUM  
**Note**: Test cart isolation between trips

---

### Test Suite 4: DP Checkout Page Validation

#### TC4.1: DP Page - Missing Trip
**Setup**: Manually navigate to `/checkout/dp/invalid-trip-id?items=prod1:1`

1. ✅ **Expected**: Error message displays
2. ✅ **Verify**: "Oops!" heading with error description
3. ✅ **Verify**: "Kembali" button available

**Priority**: MEDIUM

---

#### TC4.2: DP Page - No Items in URL
**Setup**: Navigate to `/checkout/dp/[valid-tripId]` (no query params)

1. ✅ **Expected**: Error message "No products selected"
2. ✅ **Verify**: Back button works

**Priority**: MEDIUM

---

#### TC4.3: DP Page - Invalid Item Format
**Setup**: Navigate to `/checkout/dp/[tripId]?items=invalid-format`

1. ✅ **Expected**: Graceful error handling
2. ✅ **Verify**: Error message or redirect

**Priority**: LOW

---

#### TC4.4: DP Page - Full Payment Trip Accessed
**Setup**: Navigate to `/checkout/dp/[tripId]` where trip has `paymentType: 'full'`

1. ✅ **Expected**: Redirect to profile page
2. ✅ **Verify**: Redirect happens in `fetchTripAndProducts()`

**Priority**: HIGH  
**Note**: Security - prevent unauthorized DP checkout access

---

### Test Suite 5: UI/UX Validation

#### TC5.1: Loading States
1. ✅ During navigation to DP checkout, loading indicator appears
2. ✅ Loading spinner shows while fetching trip/products
3. ✅ Loading state clears when data loaded

**Priority**: MEDIUM

---

#### TC5.2: Button States
1. ✅ "Checkout Sekarang" button enabled when cart has items
2. ✅ Button disabled when cart is empty (check current behavior)
3. ✅ Button shows correct text

**Priority**: LOW

---

#### TC5.3: Toast Messages
1. ✅ "Keranjang kosong" toast displays correctly
2. ✅ "Trip tidak ditemukan" toast displays correctly
3. ✅ Toast auto-dismisses after timeout

**Priority**: LOW

---

## Automated Testing (Future)

### Unit Tests Needed

```typescript
// app/[username]/page.tsx
describe('handleCheckout', () => {
  test('routes to DP checkout when paymentType is dp', () => {})
  test('opens dialog when paymentType is full', () => {})
  test('defaults to full payment when paymentType is undefined', () => {})
  test('shows error when tripId is missing', () => {})
  test('shows error when cart is empty', () => {})
})
```

### Integration Tests Needed

```typescript
// E2E test with Playwright
test('full checkout flow works end-to-end', async ({ page }) => {
  // Navigate, add to cart, checkout, fill form, submit
})

test('DP checkout flow works end-to-end', async ({ page }) => {
  // Navigate, add to cart, route to DP page, submit
})
```

---

## Performance Testing

### Metrics to Track
1. ⏱️ Time from button click to dialog open (full payment)
2. ⏱️ Time from button click to DP page load (DP payment)
3. ⏱️ Time to fetch trip/products on DP page
4. 📦 Bundle size impact of changes (~minimal expected)

---

## Browser Compatibility

Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

---

## Accessibility Testing

1. ✅ Keyboard navigation works (Tab, Enter)
2. ✅ Screen reader announces checkout flow correctly
3. ✅ Focus management after navigation
4. ✅ ARIA labels present on interactive elements

---

## Security Testing

1. ✅ DP checkout page validates trip payment type
2. ✅ Cannot access DP checkout for full payment trip
3. ✅ Product IDs in URL are validated against trip
4. ✅ No sensitive data exposed in URL params

---

## Regression Testing

### Verify No Breaking Changes
1. ✅ Existing full payment checkout still works
2. ✅ Cart functionality unchanged (add, remove, update quantity)
3. ✅ Trip navigation (arrows) still works
4. ✅ Product catalog search/filter still works
5. ✅ Shipping calculation still works in full payment flow

---

## Test Data Requirements

### Backend Setup
```sql
-- Create test trips
INSERT INTO trips (id, title, jastiper_id, payment_type) VALUES
  ('trip-full-1', 'Test Full Payment Trip', 'user1', 'full'),
  ('trip-dp-1', 'Test DP Payment Trip', 'user1', 'dp'),
  ('trip-legacy-1', 'Test Legacy Trip', 'user1', NULL);

-- Create test products
INSERT INTO products (id, trip_id, title, price, type) VALUES
  ('prod-1', 'trip-full-1', 'Product A', 100000, 'goods'),
  ('prod-2', 'trip-dp-1', 'Product B', 200000, 'goods'),
  ('prod-3', 'trip-dp-1', 'Product C', 150000, 'tasks');
```

---

## Sign-Off Criteria

### Must Pass Before Deploy
- [ ] All HIGH priority test cases pass
- [ ] No console errors on both checkout flows
- [ ] TypeScript build completes successfully
- [ ] No breaking changes to existing functionality
- [ ] Documentation complete

### Nice to Have
- [ ] All MEDIUM priority test cases pass
- [ ] Automated tests written
- [ ] Performance benchmarks recorded
- [ ] Accessibility audit passed

---

## Known Issues / Limitations

1. **Cart Persistence**: Cart state does not persist between trips (current behavior)
2. **TypeScript Errors**: Pre-existing type errors in unrelated files (not blocking)
3. **Back Button**: Browser back from DP page returns to profile, cart state may be lost

---

## Rollback Plan

If issues found in production:

1. **Quick Rollback**: Change line 407-413 in `[username]/page.tsx`:
   ```typescript
   // Temporarily disable DP routing
   if (false && currentTrip?.paymentType === 'dp') {
   ```
   This forces all trips to use OLD flow without revert.

2. **Full Rollback**: Revert commits in this order:
   - Revert `/app/frontend/app/[username]/page.tsx` changes
   - Keep DP page (no harm if not routed to)

3. **Database**: No rollback needed (payment_type column is optional)
