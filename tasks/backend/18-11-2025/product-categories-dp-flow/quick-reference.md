# Quick Reference: DP Flow Implementation

## 🎯 What's Changing?

**Before**: Full payment upfront → jastiper validates  
**After**: 20% DP → jastiper sets final price → pay remaining

---

## 📦 New Product Types

| Type | Stock | Address | Shipping | Markup |
|------|-------|---------|----------|--------|
| **goods** | Required | Required | Yes | Yes |
| **tasks** | Optional | No | No | Yes |

---

## 🔄 Order Status Flow

```
pending_dp (waiting for DP)
  ↓
dp_paid (DP received, stock locked)
  ↓
awaiting_validation (jastiper needs to validate)
  ↓
validated OR rejected
  ↓ (if validated)
awaiting_final_payment (invoice sent)
  ↓
confirmed (fully paid)
  ↓
shipped → completed
```

---

## 🗄️ Database Schema Quick View

### New Tables
- `addresses` (normalized participant addresses)
- `order_items` (multiple products per order)
- `fees_config` (platform fee rules)

### Products: ADD
- `type`, `unit`, `weightGram`
- `requiresDetails`, `requiresProof`
- `markupType`, `markupValue`

### Orders: ADD
- `dpAmount`, `dpPaidAt`, `finalAmount`, `finalPaidAt`
- `shippingFee`, `serviceFee`, `platformCommission`
- `finalBreakdown` (JSON)
- `validatedAt`, `validatedBy`, `rejectionReason`

---

## 🔌 API Endpoints

```bash
# Step 1: Checkout with DP
POST /api/checkout/dp
→ Returns: orderId, dpAmount, paymentLink

# Step 2a: (OPTIONAL) Calculate shipping with RajaOngkir
POST /api/orders/:id/calculate-shipping
Body: { origin?, destination?, weight, courier? }
→ Returns: shipping options (JNE, TIKI, POS)
→ Jastiper can use suggestion or ignore

# Step 2b: Jastiper validates (shipping fee manual or from calculation)
POST /api/orders/:id/validate
Body: { action, shippingFee?, serviceFee? }
→ Returns: breakdown, finalPaymentLink

# View breakdown
GET /api/orders/:id/breakdown

# Payment webhooks
POST /api/webhooks/payment/dp
POST /api/webhooks/payment/final
```

---

## 💰 Price Formula

```
subtotal = sum(price * qty)

// Shipping (for goods): manual input OR optional RajaOngkir helper
shippingFee = (hasGoods) ? jastiper_manual_input : 0

markup = (type='percent') ? subtotal*(value/100) : value
commission = (subtotal + markup) * 5%

totalFinal = subtotal + shipping + markup + commission
dpAmount = totalFinal * 20% (min 10k)
remaining = totalFinal - dpAmount
```

**RajaOngkir**: Optional helper, jastiper bisa pilih manual input atau auto-calculate

---

## ⚙️ Workers (BullMQ)

1. **DP Payment Listener** - process DP webhooks
2. **Final Payment Listener** - process final payment webhooks
3. **Auto-Refund** (every 1h) - refund if not validated in 24h
4. **Expired DP** (every 5min) - cancel unpaid DP orders
5. **Stock Lock Cleanup** (every 10min) - clean Redis locks

---

## 📋 Implementation Order

**Week 1**: Database migration  
**Week 2**: Services + API endpoints  
**Week 3**: Workers + webhooks  
**Week 4**: Frontend UI  
**Week 5**: Testing + staging  
**Week 6**: Beta + gradual rollout

---

## 🧪 Critical Test Cases

- [ ] Goods order (address required)
- [ ] Tasks order (no address)
- [ ] Mixed cart (goods + tasks)
- [ ] Auto-refund after 24h
- [ ] Stock lock expiry
- [ ] Concurrent orders (race condition)
- [ ] Jastiper reject order

---

## 🚨 Red Flags to Watch

⚠️ **Stock overselling** - use Redis locks  
⚠️ **Payment webhook retry** - implement idempotency  
⚠️ **Auto-refund double process** - check status before refund  
⚠️ **Price calculation mismatch** - always calculate server-side  
⚠️ **Address missing for goods** - validate on checkout

---

## 📁 Key Files

```
services/
  price-calculator.service.ts    ← price logic
  stock-lock.service.ts          ← Redis stock management
  checkout-dp.service.ts         ← DP checkout
  validation.service.ts          ← jastiper validation

routes/
  checkout.ts                    ← new checkout endpoints
  orders.ts                      ← validation endpoint

workers/
  dp-payment-listener.ts
  auto-refund-worker.ts
  expired-dp-worker.ts
```

---

## ✅ Ready to Start?

1. Review plan: `docs/plan/IMPLEMENTATION_PLAN_DP_FLOW.md`
2. Get approval from stakeholders
3. Create sprint tickets
4. Begin Phase 1: Database migration

**Questions?** Refer to main implementation plan document.
