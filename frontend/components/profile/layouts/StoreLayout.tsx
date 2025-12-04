import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Star, Search, Plus, ChevronLeft, ChevronRight, Calendar, Package } from "lucide-react"
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

interface StoreLayoutProps {
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

export function StoreLayout({
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
}: StoreLayoutProps) {
  return (
    <>
      {/* Compact Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src={profile.user.avatar || "/placeholder.svg?height=48&width=48"}
              alt={profile.user.profileName}
              className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover bg-white"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 truncate">{profile.user.profileName}</h1>
                <Badge className="bg-amber-400 hover:bg-amber-500 text-white border-none flex items-center gap-1 px-2 h-5 rounded-full shadow-sm flex-shrink-0">
                  <Star className="w-3 h-3 fill-white" />
                  <span className="text-xs">{profile.user.stats.rating}</span>
                </Badge>
              </div>
              {profile.user.profileBio && (
                <p className="text-xs text-gray-500 truncate">{profile.user.profileBio}</p>
              )}
            </div>
            
            {/* Social Media Icons */}
            {profile.user.socialMedia && profile.user.socialMedia.length > 0 && (
              <div className="flex gap-2 flex-shrink-0">
                {profile.user.socialMedia.slice(0, 3).map((social) => {
                  const config = getSocialMediaConfig(social.platform)
                  const Icon = config.icon
                  return (
                    <button
                      key={social.id}
                      onClick={() => window.open(social.url, "_blank")}
                      title={`${config.label} - ${social.handle}`}
                      className="group p-2 rounded-full bg-gray-50 hover:bg-orange-50 transition-all duration-200 border border-gray-100 hover:border-orange-200"
                    >
                      <Icon className={`w-4 h-4 ${config.color} opacity-80 group-hover:opacity-100`} />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 flex-1 w-full">
        {/* Trip Selector - Compact Tabs */}
        {profile.trips && profile.trips.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold text-base mb-3 flex items-center gap-2">
              ✈️ Active Trips
              {profile.trips.length > 1 && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({profile.trips.length})
                </span>
              )}
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {profile.trips.map((trip, idx) => (
                <button
                  key={trip.id}
                  onClick={() => setCurrentTripIndex(idx)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    idx === currentTripIndex
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-orange-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[120px]">{trip.title}</span>
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

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-3 shadow-sm">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {searchQuery && (
              <span className="text-xs text-gray-500">{filteredCatalog.length} results</span>
            )}
          </div>
        </div>

        {/* Product Grid - 2 Column Focus */}
        <div className="mb-6">
          <h2 className="font-bold text-base mb-4 flex items-center justify-between">
            <span>📦 Product Catalog</span>
            <span className="text-xs text-muted-foreground font-normal">
              {filteredCatalog.length} items
            </span>
          </h2>
          
          {paginatedCatalog.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {paginatedCatalog.map((item) => (
                <Card
                  key={item.id}
                  className={`overflow-hidden flex flex-col gap-0 p-0 transition-all hover:shadow-lg ${
                    !item.available && item.type !== 'tasks' ? "opacity-50" : ""
                  }`}
                >
                  <Link 
                    href={`/${username}/p/${item.slug}?tripId=${item.tripId}`}
                    className="relative w-full aspect-square flex-shrink-0 block cursor-pointer group/image overflow-hidden"
                  >
                    <img
                      src={item.image || "/placeholder.svg?height=200&width=200"}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity" />
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 right-2 flex justify-between gap-1">
                      <Badge
                        variant={item.type === 'goods' ? 'default' : 'secondary'}
                        className="text-[10px] px-2 py-0.5 backdrop-blur-sm"
                      >
                        {item.type === 'goods' ? '📦 Product' : '🔧 Service'}
                      </Badge>
                      <Badge
                        className="text-[10px] px-2 py-0.5 backdrop-blur-sm"
                        variant={item.available || item.type === 'tasks' ? "default" : "secondary"}
                      >
                        {item.available ? "In Stock" : item.type === 'tasks' ? "Available" : "Sold Out"}
                      </Badge>
                    </div>
                  </Link>
                  
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-2 break-words mb-1 leading-tight">
                        {item.title}
                      </h3>
                      {item.unit && (
                        <p className="text-xs text-gray-500 truncate">{item.unit}</p>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t mt-2 gap-2">
                      <p className="text-orange-500 font-bold text-sm sm:text-base truncate">
                        Rp {item.price.toLocaleString('id-ID')}
                      </p>
                      <button
                        onClick={() => addToCart(item)}
                        disabled={!item.available && item.type !== 'tasks'}
                        className="text-orange-500 hover:text-orange-600 disabled:text-gray-300 transition-colors p-2 hover:bg-orange-50 rounded-full disabled:hover:bg-transparent flex-shrink-0"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No products found</p>
            </div>
          )}

          {/* Pagination */}
          {filteredCatalog.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <span className="text-sm text-gray-600">
                <span className="font-semibold">{currentPage}</span> / <span className="font-semibold">{totalPages}</span>
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t text-sm text-muted-foreground">
          <p>
            Powered by <span className="font-semibold text-orange-500">Jastipin.me</span>
          </p>
        </div>
      </div>
    </>
  )
}
