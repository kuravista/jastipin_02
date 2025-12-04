import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Star, Search, Plus, ChevronLeft, ChevronRight, Calendar, Package, X } from "lucide-react"
import Link from "next/link"
import { getGradientBySeed } from "@/lib/gradient-utils"
import { getSocialMediaConfig } from "@/lib/social-media-icons"
import { useState } from "react"

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

interface ImmersiveLayoutProps {
  profile: ProfileData
  username: string
  currentTripIndex: number
  setCurrentTripIndex: (index: number) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  currentPage: number
  setCurrentPage: (page: number) => void
  paginatedCatalog: any[]
  filteredCatalog: any[]
  itemsPerPage: number
  totalPages: number
  addToCart: (product: any) => void
  handleProductClick: (product: any) => void
}

export function ImmersiveLayout({
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
}: ImmersiveLayoutProps) {
  const [showCatalog, setShowCatalog] = useState(false)

  return (
    <>
      {/* Hero Section - Full Screen with Background */}
      <div className="relative min-h-screen flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          {profile.user.coverImage ? (
            <img
              src={profile.user.coverImage}
              alt="Background"
              className="w-full h-full object-cover"
              style={{ objectPosition: `center ${profile.user.coverPosition || 50}%` }}
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${getGradientBySeed(profile.user.slug).className}`}
            />
          )}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white px-6 py-12 max-w-3xl mx-auto">
          <div className="mb-8">
            <img
              src={profile.user.avatar || "/placeholder.svg?height=120&width=120"}
              alt={profile.user.profileName}
              className="w-32 h-32 rounded-full border-4 border-white shadow-2xl object-cover bg-white mx-auto mb-6"
            />
            
            <div className="flex items-center justify-center gap-3 mb-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                {profile.user.profileName}
              </h1>
              <Badge className="bg-amber-400 text-white border-none flex items-center gap-1 px-3 py-1.5 rounded-full shadow-lg">
                <Star className="w-4 h-4 fill-white" />
                {profile.user.stats.rating}
              </Badge>
            </div>
            
            {profile.user.profileBio && (
              <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-6 max-w-2xl mx-auto">
                {profile.user.profileBio}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 text-sm mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold">{profile.user.stats.totalTrips}</div>
                <div className="text-white/70 mt-1">Trips</div>
              </div>
              <div className="w-px h-12 bg-white/30" />
              <div className="text-center">
                <div className="text-3xl font-bold">{profile.user.stats.happyCustomers}</div>
                <div className="text-white/70 mt-1">Happy Customers</div>
              </div>
            </div>

            {/* Social Links */}
            {profile.user.socialMedia && profile.user.socialMedia.length > 0 && (
              <div className="flex justify-center gap-3 mb-8">
                {profile.user.socialMedia.map((social) => {
                  const config = getSocialMediaConfig(social.platform)
                  const Icon = config.icon
                  return (
                    <button
                      key={social.id}
                      onClick={() => window.open(social.url, "_blank")}
                      title={`${config.label} - ${social.handle}`}
                      className="group p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all duration-200 border border-white/30"
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </button>
                  )
                })}
              </div>
            )}

            {/* CTA Button */}
            <Button
              onClick={() => setShowCatalog(true)}
              className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-full shadow-2xl transform hover:scale-105 transition-all"
            >
              Explore Products
            </Button>
          </div>

          {/* Trip Indicators */}
          {profile.trips && profile.trips.length > 0 && (
            <div className="mt-12">
              <p className="text-sm text-white/70 mb-4">
                {profile.trips.length} Active {profile.trips.length === 1 ? 'Trip' : 'Trips'}
              </p>
              <div className="flex justify-center gap-2">
                {profile.trips.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentTripIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentTripIndex
                        ? 'bg-white w-8'
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <button
            onClick={() => setShowCatalog(true)}
            className="text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Catalog Modal/Overlay */}
      {showCatalog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4">
            <div className="max-w-5xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8 sticky top-0 bg-black/50 backdrop-blur-md p-4 rounded-lg">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Product Catalog</h2>
                  <p className="text-sm text-white/70">{filteredCatalog.length} products available</p>
                </div>
                <button
                  onClick={() => setShowCatalog(false)}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Trip Selector */}
              {profile.trips && profile.trips.length > 0 && (
                <div className="mb-6">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {profile.trips.map((trip, idx) => (
                      <button
                        key={trip.id}
                        onClick={() => setCurrentTripIndex(idx)}
                        className={`flex-shrink-0 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                          idx === currentTripIndex
                            ? "bg-orange-500 text-white shadow-lg"
                            : "bg-white/10 text-white/80 border border-white/20 hover:bg-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[150px]">{trip.title}</span>
                          {trip.deadline && (
                            <span className="text-[10px] opacity-75">
                              {new Date(trip.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="mb-6">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3">
                  <Search className="w-5 h-5 text-white/70" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/50"
                  />
                </div>
              </div>

              {/* Product Grid */}
              {paginatedCatalog.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {paginatedCatalog.map((item) => (
                    <Card
                      key={item.id}
                      className={`overflow-hidden flex flex-col p-0 bg-white/10 backdrop-blur-md border-white/20 transition-all hover:bg-white/20 ${
                        !item.available && item.type !== 'tasks' ? "opacity-50" : ""
                      }`}
                    >
                      <Link 
                        href={`/${username}/p/${item.slug}?tripId=${item.tripId}`}
                        className="relative w-full aspect-square block cursor-pointer group/image overflow-hidden"
                      >
                        <img
                          src={item.image || "/placeholder.svg?height=200&width=200"}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-110"
                        />
                        
                        <div className="absolute top-2 left-2 right-2 flex justify-between gap-1">
                          <Badge variant={item.type === 'goods' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0.5 backdrop-blur-sm">
                            {item.type === 'goods' ? '📦' : '🔧'}
                          </Badge>
                          <Badge
                            className="text-[10px] px-1.5 py-0.5 backdrop-blur-sm"
                            variant={item.available || item.type === 'tasks' ? "default" : "secondary"}
                          >
                            {item.available ? "Available" : item.type === 'tasks' ? "Available" : "Sold Out"}
                          </Badge>
                        </div>
                      </Link>
                      
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-sm line-clamp-2 text-white mb-1">{item.title}</h3>
                          {item.unit && <p className="text-xs text-white/70 truncate">{item.unit}</p>}
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 border-t border-white/20 mt-2 gap-2">
                          <p className="text-orange-400 font-bold text-sm truncate">
                            Rp {item.price.toLocaleString('id-ID')}
                          </p>
                          <button
                            onClick={() => addToCart(item)}
                            disabled={!item.available && item.type !== 'tasks'}
                            className="text-orange-400 hover:text-orange-300 disabled:text-gray-500 transition-colors p-1.5 hover:bg-white/10 rounded-full disabled:hover:bg-transparent flex-shrink-0"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-white/70">
                  <p>No products found</p>
                </div>
              )}

              {/* Pagination */}
              {filteredCatalog.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-center gap-6 mt-6 pb-6">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-sm text-white">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Footer */}
              <div className="text-center pt-8 border-t border-white/20 text-sm text-white/50">
                <p>
                  Powered by <span className="font-semibold text-white/70">Jastipin.me</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
