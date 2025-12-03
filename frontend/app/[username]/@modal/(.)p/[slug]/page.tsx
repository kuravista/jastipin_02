"use client"

import { use, useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { ProductDetailContent } from "@/components/profile/product-detail-content"
import { addToCartItem, CartProduct } from "@/lib/cart-events"
import { getApiUrl } from "@/lib/api-client"

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
    tripId?: string
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
}

interface PageProps {
  params: Promise<{
    username: string
    slug: string
  }>
}

/**
 * Intercepted route for product detail modal
 * Shows product detail in a bottom sheet overlay on the profile page
 */
export default function ProductDetailModal({ params }: PageProps) {
  const { username, slug } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<ProductDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Get tripId from searchParams to fetch correct product when same slug exists in multiple trips
  const tripId = searchParams.get('tripId')

  const fetchProductDetail = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Include tripId in query to get the correct product when same slug exists in multiple trips
      const queryParams = tripId ? `?tripId=${tripId}` : ''
      const response = await fetch(
        `${getApiUrl()}/profile/${username}/products/${slug}${queryParams}`
      )
      
      if (!response.ok) {
        throw new Error("Product not found")
      }
      
      const result = await response.json()
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load product"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [username, slug, tripId])

  useEffect(() => {
    fetchProductDetail()
  }, [fetchProductDetail])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.back()
    }
  }

  const handleAddToCart = () => {
    if (!data) return

    const cartProduct: CartProduct = {
      id: data.product.id,
      title: data.product.title,
      price: data.product.price,
      image: data.product.image || undefined,
      tripId: data.trip.id,
      slug: data.product.slug,
      type: data.product.type,
      unit: data.product.unit || undefined,
    }

    addToCartItem(data.trip.id, cartProduct)
  }

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-3xl px-4 sm:px-6 pb-6 max-h-[85vh] overflow-y-auto"
      >
        <SheetTitle className="sr-only">
          {data?.product.title || "Detail Produk"}
        </SheetTitle>
        
        {/* Drag handle indicator */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>
        
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="text-orange-500 hover:underline"
            >
              Kembali ke profile
            </button>
          </div>
        )}

        {data && !loading && !error && (
          <ProductDetailContent
            product={data.product}
            trip={data.trip}
            jastiper={data.jastiper}
            username={username}
            onAddToCart={handleAddToCart}
            isModal
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
