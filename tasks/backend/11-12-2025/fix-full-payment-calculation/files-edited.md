# Full Payment Calculation Fix - Task Documentation

## Problem
Email template untuk order dengan `paymentType = 'full'` menampilkan "Sisa Pembayaran" yang salah. Contoh order JST-Z2Y4TW-4H:
- Trip: Full Payment
- Total Amount: Rp 116.050
- DP Amount (salah): Rp 101.000 (20% dari subtotal)
- Final Amount (salah): Rp 95.850

Seharusnya untuk full payment:
- DP Amount: Rp 116.050 (100% termasuk semua fees: ongkir + biaya jasa + komisi platform)
- Final Amount: Rp 0

## Root Cause
Di `validation.service.ts`, saat jastiper validate order, system selalu menggunakan `trip.dpPercentage` (default 20%) untuk menghitung DP amount, terlepas dari `trip.paymentType`.

## Solution
Modifikasi `validation.service.ts` untuk check `trip.paymentType`:
- Jika `paymentType = 'full'`: gunakan `dpPercentage = 100` (DP = 100% dari **subtotal saja**, bukan total dengan fees)
- Jika `paymentType = 'dp'`: gunakan `dpPercentage` dari trip setting (default 20%)

**Logika Full Payment**:
- Customer bayar **subtotal (100%)** di awal sebagai DP
- Customer bayar **fees tambahan** (ongkir + biaya jasa + komisi) di final payment
- Jika tidak ada fees, finalAmount = 0

## Files Modified

### 1. `backend/src/services/validation.service.ts`
**Lines 119-133** - Added payment type check:

```typescript
// Determine DP percentage based on payment type
let dpPercentage: number
if (order.Trip?.paymentType === 'full') {
  dpPercentage = 100  // Full payment: DP = 100% of total
} else {
  dpPercentage = order.Trip?.dpPercentage || 20  // DP payment: use trip's percentage
}

const breakdown = await calculatePriceBreakdown({
  items: itemsForCalculation,
  shippingFee: input.shippingFee || 0,
  serviceFee: input.serviceFee || 0,
  dpPercentage: dpPercentage
})
```

**Impact**: 
- dpAmount = totalFinal (termasuk semua fees: ongkir, biaya jasa, komisi)
- finalAmount = 0
- Email template akan menampilkan breakdown yang benar

## Database Update
Order JST-Z2Y4TW-4H sudah di-fix:
- dpAmount: 101.000 → 101.000 (tetap = subtotal, ini yang sudah dibayar di checkout) ✅
- finalAmount: 95.850 → 15.050 (fees tambahan yang perlu dibayar di final payment) ✅
- finalBreakdown.dpAmount: 20.200 → 101.000 ✅
- finalBreakdown.remainingAmount: 95.850 → 15.050 ✅

## Calculation Example (JST-Z2Y4TW-4H)
```
Items:
  JOK (1x): Rp 1.000
  Traktoor (1x): Rp 100.000
  Subtotal: Rp 101.000

Fees (ditetapkan saat jastiper validasi):
  Ongkir: Rp 5.000
  Biaya Jasa: Rp 5.000
  Komisi Platform: Rp 5.050
  Total Fees: Rp 15.050

Total Amount: Rp 116.050

For Full Payment (paymentType = 'full'):
  DP Percentage: 100% (dari subtotal)
  
  Tahap 1 (Checkout - DP Payment):
    DP Amount: Rp 101.000 (100% dari subtotal)
    Status: paid_dp ✅
    
  Tahap 2 (Validation - Jastiper set fees):
    Total Final: Rp 116.050 (subtotal + semua fees)
    Already Paid (DP): Rp 101.000
    Final Amount: Rp 15.050 (biaya tambahan yang masih perlu dibayar) ← BENAR!
    
  Tahap 3 (Final Payment Upload):
    Customer upload bukti transfer Rp 15.050
    
Jika tidak ada fees (ongkir=0, jasa=0, komisi=0):
  Total Final: Rp 101.000
  Final Amount: Rp 0 (customer sudah bayar semua di tahap DP)
```

## Email Template Output
Email sekarang akan menampilkan dengan benar:
```
RINCIAN PEMBAYARAN:
Subtotal Produk: Rp 101.000
Ongkir: Rp 5.000
Biaya Jasa: Rp 5.000
Komisi Platform: Rp 5.050
---------------------------------
Total: Rp 116.050
DP Terbayar: Rp 101.000 ← sudah dibayar di awal
=================================
SISA PEMBAYARAN: Rp 15.050 ← fees tambahan saja ✅
```

Jika tidak ada fees:
```
RINCIAN PEMBAYARAN:
Subtotal Produk: Rp 101.000
Ongkir: Rp 0
Biaya Jasa: Rp 0
Komisi Platform: Rp 0
---------------------------------
Total: Rp 101.000
DP Terbayar: Rp 101.000
=================================
SISA PEMBAYARAN: Rp 0 ✅
```

## Testing Notes
- Fix berlaku untuk order baru dengan `paymentType = 'full'`
- Existing order dapat di-validate ulang atau di-update via SQL jika perlu
- Email template sudah benar, tidak perlu perubahan

## How It Works

### dpPercentage Logic (price-calculator.service.ts)
```typescript
// 1. Calculate subtotal dari items
const subtotal = sum(item.price * item.quantity)

// 2. Add all fees
const totalFinal = subtotal + shippingFee + serviceFee + platformCommission

// 3. Calculate DP from subtotal ONLY (not from total with fees)
const dpAmount = subtotal * (dpPercentage / 100)

// 4. Remaining amount
const remainingAmount = totalFinal - dpAmount
```

### Contoh Full Payment vs DP Payment
**Full Payment (paymentType = 'full')**:
- dpPercentage = 100
- dpAmount = 101.000 * (100/100) = 101.000
- remainingAmount = 116.050 - 101.000 = 15.050 ← Fees saja

**DP Payment (paymentType = 'dp', default 20%)**:
- dpPercentage = 20
- dpAmount = 101.000 * (20/100) = 20.200
- remainingAmount = 116.050 - 20.200 = 95.850 ← Produk + fees

## Key Point
DP percentage **selalu dikalkulasi dari subtotal, bukan dari totalFinal**. Jadi:
- Full payment ≠ membayar semua di DP
- Full payment = membayar 100% dari subtotal di awal, bayar fees kemudian
