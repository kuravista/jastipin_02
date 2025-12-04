"use client"

import { useState, useEffect, use } from "react"
import { notFound, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ExternalLink, Instagram, MessageCircle, Heart, Calendar, MapPin, Package, CheckCircle2, Star, ChevronLeft, ChevronRight, Search, Plus, ShoppingCart, X } from "lucide-react"
import { apiGet, apiPost } from "@/lib/api-client"
import { toast } from "sonner"
import { getGradientBySeed } from "@/lib/gradient-utils"
import { ClassicLayout } from "@/components/profile/layouts/ClassicLayout"
import { StoreLayout } from "@/components/profile/layouts/StoreLayout"
import { BentoLayout } from "@/components/profile/layouts/BentoLayout"
import { EditorialLayout } from "@/components/profile/layouts/EditorialLayout"
import { ImmersiveLayout } from "@/components/profile/layouts/ImmersiveLayout"
import { ThemeWrapper } from "@/components/profile/ThemeWrapper"

interface SocialMedia {
  id: string
  platform: string
  handle: string
  url?: string
  createdAt: string
  updatedAt: string
}

interface Trip {
  id: string
  title: string
  description?: string
  image?: string
  deadline?: string
  status: string
  spotsLeft: number
  paymentType?: 'full' | 'dp'
}

interface ProfileDesign {
  id: string
  layoutId: string
  themeId: string
  updatedAt: string
}

interface ProfileData {
  user: {
    id: string
    slug: string
    profileName: string
    profileBio?: string
    avatar?: string
    coverImage?: string
    coverPosition?: number
    stats: {
      totalTrips: number
      happyCustomers: number
      rating: number
    }
    socialMedia?: SocialMedia[]
    profileDesign?: ProfileDesign
  }
  trips: Trip[]
  catalog: Array<{
    id: string
    tripId: string
    slug: string
    title: string
    price: number
    image?: string
    available: boolean
    type?: string
    unit?: string
    weightGram?: number
  }>
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTripIndex, setCurrentTripIndex] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderForm, setOrderForm] = useState({
    nama: "",
    email: "",
    jumlah: 1,
    alamat: "",
    nomor: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [cartItems, setCartItems] = useState<Array<{ product: any; quantity: number }>>([])
  const [showCart, setShowCart] = useState(false)
  
  const itemsPerPage = 10

  // Filter catalog: sesuai current trip (jika tripId ada) + search filter
  const currentTrip = profile?.trips?.[currentTripIndex]

  // Clear cart dan reset page ketika user berganti trip
  useEffect(() => {
    setCartItems([])
    setShowCart(false)
    setCurrentPage(1)
  }, [currentTripIndex])

  // Listen for cart updates from modal
  useEffect(() => {
    const handleCartUpdate = (event: CustomEvent<{ tripId: string; items: Array<{ product: any; quantity: number }> }>) => {
      const { tripId, items } = event.detail
      // Only update if it's for the current trip
      if (currentTrip?.id === tripId) {
        setCartItems(items)
      }
    }

    window.addEventListener('jastipin-cart-updated', handleCartUpdate as EventListener)
    return () => {
      window.removeEventListener('jastipin-cart-updated', handleCartUpdate as EventListener)
    }
  }, [currentTrip?.id])

  const filteredCatalog = profile?.catalog.filter((item) => {
    // Jika product punya tripId, hanya tampilkan product dari trip yang currently selected
    if (item.tripId && item.tripId !== currentTrip?.id) return false
    // Apply search filter
    return item.title.toLowerCase().includes(searchQuery.toLowerCase())
  }) || []
  const totalPages = Math.ceil(filteredCatalog.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCatalog = filteredCatalog.slice(startIndex, endIndex)

  // Cart functions
  const addToCart = (product: any) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      )
    }
  }


  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await apiGet<ProfileData>(`/profile/${username}`)
        setProfile(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [username])

  // SEO: Update meta tags and JSON-LD schema when profile loads
  useEffect(() => {
    if (!profile) return

    const profileName = profile.user.profileName
    const bio = profile.user.profileBio || ''
    const description = bio.substring(0, 160) + (bio.length > 160 ? '...' : '')
    const avatarUrl = profile.user.avatar || '/default-avatar.png'
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://jastipin.me'

    // Update document title
    document.title = `${profileName} (@${username}) | Jastipin`

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attr = property ? 'property' : 'name'
      let tag = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(attr, name)
        document.head.appendChild(tag)
      }
      tag.content = content
    }

    // Standard meta tags
    updateMetaTag('description', description)

    // Open Graph tags
    updateMetaTag('og:title', `${profileName} (@${username})`, true)
    updateMetaTag('og:description', description, true)
    updateMetaTag('og:image', avatarUrl, true)
    updateMetaTag('og:url', `${siteUrl}/${username}`, true)
    updateMetaTag('og:type', 'profile', true)

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary')
    updateMetaTag('twitter:title', `${profileName} (@${username})`)
    updateMetaTag('twitter:description', description)
    updateMetaTag('twitter:image', avatarUrl)

    // JSON-LD Schema Markup
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'Person',
        name: profileName,
        description: bio,
        image: avatarUrl,
        url: `${siteUrl}/${username}`,
        identifier: username,
        ...(profile.user.socialMedia && profile.user.socialMedia.length > 0 && {
          sameAs: profile.user.socialMedia.map((social: SocialMedia) => social.url).filter(Boolean)
        }),
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: profile.user.stats.rating,
          reviewCount: profile.user.stats.happyCustomers,
          bestRating: 5
        }
      }
    }

    // Remove existing JSON-LD if present
    const existingScript = document.getElementById('profile-jsonld')
    if (existingScript) {
      existingScript.remove()
    }

    // Add new JSON-LD
    const script = document.createElement('script')
    script.id = 'profile-jsonld'
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(jsonLd)
    document.head.appendChild(script)

    // Cleanup function
    return () => {
      const scriptToRemove = document.getElementById('profile-jsonld')
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [profile, username])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-violet-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error && !profile) {
    return notFound()
  }

  if (!profile) {
    return notFound()
  }

  // Smart routing based on trip payment type
  const handleCheckout = () => {
    const currentTrip = profile?.trips?.[currentTripIndex]

    if (!currentTrip?.id) {
      toast.error("Trip tidak ditemukan")
      return
    }

    if (!cartItems.length) {
      toast.error("Keranjang kosong")
      return
    }

    // Save cart to localStorage for checkout page
    localStorage.setItem(`cart_${currentTrip.id}`, JSON.stringify(cartItems))

    // Redirect to checkout page
    router.push(`/checkout/dp/${currentTrip.id}`)
  }

  const handleProductClick = (product: any) => {
    setSelectedProduct(product)
    setOrderDialogOpen(true)
    setOrderForm({ nama: "", email: "", jumlah: 1, alamat: "", nomor: "" })
  }

  const handleOrderSubmit = async () => {
    if (!orderForm.nama || !orderForm.email || !orderForm.alamat || !orderForm.nomor || orderForm.jumlah < 1) {
      toast.error("Semua field harus diisi!")
      return
    }

    try {
      const tripId = profile?.trips?.[currentTripIndex]?.id
      if (!tripId) {
        toast.error("Trip tidak ditemukan")
        return
      }

      // Validasi nomor WhatsApp format
      if (!/^628\d{9,}$/.test(orderForm.nomor)) {
        toast.error("Nomor WhatsApp harus format 628XXXXXXXXX")
        return
      }

      const response = await apiPost(`/trips/${tripId}/orders`, {
        productId: selectedProduct.id,
        quantity: orderForm.jumlah,
        participantPhone: orderForm.nomor,
        notes: selectedProduct.title,
      })

      toast.success("Pesanan berhasil dibuat!")
      setOrderDialogOpen(false)
      setOrderForm({ nama: "", email: "", jumlah: 1, alamat: "", nomor: "" })
    } catch (error: any) {
      console.error("Order error:", error)
      toast.error(error.message || "Gagal membuat pesanan")
    }
  }


  const layoutProps = {
    profile,
    username,
    currentTripIndex,
    setCurrentTripIndex,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    paginatedCatalog,
    filteredCatalog,
    itemsPerPage,
    totalPages,
    addToCart,
    handleProductClick,
  }

  const renderLayout = () => {
    const layoutId = profile?.user?.profileDesign?.layoutId || 'classic'
    
    switch (layoutId) {
      case 'store':
        return <StoreLayout {...layoutProps} />
      case 'bento':
        return <BentoLayout {...layoutProps} />
      case 'editorial':
        return <EditorialLayout {...layoutProps} />
      case 'immersive':
        return <ImmersiveLayout {...layoutProps} />
      case 'classic':
      default:
        return <ClassicLayout {...layoutProps} />
    }
  }

  return (
    <ThemeWrapper themeId={profile?.user?.profileDesign?.themeId || 'jastip'}>
      <div 
        className="min-h-screen flex flex-col"
        style={{ 
          background: `linear-gradient(to bottom right, 
            color-mix(in srgb, var(--color-secondary, #fff) 30%, white),
            white,
            color-mix(in srgb, var(--color-secondary, #fff) 20%, white)
          )`
        }}
      >
        
        {renderLayout()}

        {/* Order Dialog */}
        <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Form Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProduct && (
              <div className="bg-orange-50 p-3 rounded-lg mb-4">
                <p className="text-sm font-semibold">{selectedProduct.title}</p>
                <p className="text-sm text-orange-600">Rp {selectedProduct.price.toLocaleString('id-ID')}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="nama">Nama</Label>
              <Input
                id="nama"
                placeholder="Masukkan nama Anda"
                value={orderForm.nama}
                onChange={(e) => setOrderForm({...orderForm, nama: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Masukkan email Anda"
                value={orderForm.email}
                onChange={(e) => setOrderForm({...orderForm, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomor">Nomor WhatsApp</Label>
              <div className="flex border border-gray-300 rounded-md overflow-hidden focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500">
                <span className="bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 flex items-center whitespace-nowrap">+62</span>
                <Input
                  id="nomor"
                  type="tel"
                  placeholder="812345678"
                  value={orderForm.nomor}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setOrderForm({...orderForm, nomor: val ? '62' + val : ''})
                  }}
                  className="flex-1 border-0 outline-none focus:ring-0 px-3"
                />
              </div>
              <p className="text-xs text-gray-500">Contoh: 812345678 → +62812345678</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jumlah">Jumlah Order</Label>
              <Input
                id="jumlah"
                type="number"
                min="1"
                placeholder="Masukkan jumlah"
                value={orderForm.jumlah}
                onChange={(e) => setOrderForm({...orderForm, jumlah: parseInt(e.target.value) || 1})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Input
                id="alamat"
                placeholder="Masukkan alamat lengkap"
                value={orderForm.alamat}
                onChange={(e) => setOrderForm({...orderForm, alamat: e.target.value})}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setOrderDialogOpen(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                onClick={handleOrderSubmit}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Pesan Sekarang
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Cart Button - z-[60] to stay above sheet modal (z-50) */}
      {cartItems.length > 0 && (
        <button
          onClick={() => setShowCart(!showCart)}
          className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-4 shadow-2xl z-[60] transition-transform hover:scale-110"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center p-0 text-xs">
              {cartItems.length}
            </Badge>
          </div>
        </button>
      )}

      {/* Cart Detail Modal */}
      {cartItems.length > 0 && showCart && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-96 overflow-y-auto p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-lg">Checkout ({cartItems.length})</span>
              </div>
              <button onClick={() => setShowCart(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-semibold line-clamp-1">{item.product.title}</p>
                    <p className="text-xs text-gray-600">Rp {item.product.price.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="text-xs px-1.5 py-0.5 bg-gray-200 hover:bg-gray-300 rounded font-semibold"
                    >
                      -
                    </button>
                    <span className="text-xs font-semibold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="text-xs px-1.5 py-0.5 bg-gray-200 hover:bg-gray-300 rounded font-semibold"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={handleCheckout}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              Checkout Sekarang
            </Button>
          </div>
        </div>
      )}


    </div>
    </ThemeWrapper>
  )
}
