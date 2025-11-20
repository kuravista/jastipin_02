# DP Checkout - Component Specifications

**Purpose:** TypeScript interfaces and component structure reference  
**Date:** 2025-11-20

---

## 1. TypeScript Interfaces

### Core Data Types
```typescript
// Product with type distinction
interface Product {
  id: string
  title: string
  price: number
  type: 'goods' | 'tasks'           // NEW: Product type
  unit?: string                     // e.g., "pcs", "kg", "box"
  stock?: number | null
  weightGram?: number               // NEW: For goods shipping
  image?: string
  description?: string
  tripId: string
  isUnlimitedStock?: boolean
}

// Trip with payment type
interface Trip {
  id: string
  title: string
  description?: string
  image?: string
  deadline?: string
  status: string
  spotsLeft: number
  paymentType: 'full' | 'dp'        // Payment flow selector
  jastiper?: {
    id: string
    slug: string
    profileName: string
  }
}

// Cart item with product reference
interface CartItem {
  product: Product
  quantity: number
}

// DP checkout form data
interface DPCheckoutFormData {
  participantName: string           // Min 2, max 100 chars
  participantPhone: string          // Format: 628XXXXXXXXX
  notes?: string                    // Max 500 chars, optional
}

// DP breakdown calculation
interface DPBreakdown {
  subtotal: number                  // Sum of all items
  dpAmount: number                  // 20% of subtotal, min 10k
  remainingAmount: number           // subtotal - dpAmount
  dpPercentage: number              // Always 0.2 (20%)
}
```

---

## 2. Component Prop Interfaces

### ProductTypeBadge
```typescript
interface ProductTypeBadgeProps {
  type: 'goods' | 'tasks'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showIcon?: boolean                // Default: true
}

// Usage
<ProductTypeBadge 
  type="goods" 
  size="md" 
  className="absolute top-2 right-2"
/>
```

**Size Mapping:**
```typescript
const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-3 py-1.5'
}

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4'
}
```

### DPBreakdownCard
```typescript
interface DPBreakdownCardProps {
  cartItems: CartItem[]             // For calculation
  hasGoodsProducts?: boolean        // Show address notice
  className?: string
}

// Calculated internally
interface DPBreakdownState {
  subtotal: number
  dpAmount: number
  remainingAmount: number
}

// Usage
<DPBreakdownCard 
  cartItems={cartItems}
  hasGoodsProducts={cartItems.some(i => i.product.type === 'goods')}
/>
```

### CheckoutFormDP (Simplified)
```typescript
interface CheckoutFormDPProps {
  cartItems: CartItem[]
  tripId: string
  trip?: Trip                       // Optional: for display
  onSuccess: (orderId: string) => void
  onCancel?: () => void
  className?: string
}

// Internal form state
interface CheckoutFormState {
  participantName: string
  participantPhone: string
  notes: string
  isSubmitting: boolean
  error: string | null
}

// Usage
<CheckoutFormDP
  cartItems={cartItems}
  tripId={tripId}
  onSuccess={(orderId) => router.push(`/checkout/payment/${orderId}`)}
  onCancel={() => setShowCheckout(false)}
/>
```

### ProductCardWithType (Enhanced)
```typescript
interface ProductCardWithTypeProps {
  product: Product
  onAddToCart: (product: Product) => void
  showTypeInfo?: boolean            // Default: true
  showWeightInfo?: boolean          // Default: true (if goods)
  variant?: 'grid' | 'list'         // Layout variant
  className?: string
}

// Usage
<ProductCardWithType
  product={product}
  onAddToCart={addToCart}
  showTypeInfo={true}
  variant="grid"
/>
```

### CartItemCard (Enhanced)
```typescript
interface CartItemCardProps {
  item: CartItem
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
  showTypeBadge?: boolean           // Default: true
  showWeight?: boolean              // Default: true (if goods)
  showSubtotal?: boolean            // Default: true
  className?: string
}

// Usage
<CartItemCard
  item={cartItem}
  onUpdateQuantity={updateQuantity}
  onRemove={removeFromCart}
  showTypeBadge={true}
  showWeight={true}
/>
```

---

## 3. Utility Functions

### DP Calculation
```typescript
/**
 * Calculate DP amount from cart items
 * Formula: 20% of subtotal, minimum Rp 10,000, rounded up to nearest 1000
 */
export function calculateDP(cartItems: CartItem[]): DPBreakdown {
  // Calculate subtotal
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item.product.price * item.quantity)
  }, 0)
  
  // Calculate DP (20%)
  const dpPercentage = 0.2
  const calculatedDP = subtotal * dpPercentage
  
  // Round up to nearest 1000, minimum 10k
  const dpAmount = Math.max(
    Math.ceil(calculatedDP / 1000) * 1000,
    10000
  )
  
  // Calculate remaining
  const remainingAmount = subtotal - dpAmount
  
  return {
    subtotal,
    dpAmount,
    remainingAmount,
    dpPercentage
  }
}

// Usage
const breakdown = calculateDP(cartItems)
console.log(`DP: Rp ${breakdown.dpAmount.toLocaleString('id-ID')}`)
```

### Weight Formatting
```typescript
/**
 * Format weight in grams to readable string
 * < 1000g: "500g"
 * >= 1000g: "1.2kg"
 */
export function formatWeight(weightGram: number): string {
  if (weightGram < 1000) {
    return `${weightGram}g`
  }
  
  const weightKg = weightGram / 1000
  return `${weightKg.toFixed(1)}kg`
}

// Usage
<p className="text-xs text-gray-500">
  Berat: {formatWeight(product.weightGram)}
</p>
```

### Phone Number Formatting
```typescript
/**
 * Format phone number with +62 prefix
 * Input: "8123456789" or "628123456789"
 * Output: "+628123456789"
 */
export function formatPhoneNumber(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '')
  
  // Add 62 prefix if missing
  if (digits.startsWith('0')) {
    return `62${digits.substring(1)}`
  }
  
  if (digits.startsWith('62')) {
    return digits
  }
  
  return `62${digits}`
}

/**
 * Validate Indonesian phone number
 * Must be: 628XXXXXXXXX (9-13 digits after 628)
 */
export function validatePhoneNumber(phone: string): boolean {
  const pattern = /^628\d{9,13}$/
  return pattern.test(phone)
}

// Usage
const phone = formatPhoneNumber(userInput)
if (!validatePhoneNumber(phone)) {
  setError('Format nomor WhatsApp: 628XXXXXXXXX')
}
```

### Product Type Check
```typescript
/**
 * Check if cart contains goods products
 * Used to determine if address is needed
 */
export function hasGoodsInCart(cartItems: CartItem[]): boolean {
  return cartItems.some(item => item.product.type === 'goods')
}

/**
 * Get product type label in Indonesian
 */
export function getProductTypeLabel(type: 'goods' | 'tasks'): string {
  return type === 'goods' ? 'Barang' : 'Jasa'
}

/**
 * Get product type icon
 */
export function getProductTypeIcon(type: 'goods' | 'tasks'): LucideIcon {
  return type === 'goods' ? Package : UserCircle2
}

// Usage
const needsAddress = hasGoodsInCart(cartItems)
{needsAddress && <AddressNotice />}
```

---

## 4. Validation Schemas (Zod)

### Checkout Form Schema
```typescript
import { z } from 'zod'

export const checkoutFormSchema = z.object({
  participantName: z
    .string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter')
    .trim(),
  
  participantPhone: z
    .string()
    .regex(/^628\d{9,13}$/, 'Format nomor WhatsApp: 628XXXXXXXXX')
    .trim(),
  
  notes: z
    .string()
    .max(500, 'Catatan maksimal 500 karakter')
    .optional()
    .or(z.literal(''))
})

export type CheckoutFormSchema = z.infer<typeof checkoutFormSchema>

// Usage with react-hook-form
const form = useForm<CheckoutFormSchema>({
  resolver: zodResolver(checkoutFormSchema),
  defaultValues: {
    participantName: '',
    participantPhone: '',
    notes: ''
  }
})
```

---

## 5. Component File Structure

### Directory Organization
```
frontend/
├── app/
│   ├── [username]/
│   │   └── page.tsx                    # MODIFY: Add routing logic
│   └── checkout/
│       └── dp/
│           └── [tripId]/
│               └── page.tsx            # EXISTING: Keep as is
├── components/
│   ├── checkout/
│   │   ├── DPCheckoutForm.tsx          # EXISTING: Already good
│   │   ├── CheckoutFormDP.tsx          # NEW: Simplified version
│   │   ├── DPBreakdownCard.tsx         # NEW: Breakdown display
│   │   └── AddressForm.tsx             # EXISTING: Keep for later
│   ├── products/
│   │   ├── ProductCard.tsx             # MODIFY: Add type badge
│   │   ├── ProductTypeBadge.tsx        # NEW: Type badge component
│   │   └── ProductList.tsx             # MODIFY: Use enhanced card
│   └── cart/
│       ├── CartModal.tsx               # MODIFY: Add type info
│       ├── CartItemCard.tsx            # NEW: Enhanced cart item
│       └── FloatingCartButton.tsx      # EXISTING: Keep as is
├── lib/
│   ├── utils/
│   │   ├── dp-calculations.ts          # NEW: DP logic
│   │   ├── format-utils.ts             # NEW: Weight, phone format
│   │   └── validation.ts               # NEW: Custom validators
│   └── schemas/
│       └── checkout.schema.ts          # NEW: Zod schemas
└── types/
    └── checkout.types.ts               # NEW: TypeScript interfaces
```

---

## 6. Component Implementation Checklist

### Phase 1: New Components

**ProductTypeBadge.tsx**
```typescript
// File: /frontend/components/products/ProductTypeBadge.tsx

import { Package, UserCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ProductTypeBadgeProps {
  type: 'goods' | 'tasks'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showIcon?: boolean
}

export function ProductTypeBadge({ 
  type, 
  size = 'md',
  className = '',
  showIcon = true 
}: ProductTypeBadgeProps) {
  const isGoods = type === 'goods'
  
  const config = {
    label: isGoods ? 'Barang' : 'Jasa',
    icon: isGoods ? Package : UserCircle2,
    bgColor: isGoods ? 'bg-orange-500' : 'bg-purple-500'
  }
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  }
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }
  
  const Icon = config.icon
  
  return (
    <Badge 
      className={`
        ${config.bgColor} 
        text-white 
        ${sizeClasses[size]}
        flex items-center gap-1
        font-bold
        shadow-md
        ${className}
      `}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  )
}
```

**DPBreakdownCard.tsx**
```typescript
// File: /frontend/components/checkout/DPBreakdownCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Info, DollarSign } from 'lucide-react'
import { calculateDP } from '@/lib/utils/dp-calculations'
import type { CartItem } from '@/types/checkout.types'

interface DPBreakdownCardProps {
  cartItems: CartItem[]
  hasGoodsProducts?: boolean
  className?: string
}

export function DPBreakdownCard({ 
  cartItems, 
  hasGoodsProducts = false,
  className = ''
}: DPBreakdownCardProps) {
  const breakdown = calculateDP(cartItems)
  
  return (
    <Card className={`bg-blue-50 border-blue-200 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="w-5 h-5 text-blue-600" />
          Ringkasan Pembayaran
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>Rp {breakdown.subtotal.toLocaleString('id-ID')}</span>
        </div>
        
        {/* DP Amount - EMPHASIZED */}
        <div className="flex justify-between items-center font-bold text-lg text-blue-600 bg-white rounded-lg p-3 shadow-sm">
          <span>DP (20%)</span>
          <span>Rp {breakdown.dpAmount.toLocaleString('id-ID')}</span>
        </div>
        
        <Separator />
        
        {/* Remaining */}
        <div className="flex justify-between text-sm text-gray-600">
          <span>Sisa Bayar</span>
          <span>Rp {breakdown.remainingAmount.toLocaleString('id-ID')}</span>
        </div>
        
        {/* Info Notice - Conditional */}
        {hasGoodsProducts && (
          <Alert className="bg-blue-100 border-blue-300">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-800">
              <strong>Catatan:</strong> Alamat pengiriman akan diminta setelah DP dikonfirmasi jastiper. 
              Sisa pembayaran akan diinformasikan kemudian.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
```

**CheckoutFormDP.tsx (Simplified)**
```typescript
// File: /frontend/components/checkout/CheckoutFormDP.tsx

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { DPBreakdownCard } from './DPBreakdownCard'
import { CartItemCard } from '../cart/CartItemCard'
import { checkoutFormSchema, type CheckoutFormSchema } from '@/lib/schemas/checkout.schema'
import { hasGoodsInCart } from '@/lib/utils/product-utils'
import { apiPost } from '@/lib/api-client'
import type { CartItem } from '@/types/checkout.types'

interface CheckoutFormDPProps {
  cartItems: CartItem[]
  tripId: string
  onSuccess: (orderId: string) => void
  onCancel?: () => void
  className?: string
}

export function CheckoutFormDP({ 
  cartItems, 
  tripId, 
  onSuccess,
  onCancel,
  className = ''
}: CheckoutFormDPProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const form = useForm<CheckoutFormSchema>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      participantName: '',
      participantPhone: '',
      notes: ''
    }
  })
  
  const hasGoods = hasGoodsInCart(cartItems)
  
  const onSubmit = async (data: CheckoutFormSchema) => {
    setError(null)
    setIsSubmitting(true)
    
    try {
      const response = await apiPost(`/checkout/dp`, {
        tripId,
        participantName: data.participantName,
        participantPhone: data.participantPhone,
        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        })),
        notes: data.notes || undefined
      })
      
      if (response.success && response.data?.orderId) {
        onSuccess(response.data.orderId)
      } else {
        throw new Error('Checkout failed')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat checkout')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-6 ${className}`}>
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Participant Info */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Informasi Pembeli</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="participantName">
              Nama Lengkap <span className="text-red-500">*</span>
            </Label>
            <Input
              id="participantName"
              {...form.register('participantName')}
              placeholder="Nama lengkap Anda"
              className={form.formState.errors.participantName ? 'border-red-500' : ''}
            />
            {form.formState.errors.participantName && (
              <p className="text-xs text-red-500">
                {form.formState.errors.participantName.message}
              </p>
            )}
          </div>
          
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="participantPhone">
              No. WhatsApp <span className="text-red-500">*</span>
            </Label>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500">
              <span className="bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 flex items-center">
                +62
              </span>
              <Input
                id="participantPhone"
                {...form.register('participantPhone')}
                placeholder="8123456789"
                className="border-0 focus:ring-0"
              />
            </div>
            <p className="text-xs text-gray-500">Contoh: 812345678 → +62812345678</p>
            {form.formState.errors.participantPhone && (
              <p className="text-xs text-red-500">
                {form.formState.errors.participantPhone.message}
              </p>
            )}
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Catatan <span className="text-gray-500">(opsional)</span>
            </Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="Catatan tambahan untuk jastiper..."
              rows={3}
            />
            <p className="text-xs text-gray-500">
              {form.watch('notes')?.length || 0}/500 karakter
            </p>
            {form.formState.errors.notes && (
              <p className="text-xs text-red-500">
                {form.formState.errors.notes.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>🛒 Pesanan Anda ({cartItems.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cartItems.map((item) => (
            <CartItemCard 
              key={item.product.id}
              item={item}
              onUpdateQuantity={() => {}} // Read-only in checkout
              onRemove={() => {}}          // Read-only in checkout
              showActions={false}          // Hide edit buttons
            />
          ))}
        </CardContent>
      </Card>
      
      {/* DP Breakdown */}
      <DPBreakdownCard 
        cartItems={cartItems}
        hasGoodsProducts={hasGoods}
      />
      
      {/* Submit Button */}
      <div className="flex gap-2">
        {onCancel && (
          <Button 
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isSubmitting}
          >
            Batal
          </Button>
        )}
        <Button 
          type="submit"
          className="flex-1 bg-orange-500 hover:bg-orange-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memproses...
            </>
          ) : (
            `Bayar DP Sekarang`
          )}
        </Button>
      </div>
      
      <p className="text-center text-xs text-gray-500">
        Dengan melanjutkan, Anda menyetujui syarat dan ketentuan kami
      </p>
    </form>
  )
}
```

---

## 7. API Client Functions

### Checkout API
```typescript
// File: /frontend/lib/api-client.ts (add these functions)

/**
 * Submit DP checkout
 */
export async function submitDPCheckout(data: {
  tripId: string
  participantName: string
  participantPhone: string
  items: Array<{ productId: string; quantity: number }>
  notes?: string
}) {
  return apiPost<{
    success: boolean
    data: {
      orderId: string
      dpAmount: number
      paymentUrl: string
    }
  }>('/checkout/dp', data)
}

/**
 * Get products by IDs
 */
export async function getProductsByIds(tripId: string, productIds: string[]) {
  return apiGet<Product[]>(`/trips/${tripId}/products`, {
    params: { ids: productIds.join(',') }
  })
}
```

---

## 8. Testing Specifications

### Unit Tests
```typescript
// File: /frontend/__tests__/utils/dp-calculations.test.ts

import { calculateDP } from '@/lib/utils/dp-calculations'

describe('calculateDP', () => {
  it('calculates 20% DP correctly', () => {
    const cartItems = [
      { product: { price: 1000000 }, quantity: 2 }
    ]
    const result = calculateDP(cartItems)
    
    expect(result.subtotal).toBe(2000000)
    expect(result.dpAmount).toBe(400000)
    expect(result.remainingAmount).toBe(1600000)
  })
  
  it('enforces minimum DP of 10,000', () => {
    const cartItems = [
      { product: { price: 40000 }, quantity: 1 }
    ]
    const result = calculateDP(cartItems)
    
    expect(result.subtotal).toBe(40000)
    expect(result.dpAmount).toBe(10000)  // Min enforced
    expect(result.remainingAmount).toBe(30000)
  })
  
  it('rounds up to nearest 1000', () => {
    const cartItems = [
      { product: { price: 127500 }, quantity: 1 }
    ]
    const result = calculateDP(cartItems)
    
    expect(result.subtotal).toBe(127500)
    expect(result.dpAmount).toBe(26000)  // 25500 rounded up
    expect(result.remainingAmount).toBe(101500)
  })
})
```

---

**End of Component Specifications**
