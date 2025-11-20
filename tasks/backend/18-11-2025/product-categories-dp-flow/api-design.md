# DP Checkout API Design & Backend Architecture

**Date**: 2025-11-20  
**Status**: Architecture Specification  
**Author**: backend-architect subagent

---

## 1. API Endpoints Specification

### 1.1 Location APIs (Wilayah.id Proxy)

#### GET `/api/locations/provinces`
Returns list of Indonesian provinces.

**Response:**
```json
{
  "provinces": [
    {
      "code": "31",
      "name": "DKI JAKARTA"
    },
    {
      "code": "32",
      "name": "JAWA BARAT"
    }
  ]
}
```

---

#### GET `/api/locations/regencies/:provinceId`
Returns cities/regencies for a province.

**Params:**
- `provinceId` (string) - Province code from wilayah.id

**Response:**
```json
{
  "regencies": [
    {
      "code": "3171",
      "name": "KOTA JAKARTA SELATAN"
    },
    {
      "code": "3172",
      "name": "KOTA JAKARTA TIMUR"
    }
  ]
}
```

---

#### GET `/api/locations/districts/:cityId`
Returns districts/kecamatan for a city.

**Params:**
- `cityId` (string) - City code from wilayah.id

**Response:**
```json
{
  "districts": [
    {
      "code": "317101",
      "name": "KEBAYORAN BARU"
    },
    {
      "code": "317102",
      "name": "KEBAYORAN LAMA"
    }
  ]
}
```

---

#### GET `/api/locations/villages/:districtId` (Optional)
Returns villages/kelurahan for a district.

**Params:**
- `districtId` (string) - District code from wilayah.id

**Response:**
```json
{
  "villages": [
    {
      "code": "3171011001",
      "name": "MELAWAI"
    },
    {
      "code": "3171011002",
      "name": "GUNUNG"
    }
  ]
}
```

---

### 1.2 Checkout DP Endpoint

#### POST `/api/checkout/dp`
Create a down payment order (20% upfront payment).

**Authentication:** Optional (guest checkout supported)

**Request Body:**
```json
{
  "tripId": "clx123abc",
  "participantPhone": "+628123456789",
  "participantName": "John Doe",
  "items": [
    {
      "productId": "clx456def",
      "quantity": 2,
      "note": "Size L, warna merah"
    },
    {
      "productId": "clx789ghi",
      "quantity": 1,
      "note": null
    }
  ],
  "address": {
    "recipientName": "Jane Doe",
    "phone": "+628987654321",
    "provinceId": "31",
    "provinceName": "DKI JAKARTA",
    "cityId": "3171",
    "cityName": "KOTA JAKARTA SELATAN",
    "districtId": "317101",
    "districtName": "KEBAYORAN BARU",
    "villageId": "3171011001",
    "villageName": "MELAWAI",
    "addressText": "Jl. Kemang Raya No. 45, RT 001/RW 005, Sebelah Alfamart",
    "postalCode": "12130"
  }
}
```

**Field Validation Rules:**
- `tripId`: Required, must exist and `Trip.paymentType = "dp"` and `Trip.isActive = true`
- `participantPhone`: Required, format: `+62xxx` or `08xxx`
- `participantName`: Required, min 3 chars
- `items`: Required, array with at least 1 item
  - `productId`: Must exist, must belong to `tripId`, status = "active"
  - `quantity`: Required, min 1, must respect stock limits (if not unlimited)
  - `note`: Optional, max 500 chars
- `address`: **Conditional - Required ONLY if cart contains `type="goods"` products**
  - `recipientName`: Required (if address present)
  - `phone`: Required (if address present)
  - `provinceId`, `provinceName`: Required (if address present)
  - `cityId`, `cityName`: Required (if address present)
  - `districtId`, `districtName`: Required (if address present)
  - `villageId`, `villageName`: Optional
  - `addressText`: Required (if address present), min 10 chars
  - `postalCode`: Optional

**Business Logic:**
1. Validate all products exist and belong to trip
2. Check stock availability (if not unlimited)
3. Lock stock in Redis with 30min TTL
4. Calculate initial DP amount (20% of subtotal, min Rp 10,000)
5. Create Participant record (or link existing)
6. Create Address record (if address provided)
7. Create Order with status `pending_dp`
8. Create OrderItem records for each item
9. Generate payment link via Xendit/Midtrans
10. Return order ID + payment link

**Response (Success):**
```json
{
  "orderId": "clx999xyz",
  "dpAmount": 50000,
  "paymentLink": "https://payment.gateway.com/invoice/xxx",
  "expiresAt": "2025-11-20T10:30:00Z",
  "breakdown": {
    "items": [
      {
        "productId": "clx456def",
        "title": "Sneakers Nike",
        "quantity": 2,
        "pricePerUnit": 100000,
        "subtotal": 200000
      }
    ],
    "subtotal": 200000,
    "dpPercentage": 20,
    "dpAmount": 50000,
    "remainingEstimate": 150000
  }
}
```

**Response (Error - Validation):**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Address is required for goods products",
  "details": {
    "field": "address",
    "reason": "Cart contains physical goods (type=goods) which require shipping address"
  }
}
```

**Response (Error - Stock):**
```json
{
  "error": "INSUFFICIENT_STOCK",
  "message": "Product 'Sneakers Nike' has insufficient stock",
  "details": {
    "productId": "clx456def",
    "requested": 5,
    "available": 3
  }
}
```

---

### 1.3 Jastiper Validation Endpoint

#### POST `/api/orders/:orderId/validate`
Jastiper accepts/rejects order and sets final pricing.

**Authentication:** Required (Jastiper only - must own the trip)

**Authorization Check:**
```typescript
// Verify jastiper owns the trip for this order
const order = await db.order.findUnique({
  where: { id: orderId },
  include: { Trip: true }
})

if (order.Trip.jastiperId !== req.user.id) {
  throw new ForbiddenError("Not authorized")
}
```

**Request Body (Accept):**
```json
{
  "action": "accept",
  "shippingFee": 25000,
  "serviceFee": 0,
  "note": "Order confirmed, estimated delivery 7-10 days"
}
```

**Request Body (Reject):**
```json
{
  "action": "reject",
  "rejectionReason": "Product out of stock from supplier"
}
```

**Field Validation:**
- `action`: Required, enum: `"accept"` | `"reject"`
- `shippingFee`: Required if action="accept", min 0, max 10,000,000
- `serviceFee`: Optional, min 0, max 10,000,000, default 0
- `rejectionReason`: Required if action="reject", min 10 chars
- `note`: Optional, max 500 chars

**Business Logic (Accept):**
1. Verify order status = `awaiting_validation`
2. Calculate final breakdown:
   ```javascript
   subtotal = sum(orderItems.itemSubtotal)
   jastipherMarkup = calculateMarkup(subtotal, products.markupType, products.markupValue)
   platformCommission = (subtotal + jastipherMarkup) * 0.05
   finalAmount = subtotal + shippingFee + serviceFee + jastipherMarkup + platformCommission
   remainingAmount = finalAmount - order.dpAmount
   ```
3. Update Order:
   - `status` → `validated`
   - `validatedAt` → now
   - `validatedBy` → req.user.id
   - `finalAmount` → calculated
   - `shippingFee`, `serviceFee`, `platformCommission` → calculated
   - `finalBreakdown` → full JSON
4. Generate payment link for remaining amount
5. Send notification to Penitip

**Business Logic (Reject):**
1. Verify order status = `awaiting_validation`
2. Update Order:
   - `status` → `rejected`
   - `rejectionReason` → provided
   - `validatedAt` → now
   - `validatedBy` → req.user.id
3. Release stock lock (restore stock)
4. Initiate DP refund via payment gateway
5. Send notification to Penitip

**Response (Accept):**
```json
{
  "orderId": "clx999xyz",
  "status": "validated",
  "finalAmount": 280000,
  "remainingAmount": 230000,
  "paymentLink": "https://payment.gateway.com/invoice/yyy",
  "breakdown": {
    "items": [
      {
        "title": "Sneakers Nike",
        "quantity": 2,
        "subtotal": 200000
      }
    ],
    "subtotal": 200000,
    "jastipherMarkup": 20000,
    "shippingFee": 25000,
    "serviceFee": 0,
    "platformCommission": 11000,
    "finalAmount": 280000,
    "dpPaid": 50000,
    "remainingAmount": 230000
  }
}
```

**Response (Reject):**
```json
{
  "orderId": "clx999xyz",
  "status": "rejected",
  "refundAmount": 50000,
  "refundStatus": "processing",
  "message": "Order rejected. DP refund initiated."
}
```

---

### 1.4 Shipping Calculation Endpoint (Optional)

#### POST `/api/orders/:orderId/calculate-shipping`
Calculate shipping cost using RajaOngkir API (optional helper for jastiper).

**Authentication:** Required (Jastiper only)

**Request Body:**
```json
{
  "courier": "jne:tiki:pos"
}
```

**Field Validation:**
- `courier`: Optional, default "jne:tiki:pos", format: colon-separated couriers

**Business Logic:**
1. Verify jastiper owns the trip
2. Get order with address and items
3. Calculate total weight: `sum(product.weightGram * quantity)`
4. Get jastiper origin district from `User.originDistrictId`
5. Get destination district from `Address.districtId`
6. Call RajaOngkir API via existing service
7. Return shipping options sorted by cost

**Response:**
```json
{
  "totalWeight": 2000,
  "origin": {
    "districtId": "151",
    "districtName": "Jakarta Selatan"
  },
  "destination": {
    "districtId": "152",
    "districtName": "Jakarta Timur"
  },
  "shippingOptions": [
    {
      "courier": "JNE",
      "service": "REG",
      "description": "Regular",
      "cost": 15000,
      "etd": "2-3 days"
    },
    {
      "courier": "JNE",
      "service": "YES",
      "description": "Yes Express",
      "cost": 25000,
      "etd": "1-2 days"
    },
    {
      "courier": "TIKI",
      "service": "REG",
      "description": "Regular Service",
      "cost": 18000,
      "etd": "3-5 days"
    }
  ],
  "recommendedOption": {
    "courier": "JNE",
    "service": "REG",
    "cost": 15000,
    "etd": "2-3 days"
  }
}
```

**Response (Error - Missing Origin):**
```json
{
  "error": "ORIGIN_NOT_SET",
  "message": "Jastiper origin address not configured",
  "details": {
    "action": "Please set your origin district in profile settings"
  }
}
```

---

### 1.5 Order Breakdown Endpoint

#### GET `/api/orders/:orderId/breakdown`
Get detailed price breakdown for an order.

**Authentication:** Required (Participant or Jastiper)

**Authorization:**
- Participant: Can view own orders
- Jastiper: Can view orders for own trips

**Response (Before Validation):**
```json
{
  "orderId": "clx999xyz",
  "status": "awaiting_validation",
  "breakdown": {
    "items": [
      {
        "title": "Sneakers Nike",
        "quantity": 2,
        "pricePerUnit": 100000,
        "subtotal": 200000
      }
    ],
    "subtotal": 200000,
    "dpPaid": 50000,
    "finalBreakdown": null,
    "message": "Waiting for jastiper validation"
  }
}
```

**Response (After Validation):**
```json
{
  "orderId": "clx999xyz",
  "status": "validated",
  "breakdown": {
    "items": [
      {
        "title": "Sneakers Nike",
        "quantity": 2,
        "pricePerUnit": 100000,
        "subtotal": 200000
      }
    ],
    "subtotal": 200000,
    "jastipherMarkup": 20000,
    "shippingFee": 25000,
    "serviceFee": 0,
    "platformCommission": 11000,
    "finalAmount": 280000,
    "dpPaid": 50000,
    "remainingAmount": 230000
  }
}
```

---

### 1.6 Payment Webhook Endpoints

#### POST `/api/webhooks/payment/dp`
Payment gateway callback for DP payments.

**Authentication:** Webhook signature verification

**Request Body (Xendit Example):**
```json
{
  "id": "invoice_xxx",
  "external_id": "order_clx999xyz",
  "status": "PAID",
  "paid_amount": 50000,
  "paid_at": "2025-11-20T10:15:00Z"
}
```

**Business Logic:**
1. Verify webhook signature
2. Find order by external_id
3. Verify amount matches `order.dpAmount`
4. Update order:
   - `status` → `dp_paid`
   - `dpPaidAt` → webhook.paid_at
   - `dpPaymentId` → webhook.id
5. Extend stock lock to 24 hours
6. Send notification to Jastiper
7. Queue auto-refund job (24h delay)

**Response:**
```json
{
  "success": true
}
```

---

#### POST `/api/webhooks/payment/final`
Payment gateway callback for final payments.

**Authentication:** Webhook signature verification

**Request Body:**
```json
{
  "id": "invoice_yyy",
  "external_id": "order_clx999xyz_final",
  "status": "PAID",
  "paid_amount": 230000,
  "paid_at": "2025-11-21T14:30:00Z"
}
```

**Business Logic:**
1. Verify webhook signature
2. Find order by external_id (remove `_final` suffix)
3. Verify amount matches `order.finalAmount - order.dpAmount`
4. Update order:
   - `status` → `confirmed`
   - `finalPaidAt` → webhook.paid_at
   - `finalPaymentId` → webhook.id
5. Release stock lock (no restore - keep deducted)
6. Send notification to Penitip & Jastiper
7. Queue order fulfillment jobs

**Response:**
```json
{
  "success": true
}
```

---

## 2. Database Schema Confirmation

### 2.1 Address Table (Wilayah.id Structure)

**Status:** ✅ Already migrated (migration: 20251118133730)

```sql
CREATE TABLE "Address" (
    "id" TEXT PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressText" TEXT NOT NULL,
    
    -- Wilayah.id fields (REQUIRED)
    "provinceId" TEXT NOT NULL,
    "provinceName" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "cityName" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "districtName" TEXT NOT NULL,
    "villageId" TEXT,
    "villageName" TEXT,
    "postalCode" TEXT,
    
    -- RajaOngkir integration (OPTIONAL)
    "rajaOngkirDistrictId" TEXT,
    
    "isDefault" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP,
    
    FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX "Address_participantId_idx" ON "Address"("participantId");
CREATE INDEX "Address_provinceId_idx" ON "Address"("provinceId");
CREATE INDEX "Address_cityId_idx" ON "Address"("cityId");
CREATE INDEX "Address_districtId_idx" ON "Address"("districtId");
```

**Key Points:**
- `provinceId`, `cityId`, `districtId` are **required** (from wilayah.id API)
- `villageId` is **optional** (detailed address granularity)
- `rajaOngkirDistrictId` is **optional** (only for auto-shipping calculation)
- Indexes on location IDs for fast lookups

---

### 2.2 Order Table (DP Flow Fields)

**Status:** ✅ Already migrated

```sql
CREATE TABLE "Order" (
    "id" TEXT PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "tripId" TEXT,
    "productId" TEXT,  -- Legacy, nullable now
    "addressId" TEXT,  -- Foreign key to Address
    
    -- Basic order info
    "quantity" INTEGER DEFAULT 1,
    "totalPrice" INTEGER DEFAULT 0,
    "status" TEXT DEFAULT 'pending_dp',
    "notes" TEXT,
    
    -- DP Payment tracking
    "dpAmount" INTEGER DEFAULT 0,
    "dpPaidAt" TIMESTAMP,
    "dpPaymentId" TEXT,
    
    -- Final Payment tracking
    "finalAmount" INTEGER,
    "finalPaidAt" TIMESTAMP,
    "finalPaymentId" TEXT,
    "finalBreakdown" JSONB,
    
    -- Fee breakdown
    "shippingFee" INTEGER DEFAULT 0,
    "serviceFee" INTEGER DEFAULT 0,
    "platformCommission" INTEGER DEFAULT 0,
    
    -- Validation tracking
    "validatedAt" TIMESTAMP,
    "validatedBy" TEXT,
    "rejectionReason" TEXT,
    
    "proofUrl" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP,
    
    FOREIGN KEY ("participantId") REFERENCES "Participant"("id"),
    FOREIGN KEY ("tripId") REFERENCES "Trip"("id"),
    FOREIGN KEY ("addressId") REFERENCES "Address"("id")
);

-- Indexes
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_tripId_idx" ON "Order"("tripId");
CREATE INDEX "Order_dpPaidAt_idx" ON "Order"("dpPaidAt");
CREATE INDEX "Order_validatedAt_idx" ON "Order"("validatedAt");
```

**Key Fields:**
- `dpAmount`: Calculated DP (20% of subtotal, min Rp 10k)
- `finalAmount`: Total after jastiper validation
- `finalBreakdown`: JSON with full pricing details
- `shippingFee`, `serviceFee`, `platformCommission`: Fee components
- `validatedAt`, `validatedBy`: Audit trail

---

### 2.3 OrderItem Table (Multiple Products)

**Status:** ✅ Already migrated

```sql
CREATE TABLE "OrderItem" (
    "id" TEXT PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,  -- 'goods' | 'tasks'
    "priceAtOrder" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "itemSubtotal" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
);

CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
```

**Purpose:** Support multiple products per order (cart functionality)

---

### 2.4 Product Table Updates

**Status:** ✅ Already migrated

**New Fields:**
- `type`: `'goods'` (physical, needs address) or `'tasks'` (services, no address)
- `unit`: `'kg'`, `'pcs'`, `'box'`, etc.
- `stock`: Nullable (unlimited for tasks)
- `weightGram`: For shipping calculation (required for `type='goods'`)
- `markupType`: `'percent'` or `'flat'`
- `markupValue`: Markup amount

---

### 2.5 User Table (Jastiper Origin)

**Status:** ✅ Already updated

**New Fields for Jastiper:**
```sql
-- Jastiper Origin Address (for RajaOngkir)
"originProvinceId" TEXT,
"originProvinceName" TEXT,
"originCityId" TEXT,
"originCityName" TEXT,
"originDistrictId" TEXT,
"originDistrictName" TEXT,
"originPostalCode" TEXT,
"originAddressText" TEXT
```

**Purpose:** Optional - for auto-calculating shipping fees via RajaOngkir

---

## 3. DP Amount Calculation Logic

### 3.1 Core Formula

```typescript
// Step 1: Calculate subtotal from items
const subtotal = orderItems.reduce((sum, item) => {
  return sum + (item.priceAtOrder * item.quantity)
}, 0)

// Step 2: Calculate DP amount (20% with minimum)
const DP_PERCENTAGE = 0.20  // 20%
const MINIMUM_DP = 10000     // Rp 10,000

const dpAmount = Math.max(
  Math.round(subtotal * DP_PERCENTAGE),
  MINIMUM_DP
)

// Examples:
// Subtotal Rp 100,000 → DP = max(20,000, 10,000) = Rp 20,000
// Subtotal Rp 30,000  → DP = max(6,000, 10,000)  = Rp 10,000
// Subtotal Rp 500,000 → DP = max(100,000, 10,000) = Rp 100,000
```

---

### 3.2 Final Amount Calculation (After Jastiper Validation)

```typescript
// Step 1: Get subtotal from order items
const subtotal = sum(orderItems.itemSubtotal)

// Step 2: Calculate jastiper markup
let jastipherMarkup = 0
for (const item of orderItems) {
  const product = await db.product.findUnique({ 
    where: { id: item.productId } 
  })
  
  if (product.markupType === 'percent') {
    jastipherMarkup += (item.itemSubtotal * product.markupValue / 100)
  } else if (product.markupType === 'flat') {
    jastipherMarkup += (product.markupValue * item.quantity)
  }
}

// Step 3: Platform commission (5% of subtotal + markup)
const PLATFORM_COMMISSION_RATE = 0.05
const platformCommission = Math.round(
  (subtotal + jastipherMarkup) * PLATFORM_COMMISSION_RATE
)

// Step 4: Add fees from jastiper
const shippingFee = jastiper_input  // From validation request
const serviceFee = jastiper_input || 0  // Optional

// Step 5: Calculate final total
const finalAmount = subtotal 
  + jastipherMarkup 
  + platformCommission 
  + shippingFee 
  + serviceFee

// Step 6: Remaining amount to pay
const remainingAmount = finalAmount - order.dpAmount

// Full breakdown object
const breakdown = {
  items: orderItems.map(item => ({
    title: item.Product.title,
    quantity: item.quantity,
    pricePerUnit: item.priceAtOrder,
    subtotal: item.itemSubtotal
  })),
  subtotal,
  jastipherMarkup,
  shippingFee,
  serviceFee,
  platformCommission,
  finalAmount,
  dpPaid: order.dpAmount,
  remainingAmount
}
```

---

### 3.3 Mixed Goods + Services Handling

**Address Requirement Logic:**
```typescript
// Check if cart contains any physical goods
const hasGoods = orderItems.some(item => item.productType === 'goods')

if (hasGoods && !request.address) {
  throw new ValidationError(
    'Address is required for orders containing physical goods'
  )
}

// Shipping fee logic
const shippingFee = hasGoods ? jastiper_input_shipping : 0
```

**Example Scenarios:**

| Cart Contents | Address Required? | Shipping Fee? |
|---------------|-------------------|---------------|
| 2x Goods only | ✅ Yes | ✅ Yes |
| 1x Task only | ❌ No | ❌ No |
| 1x Goods + 1x Task | ✅ Yes (has goods) | ✅ Yes |
| Multiple Tasks | ❌ No | ❌ No |

---

### 3.4 When Address is Required vs Optional

**Required When:**
- At least one `OrderItem.productType = 'goods'`
- During checkout DP creation

**Optional When:**
- All `OrderItem.productType = 'tasks'`
- No physical shipping needed

**Validation Code:**
```typescript
export function validateCheckoutRequest(request: CheckoutDPRequest) {
  // Get products to check types
  const products = await db.product.findMany({
    where: { 
      id: { in: request.items.map(i => i.productId) } 
    }
  })
  
  // Check if any product is physical goods
  const hasGoods = products.some(p => p.type === 'goods')
  
  // Address is required for goods
  if (hasGoods && !request.address) {
    throw new ValidationError(
      'Address is required for physical goods',
      { field: 'address', reason: 'Cart contains type=goods products' }
    )
  }
  
  // Validate address fields if provided
  if (request.address) {
    if (!request.address.provinceId || !request.address.cityId || !request.address.districtId) {
      throw new ValidationError(
        'Province, city, and district are required address fields'
      )
    }
  }
}
```

---

## 4. Integration Points

### 4.1 Wilayah.id API Integration

**Purpose:** Provide structured Indonesian address data (cascading dropdowns)

**API Base URL:** `https://wilayah.id/api/`

**Endpoints Used:**
- `GET /provinces.json` → List provinces
- `GET /regencies/{provinceId}.json` → List cities in province
- `GET /districts/{cityId}.json` → List districts in city
- `GET /villages/{districtId}.json` → List villages in district (optional)

**Implementation Strategy:**
1. **Option A: Direct Frontend Call** (Recommended)
   - Frontend directly fetches from wilayah.id
   - No backend proxy needed
   - Lower latency
   - Example: `fetch('https://wilayah.id/api/provinces.json')`

2. **Option B: Backend Proxy** (Optional)
   - Backend proxies requests to wilayah.id
   - Add caching layer (Redis) for performance
   - Useful for rate limiting/monitoring
   - Endpoints: `/api/locations/*`

**Caching Strategy (If using proxy):**
```typescript
// Cache wilayah.id data for 24 hours (rarely changes)
const CACHE_TTL = 60 * 60 * 24  // 24 hours

export async function getProvinces() {
  const cached = await redis.get('wilayah:provinces')
  if (cached) return JSON.parse(cached)
  
  const response = await fetch('https://wilayah.id/api/provinces.json')
  const data = await response.json()
  
  await redis.setex('wilayah:provinces', CACHE_TTL, JSON.stringify(data))
  return data
}
```

---

### 4.2 RajaOngkir Integration (Optional)

**Status:** ✅ Service already exists at `/backend/src/services/rajaongkir.service.ts`

**Purpose:** Auto-calculate shipping costs (optional helper for jastiper)

**Integration Mode:** **Default Manual + Optional Auto**

**Default Flow (No RajaOngkir):**
1. Jastiper validates order
2. Jastiper manually inputs shipping fee
3. System uses manual input in final calculation

**Optional Flow (With RajaOngkir):**
1. Jastiper clicks "Calculate Shipping" button
2. Frontend calls `POST /api/orders/:id/calculate-shipping`
3. Backend queries RajaOngkir API
4. Returns shipping options (JNE, TIKI, POS)
5. Jastiper selects option OR overrides with manual input

**Required Data for RajaOngkir:**
- **Origin:** `User.originDistrictId` (jastiper's location)
- **Destination:** `Address.districtId` (customer's location)
- **Weight:** `sum(Product.weightGram * OrderItem.quantity)`
- **Courier:** `"jne:tiki:pos"` (multiple couriers)

**Existing Service Methods:**
```typescript
// From rajaongkir.service.ts
searchDestinations(search: string): Promise<District[]>
calculateShippingCost(origin, destination, weight, courier): Promise<ShippingOption[]>
getBestShippingOption(options): ShippingOption
```

**Mapping Wilayah.id → RajaOngkir:**
- Wilayah.id uses different district codes than RajaOngkir
- Need manual mapping or use `Address.rajaOngkirDistrictId` (optional field)
- Jastiper can search RajaOngkir districts via `searchDestinations(cityName)`

---

### 4.3 Stock Lock Mechanism (Redis)

**Purpose:** Prevent overselling during DP payment window

**Lock Timing:**
1. **On Checkout DP:** Lock stock for 30 minutes (payment window)
2. **On DP Paid:** Extend lock to 24 hours (validation window)
3. **On Validation Accept:** Release lock, deduct stock permanently
4. **On Validation Reject:** Release lock, restore stock
5. **On Timeout:** Auto-release expired locks

**Redis Structure:**
```typescript
// Key format: stock_lock:{productId}
// Value: JSON { orderId, quantity, expiresAt }

interface StockLock {
  orderId: string
  quantity: number
  expiresAt: number  // Unix timestamp
}

// Example:
// stock_lock:clx456def → { orderId: "clx999xyz", quantity: 2, expiresAt: 1732105200 }
```

**Service Methods:**
```typescript
export class StockLockService {
  async lockStock(orderId: string, items: CartItem[]) {
    const TTL = 30 * 60  // 30 minutes
    
    for (const item of items) {
      const product = await db.product.findUnique({ 
        where: { id: item.productId } 
      })
      
      // Skip if unlimited stock
      if (product.isUnlimitedStock) continue
      
      // Check available stock
      const lockedQty = await this.getLockedQuantity(product.id)
      const available = product.stock - lockedQty
      
      if (available < item.quantity) {
        throw new InsufficientStockError(product.title, available)
      }
      
      // Lock stock
      const lockKey = `stock_lock:${product.id}:${orderId}`
      await redis.setex(
        lockKey, 
        TTL, 
        JSON.stringify({ orderId, quantity: item.quantity })
      )
    }
  }
  
  async extendLock(orderId: string, newTTL: number) {
    const keys = await redis.keys(`stock_lock:*:${orderId}`)
    for (const key of keys) {
      await redis.expire(key, newTTL)
    }
  }
  
  async releaseStock(orderId: string, shouldRestore: boolean) {
    const keys = await redis.keys(`stock_lock:*:${orderId}`)
    
    for (const key of keys) {
      const lockData = JSON.parse(await redis.get(key))
      const productId = key.split(':')[1]
      
      // Delete lock
      await redis.del(key)
      
      // Restore stock if rejected
      if (shouldRestore) {
        await db.product.update({
          where: { id: productId },
          data: { stock: { increment: lockData.quantity } }
        })
      } else {
        // Deduct stock permanently if accepted
        await db.product.update({
          where: { id: productId },
          data: { stock: { decrement: lockData.quantity } }
        })
      }
    }
  }
  
  async getLockedQuantity(productId: string): Promise<number> {
    const keys = await redis.keys(`stock_lock:${productId}:*`)
    let total = 0
    
    for (const key of keys) {
      const lock = JSON.parse(await redis.get(key))
      total += lock.quantity
    }
    
    return total
  }
}
```

---

### 4.4 Payment Gateway Integration

**Current Status:** Need to verify existing payment service

**Required Webhooks:**
1. **DP Payment Webhook:** `/api/webhooks/payment/dp`
2. **Final Payment Webhook:** `/api/webhooks/payment/final`

**Payment Link Generation:**
```typescript
// DP Payment
const dpPaymentLink = await paymentGateway.createInvoice({
  external_id: `order_${orderId}`,
  amount: order.dpAmount,
  description: `DP 20% - Order #${orderId.slice(-8)}`,
  customer: {
    name: participant.name,
    phone: participant.phone
  },
  success_redirect_url: `${APP_URL}/orders/${orderId}/success`,
  failure_redirect_url: `${APP_URL}/orders/${orderId}/failed`
})

// Final Payment
const finalPaymentLink = await paymentGateway.createInvoice({
  external_id: `order_${orderId}_final`,
  amount: order.finalAmount - order.dpAmount,
  description: `Final Payment - Order #${orderId.slice(-8)}`,
  customer: {
    name: participant.name,
    phone: participant.phone
  }
})
```

---

## 5. Order Status Flow

```
┌─────────────┐
│ pending_dp  │ ← Initial state after checkout
└──────┬──────┘
       │ (DP payment received)
       ▼
┌─────────────┐
│   dp_paid   │ ← DP confirmed, waiting jastiper
└──────┬──────┘
       │ (24h timeout OR jastiper action)
       ├──────────────┬─────────────┐
       ▼              ▼             ▼
┌──────────────┐  ┌──────────┐  ┌──────────┐
│awaiting_     │  │validated │  │ rejected │
│validation    │  │          │  │          │
└──────┬───────┘  └────┬─────┘  └────┬─────┘
       │              │             │
       │ (manual      │ (final      │ (auto-refund)
       │  extend)     │  payment)   │
       │              ▼             ▼
       │         ┌──────────┐  ┌──────────┐
       │         │confirmed │  │ refunded │
       │         └────┬─────┘  └──────────┘
       │              │
       │              ▼
       │         ┌──────────┐
       │         │ shipped  │
       │         └────┬─────┘
       │              │
       │              ▼
       │         ┌──────────┐
       └────────▶│completed │
                 └──────────┘
```

**Status Transitions:**
- `pending_dp` → `dp_paid`: DP webhook received
- `dp_paid` → `awaiting_validation`: Auto after dp_paid
- `awaiting_validation` → `validated`: Jastiper accepts
- `awaiting_validation` → `rejected`: Jastiper rejects OR 24h timeout
- `validated` → `confirmed`: Final payment webhook received
- `confirmed` → `shipped`: Manual update by jastiper
- `shipped` → `completed`: Manual update or auto after delivery

---

## 6. Technology Recommendations

### 6.1 Backend Stack (Current)
- **Framework:** Express.js (TypeScript)
- **Database:** PostgreSQL + Prisma ORM ✅
- **Cache/Queue:** Redis (for stock locks + BullMQ workers)
- **Payment:** Xendit or Midtrans (Indonesia-focused)

### 6.2 New Services Needed
1. **`wilayah.service.ts`**: Proxy to wilayah.id API (optional)
2. **`price-calculator.service.ts`**: DP & final amount calculations
3. **`stock-lock.service.ts`**: Redis-based stock reservation
4. **`checkout-dp.service.ts`**: Main DP checkout logic
5. **`validation.service.ts`**: Jastiper order validation logic

### 6.3 Workers/Cron Jobs (BullMQ)
1. **DP Payment Listener**: Process payment webhooks
2. **Auto-Refund Worker**: Reject orders after 24h validation timeout
3. **Expired DP Worker**: Cancel pending_dp orders after 30min
4. **Stock Lock Cleanup**: Remove expired Redis locks

---

## 7. Scaling Considerations & Bottlenecks

### 7.1 Potential Bottlenecks

**1. Stock Lock Race Conditions**
- **Problem:** Multiple users checkout same product simultaneously
- **Solution:** Redis Lua scripts for atomic stock checks
```typescript
// Atomic stock check + lock
const luaScript = `
  local key = KEYS[1]
  local orderId = ARGV[1]
  local quantity = tonumber(ARGV[2])
  local ttl = tonumber(ARGV[3])
  
  -- Check if enough stock available
  local locked = redis.call('GET', key)
  if locked then
    return redis.error_reply('ALREADY_LOCKED')
  end
  
  -- Lock stock
  redis.call('SETEX', key, ttl, cjson.encode({orderId=orderId, quantity=quantity}))
  return 'OK'
`
```

**2. Wilayah.id API Rate Limits**
- **Problem:** Many users selecting addresses simultaneously
- **Solution:** Cache all wilayah.id data in Redis (24h TTL)
- **Impact:** ~250KB total data (provinces + cities + districts)

**3. RajaOngkir API Quota**
- **Problem:** Each shipping calculation = 1 API call
- **Solution:** 
  - Make optional (manual input as primary)
  - Cache common origin-destination pairs (1h TTL)
  - Show cached results if available

**4. Payment Webhook Processing**
- **Problem:** Webhook bursts during peak hours
- **Solution:** BullMQ with retry mechanism
```typescript
// Queue configuration
webhookQueue.process('payment.dp', async (job) => {
  await processPaymentWebhook(job.data)
}, {
  concurrency: 5,
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
})
```

### 7.2 Performance Optimizations

**1. Database Indexes**
- ✅ Already added in migration:
  - `Order.status` (for filtering orders)
  - `Order.dpPaidAt`, `Order.validatedAt` (for time-based queries)
  - `Address.districtId` (for shipping calculations)

**2. API Response Times**
- **Target:** <200ms for checkout DP
- **Optimization:** 
  - Use Prisma `include` for eager loading
  - Parallel stock checks
  - Async payment link generation

**3. Redis Memory Management**
- **Stock locks:** ~100 bytes per lock
- **Wilayah.id cache:** ~250KB total
- **Estimated:** <10MB for 10,000 concurrent orders

### 7.3 Horizontal Scaling Strategy

**Stateless API Servers:**
- All state in PostgreSQL + Redis
- Can deploy multiple API instances behind load balancer
- No server affinity needed

**Worker Scaling:**
- BullMQ workers can run on separate instances
- Scale workers independently from API servers

**Database Scaling:**
- Read replicas for order history queries
- Connection pooling (pgBouncer)
- Consider partitioning Orders table by date after 1M+ rows

---

## 8. Security Considerations

### 8.1 Authentication & Authorization
- **Jastiper endpoints:** Verify `req.user.id === Trip.jastiperId`
- **Participant endpoints:** Verify `req.user.participantId === Order.participantId`
- **Webhook endpoints:** Verify payment gateway signatures

### 8.2 Input Validation
- Sanitize all text inputs (XSS prevention)
- Validate numeric ranges (prevent negative quantities)
- Rate limit checkout endpoint (5 requests/minute per IP)

### 8.3 Payment Security
- Never store payment credentials
- Use HTTPS for all payment-related requests
- Verify webhook signatures before processing
- Implement idempotency keys for payment operations

### 8.4 Data Privacy
- PII fields: `phone`, `email`, `addressText`
- Encrypt sensitive data at rest
- Mask phone numbers in logs
- GDPR compliance for data deletion

---

## 9. Implementation Priority (MVP)

### Phase 1: Core DP Flow (Week 1-2)
- ✅ Database migration (already done)
- [ ] `POST /api/checkout/dp` endpoint
- [ ] `POST /api/webhooks/payment/dp` webhook
- [ ] Price calculator service
- [ ] Stock lock service (basic)

### Phase 2: Validation Flow (Week 2-3)
- [ ] `POST /api/orders/:id/validate` endpoint
- [ ] `POST /api/webhooks/payment/final` webhook
- [ ] Validation service (accept/reject logic)
- [ ] Auto-refund worker (24h timeout)

### Phase 3: Optional Enhancements (Week 3-4)
- [ ] `GET /api/locations/*` endpoints (wilayah.id proxy)
- [ ] `POST /api/orders/:id/calculate-shipping` (RajaOngkir)
- [ ] Stock lock cleanup worker
- [ ] Order dashboard for jastiper

---

## 10. Next Steps for Implementation Team

### Backend Developer Tasks:
1. Implement `checkout-dp.service.ts` with core DP logic
2. Create API routes for checkout and validation
3. Setup BullMQ workers for payment webhooks
4. Add integration tests for happy path + edge cases

### Frontend Developer Tasks:
1. Build address form component with wilayah.id cascading dropdowns
2. Implement DP checkout flow UI
3. Create jastiper validation dashboard
4. Add order status tracker component

### Database Admin Tasks:
1. ✅ Migration already completed
2. Monitor index performance
3. Setup Redis instance for stock locks
4. Configure backup schedule

### Security Auditor Tasks:
1. Review payment webhook signature verification
2. Audit input validation on checkout endpoints
3. Test rate limiting effectiveness
4. Review PII handling and encryption

---

## Summary

**API Endpoints:** 6 core endpoints (checkout, validate, webhooks) + 4 optional (locations, shipping)

**Database:** ✅ Schema ready with Address (wilayah.id), OrderItem (multi-product), DP fields

**DP Calculation:** 20% of subtotal, min Rp 10k

**Address Handling:** Required for `type='goods'`, optional for `type='tasks'`

**RajaOngkir:** Optional helper - manual input remains primary method

**Scaling:** Stateless design, Redis for locks, caching for external APIs

**Security:** Webhook verification, input validation, authorization checks

**Ready for frontend implementation with clear request/response contracts.**
