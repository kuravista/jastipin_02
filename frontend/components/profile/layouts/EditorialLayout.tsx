import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Star, Search, Plus, ChevronLeft, ChevronRight, Calendar, Package, ArrowRight } from "lucide-react"
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

interface EditorialLayoutProps {
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

export function EditorialLayout({
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
}: EditorialLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Minimalist Header - Left Aligned */}
        <div className="mb-16 pb-8 border-b border-gray-200">
          <div className="flex items-start gap-6 mb-6">
            <img
              src={profile.user.avatar || "/placeholder.svg?height=80&width=80"}
              alt={profile.user.profileName}
              className="w-20 h-20 rounded-full object-cover bg-gray-100 flex-shrink-0"
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">
                  {profile.user.profileName}
                </h1>
                <Badge className="bg-amber-400 text-white border-none flex items-center gap-1 px-2 h-6 rounded-md">
                  <Star className="w-3.5 h-3.5 fill-white" />
                  {profile.user.stats.rating}
                </Badge>
              </div>
              
              {profile.user.profileBio && (
                <p className="text-gray-600 text-base leading-relaxed mb-4 max-w-xl">
                  {profile.user.profileBio}
                </p>
              )}

              {/* Stats - Minimal */}
              <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                <div>
                  <span className="font-semibold text-gray-900">{profile.user.stats.totalTrips}</span> Trips
                </div>
                <div>
                  <span className="font-semibold text-gray-900">{profile.user.stats.happyCustomers}</span> Customers
                </div>
              </div>

              {/* Social Links - Minimal Buttons */}
              {profile.user.socialMedia && profile.user.socialMedia.length > 0 && (
                <div className="flex gap-2">
                  {profile.user.socialMedia.map((social) => {
                    const config = getSocialMediaConfig(social.platform)
                    const Icon = config.icon
                    return (
                      <button
                        key={social.id}
                        onClick={() => window.open(social.url, "_blank")}
                        title={`${config.label}`}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                      >
                        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                        {config.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Trips Section */}
        {profile.trips && profile.trips.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">
              Active Journeys
            </h2>
            
            <div className="space-y-6">
              {profile.trips.map((trip, idx) => (
                <div 
                  key={trip.id}
                  className={`border-l-4 pl-6 py-4 transition-all cursor-pointer ${
                    idx === currentTripIndex 
                      ? 'border-orange-500 bg-orange-50/50' 
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  onClick={() => setCurrentTripIndex(idx)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {trip.title}
                      </h3>
                      {trip.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {trip.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {trip.deadline && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(trip.deadline).toLocaleDateString('id-ID', { 
                              day: 'numeric', 
                              month: 'long',
                              year: 'numeric'
                            })}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" />
                          {trip.spotsLeft} slots available
                        </div>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {trip.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {trip.image && (
                      <img
                        src={trip.image}
                        alt={trip.title}
                        className="w-24 h-24 object-cover rounded flex-shrink-0"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Catalog Section */}
        <div className="mb-16">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900">
              Product Collection
            </h2>
            <span className="text-sm text-gray-500">{filteredCatalog.length} items</span>
          </div>

          {/* Search Bar - Minimal */}
          <div className="mb-8">
            <div className="flex items-center gap-3 border-b border-gray-300 pb-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
              />
            </div>
          </div>

          {paginatedCatalog.length > 0 ? (
            <div className="space-y-6">
              {paginatedCatalog.map((item) => (
                <div
                  key={item.id}
                  className={`group border-b border-gray-100 pb-6 last:border-0 transition-all ${
                    !item.available && item.type !== 'tasks' ? "opacity-50" : ""
                  }`}
                >
                  <Link 
                    href={`/${username}/p/${item.slug}?tripId=${item.tripId}`}
                    className="flex gap-6 hover:opacity-75 transition-opacity"
                  >
                    <div className="w-32 h-32 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                      <img
                        src={item.image || "/placeholder.svg?height=128&width=128"}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                            {item.title}
                          </h3>
                          <Badge 
                            variant={item.available || item.type === 'tasks' ? "default" : "secondary"}
                            className="text-[10px] px-2 py-0.5 flex-shrink-0"
                          >
                            {item.available ? "In Stock" : item.type === 'tasks' ? "Available" : "Sold Out"}
                          </Badge>
                        </div>
                        {item.unit && (
                          <p className="text-sm text-gray-500 mb-2">{item.unit}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-gray-900">
                          Rp {item.price.toLocaleString('id-ID')}
                        </p>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            addToCart(item)
                          }}
                          disabled={!item.available && item.type !== 'tasks'}
                          className="px-4 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          Add to Cart
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <p>No products found</p>
            </div>
          )}

          {/* Pagination - Minimal */}
          {filteredCatalog.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-gray-500">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer - Minimal */}
        <div className="text-center pt-12 border-t border-gray-200 text-sm text-gray-400">
          <p>
            Powered by <span className="font-medium text-gray-600">Jastipin.me</span>
          </p>
        </div>
      </div>
    </div>
  )
}
