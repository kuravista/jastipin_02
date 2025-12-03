# Research: Product Detail Modal Hybrid

## Task ID: product-detail-modal-hybrid
## Date: 03-12-2025

---

## 1. Existing Patterns Analysis

### 1.1 Dialog/Modal Pattern
- **Location:** `@/components/ui/dialog.tsx`
- **Type:** Radix UI Dialog (`@radix-ui/react-dialog`)
- **Components Available:**
  - `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogClose`
  - Custom prop: `showCloseButton` untuk kontrol visibility close button
- **Styling:** Centered modal dengan animation (fade in/out, zoom in/out)

### 1.2 Existing Dialog Usage in Codebase
- `components/dialogs/create-product-dialog.tsx` - Uses Sheet (side panel) instead of Dialog
- `components/dialogs/edit-profile-dialog.tsx` - Uses Dialog for forms
- Profile page (`app/[username]/page.tsx`) - Uses Dialog for order form (line 553)

### 1.3 Current Profile Page Structure
- **Location:** `/app/frontend/app/[username]/page.tsx`
- **Type:** Client Component (`"use client"`)
- **No layout.tsx** in `[username]` folder currently
- **Data Fetching:** Via `apiGet('/profile/${username}')` in useEffect

### 1.4 API Pattern
- **Profile API:** `GET /api/profile/:slug`
- **Returns:** `{ user, trips, catalog }` 
- **Catalog items include:**
  ```ts
  {
    id: string
    tripId: string
    title: string
    price: number
    image?: string
    available: boolean (calculated from stock)
    type?: string
    unit?: string
    weightGram?: number
  }
  ```

### 1.5 Product Schema (Prisma)
```prisma
model Product {
  id              String      @id @default(cuid())
  tripId          String
  slug            String      // ✅ SUDAH ADA SLUG
  title           String
  price           Int
  stock           Int?
  isUnlimitedStock Boolean    @default(false)
  image           String?
  description     String?
  status          String      @default("active")
  type            String      @default("goods")
  unit            String?
  weightGram      Int?
  Trip            Trip        @relation(...)
  
  @@unique([tripId, slug])  // Unique per trip
}
```

### 1.6 SEO/Metadata Pattern
- **Location:** `/app/frontend/app/layout.tsx`
- **Type:** Static metadata object
- **No dynamic generateMetadata** found in existing pages

---

## 2. Technical Decisions

### 2.1 Routing Approach: Intercepting Routes
Next.js 14 Parallel + Intercepting Routes pattern:

```
/app/[username]/
├── page.tsx                    # Profile page (existing, keep as client)
├── layout.tsx                  # NEW: Layout with modal slot
├── @modal/                     # NEW: Parallel route slot
│   ├── default.tsx             # NEW: Empty default
│   └── (.)p/[slug]/            # NEW: Intercept route
│       └── page.tsx            # NEW: Modal component
└── p/[slug]/                   # NEW: Direct access fallback
    └── page.tsx                # NEW: Full page (SSR + SEO)
```

### 2.2 Why Intercepting Routes?
- **Soft navigation** (click from profile) → Opens modal overlay
- **Hard navigation** (direct URL access) → Opens full page (SEO friendly)
- **URL changes** on modal open → Shareable
- **Back button** closes modal → Good UX

### 2.3 API Endpoint Needed
```
GET /api/profile/:username/products/:slug
```
**Response:**
```json
{
  "product": {
    "id": "...",
    "slug": "nike-air-jordan",
    "title": "Nike Air Jordan 1",
    "price": 2500000,
    "image": "...",
    "description": "...",
    "available": true,
    "stock": 10,
    "isUnlimitedStock": false,
    "unit": "pcs",
    "weightGram": 500
  },
  "trip": {
    "id": "...",
    "title": "Trip Korea Oktober"
  },
  "jastiper": {
    "slug": "qwe",
    "profileName": "Jastip Korea",
    "avatar": "..."
  },
  "navigation": {
    "prev": { "slug": "prev-product", "title": "Previous Product" } | null,
    "next": { "slug": "next-product", "title": "Next Product" } | null
  }
}
```

### 2.4 Slug Uniqueness
- Product slug is `@@unique([tripId, slug])` - unique per trip only
- Need to handle: URL `/qwe/p/nike-air-jordan` could match multiple products from different trips
- **Solution:** Include tripId in API or use first matching active trip

---

## 3. Component Structure

### 3.1 ProductDetailModal (for intercepted route)
```tsx
// Client component
// Uses: Dialog from shadcn/ui
// Features:
// - Image display
// - Title, Price, Description, Stock
// - Trip info link
// - Share button (native share API)
// - Add to cart button + toast
// - Prev/Next navigation
// - Close → router.back()
```

### 3.2 ProductDetailPage (for direct access - SSR)
```tsx
// Server component with generateMetadata
// Features:
// - SEO meta tags (title, description, og:image)
// - Same visual as modal but full page
// - Add to cart functionality
// - Share button
// - Back to profile link
```

---

## 4. Cart Integration

### 4.1 Current Cart State
- Cart state lives in profile page: `useState<Array<{ product: any; quantity: number }>>([])` 
- Cart is **per-trip** (cleared when switching trips)
- Cart stored to localStorage before checkout: `localStorage.setItem('cart_${tripId}', ...)`

### 4.2 Challenge: Modal Access to Cart
- Modal is rendered in parallel route, separate from profile page
- **Solution Options:**
  1. ~~Context API~~ - Too complex for this use case
  2. ~~Zustand~~ - New dependency
  3. **localStorage + window event** - Simple, works with existing pattern
  4. **URL query param** - Cart item added, profile page listens

**Decision:** Use localStorage + custom event pattern
- Modal saves to localStorage
- Dispatches `window.dispatchEvent(new CustomEvent('cart-updated'))`
- Profile page listens and updates state

---

## 5. Share Button Implementation

### 5.1 Native Share API
```ts
const shareProduct = async () => {
  const url = `${window.location.origin}/${username}/p/${slug}`
  
  if (navigator.share) {
    await navigator.share({
      title: product.title,
      text: `Check out ${product.title} di Jastipin.me`,
      url
    })
  } else {
    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(url)
    toast.success('Link copied!')
  }
}
```

---

## 6. Prev/Next Navigation

### 6.1 Approach
- API returns `navigation.prev` and `navigation.next` with slug + title
- Navigation based on products in same trip, sorted by creation date
- Uses `router.replace()` to avoid long history stack

### 6.2 Performance
- Preload next/prev product data on hover (optional optimization)
- Use `loading.tsx` for transition states

---

## 7. Files to Create/Modify

### New Files:
1. `/backend/src/routes/profile.ts` - Add product detail endpoint
2. `/frontend/app/[username]/layout.tsx` - Layout with modal slot
3. `/frontend/app/[username]/@modal/default.tsx` - Empty default
4. `/frontend/app/[username]/@modal/(.)p/[slug]/page.tsx` - Modal
5. `/frontend/app/[username]/p/[slug]/page.tsx` - Full page (SEO)
6. `/frontend/components/profile/product-detail-content.tsx` - Shared content

### Modified Files:
1. `/frontend/app/[username]/page.tsx` - Add image click handler with Link

---

## 8. Memory Patterns Consulted

- No directly applicable patterns found in memory for this specific use case
- Will add success pattern after implementation if works well

---

## 9. Potential Issues & Mitigations

| Issue | Mitigation |
|-------|------------|
| Product slug not unique globally | Query by username + slug combination |
| Modal state sync with cart | Use localStorage + custom events |
| SEO for modal content | Full page fallback handles SEO |
| Loading states | Add loading.tsx for transitions |
| Mobile share not supported | Fallback to clipboard copy |
