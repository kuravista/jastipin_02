# RajaOngkir Shipping Cost Optimization

**Date:** 2025-01-26
**Status:** ✅ Implemented

## Overview

Optimasi perhitungan ongkos kirim menggunakan RajaOngkir API untuk meningkatkan akurasi dan user experience dalam validasi order.

## Changes Summary

### 1. RajaOngkir District ID Persistence

#### Problem
- Frontend berhasil fetch RajaOngkir district ID tetapi tidak tersimpan ke database
- Console menampilkan `[RajaOngkir] Set ID to: 17632` tapi API response mengembalikan `null`

#### Root Cause
1. Validator schema tidak include field `originRajaOngkirDistrictId`
2. Backend service overwrite frontend-provided value dengan auto-mapping

#### Solution
**File Modified:**
- `/app/backend/src/utils/validators.ts` (line 69)
  - Added `originRajaOngkirDistrictId: z.string().optional()`

- `/app/backend/src/services/auth.service.ts` (lines 251-266)
  - Prioritize frontend-provided RajaOngkir ID
  - Only auto-map if frontend doesn't provide ID

- `/app/frontend/components/checkout/DPCheckoutForm.tsx` (line 64, 255)
  - Added `rajaOngkirDistrictId?: string` to `SavedAddress` interface
  - Include field in checkout payload

- `/app/backend/src/services/checkout-dp.service.ts` (lines 36, 183-192)
  - Accept `rajaOngkirDistrictId` in request interface
  - Prioritize frontend value in address creation

### 2. RajaOngkir Calculate Endpoint Fix

#### Problem
- API endpoint `/api/orders/{orderId}/calculate-shipping` return empty options array
- PM2 logs: `422 Unprocessable Entity - Origin or Destination not found`

#### Root Cause
- Using WRONG endpoint: `/calculate/district/domestic-cost`
- Missing required parameter: `price=lowest`
- District IDs (17601, 8186) are CORRECT and DO work with proper endpoint

#### Solution
**File Modified:**
- `/app/backend/src/services/rajaongkir.service.ts` (lines 213-284)

**Changes:**
```typescript
// BEFORE (WRONG)
const response = await fetch(
  `${RAJAONGKIR_BASE_URL}/calculate/district/domestic-cost`,
  { /* ... */ }
)

// AFTER (CORRECT)
const params = new URLSearchParams()
params.append('origin', origin)
params.append('destination', destination)
params.append('weight', weight.toString())
params.append('courier', courier) // "jne:tiki:pos"
params.append('price', 'lowest') // ✅ ADDED

const response = await fetch(
  `${RAJAONGKIR_BASE_URL}/calculate/domestic-cost`, // ✅ CORRECT ENDPOINT
  {
    method: 'POST',
    headers: {
      key: RAJAONGKIR_API_KEY || '',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  }
)
```

### 3. Cheapest Option Per Courier

#### Problem
- RajaOngkir API returns multiple services per courier (JNE REG, JNE YES, JNE SPS, dll)
- Too many options confuse users
- Example: JNE alone has 7+ different services with different prices

#### Solution
**File Modified:**
- `/app/backend/src/services/rajaongkir.service.ts` (lines 257-279)

**Logic:**
```typescript
// Parse flat array results and group by courier code
const courierMap = new Map<string, ShippingCostResult>()

for (const item of data.data) {
  const result: ShippingCostResult = {
    courier: item.code,
    service: item.service,
    description: item.description,
    cost: item.cost,
    etd: item.etd,
  }

  // Only keep the cheapest option for each courier
  const existing = courierMap.get(item.code)
  if (!existing || result.cost < existing.cost) {
    courierMap.set(item.code, result)
  }
}

// Convert map to array
const uniqueResults = Array.from(courierMap.values())
```

**Result:**
- JNE: Only shows REG (Rp 20,000) - cheapest
- SiCepat: Only shows REG (Rp 18,000) - cheapest
- AnterAja: Only shows REG (Rp 23,000) - cheapest
- etc.

### 4. Median Shipping Cost Calculator

#### Problem
- Jastiper needs quick way to set fair shipping price
- Manual selection from 15+ courier options is time-consuming

#### Solution
**File Modified:**
- `/app/frontend/components/dashboard/dashboard-validasi.tsx`

**Features Added:**
1. `calculateMedianShipping()` function (lines 310-345)
   - Calculates median from all courier options
   - Handles both even and odd number of options
   - Auto-fills shipping fee field

2. "Median" button in UI (lines 675-690)
   - Shows after successful shipping calculation
   - Purple color with `TrendingUp` icon
   - One-click to fill median value

**Usage Flow:**
```
1. User clicks "Hitung" → Fetch all courier options
2. "Median" button appears
3. User clicks "Median" → Auto-fill shipping fee with median value
```

**Example:**
```
Courier options: [5000, 8000, 15000, 16000, 18000, 18000, 20000]
Sorted: [5000, 8000, 15000, 16000, 18000, 18000, 20000]
Median: 16000 (middle value)
→ Shipping fee auto-filled with Rp 16,000
```

## API Endpoints

### Calculate Shipping Cost
**POST** `/api/orders/{orderId}/calculate-shipping`

**Request Body:**
```json
{
  "courier": "jne:tiki:pos:jnt:sicepat:anteraja:ninja:lion:rex:rpx:sentral:star:wahana:dse:ncs:sap:ide"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "origin": {
      "rajaOngkirDistrictId": "17601",
      "cityName": "JAKARTA PUSAT",
      "districtName": "Gambir"
    },
    "destination": {
      "rajaOngkirDistrictId": "8186",
      "cityName": "BOGOR",
      "districtName": "Cibinong"
    },
    "weight": 2000,
    "options": [
      {
        "courier": "dse",
        "service": "DARAT2022",
        "description": "Darat2022",
        "cost": 5000,
        "etd": "2-3 day"
      },
      {
        "courier": "jne",
        "service": "REG",
        "description": "Layanan Reguler",
        "cost": 20000,
        "etd": "1 day"
      }
      // ... only cheapest per courier
    ],
    "recommendedOption": {
      "courier": "dse",
      "service": "DARAT2022",
      "cost": 5000,
      "etd": "2-3 day"
    }
  }
}
```

## Database Schema

### User Table
```prisma
model User {
  // ... existing fields
  originRajaOngkirDistrictId String? // RajaOngkir district ID for shipping calculation
}
```

### Address Table
```prisma
model Address {
  // ... existing fields
  rajaOngkirDistrictId String? // RajaOngkir district ID for shipping calculation
}
```

## Testing

### Test Case 1: Profile Update with RajaOngkir ID
```bash
# Request
PATCH /api/profile
{
  "originCityName": "JAKARTA PUSAT",
  "originDistrictName": "Gambir",
  "originRajaOngkirDistrictId": "17632"
}

# Response
{
  "id": "...",
  "originRajaOngkirDistrictId": "17632" // ✅ Saved correctly
}
```

### Test Case 2: Shipping Calculation
```bash
# Request
POST /api/orders/{orderId}/calculate-shipping
{
  "courier": "jne:tiki:pos"
}

# Response - Only cheapest per courier
{
  "success": true,
  "data": {
    "options": [
      { "courier": "jne", "cost": 20000, ... },
      { "courier": "tiki", "cost": 18000, ... },
      { "courier": "pos", "cost": 16000, ... }
    ]
  }
}
```

### Test Case 3: Median Calculation
```javascript
// Options: [5000, 8000, 15000, 16000, 18000]
// Expected median: 15000
calculateMedianShipping(orderId)
// ✅ Shipping fee = "15000"

// Options: [5000, 8000, 15000, 16000]
// Expected median: (8000 + 15000) / 2 = 11500
calculateMedianShipping(orderId)
// ✅ Shipping fee = "11500"
```

## Benefits

1. **Accurate Shipping Costs**
   - District-level accuracy using proper RajaOngkir district IDs
   - No more "Origin or Destination not found" errors

2. **Simplified User Experience**
   - Only 1 option per courier (cheapest)
   - From 70+ options down to ~15 options
   - Clear pricing comparison

3. **Fast Decision Making**
   - "Median" button for quick fair pricing
   - One-click to set reasonable shipping fee
   - Based on market average

4. **Data Persistence**
   - RajaOngkir IDs saved in database
   - No re-fetching needed on subsequent calculations
   - Frontend-provided values take priority

## Technical Notes

### RajaOngkir API Endpoints
- ✅ **Correct:** `/api/v1/calculate/domestic-cost` with `price=lowest`
- ❌ **Wrong:** `/api/v1/calculate/district/domestic-cost`

### District ID Sources
1. **Frontend:** User selects location → Auto-fetch RajaOngkir ID
2. **Backend Auto-Map:** Fallback if frontend doesn't provide ID
3. **Priority:** Frontend > Backend auto-map

### Courier List
Default: `jne:tiki:pos:jnt:sicepat:anteraja:ninja:lion:rex:rpx:sentral:star:wahana:dse:ncs:sap:ide`

## Future Improvements

1. **Cache shipping costs** for same origin-destination pairs
2. **Add "Average" button** alongside median
3. **Show ETD comparison** in calculator dialog
4. **Auto-select recommended courier** based on price and ETD
5. **Bulk shipping calculation** for multiple orders

## Related Files

### Backend
- `/app/backend/src/services/rajaongkir.service.ts`
- `/app/backend/src/services/auth.service.ts`
- `/app/backend/src/services/checkout-dp.service.ts`
- `/app/backend/src/utils/validators.ts`
- `/app/backend/src/routes/profile.ts`

### Frontend
- `/app/frontend/components/checkout/AddressForm.tsx`
- `/app/frontend/components/checkout/DPCheckoutForm.tsx`
- `/app/frontend/components/dashboard/dashboard-validasi.tsx`

## References

- [RajaOngkir API Documentation](https://rajaongkir.komerce.id)
- Postman Collection: `/app/docs/sample/RajaOngkir Collection.postman_collection.json`
