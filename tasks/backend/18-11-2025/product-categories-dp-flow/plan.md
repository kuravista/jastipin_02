# Implementation Plan: Product Categories & DP Checkout Flow

**Version**: 1.0  
**Date**: 2025-11-18  
**Timeline**: 4-6 weeks  
**Priority**: High

---

## 🎯 Objectives

Upgrade sistem Jastipin untuk mendukung:
1. **Product types**: `goods` (barang fisik) dan `tasks` (jasa)
2. **DP Flow**: checkout minimal → DP payment → jastiper validation → final payment
3. **Flexible pricing**: jastiper set final price setelah DP

---

## 📊 Current vs Target State

### Current Flow
```
Penitip → fill all details → pay full → jastiper validate → done
```

### Target Flow
```
Penitip → minimal info → pay DP (20%) 
  → jastiper validate + set final price 
  → penitip pay remaining → done
```

### Order Status (NEW)
```
pending_dp → dp_paid → awaiting_validation 
  → validated/rejected 
  → awaiting_final_payment → confirmed → shipped → completed
```

---

## 🗄️ Database Changes

### 1. New Tables

**addresses** - normalized address table
```prisma
id, participantId, recipientName, addressText, city, postalCode, isDefault
```

**order_items** - multiple products per order
```prisma
id, orderId, productId, productType, priceAtOrder, quantity, itemSubtotal, note
```

**fees_config** - global fee configuration
```prisma
id, scope, calculationType, value, meta (JSON), isActive
```

### 2. Update Products Table

```prisma
// ADD fields:
type            String   @default("goods")  // 'goods' | 'tasks'
unit            String?  // 'kg', 'pcs', 'box'
stock           Int?     // nullable for tasks
weightGram      Int?
requiresDetails Boolean  @default(false)
requiresProof   Boolean  @default(false)
markupType      String   @default("percent")
markupValue     Int      @default(0)
```

### 3. Update Orders Table

```prisma
// ADD fields:
addressId           String?
dpAmount            Int
dpPaidAt            DateTime?
finalAmount         Int?
finalPaidAt         DateTime?
finalBreakdown      Json?
shippingFee         Int @default(0)
serviceFee          Int @default(0)
platformCommission  Int @default(0)
validatedAt         DateTime?
validatedBy         String?
rejectionReason     String?

// UPDATE status enum to include all new states
```

---

## 🔧 Implementation Phases

### **Phase 1: Database (Week 1)**

**Tasks:**
1. Create migration: new tables (addresses, order_items, fees_config)
2. Add fields to Products (type, unit, weight, markup fields)
3. Add fields to Orders (DP fields, fees, validation fields)
4. Migrate existing addresses from Participant to Address table
5. Update Order status enum

**Migration Script:**
```bash
# Create migration
npx prisma migrate dev --name add_dp_flow_support

# Test on staging
npm run db:migrate:staging

# Backup production before migration
npm run db:backup:production
```

---

### **Phase 2: Services (Week 2)**

#### Service 1: Price Calculator (`price-calculator.service.ts`)
```typescript
// Core functions:
- calculateDPAmount(subtotal) → 20% of subtotal (min 10k)
- calculatePriceBreakdown(items, shippingFee, serviceFee) → full breakdown
- calculateShippingWithRajaOngkir(origin, destination, weight) → auto-calculate shipping
```

**Integration with RajaOngkir (OPTIONAL)**:
- **Default**: Jastiper input manual shipping fee
- **Optional**: Use `rajaongkir.service.ts` untuk auto-calculate sebagai helper
- Jastiper bisa pilih: manual input ATAU gunakan RajaOngkir suggestion
- RajaOngkir tidak wajib, hanya fitur tambahan untuk convenience

#### Service 2: Stock Lock (`stock-lock.service.ts`)
```typescript
// Redis-based stock reservation
- lockStock(orderId, items) → reserve with 30min TTL
- releaseStock(orderId, shouldRestore) → release/restore
- extendStockLock(orderId) → extend TTL
```

#### Service 3: DP Checkout (`checkout-dp.service.ts`)
```typescript
// Replace current checkout.service.ts
- processCheckoutDP(request) → create order, calculate DP, create payment link
```

#### Service 4: Validation (`validation.service.ts`)
```typescript
// Jastiper validation logic
- validateOrder(orderId, action, fees) → accept/reject with final price
```

---

### **Phase 2.5: RajaOngkir Integration (OPTIONAL FEATURE)**

**Status**: Optional - jastiper bisa input manual atau gunakan auto-calculate  
**Existing Service**: `rajaongkir.service.ts` (already implemented)

**Default Behavior**: 
- Jastiper **manual input** shipping fee (simple text/number input)
- Tidak perlu address district ID jika jastiper pilih manual

**Optional Enhancement**:
- Jika jastiper mau, bisa klik "Calculate Shipping" button
- System auto-calculate menggunakan RajaOngkir API
- Jastiper bisa accept suggestion atau tetap input manual

**Integration Points (Optional)**:

1. **During Jastiper Validation**
   ```typescript
   // When jastiper validates order with goods
   const address = await db.address.findUnique({ where: { id: order.addressId }})
   const totalWeight = calculateTotalWeight(order.items) // sum of weightGram
   
   // Auto-calculate shipping options
   const shippingOptions = await calculateShippingCost(
     jastiper.originDistrictId,  // from jastiper profile
     address.districtId,          // from participant address
     totalWeight,
     'jne:tiki:pos'              // multiple couriers
   )
   
   // Suggest cheapest option
   const bestOption = getBestShippingOption(shippingOptions)
   
   // Jastiper can select or override manually
   ```

2. **API Endpoint for Shipping Calculation**
   ```typescript
   // POST /api/orders/:orderId/calculate-shipping
   export async function calculateOrderShipping(req, res) {
     const { orderId } = req.params
     const { courier } = req.body  // optional, defaults to 'jne:tiki:pos'
     
     const order = await db.order.findUnique({
       where: { id: orderId },
       include: { items: { include: { product: true }}, address: true }
     })
     
     // Calculate total weight from products
     const totalWeight = order.items.reduce((sum, item) => {
       return sum + ((item.product.weightGram || 1000) * item.quantity)
     }, 0)
     
     // Get shipping options
     const options = await calculateShippingCost(
       req.user.originDistrictId,
       order.address.districtId,
       totalWeight,
       courier
     )
     
     return res.json({ options, recommendedOption: getBestShippingOption(options) })
   }
   ```

3. **Address Selection During Checkout (Wilayah.id API)**
   ```typescript
   // Frontend: Cascading dropdowns using wilayah.id
   
   // Step 1: Select province
   const provinces = await fetch('https://wilayah.id/api/provinces.json')
   // [{ code: "31", name: "DKI JAKARTA" }, ...]
   
   // Step 2: Select city/regency based on province
   const cities = await fetch(`https://wilayah.id/api/regencies/${provinceId}.json`)
   // [{ code: "3171", name: "KOTA JAKARTA SELATAN" }, ...]
   
   // Step 3: Select district/kecamatan based on city
   const districts = await fetch(`https://wilayah.id/api/districts/${cityId}.json`)
   // [{ code: "317101", name: "KEBAYORAN BARU" }, ...]
   
   // Step 4 (Optional): Select village/kelurahan based on district
   const villages = await fetch(`https://wilayah.id/api/villages/${districtId}.json`)
   // [{ code: "3171011001", name: "MELAWAI" }, ...]
   
   // Save complete structured address
   await db.address.create({
     data: {
       participantId,
       recipientName,
       phone,
       addressText: manualInput,  // Street address, house number, etc
       provinceId: province.code,
       provinceName: province.name,
       cityId: city.code,
       cityName: city.name,
       districtId: district.code,
       districtName: district.name,
       villageId: village?.code,
       villageName: village?.name,
       postalCode: userInput,
       rajaOngkirDistrictId: null  // optional, for auto-calculate shipping
     }
   })
   ```

**Required Address Schema (Wilayah.id)**:
```prisma
// Address table uses wilayah.id structure
model Address {
  // ... existing fields
  provinceId   String  // Required from wilayah.id
  provinceName String
  cityId       String  // Required from wilayah.id
  cityName     String
  districtId   String  // Required from wilayah.id
  districtName String
  villageId    String? // Optional
  villageName  String? // Optional
  
  rajaOngkirDistrictId String? // Optional, only for shipping auto-calculate
}
```

**Optional User Schema (for jastiper)**:
```prisma
// Add to User model (OPTIONAL - for jastiper who want auto-calculate)
model User {
  // ... existing fields
  originDistrictId  String?  // Jastiper's origin district (nullable, only for auto-calculate)
}
```

**Note**: 
- **Wilayah.id fields are required** for proper address structure
- **RajaOngkir fields are optional** for shipping auto-calculate

---

### **Phase 3: API Endpoints (Week 2-3)**

```
# Location APIs (wilayah.id proxy or direct)
GET    /api/locations/provinces
  → Returns provinces list

GET    /api/locations/regencies/:provinceId
  → Returns cities/regencies list

GET    /api/locations/districts/:cityId
  → Returns districts/kecamatan list

GET    /api/locations/villages/:districtId
  → Returns villages/kelurahan list (optional)

# Checkout
POST   /api/checkout/dp
  Body: { 
    tripId, 
    participantPhone, 
    participantName, 
    address: {
      recipientName,
      phone,
      addressText,
      provinceId,
      provinceName,
      cityId,
      cityName,
      districtId,
      districtName,
      villageId?,
      villageName?,
      postalCode?
    }?, 
    items[] 
  }
  → Creates order, returns orderId + paymentLink

POST   /api/orders/:id/calculate-shipping (OPTIONAL)
  Body: { origin?, destination?, weight, courier? }
  Auth: Jastiper only
  → Returns shipping cost options from RajaOngkir
  → Only called if jastiper clicks "Calculate" button

POST   /api/orders/:id/validate
  Body: { action: 'accept'|'reject', shippingFee?, serviceFee?, rejectionReason? }
  Auth: Jastiper only
  → Updates order status, sends final invoice

GET    /api/orders/:id/breakdown
  → Returns price breakdown JSON

POST   /api/webhooks/payment/dp
  → Payment gateway callback for DP

POST   /api/webhooks/payment/final
  → Payment gateway callback for final payment
```

---

### **Phase 4: Workers (Week 3)**

```javascript
// BullMQ workers

1. DP Payment Listener
   - On webhook: update status dp_paid → awaiting_validation
   - Lock stock
   - Notify jastiper

2. Final Payment Listener
   - On webhook: update status → confirmed
   - Release stock lock (no restore)
   - Notify penitip

3. Auto-Refund Worker (cron: every 1 hour)
   - Find orders awaiting_validation > 24h
   - Auto-reject + refund DP

4. Expired DP Worker (cron: every 5 min)
   - Cancel pending_dp > 30min
   - Release stock

5. Stock Lock Cleanup (cron: every 10 min)
   - Remove expired Redis locks
```

---

### **Phase 5: Frontend (Week 4)**

#### 1. Checkout Form (Simplified)
```tsx
// Basic fields:
- Name, Phone, Quantity
- Notes (optional)

// Address fields (conditional: only if product.type = 'goods'):
- Recipient Name
- Phone Number
- Province (dropdown from wilayah.id)
- City/Regency (dropdown based on province)
- District/Kecamatan (dropdown based on city)
- Village/Kelurahan (dropdown, optional)
- Street Address (text input: detailed address)
- Postal Code (text input)

- Button: "Bayar DP"
```

**Address Selection Component**:
```tsx
// Cascading dropdowns using wilayah.id API
<AddressForm>
  <Select name="province" 
    options={fetch('https://wilayah.id/api/provinces.json')} />
  
  <Select name="city" 
    options={fetch(`https://wilayah.id/api/regencies/${provinceId}.json`)} 
    disabled={!provinceId} />
  
  <Select name="district" 
    options={fetch(`https://wilayah.id/api/districts/${cityId}.json`)} 
    disabled={!cityId} />
  
  <Select name="village" 
    options={fetch(`https://wilayah.id/api/villages/${districtId}.json`)} 
    disabled={!districtId} 
    optional />
  
  <Textarea name="addressText" 
    placeholder="Jl. Contoh No. 123, RT/RW, Patokan..." />
  
  <Input name="postalCode" 
    placeholder="12345" />
</AddressForm>
```

#### 2. Jastiper Validation Dashboard
```tsx
// List: Orders awaiting validation
// Form: 
//   - Shipping fee (manual input OR auto-calculate with RajaOngkir)
//   - Button: "Calculate Shipping" → calls RajaOngkir API
//   - Shows courier options (JNE, TIKI, POS) with costs
//   - Service fee (optional)
// Preview: Price breakdown
// Actions: Accept / Reject
```

**Shipping Fee Input (Flexible)**:
- **Primary**: Manual input field (Rp 0 - 999,999)
- **Secondary (Optional)**: "Calculate with RajaOngkir" button
  - Only show if jastiper setup originDistrictId
  - Display courier options (JNE, TIKI, POS)
  - Jastiper can select from suggestions OR ignore and input manual

#### 3. Order Status Tracker
```tsx
// Timeline component showing:
- DP Paid ✓
- Awaiting Validation (current)
- Final Payment
- Shipped
- Completed
```

---

## 💰 Price Calculation Formula

```javascript
subtotal = sum(price * qty)

// Shipping fee (for goods only)
// Option 1: Jastiper manual input (default)
// Option 2: Auto-calculate dengan RajaOngkir (optional helper)
shippingFee = (hasGoods) ? jastiper_input_or_rajaongkir_suggestion : 0

jastipherMarkup = 
  if (markupType='percent'): subtotal * (value/100)
  if (markupType='flat'): value

platformCommission = (subtotal + markup) * 0.05

totalFinal = subtotal + shippingFee + markup + commission

dpAmount = totalFinal * 0.20  // 20%, min 10k

remainingAmount = totalFinal - dpAmount
```

**Note**: RajaOngkir integration sudah ready di `rajaongkir.service.ts`:
- `searchDestinations(search)` - search cities/districts
- `calculateShippingCost(origin, destination, weight, courier)` - get shipping cost
- `getBestShippingOption(options)` - pilih opsi termurah

---

## 📬 Notification Flow

**After DP:**
- → Penitip: "DP received, jastiper will confirm in 24h"
- → Jastiper: "Order #X paid DP, please validate"

**After Validation (Accept):**
- → Penitip: "Order confirmed. Pay remaining: Rp{remaining}"

**After Validation (Reject):**
- → Penitip: "Order rejected. DP refunded"

**After Final Payment:**
- → Penitip: "Payment received, order processing"
- → Jastiper: "Final payment received for order #X"

---

## ✅ Testing Checklist

### Unit Tests
- [ ] Price calculator (all scenarios)
- [ ] Stock lock (reserve/release/expire)
- [ ] DP amount calculation
- [ ] Validation logic (accept/reject)

### Integration Tests
- [ ] Complete DP flow (happy path)
- [ ] Auto-refund after 24h
- [ ] Expired DP cancellation
- [ ] Stock restoration on cancel

### E2E Tests
- [ ] Checkout with goods (address required)
- [ ] Checkout with tasks (no address)
- [ ] Mixed cart (goods + tasks)
- [ ] Jastiper reject order
- [ ] Concurrent orders (stock race)

---

## 🚨 Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Data migration fails | Test on staging, backup production |
| Stock overselling | Redis locks + DB transactions |
| Payment webhook missed | Retry mechanism + manual reconciliation |
| Worker crashes | BullMQ retry + monitoring alerts |
| Price calculation bugs | Comprehensive unit tests |

---

## 🚀 Rollout Plan

**Week 5**: Staging deployment + internal testing  
**Week 6**: Beta with 5-10 jastiper  
**Week 7**: Gradual rollout (25% → 50% → 100%)  
**Week 8**: Legacy migration + monitoring

---

## 📝 Files to Create/Modify

### New Files
```
backend/src/services/price-calculator.service.ts
backend/src/services/stock-lock.service.ts
backend/src/services/checkout-dp.service.ts
backend/src/services/validation.service.ts
backend/src/services/wilayah.service.ts (proxy to wilayah.id API)
backend/src/routes/checkout.ts
backend/src/routes/locations.ts (wilayah.id endpoints)
backend/src/workers/dp-payment-listener.ts
backend/src/workers/auto-refund-worker.ts
backend/src/workers/expired-dp-worker.ts
backend/src/workers/stock-lock-worker.ts
```

### Modified Files
```
backend/prisma/schema.prisma (major update - Address with wilayah.id structure)
backend/src/routes/orders.ts (add validation & shipping endpoints)
backend/src/services/checkout.service.ts (refactor or deprecate)
backend/src/services/rajaongkir.service.ts (optional integration with DP flow)
frontend/components/checkout/CheckoutForm.tsx (add structured address form)
frontend/components/checkout/AddressSelector.tsx (wilayah.id cascading dropdowns)
frontend/app/dashboard/orders/page.tsx (shipping calculator for jastiper)
```

---

**Ready for implementation approval** ✓
