# Implementation Plan: Product Detail Modal Hybrid

## Task ID: product-detail-modal-hybrid
## Date: 03-12-2025

---

## Overview

Implementasi hybrid modal untuk detail produk di halaman profile dengan fitur:
- Klik gambar → buka modal + URL berubah
- Direct access URL → full page dengan SEO
- Share button dengan native share API
- Add to cart dengan toast feedback
- Navigasi prev/next produk
- Dialog tetap terbuka setelah add to cart

---

## Phase 1: Backend API

### 1.1 Add Product Detail Endpoint

**File:** `/backend/src/routes/profile.ts`

**Endpoint:** `GET /profile/:slug/products/:productSlug`

**Response Schema:**
```typescript
interface ProductDetailResponse {
  product: {
    id: string
    slug: string
    title: string
    price: number
    description: string | null
    image: string | null
    stock: number | null
    isUnlimitedStock: boolean
    unit: string | null
    weightGram: number | null
    type: string
    available: boolean
  }
  trip: {
    id: string
    title: string
    status: string
  }
  jastiper: {
    slug: string
    profileName: string
    avatar: string | null
  }
  navigation: {
    prev: { slug: string; title: string } | null
    next: { slug: string; title: string } | null
  }
}
```

**Implementation:**
1. Find user by slug
2. Find product by productSlug where trip belongs to user
3. Calculate prev/next products in same trip
4. Return structured response

---

## Phase 2: Frontend Routing Structure

### 2.1 Create Layout with Modal Slot

**File:** `/frontend/app/[username]/layout.tsx`

```tsx
// Server component
export default function ProfileLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
```

### 2.2 Create Default Modal (Empty)

**File:** `/frontend/app/[username]/@modal/default.tsx`

```tsx
export default function Default() {
  return null
}
```

### 2.3 Create Intercepted Route for Modal

**File:** `/frontend/app/[username]/@modal/(.)p/[slug]/page.tsx`

- Client component
- Uses Dialog from shadcn/ui
- Fetches product detail
- Renders ProductDetailContent
- Uses router.back() on close

### 2.4 Create Direct Access Page

**File:** `/frontend/app/[username]/p/[slug]/page.tsx`

- Server component
- Has generateMetadata for SEO
- Fetches product detail
- Renders ProductDetailContent in full page layout
- Link back to profile

---

## Phase 3: Shared Components

### 3.1 ProductDetailContent Component

**File:** `/frontend/components/profile/product-detail-content.tsx`

**Props:**
```typescript
interface ProductDetailContentProps {
  product: Product
  trip: Trip
  jastiper: Jastiper
  navigation: { prev: NavItem | null; next: NavItem | null }
  username: string
  onAddToCart: () => void
  onNavigate: (slug: string) => void
  isModal?: boolean
}
```

**Features:**
- Product image (responsive)
- Title & price
- Description
- Stock status badge
- Trip info with link
- Share button
- Add to cart button
- Prev/Next navigation arrows

### 3.2 Share Button Logic

```typescript
const handleShare = async () => {
  const url = `${window.location.origin}/${username}/p/${product.slug}`
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: product.title,
        text: `Check out ${product.title} - Rp ${product.price.toLocaleString('id-ID')}`,
        url
      })
    } catch (err) {
      // User cancelled or share failed
    }
  } else {
    await navigator.clipboard.writeText(url)
    toast.success('Link berhasil disalin!')
  }
}
```

---

## Phase 4: Cart Integration

### 4.1 Cart Event System

**Add to `/frontend/lib/cart-events.ts`:**
```typescript
export const CART_UPDATED_EVENT = 'jastipin-cart-updated'

export interface CartItem {
  product: {
    id: string
    title: string
    price: number
    image?: string
    tripId: string
  }
  quantity: number
}

export function dispatchCartUpdate(tripId: string, items: CartItem[]) {
  localStorage.setItem(`cart_${tripId}`, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { 
    detail: { tripId, items } 
  }))
}

export function getCartItems(tripId: string): CartItem[] {
  const stored = localStorage.getItem(`cart_${tripId}`)
  return stored ? JSON.parse(stored) : []
}

export function addToCartItem(tripId: string, product: CartItem['product']) {
  const items = getCartItems(tripId)
  const existing = items.find(item => item.product.id === product.id)
  
  if (existing) {
    existing.quantity += 1
  } else {
    items.push({ product, quantity: 1 })
  }
  
  dispatchCartUpdate(tripId, items)
  return items
}
```

### 4.2 Profile Page Integration

**Modify `/frontend/app/[username]/page.tsx`:**
- Listen to `CART_UPDATED_EVENT`
- Sync localStorage cart with state on event

---

## Phase 5: Profile Page Modification

### 5.1 Add Click Handler for Image

**Current (Product Card):**
```tsx
<Card key={item.id} ...>
  <div className="relative w-full h-32">
    <img src={item.image} ... />
  </div>
  ...
</Card>
```

**New:**
```tsx
<Card key={item.id} ...>
  <Link href={`/${username}/p/${item.slug}`} className="relative w-full h-32 block cursor-pointer">
    <img src={item.image} ... />
  </Link>
  ...
</Card>
```

### 5.2 Add slug to catalog response

**Modify backend auth.service.ts getPublicProfile:**
- Add `slug` field to products select

---

## Phase 6: SEO Metadata

### 6.1 generateMetadata Function

**File:** `/frontend/app/[username]/p/[slug]/page.tsx`

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, slug } = await params
  const data = await fetchProductDetail(username, slug)
  
  if (!data) {
    return {
      title: 'Product Not Found',
    }
  }
  
  return {
    title: `${data.product.title} - ${data.jastiper.profileName} | Jastipin.me`,
    description: data.product.description || `Beli ${data.product.title} dari ${data.jastiper.profileName}`,
    openGraph: {
      title: data.product.title,
      description: data.product.description || `Rp ${data.product.price.toLocaleString('id-ID')}`,
      images: data.product.image ? [data.product.image] : [],
      url: `https://jastipin.me/${username}/p/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: data.product.title,
      description: data.product.description || `Rp ${data.product.price.toLocaleString('id-ID')}`,
      images: data.product.image ? [data.product.image] : [],
    },
  }
}
```

---

## Implementation Order

1. **Backend:** Add product detail endpoint to profile.ts
2. **Backend:** Add slug to getPublicProfile products response
3. **Frontend:** Create cart-events.ts utility
4. **Frontend:** Create ProductDetailContent component
5. **Frontend:** Create layout.tsx for [username]
6. **Frontend:** Create @modal/default.tsx
7. **Frontend:** Create @modal/(.)p/[slug]/page.tsx (modal)
8. **Frontend:** Create p/[slug]/page.tsx (full page + SEO)
9. **Frontend:** Update profile page.tsx (image click + cart events)
10. **Testing:** Manual test all scenarios

---

## File Summary

### New Files (9):
| File | Type | Purpose |
|------|------|---------|
| `/backend/src/routes/profile.ts` | Modified | Add product detail endpoint |
| `/frontend/lib/cart-events.ts` | New | Cart event utilities |
| `/frontend/components/profile/product-detail-content.tsx` | New | Shared product detail UI |
| `/frontend/app/[username]/layout.tsx` | New | Layout with modal slot |
| `/frontend/app/[username]/@modal/default.tsx` | New | Empty modal default |
| `/frontend/app/[username]/@modal/(.)p/[slug]/page.tsx` | New | Modal component |
| `/frontend/app/[username]/p/[slug]/page.tsx` | New | Full page (SEO) |
| `/frontend/app/[username]/p/[slug]/loading.tsx` | New | Loading state |

### Modified Files (2):
| File | Changes |
|------|---------|
| `/backend/src/services/auth.service.ts` | Add slug to products in getPublicProfile |
| `/frontend/app/[username]/page.tsx` | Add image Link, cart event listener |

---

## Testing Scenarios

1. ✅ Click gambar produk → modal terbuka, URL berubah
2. ✅ Close modal → URL kembali ke profile
3. ✅ Direct access /username/p/slug → full page render
4. ✅ Share button → native share atau copy link
5. ✅ Add to cart dari modal → toast success, dialog tetap terbuka
6. ✅ Cart count update di floating button
7. ✅ Prev/Next navigation → product berubah
8. ✅ SEO meta tags pada direct access
9. ✅ Mobile responsiveness
10. ✅ Back button browser → modal close

---

## Estimated Timeline

| Phase | Task | Est. Time |
|-------|------|-----------|
| 1 | Backend API | 15 min |
| 2 | Frontend Routing | 10 min |
| 3 | Shared Components | 20 min |
| 4 | Cart Integration | 10 min |
| 5 | Profile Page Update | 10 min |
| 6 | SEO Metadata | 5 min |
| - | Testing & Fixes | 15 min |
| **Total** | | **~85 min** |
