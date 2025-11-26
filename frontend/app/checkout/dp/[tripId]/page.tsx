"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import DPCheckoutForm from "@/components/checkout/DPCheckoutForm"
import { apiGet } from "@/lib/api-client"
import { Loader2 } from "lucide-react"

interface Product {
  id: string
  title: string
  price: number
  type: "goods" | "tasks"
  unit?: string
  stock?: number | null
  image?: string
}

interface Trip {
  id: string
  title: string
  paymentType: string
  jastiper?: {
    slug: string
    name: string
  }
}

export default function DPCheckoutPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const tripId = params.tripId as string
  const productsParam = searchParams.get("products")
  const itemsParam = searchParams.get("items")
  
  const [trip, setTrip] = useState<Trip | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [cartItems, setCartItems] = useState<Array<{ productId: string; quantity: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchTripAndProducts()
  }, [tripId])

  const fetchTripAndProducts = async () => {
    try {
      setLoading(true)

      // Fetch trip details (PUBLIC endpoint - no auth required)
      const tripData = await apiGet(`/trips/${tripId}/public`)

      // Check if trip supports DP payment
      if (tripData.paymentType !== "dp") {
        // Redirect to regular checkout if trip doesn't support DP
        router.push(`/${tripData.jastiper?.slug || ""}`)
        return
      }

      setTrip(tripData)

      // Parse items from URL params OR localStorage
      let items: Array<{ productId: string; quantity: number }> = []

      if (itemsParam) {
        // Multiple items from cart: "prod1:2,prod2:1"
        items = itemsParam.split(",").map(item => {
          const [productId, quantity] = item.split(":")
          return { productId, quantity: parseInt(quantity) || 1 }
        })
      } else if (productsParam) {
        // Single product: "prod1"
        items = [{ productId: productsParam, quantity: 1 }]
      } else {
        // Try to load from localStorage (new flow from profile page)
        const savedCart = localStorage.getItem(`cart_${tripId}`)
        if (savedCart) {
          try {
            const cartData = JSON.parse(savedCart)
            // Convert from cart format { product: {...}, quantity: number } to items format
            items = cartData.map((item: any) => ({
              productId: item.product.id,
              quantity: item.quantity
            }))
          } catch (e) {
            console.error('Failed to parse cart from localStorage:', e)
          }
        }

        if (items.length === 0) {
          setError("No products selected")
          return
        }
      }

      setCartItems(items)

      // Fetch product details
      const productIds = items.map(i => i.productId)
      const productsData = await apiGet(`/trips/${tripId}/products`, {
        params: { ids: productIds.join(",") }
      })

      setProducts(productsData)

    } catch (err: any) {
      console.error("Failed to fetch trip/products:", err)
      setError(err.message || "Failed to load checkout")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-primary hover:underline"
          >
            Kembali
          </button>
        </div>
      </div>
    )
  }

  if (!trip || products.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            ← Kembali
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{trip.title}</h1>
          <p className="text-sm text-gray-600">Checkout dengan sistem DP</p>
        </div>

        {/* DP Checkout Form */}
        <DPCheckoutForm
          tripId={tripId}
          products={products}
          items={cartItems}
          jastiperSlug={trip.jastiper?.slug}
        />
      </div>
    </div>
  )
}
