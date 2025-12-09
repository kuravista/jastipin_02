"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Share2, 
  Plus, 
  Package,
  CheckCircle2,
  XCircle,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"

interface Product {
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

interface Trip {
  id: string
  title: string
  status: string
}

interface Jastiper {
  slug: string
  profileName: string
  avatar: string | null
}

interface ProductDetailContentProps {
  product: Product
  trip: Trip
  jastiper: Jastiper
  username: string
  onAddToCart: () => void
  isModal?: boolean
}

/**
 * Shared product detail content component
 * Used by both modal and full page views
 */
export function ProductDetailContent({
  product,
  trip,
  jastiper,
  username,
  onAddToCart,
  isModal = false,
  isDirectAccess = false,
}: ProductDetailContentProps & { isDirectAccess?: boolean }) {
  const [isAdding, setIsAdding] = useState(false)

  const handleShare = async () => {
    const url = `${window.location.origin}/${username}/p/${product.slug}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} - Rp ${product.price.toLocaleString("id-ID")}`,
          url,
        })
      } catch {
        // User cancelled or share failed - do nothing
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success("Link berhasil disalin!")
    }
  }

  const handleAddToCart = () => {
    if (isDirectAccess) {
      onAddToCart()
      return
    }
    
    setIsAdding(true)
    onAddToCart()
    
    setTimeout(() => {
      setIsAdding(false)
      toast.success("Berhasil ditambahkan ke keranjang!", {
        description: product.title,
        duration: 2000,
      })
    }, 300)
  }

  return (
    <div className="flex flex-col">
      {/* Product Type Badge */}
      <div className="mb-4">
        <Badge
          variant={product.type === "goods" ? "default" : "secondary"}
          className="text-xs"
        >
          {product.type === "goods" ? "📦 Barang" : "🔧 Jasa"}
        </Badge>
      </div>

      {/* Product Image */}
      <div className="relative w-full aspect-video sm:aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-4">
        <img
          src={product.image || "/placeholder.svg?height=300&width=400"}
          alt={product.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        {/* Title & Price */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 line-clamp-2">{product.title}</h2>
            <p className="text-xl font-bold theme-primary-text mt-0.5">
              Rp {product.price.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Stock & Unit Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={product.available ? "default" : "secondary"}
            className={`text-xs ${
              product.available
                ? "bg-green-100 text-green-700 hover:bg-green-100"
                : "bg-red-100 text-red-700 hover:bg-red-100"
            }`}
          >
            {product.available ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {product.isUnlimitedStock ? "Tersedia" : `Stok: ${product.stock}`}
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 mr-1" />
                Habis
              </>
            )}
          </Badge>
          
          {product.unit && (
            <Badge variant="outline" className="text-xs text-gray-600">
              {product.unit}
            </Badge>
          )}
          
          {product.weightGram && (
            <Badge variant="outline" className="text-xs text-gray-600">
              {product.weightGram}g
            </Badge>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600 whitespace-pre-line line-clamp-4">
              {product.description}
            </p>
          </div>
        )}

        {/* Trip Info */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package className="w-4 h-4 theme-primary-text flex-shrink-0" />
            <span className="flex-shrink-0">Dari trip:</span>
            <Link 
              href={`/${username}`}
              className="font-medium theme-primary-text hover:underline flex items-center gap-1 truncate"
            >
              <span className="truncate">{trip.title}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </Link>
            <Badge
              variant="outline"
              className={`ml-auto flex-shrink-0 text-xs ${
                trip.status === "Buka" 
                  ? "border-green-500 text-green-600" 
                  : "border-gray-400 text-gray-500"
              }`}
            >
              {trip.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Action Buttons - Share next to Add to Cart */}
      <div className="flex gap-2 pt-4 mt-2 border-t">
        <Button
          onClick={handleShare}
          variant="outline"
          className="h-11 px-4"
          title="Bagikan produk"
        >
          <Share2 className="w-5 h-5" />
        </Button>
        <Button
          onClick={handleAddToCart}
          disabled={!product.available || isAdding}
          className="flex-1 theme-primary-button h-11 text-sm font-semibold"
        >
          {isAdding ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2 animate-pulse" />
              Ditambahkan!
            </>
          ) : isDirectAccess ? (
            <>
              Beli Sekarang
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Tambah ke Keranjang
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
