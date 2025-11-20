# DP Checkout Flow - Visual Mockups

**Date:** 2025-11-20  
**Purpose:** Quick visual reference for UI components

---

## 1. Product Type Badges

### Goods Badge (📦 Barang)
```
┌──────────────┐
│ 📦 Barang    │ ← bg-orange-500, white text
└──────────────┘
```

### Services Badge (👤 Jasa)
```
┌──────────────┐
│ 👤 Jasa      │ ← bg-purple-500, white text
└──────────────┘
```

**Usage:**
- Position: Top-right overlay on product images
- Size: Small (mobile: 10px text, desktop: 12px text)
- Icons: lucide-react Package & UserCircle2

---

## 2. Enhanced Product Card (Desktop)

```
┌─────────────────────────────────────┐
│                      [📦 Barang] ←  │  Badge overlay
│                                     │
│        PRODUCT IMAGE                │  h-32
│        (Nike Air Max)               │
│                                     │
├─────────────────────────────────────┤
│ Nike Air Max                        │  Title (bold)
│ Berat: 800g • Trip: US Fall     ←  │  NEW: Weight info
│ Rp 2,100,000           [+ Add]      │  Price + Action
└─────────────────────────────────────┘
```

**Key Changes:**
- ✅ Type badge (top-right)
- ✅ Weight display (for goods only)
- ✅ Trip name with icon
- ⚠️  Keep existing: stock indicator, image, price

---

## 3. Enhanced Product Card (Mobile)

```
┌──────────────────┐
│   PRODUCT IMG    │
│                  │
│  [📦 Barang]  ←  │  Badge bottom-left
├──────────────────┤
│ Nike Air Max     │
│ 800g • 15 pcs    │  Weight + Stock
│ Rp 2.1jt    [+]  │  Price + Add
└──────────────────┘
```

**Mobile Specifics:**
- Smaller card height
- Compact font sizes
- Badge position: bottom-left overlay
- Touch-friendly buttons (min 44px)

---

## 4. Cart Modal - Enhanced

```
┌─────────────────────────────────────┐
│  🛒 Keranjang (3 items)        [X]  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [📦 Barang] ← NEW           │   │
│  │ Nike Air Max                │   │
│  │ Rp 2,100,000                │   │
│  │ Berat: 800g ← NEW           │   │
│  │ [-] 2 pcs [+]          [X]  │   │
│  │                             │   │
│  │ Subtotal: Rp 4,200,000      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [👤 Jasa] ← NEW             │   │
│  │ Jasa Penitipan              │   │
│  │ Rp 500,000                  │   │
│  │ [-] 1 jasa [+]         [X]  │   │
│  │                             │   │
│  │ Subtotal: Rp 500,000        │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  Total: Rp 4,700,000                │
│  [    Checkout Sekarang    ]        │
└─────────────────────────────────────┘
```

**Cart Item Structure:**
```typescript
<div className="space-y-3">
  {cartItems.map((item) => (
    <div key={item.product.id} className="bg-gray-50 rounded-lg p-3">
      {/* Type Badge */}
      <ProductTypeBadge type={item.product.type} />
      
      {/* Product Info */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex-1">
          <p className="font-semibold">{item.product.title}</p>
          <p className="text-sm text-gray-600">
            Rp {item.product.price.toLocaleString('id-ID')}
          </p>
          
          {/* NEW: Weight info (goods only) */}
          {item.product.type === 'goods' && item.product.weightGram && (
            <p className="text-xs text-gray-500">
              Berat: {formatWeight(item.product.weightGram)}
            </p>
          )}
        </div>
        
        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
            -
          </button>
          <span>{item.quantity} {item.product.unit || 'pcs'}</span>
          <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
            +
          </button>
          <button onClick={() => removeFromCart(item.product.id)}>
            <X />
          </button>
        </div>
      </div>
      
      {/* Item Subtotal */}
      <div className="text-right mt-2 text-sm font-medium">
        Subtotal: Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
      </div>
    </div>
  ))}
</div>
```

---

## 5. Simplified Checkout Form (DP Stage)

### Full Form Layout
```
┌─────────────────────────────────────────────┐
│  ← Kembali                                  │
│  Checkout - Trip: NY Fall 2024              │
├─────────────────────────────────────────────┤
│                                             │
│  📋 Informasi Pembeli                       │
│  ┌──────────────────────────────────────┐  │
│  │ Nama Lengkap *                       │  │
│  │ ┌──────────────────────────────────┐ │  │
│  │ │ John Doe                         │ │  │
│  │ └──────────────────────────────────┘ │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ No. WhatsApp *                       │  │
│  │ ┌───┬──────────────────────────────┐ │  │
│  │ │+62│ 8123456789                   │ │  │
│  │ └───┴──────────────────────────────┘ │  │
│  │ Contoh: 812345678                    │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ Catatan (opsional)                   │  │
│  │ ┌──────────────────────────────────┐ │  │
│  │ │ Tolong beli size 42...           │ │  │
│  │ │                                  │ │  │
│  │ └──────────────────────────────────┘ │  │
│  │ 0/500 karakter                       │  │
│  └──────────────────────────────────────┘  │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  🛒 Pesanan Anda (2 items)                  │
│  ┌──────────────────────────────────────┐  │
│  │ [📦 Barang]                          │  │
│  │ Nike Air Max                         │  │
│  │ Rp 2,100,000 × 2 pcs                 │  │
│  │ Berat: 800g                          │  │
│  │                                      │  │
│  │ Subtotal: Rp 4,200,000               │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ [👤 Jasa]                            │  │
│  │ Jasa Penitipan                       │  │
│  │ Rp 500,000 × 1 jasa                  │  │
│  │                                      │  │
│  │ Subtotal: Rp 500,000                 │  │
│  └──────────────────────────────────────┘  │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  💰 Ringkasan Pembayaran                    │
│  ┌──────────────────────────────────────┐  │
│  │ Subtotal              Rp 4,700,000   │  │
│  │                                      │  │
│  │ DP (20%)              Rp   940,000   │  │ ← Bold, blue
│  │ ──────────────────────────────────   │  │
│  │ Sisa Bayar            Rp 3,760,000   │  │
│  │                                      │  │
│  │ ┌────────────────────────────────┐   │  │
│  │ │ ℹ️  Alamat pengiriman akan     │   │  │
│  │ │    diminta setelah DP          │   │  │
│  │ │    dikonfirmasi jastiper       │   │  │
│  │ └────────────────────────────────┘   │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Bayar DP Rp 940,000 Sekarang      │   │ ← Primary CTA
│  └─────────────────────────────────────┘   │
│                                             │
│  Dengan melanjutkan, Anda menyetujui        │
│  syarat dan ketentuan kami                  │
│                                             │
└─────────────────────────────────────────────┘
```

### Section Breakdown

**1. Participant Info Section**
```
┌─────────────────────────────────┐
│ 📋 Informasi Pembeli            │ ← Section header
├─────────────────────────────────┤
│ Nama Lengkap *                  │ ← Label + required indicator
│ [_________________________]     │ ← Input field
│                                 │
│ No. WhatsApp *                  │
│ +62 [_____________________]     │ ← Prefixed input
│ Contoh: 812345678               │ ← Helper text
│                                 │
│ Catatan (opsional)              │ ← Optional label
│ [_________________________]     │ ← Textarea
│ [_________________________]     │
│ 0/500 karakter                  │ ← Character counter
└─────────────────────────────────┘
```

**2. Order Items Section**
```
┌─────────────────────────────────┐
│ 🛒 Pesanan Anda (2 items)       │ ← Section header with count
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ [📦 Barang]                 │ │ ← Type badge
│ │ Nike Air Max                │ │ ← Product name
│ │ Rp 2,100,000 × 2 pcs        │ │ ← Price × Qty
│ │ Berat: 800g                 │ │ ← Weight (goods only)
│ │                             │ │
│ │ Subtotal: Rp 4,200,000      │ │ ← Item subtotal
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**3. DP Breakdown Section**
```
┌─────────────────────────────────┐
│ 💰 Ringkasan Pembayaran         │ ← Section header
├─────────────────────────────────┤
│ Subtotal        Rp 4,700,000    │ ← Regular font, gray
│                                 │
│ DP (20%)        Rp   940,000    │ ← Bold, large, blue
│ ──────────────────────────────  │ ← Visual separator
│ Sisa Bayar      Rp 3,760,000    │ ← Medium font, gray
│                                 │
│ ┌───────────────────────────┐   │
│ │ ℹ️  Alamat pengiriman     │   │ ← Info notice
│ │    akan diminta setelah   │   │   (conditional:
│ │    DP dikonfirmasi        │   │    only if goods
│ └───────────────────────────┘   │    in cart)
└─────────────────────────────────┘
```

---

## 6. DP Breakdown Component Detail

### Component Structure
```typescript
<Card className="bg-blue-50 border-blue-200">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <DollarSign className="w-5 h-5" />
      Ringkasan Pembayaran
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    {/* Subtotal */}
    <div className="flex justify-between text-sm text-gray-600">
      <span>Subtotal</span>
      <span>Rp {subtotal.toLocaleString('id-ID')}</span>
    </div>

    {/* DP Amount - EMPHASIZED */}
    <div className="flex justify-between items-center font-bold text-lg text-blue-600 bg-white rounded-lg p-3">
      <span>DP (20%)</span>
      <span>Rp {dpAmount.toLocaleString('id-ID')}</span>
    </div>

    {/* Divider */}
    <Separator />

    {/* Remaining */}
    <div className="flex justify-between text-sm text-gray-600">
      <span>Sisa Bayar</span>
      <span>Rp {remainingAmount.toLocaleString('id-ID')}</span>
    </div>

    {/* Info Notice (conditional) */}
    {hasGoodsProducts && (
      <Alert className="bg-blue-100 border-blue-300">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Alamat pengiriman akan diminta setelah DP dikonfirmasi jastiper
        </AlertDescription>
      </Alert>
    )}
  </CardContent>
</Card>
```

### Visual Hierarchy (CSS)
```css
/* Subtotal - Secondary */
.subtotal {
  font-size: 0.875rem;
  color: rgb(107 114 128); /* gray-500 */
}

/* DP Amount - Primary Focus */
.dp-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(37 99 235); /* blue-600 */
  background: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
}

/* Remaining - Tertiary */
.remaining {
  font-size: 0.875rem;
  color: rgb(107 114 128); /* gray-500 */
  padding-top: 0.5rem;
  border-top: 1px solid rgb(229 231 235); /* gray-200 */
}

/* Info Notice */
.info-notice {
  background: rgb(219 234 254); /* blue-100 */
  border: 1px solid rgb(147 197 253); /* blue-300 */
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
}
```

---

## 7. Responsive Layouts

### Mobile (< 640px)
```
┌─────────────┐
│  ← Kembali  │
│  Checkout   │
├─────────────┤
│             │
│ [Name]      │
│ [Phone]     │
│ [Notes]     │
│             │
│ [Item 1]    │
│ [Item 2]    │
│             │
│ [DP Card]   │
│             │
│ [Pay DP]    │ ← Full width button
│             │
└─────────────┘
```
- **Stack vertically**
- **Full-width inputs**
- **Larger touch targets** (min 48px)
- **Sticky CTA button** at bottom

### Tablet (640px - 1024px)
```
┌─────────────────────────┐
│  ← Kembali  Checkout    │
├─────────────────────────┤
│                         │
│  [Name]    [Phone]      │ ← 2-column for name/phone
│                         │
│  [Notes - full width]   │
│                         │
│  [Item 1]  [Item 2]     │ ← 2-column for items
│                         │
│  [DP Breakdown Card]    │ ← Full width
│                         │
│  [      Pay DP      ]   │ ← Centered, max-width
│                         │
└─────────────────────────┘
```
- **2-column grid** where appropriate
- **Wider form** (max-w-3xl)
- **More breathing room**

### Desktop (> 1024px)
```
┌──────────────────────────────────────────┐
│  ← Kembali  Checkout - Trip Name         │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────┐  ┌────────────────┐ │
│  │ Name           │  │ Phone          │ │
│  └────────────────┘  └────────────────┘ │
│                                          │
│  ┌──────────────────────────────────────┐ │
│  │ Notes (full width)                   │ │
│  └──────────────────────────────────────┘ │
│                                          │
│  ┌────────────────┐  ┌────────────────┐ │
│  │ Item 1         │  │ Item 2         │ │
│  └────────────────┘  └────────────────┘ │
│                                          │
│  ┌──────────────────────────────────────┐ │
│  │ DP Breakdown Card (centered)         │ │
│  └──────────────────────────────────────┘ │
│                                          │
│         [    Pay DP Rp 940k    ]         │ ← Centered
│                                          │
└──────────────────────────────────────────┘
```
- **2-column layout** for name/phone
- **Max container width** (max-w-4xl)
- **Hover states** on interactive elements
- **Larger modal** size

---

## 8. Color Palette

### Product Type Colors
```typescript
const productTypeColors = {
  goods: {
    background: 'bg-orange-500',    // #f97316
    text: 'text-white',
    border: 'border-orange-600',
    hover: 'hover:bg-orange-600'
  },
  tasks: {
    background: 'bg-purple-500',    // #a855f7
    text: 'text-white',
    border: 'border-purple-600',
    hover: 'hover:bg-purple-600'
  }
}
```

### Payment Breakdown Colors
```typescript
const breakdownColors = {
  subtotal: 'text-gray-600',        // #6b7280
  dpAmount: 'text-blue-600',        // #2563eb
  remaining: 'text-gray-600',       // #6b7280
  cardBg: 'bg-blue-50',             // #eff6ff
  cardBorder: 'border-blue-200',    // #bfdbfe
  infoNotice: {
    bg: 'bg-blue-100',              // #dbeafe
    border: 'border-blue-300',      // #93c5fd
    text: 'text-blue-800'           // #1e40af
  }
}
```

### Interactive States
```typescript
const interactionColors = {
  primary: {
    default: 'bg-orange-500',       // CTA button
    hover: 'hover:bg-orange-600',
    active: 'active:bg-orange-700',
    disabled: 'bg-gray-300'
  },
  input: {
    default: 'border-gray-300',
    focus: 'focus:border-orange-500 focus:ring-orange-500',
    error: 'border-red-500 focus:border-red-500'
  }
}
```

---

## 9. Typography Scale

### Font Sizes (Tailwind)
```typescript
const typography = {
  // Headers
  pageTitle: 'text-2xl font-bold',           // 24px
  sectionTitle: 'text-lg font-semibold',     // 18px
  cardTitle: 'text-base font-semibold',      // 16px
  
  // Body
  body: 'text-sm',                           // 14px
  bodySmall: 'text-xs',                      // 12px
  caption: 'text-[10px]',                    // 10px
  
  // Emphasis
  price: 'text-lg font-bold',                // 18px
  dpAmount: 'text-xl font-bold',             // 20px
  
  // Labels
  label: 'text-sm font-medium',              // 14px
  helper: 'text-xs text-gray-500',           // 12px
}
```

---

## 10. Animation & Transitions

### Modal Animations
```css
/* Cart Modal - Slide Up (Mobile) */
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Checkout Form - Fade In */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### Micro-interactions
```typescript
// Add to cart button
<button className="transition-all duration-200 hover:scale-110 active:scale-95">
  <Plus />
</button>

// Quantity adjustment
<button className="transition-colors duration-150 hover:bg-gray-200 active:bg-gray-300">
  -
</button>

// Submit button
<button className="transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
  Bayar DP
</button>
```

---

## 11. Icon Reference

### Icons Used (lucide-react)
```typescript
import {
  Package,        // Barang (goods)
  UserCircle2,    // Jasa (tasks)
  ShoppingCart,   // Cart icon
  Plus,           // Add to cart
  X,              // Remove item / Close modal
  Info,           // Information notice
  DollarSign,     // Payment breakdown
  ChevronLeft,    // Back button
  Phone,          // WhatsApp
  Calendar,       // Trip deadline
  MapPin,         // Location
  Loader2         // Loading state
} from "lucide-react"
```

### Icon Sizes
```typescript
const iconSizes = {
  badge: 'w-3 h-3',      // 12px (in type badge)
  button: 'w-4 h-4',     // 16px (action buttons)
  section: 'w-5 h-5',    // 20px (section headers)
  hero: 'w-6 h-6'        // 24px (floating cart button)
}
```

---

## 12. Form Input States

### Input State Visualization

**Default State:**
```
┌─────────────────────────┐
│ Nama Lengkap *          │ ← Label
├─────────────────────────┤
│                         │
│ [____________________]  │ ← Input (border-gray-300)
│                         │
└─────────────────────────┘
```

**Focus State:**
```
┌─────────────────────────┐
│ Nama Lengkap *          │
├─────────────────────────┤
│                         │
│ [____________________]  │ ← border-orange-500, ring-1
│ │ cursor here          │
└─────────────────────────┘
```

**Error State:**
```
┌─────────────────────────┐
│ Nama Lengkap *          │
├─────────────────────────┤
│                         │
│ [____________________]  │ ← border-red-500
│                         │
│ ❌ Nama minimal 2 char  │ ← Error message
└─────────────────────────┘
```

**Success State:**
```
┌─────────────────────────┐
│ Nama Lengkap *          │
├─────────────────────────┤
│                         │
│ [John Doe___________]   │ ← border-green-500
│ ✅                      │ ← Checkmark
└─────────────────────────┘
```

---

## 13. Loading States

### Button Loading
```
┌─────────────────────────┐
│  ⏳ Memproses...        │ ← Spinner + text
└─────────────────────────┘
```

### Page Loading
```
┌─────────────────────────┐
│                         │
│      ⏳                 │ ← Centered spinner
│   Loading checkout...   │
│                         │
└─────────────────────────┘
```

### Skeleton Loading (Product Cards)
```
┌─────────────────────────┐
│ ███████████████████     │ ← Image skeleton
│ ███████████████████     │
├─────────────────────────┤
│ ██████████              │ ← Title skeleton
│ ████████                │ ← Price skeleton
└─────────────────────────┘
```

---

## 14. Error States

### Toast Notifications
```
┌─────────────────────────────┐
│ ❌ Keranjang kosong         │ ← Error toast (red)
└─────────────────────────────┘

┌─────────────────────────────┐
│ ⚠️  Nomor WhatsApp invalid  │ ← Warning toast (yellow)
└─────────────────────────────┘

┌─────────────────────────────┐
│ ✅ Ditambahkan ke keranjang │ ← Success toast (green)
└─────────────────────────────┘
```

### Error Banner
```
┌────────────────────────────────────┐
│ ⚠️  Koneksi tergagal               │
│    [Coba Lagi]                     │ ← Action button
└────────────────────────────────────┘
```

---

**End of Visual Mockups**
