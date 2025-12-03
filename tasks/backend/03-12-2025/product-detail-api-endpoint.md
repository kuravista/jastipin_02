# Product Detail API Endpoint

**Task ID:** product-detail-api  
**Date:** 03 December 2025  
**Status:** ✅ Completed

---

## 📋 Overview

Pembuatan API endpoint untuk mengambil detail produk pada halaman profile publik jastiper. Endpoint ini mendukung fitur Product Detail Modal di frontend.

---

## 🔌 API Specification

### Endpoint

```
GET /api/profile/:slug/products/:productSlug
```

### Parameters

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `slug` | string | path | ✅ | Username/slug jastiper |
| `productSlug` | string | path | ✅ | Slug produk |
| `tripId` | string | query | ❌ | ID trip untuk identifikasi unik (diperlukan jika ada produk dengan slug sama di trip berbeda) |

### Response Success (200)

```json
{
  "product": {
    "id": "clx...",
    "slug": "camera-sony-a7",
    "title": "Camera Sony A7",
    "price": 15000000,
    "description": "Kamera mirrorless full frame...",
    "image": "https://...",
    "stock": 5,
    "isUnlimitedStock": false,
    "unit": "pcs",
    "weightGram": 500,
    "type": "goods",
    "available": true,
    "tripId": "clx..."
  },
  "trip": {
    "id": "clx...",
    "title": "Trip Korea November 2025",
    "status": "Buka"
  },
  "jastiper": {
    "slug": "qwe",
    "profileName": "John Doe",
    "avatar": "https://..."
  }
}
```

### Response Error

```json
// 404 - User not found
{ "error": "User not found" }

// 404 - Product not found
{ "error": "Product not found" }

// 500 - Server error
{ "error": "Failed to fetch product detail" }
```

---

## 📁 Files Modified

### `src/routes/profile.ts`

**Added endpoint:**

```typescript
/**
 * GET /profile/:slug/products/:productSlug
 * Get product detail for public profile
 * Query params:
 *   - tripId: Optional. Filter by trip to get correct product when same slug exists
 */
router.get('/profile/:slug/products/:productSlug', async (req, res) => {
  // ... implementation
})
```

**Key Logic:**

1. **Find user by slug** - Validasi jastiper exists
2. **Build product query** - Filter by productSlug + tripId (if provided)
3. **Calculate availability** - Based on `isUnlimitedStock` atau `stock > 0`
4. **Return structured response** - product, trip, jastiper info

### `src/services/auth.service.ts`

**Modified `getPublicProfile`:**

Menambahkan field `slug` dan `isUnlimitedStock` pada products response untuk mendukung navigasi ke product detail.

```typescript
// Before
products: trip.Products.map((p) => ({
  id: p.id,
  title: p.title,
  // ...
}))

// After
products: trip.Products.map((p) => ({
  id: p.id,
  slug: p.slug,           // ← Added
  isUnlimitedStock: p.isUnlimitedStock,  // ← Added
  title: p.title,
  // ...
}))
```

---

## 🔧 Technical Details

### Handling Duplicate Slugs

**Problem:** Produk dengan slug yang sama bisa ada di trip berbeda (misal jastiper membuat produk "korea-stuff" di 2 trip berbeda).

**Solution:** 

1. Frontend mengirim `tripId` sebagai query parameter
2. Backend filter dengan `tripId` jika tersedia

```typescript
const productWhere: { slug: string; tripId?: string; Trip: { jastiperId: string } } = {
  slug: productSlug,
  Trip: { jastiperId: user.id },
}

if (tripId) {
  productWhere.tripId = tripId as string
}

const product = await db.product.findFirst({
  where: productWhere,
  include: { Trip: { select: { id: true, title: true, isActive: true } } }
})
```

### Prisma Query

```typescript
// Find product with trip relation
const product = await db.product.findFirst({
  where: {
    slug: productSlug,
    tripId: tripId,  // optional filter
    Trip: { jastiperId: user.id }  // ensure product belongs to this jastiper
  },
  include: {
    Trip: {
      select: {
        id: true,
        title: true,
        isActive: true
      }
    }
  }
})
```

---

## 🗑️ Removed Features

### Navigation (Prev/Next Product)

Awalnya diimplementasi tapi kemudian di-rollback:

```typescript
// REMOVED - Was querying all products in trip for navigation
const tripProducts = await db.product.findMany({
  where: { tripId: navigationTripId },
  orderBy: { createdAt: 'asc' },
  select: { id: true, slug: true, title: true }
})

// REMOVED - Was calculating prev/next
const currentIndex = tripProducts.findIndex(p => p.id === product.id)
const prevProduct = currentIndex > 0 ? tripProducts[currentIndex - 1] : null
const nextProduct = currentIndex < tripProducts.length - 1 ? tripProducts[currentIndex + 1] : null

// REMOVED from response
navigation: {
  prev: prevProduct ? { slug: prevProduct.slug, title: prevProduct.title } : null,
  next: nextProduct ? { slug: nextProduct.slug, title: nextProduct.title } : null,
}
```

**Reason:** Kompleksitas dan UX yang kurang baik untuk use case ini.

---

## ✅ Testing

```bash
# Test endpoint
curl "https://api.jastipin.me/api/profile/qwe/products/camera-sony?tripId=clx123"

# Expected response
{
  "product": { ... },
  "trip": { ... },
  "jastiper": { ... }
}
```

---

## 📝 Notes

1. Endpoint ini **tidak memerlukan authentication** (public endpoint)
2. `tripId` sangat direkomendasikan untuk dikirim dari frontend untuk menghindari ambiguitas
3. Response di-cache oleh frontend selama 60 detik untuk performa
