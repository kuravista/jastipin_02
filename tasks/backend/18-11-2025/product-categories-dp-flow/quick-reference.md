# DP Checkout API Quick Reference

## API Endpoints Summary

### 1. Checkout DP (Create Order)
```http
POST /api/checkout/dp
Content-Type: application/json

{
  "tripId": "clx123abc",
  "participantPhone": "+628123456789",
  "participantName": "John Doe",
  "items": [
    { "productId": "clx456def", "quantity": 2, "note": "Size L" }
  ],
  "address": {  // Required ONLY if cart has type='goods'
    "recipientName": "Jane Doe",
    "phone": "+628987654321",
    "provinceId": "31",
    "provinceName": "DKI JAKARTA",
    "cityId": "3171",
    "cityName": "KOTA JAKARTA SELATAN",
    "districtId": "317101",
    "districtName": "KEBAYORAN BARU",
    "addressText": "Jl. Kemang Raya No. 45",
    "postalCode": "12130"
  }
}
```

**Response:**
```json
{
  "orderId": "clx999xyz",
  "dpAmount": 50000,
  "paymentLink": "https://payment.gateway.com/invoice/xxx",
  "expiresAt": "2025-11-20T10:30:00Z"
}
```

---

### 2. Jastiper Validate Order
```http
POST /api/orders/:orderId/validate
Authorization: Bearer {jastiper_token}
Content-Type: application/json

// Accept
{
  "action": "accept",
  "shippingFee": 25000,
  "serviceFee": 0
}

// Reject
{
  "action": "reject",
  "rejectionReason": "Product out of stock"
}
```

---

### 3. Calculate Shipping (Optional)
```http
POST /api/orders/:orderId/calculate-shipping
Authorization: Bearer {jastiper_token}
Content-Type: application/json

{
  "courier": "jne:tiki:pos"
}
```

**Response:**
```json
{
  "shippingOptions": [
    { "courier": "JNE", "service": "REG", "cost": 15000, "etd": "2-3 days" },
    { "courier": "TIKI", "service": "REG", "cost": 18000, "etd": "3-5 days" }
  ],
  "recommendedOption": { "courier": "JNE", "service": "REG", "cost": 15000 }
}
```

---

### 4. Location APIs (Wilayah.id)
```http
GET /api/locations/provinces
GET /api/locations/regencies/:provinceId
GET /api/locations/districts/:cityId
GET /api/locations/villages/:districtId  // Optional
```

---

## Price Calculation Formulas

### DP Amount (At Checkout)
```typescript
subtotal = sum(price * quantity)
dpAmount = max(subtotal * 0.20, 10000)  // 20%, min Rp 10k
```

### Final Amount (After Validation)
```typescript
subtotal = sum(itemSubtotal)
jastipherMarkup = calculateMarkup(products)
platformCommission = (subtotal + markup) * 0.05
shippingFee = jastiper_input  // Manual or RajaOngkir
serviceFee = jastiper_input || 0

finalAmount = subtotal + markup + platformCommission + shippingFee + serviceFee
remainingAmount = finalAmount - dpAmount
```

---

## Address Requirement Logic

| Cart Contents | Address Required? | Shipping Fee? |
|---------------|-------------------|---------------|
| Goods only | ✅ Yes | ✅ Yes |
| Tasks only | ❌ No | ❌ No |
| Goods + Tasks | ✅ Yes | ✅ Yes |

**Validation:**
```typescript
const hasGoods = items.some(i => i.productType === 'goods')
if (hasGoods && !request.address) {
  throw new Error('Address required for physical goods')
}
```

---

## Database Schema Key Fields

### Address
```sql
provinceId, provinceName       -- Required (wilayah.id)
cityId, cityName               -- Required (wilayah.id)
districtId, districtName       -- Required (wilayah.id)
villageId, villageName         -- Optional
rajaOngkirDistrictId           -- Optional (for auto-shipping)
addressText                    -- Street address
```

### Order
```sql
addressId                      -- FK to Address (nullable)
dpAmount, dpPaidAt             -- DP tracking
finalAmount, finalPaidAt       -- Final payment tracking
shippingFee, serviceFee        -- Fee components
platformCommission             -- 5% of subtotal+markup
validatedAt, validatedBy       -- Audit trail
finalBreakdown                 -- JSON with full pricing
```

### OrderItem
```sql
productType                    -- 'goods' | 'tasks'
priceAtOrder                   -- Price snapshot
itemSubtotal                   -- price * quantity
```

---

## Stock Lock Flow (Redis)

1. **Checkout DP**: Lock 30 min
2. **DP Paid**: Extend to 24 hours
3. **Validated (Accept)**: Deduct stock, release lock
4. **Validated (Reject)**: Restore stock, release lock
5. **Timeout**: Auto-release + restore

**Redis Key:** `stock_lock:{productId}:{orderId}`

---

## Order Status Flow

```
pending_dp → dp_paid → awaiting_validation
                            ↓
                        validated → confirmed → shipped → completed
                            ↓
                        rejected → refunded
```

---

## Integration Points

### Wilayah.id (Required)
- Base URL: `https://wilayah.id/api/`
- Cache: 24 hours (data rarely changes)
- Usage: Address cascading dropdowns

### RajaOngkir (Optional)
- Service: `/backend/src/services/rajaongkir.service.ts`
- Usage: Auto-calculate shipping (jastiper can override)
- Requires: `User.originDistrictId` + `Address.districtId`

### Payment Gateway
- Webhooks: `/api/webhooks/payment/dp` and `/api/webhooks/payment/final`
- Verify signatures before processing
- Idempotency: Check `dpPaymentId` / `finalPaymentId` before updating

---

## Error Codes

| Code | Reason |
|------|--------|
| `VALIDATION_ERROR` | Invalid input fields |
| `INSUFFICIENT_STOCK` | Product stock too low |
| `TRIP_NOT_FOUND` | Trip doesn't exist or inactive |
| `PRODUCT_NOT_FOUND` | Product doesn't belong to trip |
| `UNAUTHORIZED` | Not authorized for this action |
| `ORDER_NOT_FOUND` | Order doesn't exist |
| `INVALID_STATUS` | Order status doesn't allow action |
| `ORIGIN_NOT_SET` | Jastiper origin address missing |

---

## Security Checklist

- [ ] Verify jastiper owns trip before validation
- [ ] Verify participant owns order before viewing
- [ ] Validate webhook signatures
- [ ] Rate limit checkout endpoint (5 req/min)
- [ ] Sanitize text inputs (XSS prevention)
- [ ] Validate numeric ranges (no negative values)
- [ ] Use HTTPS for all payment operations
- [ ] Mask phone numbers in logs

---

## Performance Targets

- Checkout DP: <200ms
- Validate Order: <150ms
- Calculate Shipping: <500ms (external API)
- Stock Lock: <50ms (Redis)

---

## Testing Priority

1. ✅ Happy path: Checkout → DP → Validate → Final payment
2. ✅ Stock lock race condition (concurrent checkouts)
3. ✅ Auto-refund after 24h timeout
4. ✅ Mixed cart (goods + tasks)
5. ✅ Address validation (required for goods)
6. ⚠️ Payment webhook retry mechanism
7. ⚠️ Expired DP cancellation

---

## Implementation Order

1. **Phase 1**: Checkout DP + Payment webhook
2. **Phase 2**: Validation endpoint + Auto-refund worker
3. **Phase 3**: Location APIs + Shipping calculator (optional)
4. **Phase 4**: Workers (expired DP, stock cleanup)
