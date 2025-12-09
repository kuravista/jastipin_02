"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ProductDetailContent } from "@/components/profile/product-detail-content"
import { addToCartItem, CartProduct } from "@/lib/cart-events"
import { ThemeWrapper } from "@/components/profile/ThemeWrapper"

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
    paymentType: string
  }
  jastiper: {
    slug: string
    profileName: string
    avatar: string | null
    profileDesign?: {
      layoutId: string
      themeId: string
    }
  }
}

interface ProductDetailPageClientProps {
  data: ProductDetailResponse
  username: string
}

/**
 * Client component for product detail page
 * Handles add to cart
 */
export function ProductDetailPageClient({
  data,
  username,
}: ProductDetailPageClientProps) {
  const router = useRouter()

  const handleAction = () => {
    // For DP trips, redirect to DP checkout with query param
    if (data.trip.paymentType === 'dp') {
      router.push(`/checkout/dp/${data.trip.id}?products=${data.product.id}`)
      return
    }
    
    // For Full Payment trips, fallback to cart (or standard checkout if implemented)
    // Since "tidak perlu addtocartitem" was requested specifically for "redirect",
    // we assume there is a direct checkout URL for full payment too, 
    // BUT if not exists, we might need to fallback to add to cart + redirect to cart page?
    // For now, let's assume standard checkout is at /checkout/[tripId] or similar.
    // However, if no such page exists, we might break it.
    // Given the prompt context "checkout/dp", I will prioritize DP logic.
    // For non-DP, if no specific instruction, I'll default to Add to Cart to be safe, 
    // OR redirect to profile with cart open? 
    // User said "buat langsung Redirect to checkout page", so I should try to redirect.
    
    // Let's try to redirect to standard checkout if exists, or fallback.
    // If I look at the file structure, only `checkout/dp` exists. 
    // Maybe the user ONLY has DP trips for now or `checkout/dp` handles everything?
    // Wait, `checkout/dp` specifically checks `if (tripData.paymentType !== "dp")` and redirects away.
    // So I cannot use `checkout/dp` for full payment.
    
    // If it's NOT DP, I will fallback to "Add to Cart" behavior for now to avoid broken link,
    // UNLESS I find a general checkout page.
    // Actually, I can just implement the DP redirect as requested and leave non-DP as "Add to Cart" 
    // or just log a warning if not supported.
    
    // BUT, since the prompt specifically mentioned "Redirect to checkout page",
    // I will assume the user wants this behavior. 
    
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
    <ThemeWrapper themeId={data.jastiper.profileDesign?.themeId || 'jastip'}>
      <div className="min-h-screen theme-gradient-bg">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
            <Link
              href={`/${username}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Kembali ke {data.jastiper.profileName}</span>
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-md mx-auto px-4 py-6">
          <ProductDetailContent
            product={data.product}
            trip={data.trip}
            jastiper={data.jastiper}
            username={username}
            onAddToCart={handleAction}
            isDirectAccess={true}
          />
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-sm text-muted-foreground">
          <p>
            Powered by <span className="font-semibold theme-primary-text">Jastipin.me</span>
          </p>
        </div>
      </div>
    </ThemeWrapper>
  )
}
