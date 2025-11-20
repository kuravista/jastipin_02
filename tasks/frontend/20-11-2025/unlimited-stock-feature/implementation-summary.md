# Unlimited Stock Feature - Implementation Summary

## Overview
Comprehensive unlimited stock feature implementation using database boolean flag approach instead of magic numbers. This is production-ready and scalable.

## Architecture Decision

### Why Boolean Flag?
| Approach | Pros | Cons |
|----------|------|------|
| **Magic Number (99999999)** | Simple | Hard-coded, unclear intent, error-prone |
| **Null Value** | Could work | Complex null-checking, ambiguous meaning |
| **Boolean Flag** ✅ | Semantic, scalable, queryable | Requires nullable stock field |

**Decision: Boolean flag with nullable stock** - Best practice for distinguishing unlimited from limited inventory.

## Component Architecture

### Frontend Flow
```
CreateProductDialog / EditProductDialog
    ↓
[Tipe] [Unlimited Toggle]
[Harga] [Stok] (auto-disable when unlimited)
[Nama Produk]
[Deskripsi]
    ↓
API: POST /products or PATCH /products/:id
    ↓
Backend validation + database save
```

### Backend Flow
```
POST /products { isUnlimitedStock: true }
    ↓
Validator checks isUnlimitedStock flag
    ↓
Router sets stock = null if unlimited
    ↓
Prisma creates record with isUnlimitedStock=true, stock=null
```

## State Management

### Form State
```typescript
interface ProductFormData {
  title: string
  price: number
  stock: number | null  // null when unlimited
  isUnlimitedStock: boolean  // controls UI and API behavior
  description: string
  tripId: string
  type: 'goods' | 'tasks'
  image?: string
}
```

### UI Behavior
- **When isUnlimitedStock = false**: Stock input enabled, accepts number
- **When isUnlimitedStock = true**: Stock input disabled/hidden, auto-set to null
- **On toggle**: Automatically clear stock value when enabling unlimited

## Display Logic

### Product List
```
If product.isUnlimitedStock === true:
  - Label: "∞ Unlimited"
  - Color: Blue (text-blue-600)
  - Bar: 100% width, blue (bg-blue-500)
Else if product.stock === 0:
  - Label: "HABIS"
  - Color: Red
  - Bar: 0% width, red
Else if product.stock < 5:
  - Label: "{stock} tersisa"
  - Color: Yellow
  - Bar: {percentage}% width, yellow
Else:
  - Label: "{stock} tersisa"
  - Color: Green
  - Bar: {percentage}% width, green
```

## API Contract

### Create Product
**Request:**
```json
{
  "title": "KitKat Matcha",
  "price": 25000,
  "stock": 100,
  "isUnlimitedStock": false,
  "tripId": "trip_123",
  "description": "Matcha flavored KitKat"
}
```

**With Unlimited:**
```json
{
  "title": "Mystery Box",
  "price": 50000,
  "stock": null,  // or omitted
  "isUnlimitedStock": true,
  "tripId": "trip_123"
}
```

**Response:**
```json
{
  "id": "prod_456",
  "title": "Mystery Box",
  "price": 50000,
  "stock": null,
  "isUnlimitedStock": true,
  "tripId": "trip_123",
  "createdAt": "2025-11-20T10:30:00Z"
}
```

### Update Product
**Same payload structure as create**

## Database Schema

```prisma
model Product {
  id                  String    @id @default(cuid())
  tripId              String
  stock               Int?      // nullable for unlimited
  isUnlimitedStock    Boolean   @default(false)  // NEW
  // ... other fields
}
```

## Validation Rules

### Stock Field
- **If isUnlimitedStock = false:**
  - stock is required (min 0)
  - Must be a positive integer
- **If isUnlimitedStock = true:**
  - stock is ignored/null
  - No validation needed

### Form Level (Frontend)
- Stock input disabled when isUnlimitedStock = true
- User cannot enter stock value while unlimited = true
- Toggle automatically clears stock value

### API Level (Backend)
- Zod schema validates both fields
- Logic: if isUnlimitedStock=true, set stock=null
- Prevents invalid state (stock value + unlimited flag)

## Testing Scenarios

### ✅ Create Product
1. Regular stock: "KitKat" with stock=100 → saved with isUnlimitedStock=false
2. Unlimited stock: "Mystery Box" toggle ON → saved with stock=null, isUnlimitedStock=true
3. Form validation: Stock input disabled when unlimited ON

### ✅ Edit Product
1. Change from limited to unlimited → stock cleared, flag set
2. Change from unlimited to limited → stock input enabled, user can enter value
3. Keep unlimited → no changes to stock field

### ✅ Product List Display
1. Limited stock shows "100 tersisa" with green bar
2. Low stock shows "3 tersisa" with yellow bar
3. Out of stock shows "HABIS" with red bar
4. Unlimited stock shows "∞ Unlimited" with blue 100% bar

### ✅ API Behavior
1. POST with isUnlimitedStock=true stores stock=null
2. PATCH unlimited→limited updates both fields
3. Retrieving product returns correct isUnlimitedStock flag

## Performance Considerations

- ✅ Indexed `isUnlimitedStock` for fast filtering: `WHERE isUnlimitedStock = true`
- ✅ Nullable `stock` column: no performance penalty
- ✅ Boolean flag: 1 byte storage vs 4 bytes for magic number
- ✅ No N+1 queries: fields included in product selection

## Security Notes

- ✅ User can only set unlimited flag on their own trip products
- ✅ Stock/unlimited flag validated on each request
- ✅ No direct SQL - using Prisma ORM for protection
- ✅ Auth middleware checks trip ownership

## Future Enhancements

1. **Unlimited Stock Badges** - Display ∞ icon in product cards
2. **Stock Analytics** - Query unlimited vs limited products
3. **Bulk Actions** - Toggle unlimited for multiple products
4. **Stock Alerts** - Notify when limited stock runs low (not for unlimited)
5. **Order Fulfillment** - Handle unlimited stock in order processing

## Known Limitations

- Unlimited flag must be manually toggled (no auto-detection)
- Cannot set partial unlimited (e.g., "at least 100 items")
- Stock history not tracked for unlimited products
- No way to "restock" unlimited products

## Rollback Plan

If needed to revert:
1. Drop `isUnlimitedStock` column: `ALTER TABLE Product DROP COLUMN isUnlimitedStock`
2. Revert schema changes in prisma/schema.prisma
3. Remove toggle UI from dialogs
4. Run `prisma db push --accept-data-loss`
5. Redeploy backend and frontend

