"use client"

export const runtime = 'edge';

import { useState, useEffect, use } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ExternalLink, Instagram, MessageCircle, Heart, Calendar, MapPin, Package, CheckCircle2, Star, ChevronLeft, ChevronRight, Search, Plus, ShoppingCart, X } from "lucide-react"
import { apiGet, apiPost, searchShippingDestinations, calculateShippingCost } from "@/lib/api-client"
import { toast } from "sonner"
import { getGradientBySeed } from "@/lib/gradient-utils"
import { getSocialMediaConfig } from "@/lib/social-media-icons"

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
}

interface ProfileData {
  user: {
    id: string
    slug: string
    profileName: string
    profileBio?: string
    avatar?: string
    coverImage?: string
    stats: {
      totalTrips: number
      happyCustomers: number
      rating: number
    }
    socialMedia?: SocialMedia[]
  }
  trips?: Trip[]
  catalog: Array<{
    id: string
    title: string
    price: number
    image?: string
    available: boolean
  }>
}

// Fallback demo data for development
const demoProfiles = {
  tina: {
    name: "Tina Jastip",
    username: "tina",
    bio: "🇺🇸 NYC based | Sneaker & Fashion Hunter\n✈️ Trip bulanan | Trusted 3+ tahun",
    avatar: "/indonesian-woman-profile-1.jpg",
    coverImage: "/new-york-street.jpg",
    stats: {
      totalTrips: 47,
      happyCustomers: 320,
      rating: 4.9,
    },
    currentTrip: {
      title: "Fall Sale — Nike & Adidas Sneakers",
      image: "/athletic-shoes.jpg",
      location: "New York, USA",
      deadline: "25 Nov 2024",
      status: "Buka",
      spotsLeft: 12,
    },
    catalog: [
      { name: "Nike Air Max", price: "Rp 2.1jt", image: "/athletic-shoes.jpg", available: true },
      { name: "Adidas Ultraboost", price: "Rp 2.4jt", image: "/athletic-shoes.jpg", available: true },
      { name: "New Balance 574", price: "Rp 1.8jt", image: "/athletic-shoes.jpg", available: false },
    ],
    social: {
      instagram: "tina_jastip",
      whatsapp: "+628123456789",
    },
  },
  ana: {
    name: "Ana Shop",
    username: "ana",
    bio: "🇰🇷 Seoul Beauty Expert | K-Beauty Specialist\n💄 Skincare & Makeup | Authentic guarantee",
    avatar: "/indonesian-woman-profile-2.jpg",
    coverImage: "/seoul-beauty-store.jpg",
    stats: {
      totalTrips: 62,
      happyCustomers: 580,
      rating: 5.0,
    },
    currentTrip: {
      title: "Korea Beauty Haul — December Edition",
      image: "/korean-beauty-products.jpg",
      location: "Seoul, South Korea",
      deadline: "30 Nov 2024",
      status: "Buka",
      spotsLeft: 8,
    },
    catalog: [
      { name: "COSRX Snail Mucin", price: "Rp 280k", image: "/korean-beauty-products.jpg", available: true },
      { name: "Laneige Cream Skin", price: "Rp 420k", image: "/korean-beauty-products.jpg", available: true },
      { name: "Innisfree Green Tea", price: "Rp 190k", image: "/korean-beauty-products.jpg", available: true },
    ],
    social: {
      instagram: "ana_shop",
      whatsapp: "+628234567890",
    },
  },
  sg: {
    name: "Jastip SG",
    username: "sg",
    bio: "🇸🇬 Singapore Electronics & Tech Gadgets\n⚡ Fast shipping | Official warranty",
    avatar: "/indonesian-man-profile.jpg",
    coverImage: "/singapore-electronics-mall.jpg",
    stats: {
      totalTrips: 89,
      happyCustomers: 1240,
      rating: 4.8,
    },
    currentTrip: {
      title: "Singapore Electronics — Black Friday Deals",
      image: "/electronics-gadget.jpg",
      location: "Singapore",
      deadline: "28 Nov 2024",
      status: "Buka",
      spotsLeft: 15,
    },
    catalog: [
      { name: "AirPods Pro", price: "Rp 3.2jt", image: "/electronics-gadget.jpg", available: true },
      { name: "Apple Watch Series 9", price: "Rp 6.5jt", image: "/electronics-gadget.jpg", available: true },
      { name: "iPad Air", price: "Rp 8.9jt", image: "/electronics-gadget.jpg", available: false },
    ],
    social: {
      instagram: "jastip.sg",
      whatsapp: "+628345678901",
    },
  },
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
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
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState({
    nama: "",
    email: "",
    nomor: "",
    alamat: "",
    cityId: "",
    cityName: "",
    districtId: "",
  })
  const [locationSearch, setLocationSearch] = useState("")
  const [locationResults, setLocationResults] = useState<any[]>([])
  const [shippingOptions, setShippingOptions] = useState<any[]>([])
  const [selectedShipping, setSelectedShipping] = useState<any>(null)
  const [loadingShipping, setLoadingShipping] = useState(false)
  const itemsPerPage = 10

  // Calculate total price from cart
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

  // Filter and paginate catalog
  const filteredCatalog = profile?.catalog.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []
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

  const handleCheckoutSubmit = async () => {
    if (!checkoutForm.nama || !checkoutForm.email || !checkoutForm.nomor || !checkoutForm.alamat) {
      toast.error("Semua field harus diisi")
      return
    }

    if (!selectedShipping) {
      toast.error("Silakan pilih kurir pengiriman terlebih dahulu")
      return
    }

    try {
      // Validasi nomor WhatsApp format
      if (!/^628\d{9,}$/.test(checkoutForm.nomor)) {
        toast.error("Nomor WhatsApp harus format 628XXXXXXXXX")
        return
      }

      const tripId = profile?.trips?.[currentTripIndex]?.id
      if (!tripId) {
        toast.error("Trip tidak ditemukan")
        return
      }

      // Format items untuk checkout
      const checkoutItems = cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        notes: `${item.product.title} - ${selectedShipping.service}`,
      }))

      const totalWithShipping = totalPrice + selectedShipping.cost

      const response = await apiPost(`/trips/${tripId}/checkout`, {
        participantName: checkoutForm.nama,
        participantEmail: checkoutForm.email,
        participantPhone: checkoutForm.nomor,
        participantAddress: checkoutForm.alamat,
        participantCityId: checkoutForm.cityId,
        participantCityName: checkoutForm.cityName,
        shippingCourier: selectedShipping.courier,
        shippingService: selectedShipping.service,
        shippingCost: selectedShipping.cost,
        items: checkoutItems,
      })

      toast.success(`Checkout berhasil! Total: Rp ${totalWithShipping.toLocaleString('id-ID')}`)
      setCartItems([])
      setCheckoutForm({ nama: "", email: "", nomor: "", alamat: "", cityId: "", cityName: "", districtId: "" })
      setSelectedShipping(null)
      setLocationResults([])
      setShippingOptions([])
      setShowCheckoutForm(false)
      setShowCart(false)
    } catch (error: any) {
      console.error("Checkout error:", error)
      toast.error(error.message || "Gagal melakukan checkout")
    }
  }

  // Search location for address
  const handleLocationSearch = async (query: string) => {
    setLocationSearch(query)
    if (query.length < 2) {
      setLocationResults([])
      return
    }

    try {
      const results = await searchShippingDestinations(query)
      setLocationResults(results?.data || [])
    } catch (error) {
      console.error("Location search error:", error)
      setLocationResults([])
    }
  }

  // Calculate shipping cost
  const handleCalculateShipping = async () => {
    if (!checkoutForm.cityId) {
      toast.error("Silakan pilih kota pengiriman")
      return
    }

    // Use Jakarta (31555) as default origin city for all shipments
    const originCity = "31555"
    // Use districtId if available (numeric), fallback to cityId
    const destinationCity = checkoutForm.districtId || checkoutForm.cityId
    
    setLoadingShipping(true)
    try {
      const results = await calculateShippingCost(originCity, destinationCity)
      setShippingOptions(results?.data || [])
      
      if (!results?.data || results.data.length === 0) {
        toast.error("Tidak ada opsi pengiriman tersedia")
      } else {
        toast.success(`Ditemukan ${results.data.length} opsi pengiriman`)
      }
    } catch (error: any) {
      toast.error("Gagal menghitung biaya pengiriman")
      console.error("Shipping calculation error:", error)
    } finally {
      setLoadingShipping(false)
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
        const fallback = demoProfiles[username as keyof typeof demoProfiles]
        if (fallback) {
          setProfile({
            user: {
              ...fallback,
              stats: fallback.stats,
              social: fallback.social,
            },
            currentTrip: fallback.currentTrip,
            catalog: fallback.catalog.map((c) => ({
              ...c,
              id: c.name,
            })),
          } as any)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [username])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-violet-50">
      {/* Demo Banner */}
      {!error && (
        <Link href="/">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 text-center cursor-pointer hover:from-orange-600 hover:to-orange-700 transition-all duration-200 active:opacity-90">
            <p className="text-sm font-medium">
              🚀 Mulai Bisnis Jastip Anda Sekarang! Gratis Selamanya — Kelola Pesanan, Pelanggan & Pembayaran dengan Mudah
            </p>
          </div>
        </Link>
      )}

      <div className="relative w-full h-48 overflow-hidden rounded-b-3xl">
        {profile.user.coverImage ? (
          <img
            src={profile.user.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${getGradientBySeed(profile.user.slug).className}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Profile Container - Link-in-bio style */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        {/* Profile Header */}
        <div className="text-center mb-6 -mt-20 relative z-10">
          <div className="inline-block relative mb-3">
            <img
              src={profile.user.avatar || "/placeholder.svg?height=120&width=120"}
              alt={profile.user.profileName}
              className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover"
            />
            <Badge className="absolute bottom-0 right-0 bg-green-500 border-2 border-white">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Aktif
            </Badge>
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold">{profile.user.profileName}</h1>
            <Badge className="bg-yellow-500 text-white border-none flex items-center gap-1">
              <Star className="w-3 h-3 fill-white" />
              {profile.user.stats.rating}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mb-3 whitespace-pre-line text-pretty text-center">{profile.user.profileBio}</p>

        </div>

        {/* Trips Card with Next/Prev Navigation */}
        {profile.trips && profile.trips.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">✈️ {profile.trips.length > 1 ? `${profile.trips.length} Active Trips` : 'Trip'}</h3>
              {profile.trips.length > 1 && (
                <span className="text-xs text-muted-foreground">{currentTripIndex + 1} / {profile.trips.length}</span>
              )}
            </div>

            <div className="relative">
              {/* Current Trip Card - Full Overlay */}
              <div className="overflow-hidden border-2 border-orange-500 shadow-md rounded-lg">
                {/* Image + Content Overlay */}
                <div className="relative h-80 bg-white">
                  {/* Image */}
                  <img
                    src={profile.trips[currentTripIndex].image || "/placeholder.svg?height=320&width=400"}
                    alt={profile.trips[currentTripIndex].title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  
                  {/* White Gradient Overlay - from top to bottom */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/20 to-white/80"></div>
                  
                  {/* Status Badge */}
                  <Badge className="absolute top-3 right-3 bg-green-500 text-sm">{profile.trips[currentTripIndex].status}</Badge>
                  
                  {/* Trip Counter */}
                  <div className="absolute top-3 left-3 text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded">
                    {currentTripIndex + 1} / {profile.trips.length}
                  </div>
                  
                  {/* Content: 2 Columns - OVERLAY at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 flex bg-black/50">
                    {/* Left: Text Content */}
                    <div className="flex-1 p-3 text-white space-y-1 flex flex-col justify-between">
                      <div>
                        <h1 className="font-bold text-sm line-clamp-1">{profile.trips[currentTripIndex].title}</h1>
                        {profile.trips[currentTripIndex].description && (
                          <p className="text-xs text-gray-200 line-clamp-2 mt-0.5">{profile.trips[currentTripIndex].description}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Right: Button + Deadline */}
                    <div className="flex flex-col items-end justify-between p-3">
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white hover:text-white h-8 px-4 text-xs font-semibold whitespace-nowrap">
                        Ikut Sekarang
                      </Button>
                      {profile.trips[currentTripIndex].deadline && (
                        <div className="flex items-center gap-1 text-white text-xs">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(profile.trips[currentTripIndex].deadline!).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              {profile.trips.length > 1 && (
                <div className="flex gap-2 mt-3 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentTripIndex((currentTripIndex - 1 + profile.trips!.length) % profile.trips!.length)}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentTripIndex((currentTripIndex + 1) % profile.trips!.length)}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Catalog Preview */}
        {profile.catalog.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="font-bold text-lg">📦 Katalog Barang</h3>
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 w-48">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Cari barang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {paginatedCatalog.map((item) => (
                <Card 
                  key={item.id} 
                  className={`overflow-hidden flex flex-col p-0 transition-all ${!item.available ? "opacity-50" : ""}`}
                >
                  <div className="relative w-full h-32 flex-shrink-0">
                    <img
                      src={item.image || "/placeholder.svg?height=128&width=200"}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 right-2" variant={item.available ? "default" : "secondary"}>
                      {item.available ? "Tersedia" : "Habis"}
                    </Badge>
                  </div>
                  <div className="p-1 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="font-semibold text-xl line-clamp-2">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{profile?.trips?.[0]?.title || "Trip"}</p>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <p className="text-orange-500 font-bold text-sm">Rp {item.price.toLocaleString('id-ID')}</p>
                      <button 
                        onClick={() => addToCart(item)}
                        className="text-orange-500 hover:text-orange-600 transition-colors p-1 hover:bg-orange-50 rounded"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {filteredCatalog.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Sebelumnya
                </button>
                <span className="text-sm text-gray-600">
                  Halaman <span className="font-semibold">{currentPage}</span> dari <span className="font-semibold">{totalPages}</span>
                  <span className="ml-2 text-xs text-gray-500">({filteredCatalog.length} item)</span>
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Social Links - Icon Only in One Line */}
        {profile.user.socialMedia && profile.user.socialMedia.length > 0 && (
          <div className="flex justify-center gap-4 mb-8">
            {profile.user.socialMedia.map((social) => {
              const config = getSocialMediaConfig(social.platform)
              const Icon = config.icon
              return (
                <button
                  key={social.id}
                  onClick={() => window.open(social.url, "_blank")}
                  title={`${config.label} - ${social.handle}`}
                  className="group relative p-3 rounded-full bg-gray-100 hover:bg-orange-500 transition-all duration-200 transform hover:scale-110"
                >
                  <Icon className={`w-6 h-6 ${config.color} group-hover:text-white transition-colors`} />
                </button>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            Powered by <span className="font-semibold text-orange-500">Jastipin.me</span>
          </p>
        </div>
      </div>

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

      {/* Floating Cart Button */}
      {cartItems.length > 0 && (
        <button
          onClick={() => setShowCart(!showCart)}
          className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-4 shadow-2xl z-40 transition-transform hover:scale-110"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
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
              onClick={() => {
                setShowCheckoutForm(true)
                // Reset checkout form and related states
                setCheckoutForm({ nama: "", email: "", nomor: "", alamat: "", cityId: "", cityName: "", districtId: "" })
                setLocationSearch("")
                setSelectedShipping(null)
                setShippingOptions([])
                setLocationResults([])
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              Checkout Sekarang
            </Button>
          </div>
        </div>
      )}

      {/* Checkout Form Dialog */}
      {showCheckoutForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Informasi Checkout</h2>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">Ringkasan Order:</h3>
              <div className="space-y-1 mb-3">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>{item.product.title} x{item.quantity}</span>
                    <span>Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-orange-500">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={checkoutForm.nama}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, nama: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={checkoutForm.email}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nomor WhatsApp</label>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500">
                  <span className="bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 flex items-center whitespace-nowrap">+62</span>
                  <input
                    type="tel"
                    placeholder="812345678"
                    value={checkoutForm.nomor.replace(/^62/, '')}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '')
                      setCheckoutForm({ ...checkoutForm, nomor: val })
                    }}
                    className="flex-1 border-0 outline-none focus:ring-0 px-3 py-2 text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Contoh: 812345678 → +62812345678</p>
              </div>

              {/* Address Search with Autocomplete */}
              <div>
                <label className="block text-sm font-medium mb-1">Kota/Daerah Pengiriman</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari kota (Jakarta, Bandung, dll)"
                    value={locationSearch}
                    onChange={(e) => handleLocationSearch(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500"
                  />
                  
                  {/* Autocomplete Dropdown */}
                  {locationSearch && locationResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                      {locationResults.map((loc: any) => (
                        <div
                          key={loc.id}
                          onClick={() => {
                            setCheckoutForm({
                              ...checkoutForm,
                              cityId: loc.id,
                              cityName: loc.name,
                              districtId: loc.districtId || loc.id,
                            })
                            setLocationSearch(loc.name)
                            setLocationResults([])
                          }}
                          className="px-3 py-2 text-sm hover:bg-orange-50 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="font-medium">{loc.name}</div>
                          {loc.province_name && (
                            <div className="text-xs text-gray-500">{loc.province_name}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {checkoutForm.cityName && (
                  <p className="text-xs text-green-600 mt-1">✓ Terpilih: {checkoutForm.cityName}</p>
                )}
              </div>

              {/* Shipping Calculator */}
              {checkoutForm.cityId && !selectedShipping && (
                <button
                  onClick={handleCalculateShipping}
                  disabled={loadingShipping}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-3 rounded-lg text-sm font-medium transition"
                >
                  {loadingShipping ? "Menghitung..." : "Hitung Biaya Pengiriman"}
                </button>
              )}

              {/* Shipping Options */}
              {shippingOptions.length > 0 && !selectedShipping && (
                <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                  <h4 className="text-sm font-semibold mb-2">Pilih Kurir Pengiriman:</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {shippingOptions.map((option: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedShipping(option)}
                        className="w-full text-left p-2 border border-blue-300 rounded hover:bg-blue-100 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm">
                              {option.courier.toUpperCase()} - {option.service}
                            </div>
                            <div className="text-xs text-gray-600">
                              {option.description} (EST: {option.etd} hari)
                            </div>
                          </div>
                          <div className="font-bold text-orange-500 text-sm">
                            Rp {option.cost.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Shipping Info */}
              {selectedShipping && (
                <div className="border-2 border-green-400 rounded-lg p-3 bg-green-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-sm">
                        ✓ {selectedShipping.courier.toUpperCase()} - {selectedShipping.service}
                      </div>
                      <div className="text-xs text-gray-600">
                        {selectedShipping.description} (EST: {selectedShipping.etd} hari)
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedShipping(null)
                        setShippingOptions([])
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Ubah
                    </button>
                  </div>
                  <div className="text-sm font-bold text-orange-600">
                    Biaya Pengiriman: Rp {selectedShipping.cost.toLocaleString('id-ID')}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Alamat Lengkap</label>
                <textarea
                  placeholder="Jl. Contoh No. 123, RT/RW..."
                  value={checkoutForm.alamat}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, alamat: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500 resize-none h-16"
                />
              </div>
            </div>

            {/* Updated Total with Shipping */}
            <div className="border-t pt-3 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Subtotal:</span>
                <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
              {selectedShipping && (
                <div className="flex justify-between text-sm mb-2">
                  <span>Pengiriman:</span>
                  <span>Rp {selectedShipping.cost.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg text-orange-600 border-t pt-2">
                <span>Total:</span>
                <span>
                  Rp {(totalPrice + (selectedShipping?.cost || 0)).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCheckoutForm(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-black"
              >
                Batal
              </Button>
              <Button
                onClick={handleCheckoutSubmit}
                disabled={!checkoutForm.nama || !checkoutForm.email || !checkoutForm.nomor || !checkoutForm.alamat || !checkoutForm.cityId || !selectedShipping}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white"
              >
                Pesan Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
