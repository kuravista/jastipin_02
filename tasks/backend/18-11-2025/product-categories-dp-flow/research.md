# Research: Product Categories & DP Flow

**Task ID**: product-categories-dp-flow  
**Date**: 2025-11-18  
**Status**: Research Complete

---

## 📋 Requirements Summary

Dari `docs/plan/kategory_product_flow.md`:

### 1. Product Categories
- **Goods**: barang fisik, butuh alamat, ongkir, stock tracking
- **Tasks**: jasa/tugas, no address, no shipping, optional stock

### 2. DP Flow
```
Step 1: Minimal checkout → DP 20%
Step 2: DP paid → stock locked
Step 3: Jastiper validate → set final price
Step 4: Penitip pay remaining → done
```

### 3. Order Status (9 states)
```
pending_dp → dp_paid → awaiting_validation 
→ validated/rejected → awaiting_final_payment 
→ confirmed → shipped → completed
```

---

## 🔍 Current System Analysis

### Existing Schema
```prisma
Product: id, title, price, stock, image, status
  ❌ Missing: type, unit, weight, markup fields

Order: id, quantity, totalPrice, proofUrl, status
  ❌ Missing: DP fields, fees, breakdown, validation fields
  ❌ Status: only pending/confirmed/rejected

Participant: phone, name, address (single text)
  ❌ No normalized addresses table
```

### Current Checkout
- Single-step: fill everything → pay full amount
- No DP concept
- No jastiper validation step
- No stock locking during payment

---

## 📊 Gap Analysis

| Area | Current | Required | Action |
|------|---------|----------|--------|
| Products | Single type | goods/tasks | Add type enum + fields |
| Orders | Simple status | 9-state flow | Update status + add DP fields |
| Addresses | In Participant | Separate table | Create + migrate |
| Stock | No locking | Redis locks | Implement stock-lock service |
| Pricing | Single calc | DP + final | Create price-calculator |
| Validation | None | Jastiper step | Create validation service |

---

## 🗄️ Database Changes

### New Tables (3)
1. **addresses** - normalized addresses
2. **order_items** - multi-product support
3. **fees_config** - platform fee rules

### Updated Tables (2)
1. **products** - add 7 new fields (type, unit, weight, markup, etc)
2. **orders** - add 12 new fields (DP, fees, validation, breakdown)

### Migration Complexity: **HIGH**
- Need to migrate existing addresses
- Update status enum
- Ensure zero downtime

---

## 🔧 Service Layer Changes

### New Services (4)
1. `price-calculator.service.ts` - all pricing logic
2. `stock-lock.service.ts` - Redis-based stock reservation
3. `checkout-dp.service.ts` - DP checkout flow
4. `validation.service.ts` - jastiper validation

### Modified Services (1)
- `checkout.service.ts` - deprecate or refactor

---

## 📡 API Changes

### New Endpoints (4)
```
POST /api/checkout/dp - step 1
POST /api/orders/:id/validate - step 3
GET /api/orders/:id/breakdown - view price
POST /api/webhooks/payment/{dp|final} - payment callbacks
```

---

## ⚙️ Worker Tasks

### New Workers (5)
1. DP payment webhook listener
2. Final payment webhook listener
3. Auto-refund worker (cron: 1h)
4. Expired DP worker (cron: 5min)
5. Stock lock cleanup (cron: 10min)

---

## 💰 Pricing Formula

```javascript
subtotal = sum(price * qty)
shipping = (hasGoods) ? jastiper_set : 0
markup = (percent) ? subtotal*% : flat
commission = (subtotal + markup) * 5%
total = subtotal + shipping + markup + commission

DP = total * 20% (min 10k)
remaining = total - DP
```

---

## 🚨 Key Risks

1. **Stock race conditions** - multiple users ordering simultaneously
2. **Payment webhook reliability** - must handle retries
3. **Data migration** - existing orders/addresses
4. **Worker failures** - auto-refund must be idempotent
5. **Price calculation bugs** - server-side validation critical

---

## 🎯 Existing Patterns to Reuse

From codebase analysis:
- ✅ Auth: JWT from `auth.service.ts`
- ✅ Validation: patterns from `validators.ts`
- ✅ Database: Prisma client patterns
- ✅ Workers: BullMQ from `TSD_WORKER.md`
- ✅ WhatsApp: notification flow ready

---

## 📚 Technology Stack (No Changes)

- Backend: Express.js + Prisma + PostgreSQL
- Queue: BullMQ + Redis
- Storage: Cloudflare R2
- Messaging: WhatsApp Cloud API

---

## ✅ Key Findings

1. **Major database migration required** - plan carefully
2. **Multi-step state machine** - needs robust testing
3. **Stock locking critical** - use Redis for performance
4. **Price calculation complex** - centralize in one service
5. **Worker reliability important** - implement monitoring

---

## 🎓 Recommendations

1. Start with database migration (staging first)
2. Implement services with comprehensive unit tests
3. Use feature flags for gradual rollout
4. Monitor workers closely during beta
5. Clear documentation for frontend team

---

**Next Step**: Review `plan.md` for detailed implementation strategy
