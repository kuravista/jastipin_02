# DP Checkout Flow - Frontend Design Specification

**Date:** 2025-11-20  
**Status:** Design Phase  
**Target:** Profile page checkout form simplification for DP payment flow

---

## 1. Overview

This specification outlines the frontend design for implementing a simplified Down Payment (DP) checkout flow on user profile pages (`/app/frontend/app/[username]/page.tsx`). The design separates concerns between initial DP payment and full payment completion, with conditional form fields based on product types.

---

## 2. Current State Analysis

### Existing Implementation
- **Location:** `/app/frontend/app/[username]/page.tsx`
- **Current Form Fields:**
  - Nama (Name)
  - Email
  - Nomor WhatsApp
  - Alamat Lengkap (Full Address)
  - Kota/Daerah (City/District with autocomplete)
  - Kurir Pengiriman (Shipping courier selection)

### Existing DP Flow
- **Location:** `/app/frontend/app/checkout/dp/[tripId]/page.tsx`
- **Component:** `DPCheckoutForm.tsx`
- **Key Features:**
  - Conditional address collection (only for `type: 'goods'`)
  - DP calculation: 20% of subtotal, minimum Rp 10,000
  - Product type differentiation: `'goods'` vs `'tasks'`

### Data Structures
```typescript
interface Product {
  id: string
  title: string
  price: number
  type: 'goods' | 'tasks'
  unit?: string          // e.g., "pcs", "kg", "box"
  stock?: number | null
  weightGram?: number    // For shipping calculation
  image?: string
}

interface Trip {
  id: string
  title: string
  paymentType: 'full' | 'dp'
  // ... other fields
}
```

---

## 3. Design Requirements

### 3.1 Simplified Checkout Form (Phase 1 - DP Stage)

#### Required Fields
1. **Nama** (Name) - Text input
   - Required for all orders
   - Validation: Min 2 characters, max 100 characters
   
2. **Nomor WhatsApp** (Phone) - Tel input with +62 prefix
   - Required for all orders
   - Format: +62 followed by 9-13 digits
   - Validation: Must match pattern `^628\d{9,13}$`
   - Display format: "+62" prefix with auto-formatting

3. **Cart Items** - Read-only display
   - Show product name, quantity, unit, price
   - Show product type badge (Barang/Jasa)
   - Allow quantity adjustment (+-) and item removal (X)

4. **Catatan** (Notes) - Textarea (optional)
   - Optional field for customer requests
   - Max 500 characters
   - Placeholder: "Catatan tambahan untuk jastiper..."

#### Fields NOT Required at DP Stage
- ❌ Email (collected later during validation)
- ❌ Full Address (collected later during validation)
- ❌ Shipping Courier (calculated later by jastiper)

#### Conditional Logic
- **If cart contains `type: 'goods'`:**
  - Show info notice: "⚠️ Alamat pengiriman akan diminta setelah DP dikonfirmasi"
  
- **If cart only contains `type: 'tasks'`:**
  - No address notice needed

---

### 3.2 Product List Redesign

#### Product Card Enhancements

**Type Badge Display:**
- **For Goods (`type: 'goods'`):**
  ```
  [📦 Barang]
  - Background: bg-orange-500
  - Icon: Package
  - Position: Top-right of product image
  ```

- **For Services (`type: 'tasks'`):**
  ```
  [👤 Jasa]
  - Background: bg-purple-500
  - Icon: UserCircle2
  - Position: Top-right of product image
  ```

**Additional Product Info:**
- **Weight Info** (for goods only):
  - Display if `weightGram` exists
  - Format: "Berat: 500g" or "Berat: 1.2kg"
  - Position: Below product title
  
- **Unit Info** (for all products):
  - Display unit in quantity selector
  - Example: "2 pcs", "1.5 kg", "3 box"

**Cart Item Display:**
```
┌─────────────────────────────────────┐
│ [📦 Barang] Nike Air Max            │
│ Rp 2,100,000                        │
│ Berat: 800g                         │
│ [-] 2 pcs [+]                 [X]   │
└─────────────────────────────────────┘
```

---

### 3.3 DP Calculation Display

#### Calculation Logic
```typescript
// Calculate subtotal
const subtotal = cartItems.reduce((sum, item) => {
  const product = products.find(p => p.id === item.productId)
  return sum + (product?.price || 0) * item.quantity
}, 0)

// Calculate DP (20%, minimum Rp 10,000)
const dpPercentage = 0.2
const calculatedDP = subtotal * dpPercentage
const dpAmount = Math.max(
  Math.ceil(calculatedDP / 1000) * 1000,  // Round up to nearest 1000
  10000
)

// Calculate remaining
const remainingAmount = subtotal - dpAmount
```

#### Breakdown Display Component
```
┌─────────────────────────────────────┐
│  💰 Ringkasan Pembayaran            │
├─────────────────────────────────────┤
│  Subtotal           Rp 5,000,000    │
│  DP (20%)           Rp 1,000,000    │
│  ─────────────────────────────────  │
│  Sisa Bayar         Rp 4,000,000    │
├─────────────────────────────────────┤
│  ℹ️  Sisa pembayaran akan           │
│     diinformasikan setelah          │
│     validasi jastiper               │
└─────────────────────────────────────┘
```

**Visual Hierarchy:**
1. **Subtotal** - Regular font, gray text
2. **DP Amount** - Bold, large font, primary color (blue-600)
3. **Remaining** - Medium font, gray text, border-top separator
4. **Info Notice** - Small font, info badge styling

---

### 3.4 Form Field Validation Rules

| Field | Required | Validation Rule | Error Message |
|-------|----------|----------------|---------------|
| Nama | ✅ Yes | `min: 2, max: 100` | "Nama minimal 2 karakter" |
| Nomor WhatsApp | ✅ Yes | `^628\d{9,13}$` | "Format: 628XXXXXXXXX" |
| Cart Items | ✅ Yes | `items.length > 0` | "Keranjang kosong" |
| Catatan | ❌ No | `max: 500` | "Maksimal 500 karakter" |

**Real-time Validation:**
- Name: Check on blur
- Phone: Check on blur, show format helper on focus
- Cart: Check before checkout button enabled
- Notes: Character counter display

---

## 4. Component Structure

### 4.1 Component Hierarchy
```
ProfilePage (/[username]/page.tsx)
├── ProductList
│   ├── ProductCard
│   │   ├── ProductTypeBadge        (NEW)
│   │   ├── ProductImage
│   │   ├── ProductInfo
│   │   │   ├── Title
│   │   │   ├── WeightInfo          (NEW - conditional)
│   │   │   └── UnitInfo            (NEW)
│   │   └── AddToCartButton
│   └── Pagination
├── FloatingCartButton
├── CartModal
│   ├── CartItemList
│   │   └── CartItemCard            (ENHANCED)
│   │       ├── ProductTypeBadge    (NEW)
│   │       ├── WeightInfo          (NEW)
│   │       └── QuantityControls
│   └── CheckoutButton
└── CheckoutFormModal               (SIMPLIFIED)
    ├── ParticipantInfo             (SIMPLIFIED)
    │   ├── NameInput
    │   ├── PhoneInput
    │   └── NotesTextarea
    ├── DPBreakdownCard             (NEW)
    │   ├── SubtotalRow
    │   ├── DPAmountRow
    │   ├── RemainingRow
    │   └── InfoNotice
    └── SubmitButton
```

### 4.2 New/Modified Components

#### `ProductTypeBadge.tsx`
```typescript
interface ProductTypeBadgeProps {
  type: 'goods' | 'tasks'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Visual badge showing product type
 * - Goods: Orange background with Package icon
 * - Tasks: Purple background with UserCircle2 icon
 */
```

#### `ProductCardWithType.tsx` (Enhanced)
```typescript
interface ProductCardWithTypeProps {
  product: Product
  onAddToCart: (product: Product) => void
}

/**
 * Enhanced product card with:
 * - Type badge (top-right overlay)
 * - Weight info (for goods only)
 * - Unit info in quantity selector
 */
```

#### `DPBreakdownCard.tsx` (New)
```typescript
interface DPBreakdownProps {
  subtotal: number
  dpAmount: number
  remainingAmount: number
  hasGoodsProducts: boolean  // Show shipping notice
}

/**
 * Displays payment breakdown:
 * - Subtotal
 * - DP (20%)
 * - Remaining amount
 * - Info notice about address/shipping
 */
```

#### `CheckoutFormDP.tsx` (Simplified - for profile page)
```typescript
interface CheckoutFormDPProps {
  cartItems: Array<{ product: Product; quantity: number }>
  tripId: string
  onSuccess: () => void
}

/**
 * Simplified checkout form for DP payment:
 * - Name + Phone only
 * - Notes (optional)
 * - DP breakdown display
 * - NO address/email at this stage
 */
```

---

## 5. UI/UX Flow

### User Journey: DP Checkout

```
Step 1: Browse Products
├─ View product list with type badges
├─ See weight info for goods
└─ Add items to cart

Step 2: Review Cart
├─ See cart modal with items
├─ Each item shows type badge
├─ Adjust quantities
└─ Click "Checkout"

Step 3: Fill DP Form
├─ Enter name
├─ Enter WhatsApp number
├─ (Optional) Add notes
├─ See DP breakdown (20%)
└─ See remaining amount

Step 4: Submit DP
├─ Validation checks
├─ If goods: Show "Address needed later" notice
├─ Submit to backend
└─ Redirect to payment page

Step 5: (Later) Jastiper Validation
├─ Jastiper validates items
├─ Customer provides full address
├─ Shipping calculated
└─ Pay remaining amount
```

### Routing Logic
```typescript
const handleCheckout = () => {
  const currentTrip = profile?.trips?.[currentTripIndex]
  
  if (!tripId || !cartItems.length) {
    toast.error("Keranjang kosong")
    return
  }

  if (currentTrip?.paymentType === 'dp') {
    // Route to DP checkout page (NEW)
    const items = cartItems
      .map(item => `${item.product.id}:${item.quantity}`)
      .join(',')
    router.push(`/checkout/dp/${tripId}?items=${items}`)
  } else {
    // Use full payment checkout (EXISTING)
    setShowCheckoutForm(true)
  }
}
```

---

## 6. Visual Design Mockups

### 6.1 Product Card with Type Badge

**Desktop View:**
```
┌───────────────────────────────┐
│                    [📦 Barang]│
│       PRODUCT IMAGE           │
│                               │
├───────────────────────────────┤
│ Nike Air Max                  │
│ Berat: 800g • Trip: US Fall   │
│ Rp 2,100,000                  │
│ [📦 15 pcs]          [+ Add]  │
└───────────────────────────────┘
```

**Mobile View:**
```
┌──────────────────┐
│       IMAGE      │
│   [📦 Barang]    │ ← Badge overlay
│                  │
├──────────────────┤
│ Nike Air Max     │
│ Rp 2.1jt         │
│ 800g • 15 pcs    │
│        [+]       │
└──────────────────┘
```

### 6.2 Simplified Checkout Form

```
┌─────────────────────────────────────────┐
│  Checkout - Trip NY Fall 2024           │
├─────────────────────────────────────────┤
│                                         │
│  📋 Informasi Pembeli                   │
│  ┌───────────────────────────────────┐ │
│  │ Nama Lengkap *                    │ │
│  │ [________________________]        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ No. WhatsApp *                    │ │
│  │ +62 [____________________]        │ │
│  │ Contoh: 812345678                 │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Catatan (opsional)                │ │
│  │ [_____________________________]   │ │
│  │ [_____________________________]   │ │
│  └───────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🛒 Pesanan Anda                        │
│  ┌───────────────────────────────────┐ │
│  │ [📦] Nike Air Max                 │ │
│  │ Rp 2,100,000 × 2 pcs              │ │
│  │ Berat: 800g                       │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ [👤] Jasa Penitipan               │ │
│  │ Rp 500,000 × 1 jasa               │ │
│  └───────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  💰 Ringkasan Pembayaran                │
│  ┌───────────────────────────────────┐ │
│  │ Subtotal         Rp 4,700,000     │ │
│  │ DP (20%)         Rp   940,000     │ │
│  │ ──────────────────────────────    │ │
│  │ Sisa Bayar       Rp 3,760,000     │ │
│  │                                   │ │
│  │ ℹ️  Alamat pengiriman akan        │ │
│  │    diminta setelah DP             │ │
│  │    dikonfirmasi jastiper          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [  Bayar DP Rp 940,000 Sekarang   ]   │
│                                         │
└─────────────────────────────────────────┘
```

### 6.3 Cart Modal Enhancement

```
┌─────────────────────────────────────┐
│  🛒 Keranjang (3)              [X]  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [📦 Barang]                 │   │
│  │ Nike Air Max                │   │
│  │ Rp 2,100,000                │   │
│  │ Berat: 800g                 │   │ ← NEW
│  │ [-] 2 pcs [+]          [X]  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [👤 Jasa]                   │   │ ← NEW
│  │ Jasa Penitipan              │   │
│  │ Rp 500,000                  │   │
│  │ [-] 1 jasa [+]         [X]  │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  Total: Rp 4,700,000                │
│  [    Checkout Sekarang    ]        │
└─────────────────────────────────────┘
```

---

## 7. Validation & Error Handling

### Validation Flow

```typescript
// Frontend Validation (before submit)
const validateCheckoutForm = () => {
  const errors: string[] = []
  
  // Name validation
  if (!participantName || participantName.trim().length < 2) {
    errors.push("Nama minimal 2 karakter")
  }
  
  // Phone validation
  if (!participantPhone || !/^628\d{9,13}$/.test(participantPhone)) {
    errors.push("Format nomor WhatsApp: 628XXXXXXXXX")
  }
  
  // Cart validation
  if (!cartItems.length) {
    errors.push("Keranjang kosong")
  }
  
  // Notes length
  if (notes && notes.length > 500) {
    errors.push("Catatan maksimal 500 karakter")
  }
  
  return errors
}
```

### Error States

| Error Type | Display Method | User Action |
|------------|----------------|-------------|
| Empty name | Red border + error text below field | Fill name field |
| Invalid phone | Red border + error text + format example | Correct phone format |
| Empty cart | Toast notification | Add items to cart |
| Notes too long | Character counter turns red | Reduce text length |
| Network error | Alert banner at top | Retry button |

### Success States

| Success Event | Visual Feedback | Next Step |
|---------------|-----------------|-----------|
| Item added to cart | Toast: "Ditambahkan ke keranjang" | Continue shopping or checkout |
| Cart updated | Smooth animation, updated total | - |
| DP form submitted | Loading spinner on button | Redirect to payment |

---

## 8. Responsive Design

### Breakpoints
- **Mobile:** `< 640px` (sm)
- **Tablet:** `640px - 1024px` (md)
- **Desktop:** `> 1024px` (lg)

### Mobile Optimizations

**Product Card:**
- Stack vertically
- Badge overlay on image (bottom-left)
- Smaller font sizes
- Touch-friendly buttons (min 44px height)

**Cart Modal:**
- Full-screen overlay on mobile
- Slide-up animation
- Sticky checkout button at bottom

**Checkout Form:**
- Single column layout
- Larger input fields (min 48px height)
- Phone keyboard for number input
- Auto-focus on first field

### Tablet/Desktop Enhancements
- 2-column product grid
- Side-by-side form layout
- Hover states on interactive elements
- Larger modal widths

---

## 9. Accessibility (a11y)

### ARIA Labels
```typescript
<button aria-label="Tambah Nike Air Max ke keranjang">
  <Plus />
</button>

<div role="alert" aria-live="polite">
  {errorMessage}
</div>

<input 
  id="participant-name"
  aria-required="true"
  aria-describedby="name-error"
/>
```

### Keyboard Navigation
- Tab order: Name → Phone → Notes → Submit
- Enter key submits form
- Escape closes modal
- Arrow keys for quantity adjustment

### Screen Reader Support
- Descriptive labels for all inputs
- Error messages announced
- Loading states announced
- Success/failure feedback announced

---

## 10. Performance Considerations

### Optimization Strategies

**Code Splitting:**
```typescript
// Lazy load checkout form
const CheckoutFormDP = dynamic(() => import('./CheckoutFormDP'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

**Memoization:**
```typescript
// Memoize expensive calculations
const dpAmount = useMemo(() => {
  const subtotal = calculateSubtotal(cartItems)
  return Math.max(Math.ceil(subtotal * 0.2 / 1000) * 1000, 10000)
}, [cartItems])
```

**Image Optimization:**
- Use Next.js `<Image>` component
- Lazy load product images
- WebP format with fallback
- Responsive image sizes

---

## 11. Integration Points

### API Endpoints Required

```typescript
// DP Checkout submission
POST /api/checkout/dp
Body: {
  tripId: string
  participantName: string
  participantPhone: string
  items: Array<{ productId: string; quantity: number }>
  notes?: string
}
Response: {
  success: boolean
  data: {
    orderId: string
    dpAmount: number
    paymentUrl: string
  }
}

// Get products with type info
GET /api/trips/{tripId}/products?ids=prod1,prod2
Response: {
  products: Product[]
}
```

### State Management

```typescript
// Cart state (local)
const [cartItems, setCartItems] = useState<CartItem[]>([])

// Form state
const [participantName, setParticipantName] = useState('')
const [participantPhone, setParticipantPhone] = useState('')
const [notes, setNotes] = useState('')

// UI state
const [showCart, setShowCart] = useState(false)
const [showCheckoutForm, setShowCheckoutForm] = useState(false)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

---

## 12. Testing Checklist

### Unit Tests
- [ ] DP calculation logic (20%, min 10k)
- [ ] Phone number validation regex
- [ ] Cart total calculation
- [ ] Product type badge rendering

### Integration Tests
- [ ] Add product to cart flow
- [ ] Update cart quantity
- [ ] Remove item from cart
- [ ] Submit DP checkout form
- [ ] Route to payment page

### E2E Tests
- [ ] Complete DP checkout journey
- [ ] Goods vs Tasks product flow
- [ ] Form validation errors
- [ ] Mobile responsive behavior

### Manual Test Cases

**Test Case 1: DP Checkout with Goods**
1. Add goods product to cart
2. Click checkout
3. Fill name + phone
4. See address notice
5. Submit DP
6. Verify redirect to payment

**Test Case 2: DP Checkout with Tasks**
1. Add tasks product to cart
2. Click checkout
3. Fill name + phone
4. No address notice shown
5. Submit DP
6. Verify redirect to payment

**Test Case 3: Mixed Cart**
1. Add goods + tasks to cart
2. See both type badges
3. Click checkout
4. See address notice (because goods exists)
5. Submit DP

---

## 13. Implementation Phases

### Phase 1: Component Creation (Days 1-2)
- [ ] Create `ProductTypeBadge` component
- [ ] Enhance `ProductCard` with type badge
- [ ] Create `DPBreakdownCard` component
- [ ] Create simplified `CheckoutFormDP` component

### Phase 2: Profile Page Integration (Day 3)
- [ ] Update profile page product list
- [ ] Update cart modal with type badges
- [ ] Add weight info display
- [ ] Implement routing logic (dp vs full)

### Phase 3: Form & Validation (Day 4)
- [ ] Implement simplified form fields
- [ ] Add phone number validation
- [ ] Add real-time error feedback
- [ ] Add DP calculation display

### Phase 4: Testing & Polish (Day 5)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Mobile responsive testing
- [ ] Accessibility audit
- [ ] Performance optimization

---

## 14. Success Metrics

### Key Performance Indicators (KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Checkout form completion rate | > 80% | Analytics events |
| Average time to DP checkout | < 2 minutes | User flow timing |
| Form validation error rate | < 15% | Error event tracking |
| Mobile vs Desktop conversion | Equal parity | Platform-split metrics |
| Page load time | < 2 seconds | Lighthouse/WebVitals |

---

## 15. Open Questions & Risks

### Questions for Product Team
1. Should we collect email at DP stage? (Current spec: NO)
2. Minimum cart value for DP checkout?
3. Maximum notes character limit (Current spec: 500)
4. Should phone number be editable during validation phase?

### Technical Risks
1. **Risk:** Form state loss on accidental modal close  
   **Mitigation:** Add "Confirm exit?" dialog if form is dirty

2. **Risk:** Race condition between cart updates and checkout  
   **Mitigation:** Disable checkout button during cart updates

3. **Risk:** Product type mismatch from backend  
   **Mitigation:** Default to 'goods' if type missing, log warning

---

## 16. References

### Related Documents
- `ORCHESTRATION_EXECUTION_PLAN.md` - Overall project context
- `/app/frontend/app/checkout/dp/[tripId]/page.tsx` - Existing DP checkout page
- `/app/frontend/components/checkout/DPCheckoutForm.tsx` - Existing DP form component

### External Resources
- shadcn/ui Components: https://ui.shadcn.com/
- React Hook Form: https://react-hook-form.com/
- Zod Validation: https://zod.dev/

---

## Appendix A: Component Props Reference

### ProductTypeBadge
```typescript
interface ProductTypeBadgeProps {
  type: 'goods' | 'tasks'
  size?: 'sm' | 'md' | 'lg'     // Default: 'md'
  className?: string
}
```

### DPBreakdownCard
```typescript
interface DPBreakdownProps {
  subtotal: number               // Total cart value
  dpAmount: number               // Calculated DP (20%, min 10k)
  remainingAmount: number        // subtotal - dpAmount
  hasGoodsProducts: boolean      // Show address notice?
  className?: string
}
```

### CheckoutFormDP
```typescript
interface CheckoutFormDPProps {
  cartItems: Array<{
    product: Product
    quantity: number
  }>
  tripId: string
  onSuccess: () => void          // Called after successful checkout
  onCancel?: () => void          // Called when user closes form
}
```

---

**End of Design Specification**
