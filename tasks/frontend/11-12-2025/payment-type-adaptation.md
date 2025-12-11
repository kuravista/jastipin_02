# Payment Type Adaptation Implementation

## Overview
Updated checkout form to dynamically adapt based on trip's payment type (full vs dp payment).

## Problem Addressed
The checkout form was hardcoded to show "DP yang harus dibayar (20%)" regardless of whether the trip was configured for full payment or DP payment. For full payment trips, users should see the total amount, not a 20% down payment.

## Changes Made

### 1. DPCheckoutForm Component (`frontend/components/checkout/DPCheckoutForm.tsx`)

**Added `paymentType` prop:**
```typescript
interface DPCheckoutFormProps {
  // ... existing props
  paymentType?: 'full' | 'dp' // Payment type (default: 'dp')
}

export default function DPCheckoutForm({
  // ... existing params
  paymentType = 'dp'
}: DPCheckoutFormProps) {
```

**Updated payment calculation logic:**
```typescript
// Calculate payment amount based on payment type
const paymentAmount = paymentType === 'full' 
  ? subtotal 
  : Math.max(Math.ceil(subtotal * (dpPercentage / 100) / 1000) * 1000, 10000)

const dpAmount = paymentAmount
const isFullPayment = paymentType === 'full'
```

**Updated Order Summary display:**
- For DP payment: Shows subtotal + DP amount (20%)
- For Full payment: Shows only total amount to pay

**Updated labels:**
- Button: "Bayar DP Rp X" → "Bayar Rp X" (for full) or "Bayar DP Rp X" (for dp)
- Payment label: "DP yang harus dibayar (20%)" → "Total yang harus dibayar" (for full)
- Note text: Adapts message based on payment type

### 2. Checkout Page (`frontend/app/checkout/dp/[tripId]/page.tsx`)

**Pass paymentType to form:**
```typescript
<DPCheckoutForm
  tripId={tripId}
  products={products}
  items={cartItems}
  jastiperSlug={trip.jastiper?.slug}
  dpPercentage={trip.dpPercentage}
  paymentType={trip.paymentType}  // NEW
/>
```

**Dynamic page heading:**
```typescript
<p className="text-sm text-gray-600">
  Checkout {trip.paymentType === 'full' ? 'pembayaran penuh' : 'dengan sistem DP'}
</p>
```

## Behavior

### When trip.paymentType = 'full'
- Shows: "Total yang harus dibayar: Rp [full amount]"
- Subtotal hidden (not needed)
- Button: "Bayar Rp [full amount]"
- Message: "Anda harus membayar seluruh jumlah pesanan. Pesanan akan diproses setelah pembayaran diverifikasi."

### When trip.paymentType = 'dp'
- Shows: "Subtotal: Rp [subtotal]"
- Shows: "DP yang harus dibayar (20%): Rp [20% amount]"
- Button: "Bayar DP Rp [20% amount]"
- Message: "Anda hanya perlu membayar DP sebesar 20% terlebih dahulu. Sisa pembayaran akan diinformasikan setelah jastiper memvalidasi pesanan Anda."

## Files Modified
- `frontend/components/checkout/DPCheckoutForm.tsx` - Added paymentType handling
- `frontend/app/checkout/dp/[tripId]/page.tsx` - Pass paymentType and dynamic heading

## Testing Checklist
- [x] Form compiles without errors
- [ ] Test with `paymentType: 'dp'` - should show 20% DP amount
- [ ] Test with `paymentType: 'full'` - should show full amount
- [ ] Test button text changes based on payment type
- [ ] Test note text changes based on payment type
- [ ] Test subtotal visibility (shown only for DP)
- [ ] Test checkout submission for both types

## Notes
- Default `paymentType` is 'dp' for backward compatibility
- `dpAmount` variable kept for backward compatibility with dialog component
- Both payment types reuse same checkout form (no separate checkout pages needed)
- Payment calculation respects trip's `dpPercentage` setting for DP payments
