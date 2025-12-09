import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CheckCircle2, Star, Search, Plus, ChevronLeft, ChevronRight, Calendar, Package, Users, TrendingUp, MapPin, ArrowRight, MoreHorizontal } from "lucide-react"
import Link from "next/link"
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

interface BentoLayoutProps {
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

export function BentoLayout({
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
}: BentoLayoutProps) {
  
  // Helper to get social media
  const allSocials = profile.user.socialMedia || []
  const displayedSocials = allSocials.slice(0, 3)
  const remainingSocials = allSocials.slice(3)
  const hasMore = remainingSocials.length > 0

  type GridItem = 
    | { type: 'social'; data: SocialMedia }
    | { type: 'more'; data: SocialMedia[] }
    | { type: 'empty' }

  // Calculate slots for the top-right quadrant (2x2 grid)
  const topRightSlots: GridItem[] = []
  
  // Add top 3 social links
  displayedSocials.forEach(social => {
    topRightSlots.push({ type: 'social', data: social })
  })

  // Add "more" button if there are extra socials
  if (hasMore) {
    topRightSlots.push({ type: 'more', data: remainingSocials })
  }
  
  // If grid is not full (less than 4 items), fill with empty slots
  // This ensures the grid layout remains stable
  while (topRightSlots.length < 4) {
    topRightSlots.push({ type: 'empty' })
  }
  
  // Ensure we only take 4 items
  const gridItems = topRightSlots.slice(0, 4)

  return (
    <div className="min-h-screen py-4 px-4 bg-gray-50/50">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* Top Section: 2x1 Grid */}
        <div className="grid grid-cols-2 gap-3 aspect-[2/1]">
          
          {/* 1. Profile Block (Top Left) */}
          <div className="col-span-1 h-full">
            <div className="h-full bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity theme-primary-bg`} />
              
              <div className="relative mb-3">
                <div className="w-16 h-16 rounded-full p-0.5 border-2 theme-primary-border overflow-hidden">
                  <img
                    src={profile.user.avatar || "/placeholder.svg?height=120&width=120"}
                    alt={profile.user.profileName}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              </div>
              
              <h1 className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-1">
                {profile.user.profileName}
              </h1>
              <p className="text-[10px] text-gray-500 font-medium line-clamp-2 px-1">
                {profile.user.profileBio || "Traveler & Creator"}
              </p>
            </div>
          </div>

          {/* 2. Social Grid (Top Right) */}
          <div className="col-span-1 h-full grid grid-cols-2 grid-rows-2 gap-3">
            {gridItems.map((item, idx) => {
              if (item.type === 'social') {
                const config = getSocialMediaConfig(item.data.platform)
                const Icon = config.icon
                return (
                  <a
                    key={`social-${idx}`}
                    href={item.data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-full bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 hover:scale-95 transition-transform group"
                    title={config.label}
                  >
                    <Icon className={`w-6 h-6 text-gray-400 group-hover:theme-primary-text transition-colors`} />
                  </a>
                )
              } else if (item.type === 'more') {
                return (
                  <DropdownMenu key={`more-${idx}`}>
                    <DropdownMenuTrigger asChild>
                      <button className="w-full h-full bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 hover:scale-95 transition-transform group cursor-pointer">
                        <MoreHorizontal className="w-6 h-6 text-gray-400 group-hover:theme-primary-text transition-colors" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {item.data.map((social) => {
                        const config = getSocialMediaConfig(social.platform)
                        const Icon = config.icon
                        return (
                          <DropdownMenuItem key={social.id} asChild>
                            <a 
                              href={social.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Icon className={`w-4 h-4 ${config.color}`} />
                              <span>{config.label}</span>
                            </a>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              } else {
                // Empty slot
                return (
                  <div 
                    key={`empty-${idx}`}
                    className="w-full h-full bg-white/50 rounded-2xl border border-gray-100/50"
                  />
                )
              }
            })}
          </div>
        </div>

        {/* 3. Active Trips Block (Middle) */}
        {profile.trips && profile.trips.length > 0 && (
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-bold text-gray-900">Active Trips</h3>
              <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                {profile.trips.length} Available
              </span>
            </div>
            
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {profile.trips.map((trip, idx) => (
                <div
                  key={trip.id}
                  onClick={() => setCurrentTripIndex(idx)}
                  className={`flex-shrink-0 w-[70%] snap-start cursor-pointer group ${
                    currentTripIndex === idx ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="relative aspect-[4/3] mb-2 overflow-hidden rounded-2xl">
                    <img
                      src={trip.image || "/placeholder.svg?height=300&width=400"}
                      alt={trip.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {currentTripIndex === idx && (
                      <div className="absolute inset-0 ring-2 theme-primary-ring rounded-2xl z-10 pointer-events-none" />
                    )}
                    <div className="absolute top-2 right-2">
                       <Badge className="bg-white/90 text-black hover:bg-white text-[10px] px-1.5 py-0 shadow-sm backdrop-blur-sm h-5">
                        {trip.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="px-1">
                    <h4 className={`text-sm font-bold mb-0.5 line-clamp-1 ${currentTripIndex === idx ? 'theme-primary-text' : 'text-gray-900'}`}>
                      {trip.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      {trip.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(trip.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {trip.spotsLeft} left
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Catalog Block (Bottom) */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-bold text-gray-900">Katalog & Jastip</h3>
            <div className="relative w-32">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-full py-1 pl-7 pr-3 text-xs outline-none focus:ring-1 theme-primary-ring"
              />
            </div>
          </div>

          {paginatedCatalog.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {paginatedCatalog.map((item) => (
                <div
                  key={item.id}
                  className="group flex flex-col gap-2"
                >
                  <Link 
                    href={`/${username}/p/${item.slug}?tripId=${item.tripId}`}
                    className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100"
                  >
                    <img
                      src={item.image || "/placeholder.svg?height=200&width=200"}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {!item.available && item.type !== 'tasks' && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                        <Badge variant="secondary" className="text-[10px]">Habis</Badge>
                      </div>
                    )}
                  </Link>
                  
                  <div className="flex items-start justify-between gap-2 px-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 line-clamp-1">{item.title}</p>
                      <p className="text-[10px] text-gray-500">Rp {item.price.toLocaleString('id-ID')}</p>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      disabled={!item.available && item.type !== 'tasks'}
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full theme-primary-bg/10 theme-primary-text hover:theme-primary-bg hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:theme-primary-text transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-xs">
              Produk tidak ditemukan
            </div>
          )}

          {/* Minimal Pagination */}
          {filteredCatalog.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6 pt-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-xs font-medium text-gray-600">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="text-center py-4 text-[10px] text-muted-foreground">
          <p>
            Powered by <span className="font-semibold theme-primary-text">Jastipin.me</span>
          </p>
        </div>

      </div>
    </div>
  )
}
