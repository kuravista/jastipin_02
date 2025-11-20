# Dual Checkout Routing - Visual Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Profile Page Component                   │
│                  /app/[username]/page.tsx                   │
└────────────────────────────┬────────────────────────────────┘
                             │
                    User adds products to cart
                             │
                             ▼
                   ┌─────────────────────┐
                   │ Shopping Cart State │
                   │  cartItems: Array   │
                   └──────────┬──────────┘
                              │
                  User clicks "Checkout Sekarang"
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   handleCheckout() Function                 │
│                                                             │
│  1. Validate Trip ID                                        │
│  2. Validate Cart (not empty)                               │
│  3. Check trip.paymentType                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴────────────────┐
         │                                │
         ▼                                ▼
┌──────────────────────┐        ┌──────────────────────┐
│ paymentType === 'dp' │        │ paymentType === 'full'│
│        OR            │        │         OR            │
│ paymentType === null │        │  (undefined/legacy)   │
└──────────┬───────────┘        └──────────┬───────────┘
           │                               │
           │                               │
           ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│   NEW DP CHECKOUT FLOW  │    │  OLD FULL PAYMENT FLOW  │
│                         │    │                         │
│  router.push()          │    │  setShowCheckoutForm()  │
│  Navigate to:           │    │  Open inline dialog     │
│  /checkout/dp/[tripId]  │    │  on same page           │
│  ?items=prod1:2,prod2:1 │    │                         │
└───────────┬─────────────┘    └───────────┬─────────────┘
            │                              │
            ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│ DP Checkout Page Component   │ │  Checkout Dialog (Inline) │
│ /checkout/dp/[tripId]/page   │ │                            │
│                              │ │  - Name, Email, Phone      │
│  - Parse tripId from URL     │ │  - Address Search          │
│  - Parse items from query    │ │  - Shipping Options        │
│  - Fetch trip details        │ │  - Shipping Cost Calc      │
│  - Validate paymentType='dp' │ │  - Order Summary           │
│  - Fetch products by IDs     │ │                            │
│  - Display DPCheckoutForm    │ │  Submit → Backend API      │
│                              │ │  POST /trips/{id}/checkout │
│  Components:                 │ │                            │
│  - Participant Info Form     │ │  Result: Order Created     │
│  - DP Percentage Selector    │ └────────────────────────────┘
│  - Address Form (if goods)   │
│  - Price Calculator          │
│  - Payment Button            │
│                              │
│  Submit → Backend API        │
│  POST /trips/{id}/checkout-dp│
│                              │
│  Result: DP Order Created    │
└──────────────────────────────┘
```

---

## State Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                  INITIAL STATE                      │
│                                                     │
│  - User on profile page                            │
│  - Cart: []                                         │
│  - showCheckoutForm: false                          │
└────────────────────┬────────────────────────────────┘
                     │
        User clicks "Add to Cart" (Plus icon)
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│               CART POPULATED STATE                  │
│                                                     │
│  - Cart: [{product: {...}, quantity: 2}, ...]      │
│  - showCart: true (cart sidebar visible)            │
└────────────────────┬────────────────────────────────┘
                     │
        User clicks "Checkout Sekarang"
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              ROUTING DECISION POINT                 │
│                                                     │
│  handleCheckout() evaluates:                        │
│  - trip?.paymentType                                │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    DP BRANCH              FULL PAYMENT BRANCH
         │                       │
         │                       ▼
         │          ┌────────────────────────┐
         │          │ Dialog State Updated   │
         │          │ showCheckoutForm: true │
         │          │ Form resets            │
         │          └────────┬───────────────┘
         │                   │
         │                   ▼
         │          ┌────────────────────────┐
         │          │   DIALOG VISIBLE       │
         │          │   User fills form      │
         │          │   Selects shipping     │
         │          └────────┬───────────────┘
         │                   │
         │                   ▼
         │          ┌────────────────────────┐
         │          │   Form Submission      │
         │          │   API: POST /checkout  │
         │          └────────┬───────────────┘
         │                   │
         │                   ▼
         │          ┌────────────────────────┐
         │          │  Success → Reset State │
         │          │  - Cart: []            │
         │          │  - showCheckoutForm: false
         │          │  - showCart: false     │
         │          └────────────────────────┘
         │
         ▼
┌────────────────────────┐
│  Navigation Triggered  │
│  URL changes to:       │
│  /checkout/dp/[tripId] │
│  Cart state preserved  │
│  in URL query params   │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  NEW PAGE LOAD         │
│  DPCheckoutPage()      │
│  - Fetch trip          │
│  - Fetch products      │
│  - Render DP form      │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  User completes DP form│
│  - Participant info    │
│  - DP percentage       │
│  - Address (if needed) │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  DP Form Submission    │
│  API: POST /checkout-dp│
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  Success → Payment     │
│  Redirect to gateway   │
│  or confirmation page  │
└────────────────────────┘
```

---

## URL Structure Comparison

### Full Payment Flow (OLD)
```
URL: https://example.com/tina
                         └─ username

State: All in React state
├─ cartItems: Array<{product, quantity}>
├─ showCheckoutForm: boolean
└─ checkoutForm: {nama, email, nomor, alamat, ...}

Navigation: None (stays on same page)
```

### DP Payment Flow (NEW)
```
URL: https://example.com/checkout/dp/trip123?items=prod1:2,prod2:1
                         └──────┬───────┘ └─┬┘ └───────┬──────────┘
                                │          │          │
                            Route path   Trip ID   Cart items
                                                   (serialized)

State: Mix of URL and React state
URL carries:
├─ tripId (path param)
└─ items (query param) → "prodId:qty,prodId:qty,..."

React state manages:
├─ trip: Trip object (fetched)
├─ products: Product[] (fetched)
├─ cartItems: parsed from URL
└─ form: {participantName, phone, address, ...}

Navigation: router.push() - client-side navigation
```

---

## Data Flow: Cart Items Serialization

### From Cart State to URL (Profile Page → DP Page)

```typescript
// INPUT: React state
cartItems = [
  { product: { id: "prod-abc", title: "Item 1", ... }, quantity: 2 },
  { product: { id: "prod-xyz", title: "Item 2", ... }, quantity: 1 },
  { product: { id: "prod-123", title: "Item 3", ... }, quantity: 5 }
]

// TRANSFORMATION: handleCheckout()
const items = cartItems
  .map(item => `${item.product.id}:${item.quantity}`)
  .join(',')
// items = "prod-abc:2,prod-xyz:1,prod-123:5"

// OUTPUT: URL query string
router.push(`/checkout/dp/${tripId}?items=${items}`)
// URL: /checkout/dp/trip123?items=prod-abc:2,prod-xyz:1,prod-123:5
```

### From URL to Cart State (DP Page Load)

```typescript
// INPUT: URL query string
const itemsParam = searchParams.get("items")
// itemsParam = "prod-abc:2,prod-xyz:1,prod-123:5"

// TRANSFORMATION: fetchTripAndProducts()
const items = itemsParam.split(",").map(item => {
  const [productId, quantity] = item.split(":")
  return { 
    productId, 
    quantity: parseInt(quantity) || 1 
  }
})
// items = [
//   { productId: "prod-abc", quantity: 2 },
//   { productId: "prod-xyz", quantity: 1 },
//   { productId: "prod-123", quantity: 5 }
// ]

// Fetch full product details from backend
const productIds = items.map(i => i.productId)
const products = await apiGet(`/trips/${tripId}/products`, {
  params: { ids: productIds.join(",") }
})

// OUTPUT: Hydrated cart items
cartItems = items
products = [/* full product objects from API */]
```

---

## Component Interaction Diagram

```
┌───────────────────────────────────────────────────────────┐
│                     ProfilePage                           │
│                 ([username]/page.tsx)                     │
│                                                           │
│  State:                                                   │
│  ├─ profile: ProfileData                                 │
│  ├─ currentTripIndex: number                             │
│  ├─ cartItems: Array                                     │
│  └─ showCheckoutForm: boolean                            │
│                                                           │
│  Functions:                                               │
│  ├─ addToCart(product)                                   │
│  ├─ removeFromCart(productId)                            │
│  ├─ updateQuantity(productId, qty)                       │
│  └─ handleCheckout() ← NEW FUNCTION                      │
│                                                           │
│  Renders:                                                 │
│  ├─ Trip carousel                                        │
│  ├─ Product catalog                                      │
│  ├─ Shopping cart sidebar                                │
│  └─ Checkout button                                      │
│       └─ onClick={handleCheckout}                        │
└─────────────────────┬─────────────────────────────────────┘
                      │
                      │ If paymentType='dp'
                      │ router.push()
                      ▼
┌───────────────────────────────────────────────────────────┐
│                   DPCheckoutPage                          │
│           (checkout/dp/[tripId]/page.tsx)                 │
│                                                           │
│  State:                                                   │
│  ├─ trip: Trip | null                                    │
│  ├─ products: Product[]                                  │
│  ├─ cartItems: Array<{productId, quantity}>             │
│  ├─ loading: boolean                                     │
│  └─ error: string                                        │
│                                                           │
│  Functions:                                               │
│  └─ fetchTripAndProducts()                               │
│      ├─ Fetch trip by ID                                │
│      ├─ Validate paymentType='dp'                        │
│      ├─ Parse items from URL                            │
│      └─ Fetch products by IDs                           │
│                                                           │
│  Renders:                                                 │
│  └─ DPCheckoutForm component                            │
└─────────────────────┬─────────────────────────────────────┘
                      │
                      │ Props: tripId, products, items
                      ▼
┌───────────────────────────────────────────────────────────┐
│                  DPCheckoutForm                           │
│           (components/checkout/DPCheckoutForm.tsx)        │
│                                                           │
│  State:                                                   │
│  ├─ participantName: string                              │
│  ├─ participantPhone: string                             │
│  ├─ notes: string                                        │
│  ├─ address: object                                      │
│  ├─ loading: boolean                                     │
│  └─ error: string                                        │
│                                                           │
│  Renders:                                                 │
│  ├─ Order summary (products + quantities)                │
│  ├─ Participant info form                                │
│  ├─ DP percentage selector                               │
│  ├─ AddressForm (if goods)                              │
│  └─ Submit button                                        │
└─────────────────────┬─────────────────────────────────────┘
                      │
                      │ If type='goods'
                      ▼
┌───────────────────────────────────────────────────────────┐
│                    AddressForm                            │
│           (components/checkout/AddressForm.tsx)           │
│                                                           │
│  Handles:                                                 │
│  ├─ Province selection                                   │
│  ├─ City selection                                       │
│  ├─ District selection                                   │
│  ├─ Address details                                      │
│  └─ Shipping cost calculation                            │
└───────────────────────────────────────────────────────────┘
```

---

## Decision Logic Flowchart

```
                        START
                          │
                          ▼
              ┌───────────────────────┐
              │ User clicks checkout  │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Get currentTrip       │
              │ from profile state    │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
         ┌────┤ tripId exists?        │
         │    └───────────┬───────────┘
         │ NO             │ YES
         │                ▼
         │    ┌───────────────────────┐
         │ ┌──┤ cart has items?       │
         │ │  └───────────┬───────────┘
         │ │ NO           │ YES
         │ │              ▼
         │ │  ┌───────────────────────┐
         │ │  │ Check paymentType     │
         │ │  └───┬──────────┬────────┘
         │ │      │          │
         │ │      │ 'dp'     │ 'full'/'undefined'/null
         │ │      │          │
         │ │      ▼          ▼
         │ │  ┌─────────┐ ┌──────────────┐
         │ │  │ Serialize│ │ Set dialog   │
         │ │  │ cart to  │ │ state to true│
         │ │  │ URL      │ │              │
         │ │  └────┬────┘ └──────┬───────┘
         │ │       │             │
         │ │       ▼             ▼
         │ │  ┌─────────┐ ┌──────────────┐
         │ │  │ Navigate│ │ Open inline  │
         │ │  │ to DP   │ │ checkout     │
         │ │  │ page    │ │ dialog       │
         │ │  └────┬────┘ └──────┬───────┘
         │ │       │             │
         │ │       └──────┬──────┘
         │ │              │
         ▼ ▼              ▼
    ┌──────────┐     ┌────────┐
    │ Show     │     │  END   │
    │ Toast    │     └────────┘
    │ Error    │
    └────┬─────┘
         │
         ▼
    ┌────────┐
    │  END   │
    └────────┘
```

---

## Error Handling Paths

```
┌─────────────────────────────────────────────────────────────┐
│                   ERROR SCENARIOS                           │
└─────────────────────────────────────────────────────────────┘

1. Trip ID Missing
   handleCheckout() → Check tripId → null
   ├─ Action: toast.error("Trip tidak ditemukan")
   └─ Result: No navigation, stay on page

2. Cart Empty
   handleCheckout() → Check cartItems.length → 0
   ├─ Action: toast.error("Keranjang kosong")
   └─ Result: No navigation, stay on page

3. Invalid Payment Type (e.g., typo, unsupported value)
   handleCheckout() → Check paymentType → 'invalid'
   ├─ Action: Falls into else branch (default behavior)
   └─ Result: Opens full payment dialog (safe fallback)

4. DP Page: Trip Doesn't Support DP
   DPCheckoutPage → fetchTripAndProducts() → Check paymentType !== 'dp'
   ├─ Action: router.push(profile page)
   └─ Result: Redirect back to profile

5. DP Page: No Products in URL
   DPCheckoutPage → Parse URL → items empty
   ├─ Action: setError("No products selected")
   └─ Result: Error page with back button

6. DP Page: API Fetch Fails
   DPCheckoutPage → apiGet() throws error
   ├─ Action: catch block → setError(err.message)
   └─ Result: Error page with back button

7. DP Page: Invalid Product IDs
   DPCheckoutPage → Fetch products → Some IDs invalid
   ├─ Backend should return error or empty array
   └─ Result: Error handling in catch block
```

---

## Performance Considerations

```
┌────────────────────────────────────────────────────────────┐
│              PERFORMANCE CHARACTERISTICS                   │
└────────────────────────────────────────────────────────────┘

Full Payment Flow (OLD):
├─ Page Load: 0ms (no navigation)
├─ Dialog Render: ~50ms (React state update)
├─ Network Calls: 
│  ├─ Shipping location search (debounced)
│  └─ Shipping cost calculation (on-demand)
└─ Total Time to Interactive: ~50-100ms

DP Payment Flow (NEW):
├─ Navigation: ~10-50ms (client-side routing)
├─ Page Load: ~100-200ms (component mount)
├─ Network Calls:
│  ├─ Fetch trip details: ~200-500ms
│  └─ Fetch products: ~200-500ms (parallel)
├─ Render: ~50ms
└─ Total Time to Interactive: ~400-800ms

Optimization Opportunities:
├─ Prefetch DP page when paymentType='dp' (hover/focus)
├─ Cache trip data (already fetched on profile page)
├─ Parallel API calls (already implemented)
└─ Skeleton loaders during fetch (improve perceived performance)
```

---

## Security Model

```
┌────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                         │
└────────────────────────────────────────────────────────────┘

Frontend Validation:
├─ Trip ID existence check
├─ Cart empty check
├─ Payment type validation (redirect if mismatch)
└─ Product IDs passed to backend for validation

URL Parameter Security:
├─ Product IDs in URL are PUBLIC (no sensitive data)
├─ Quantities in URL are PUBLIC (just numbers)
├─ Backend MUST validate:
│  ├─ Trip ID belongs to user
│  ├─ Products belong to trip
│  ├─ Stock availability
│  └─ Price calculations (never trust frontend)

Backend Validation (Expected):
POST /trips/{tripId}/checkout-dp
├─ Verify trip exists and supports DP
├─ Verify all product IDs belong to this trip
├─ Recalculate prices (don't trust frontend totals)
├─ Check stock availability
├─ Validate participant data
└─ Create order with proper authorization

Authorization:
├─ No authentication required for browsing (public profiles)
├─ Email/phone used for order tracking
└─ Payment verification happens at gateway level
```

---

## Rollback Strategy Diagram

```
┌────────────────────────────────────────────────────────────┐
│                   ROLLBACK OPTIONS                         │
└────────────────────────────────────────────────────────────┘

Option 1: Feature Flag (Instant, No Deploy)
├─ Change: Line 408 in [username]/page.tsx
├─ Before: if (currentTrip?.paymentType === 'dp') {
├─ After:  if (false && currentTrip?.paymentType === 'dp') {
├─ Effect: All trips use OLD flow
├─ Time:   <1 minute
└─ Risk:   Very low

Option 2: Conditional Rollback (Selective)
├─ Add environment variable: ENABLE_DP_CHECKOUT=true/false
├─ Check in handleCheckout():
│  if (process.env.NEXT_PUBLIC_ENABLE_DP_CHECKOUT && ...)
├─ Effect: Toggle feature without code change
├─ Time:   Restart application (~1-2 minutes)
└─ Risk:   Low

Option 3: Git Revert (Full Rollback)
├─ Revert commit(s) for this feature
├─ Re-deploy frontend
├─ Effect: Complete removal of DP routing logic
├─ Time:   5-10 minutes (build + deploy)
└─ Risk:   Low (DP page remains, just not routed to)

Option 4: Database Rollback (Backend)
├─ UPDATE trips SET payment_type = 'full' WHERE payment_type = 'dp'
├─ Effect: All trips forced to full payment
├─ Time:   <1 minute
└─ Risk:   Very low (column is optional)
```
