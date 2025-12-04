import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Star, Search, Plus, ChevronLeft, ChevronRight, Calendar, Package, Users, TrendingUp } from "lucide-react"
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
  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Profile Card - Tall */}
          <div className="md:col-span-1 md:row-span-2">
            <Card className="p-6 h-full flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-sm">
              <div className="relative mb-4">
                <img
                  src={profile.user.avatar || "/placeholder.svg?height=120&width=120"}
                  alt={profile.user.profileName}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                />
                <Badge className="absolute bottom-0 right-0 bg-green-500 border-2 border-white rounded-full p-0.5 w-6 h-6 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </Badge>
              </div>
              
              <h1 className="text-xl font-bold text-gray-900 mb-1">{profile.user.profileName}</h1>
              <Badge className="bg-amber-400 hover:bg-amber-500 text-white border-none flex items-center gap-1 px-2 h-6 rounded-full shadow-sm mb-3">
                <Star className="w-3 h-3 fill-white" />
                {profile.user.stats.rating}
              </Badge>
              
              {profile.user.profileBio && (
                <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">
                  {profile.user.profileBio}
                </p>
              )}

              {/* Social Links */}
              {profile.user.socialMedia && profile.user.socialMedia.length > 0 && (
                <div className="flex justify-center gap-2 flex-wrap mt-auto">
                  {profile.user.socialMedia.map((social) => {
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
            </Card>
          </div>

          {/* Stats Cards - Wide */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-3 gap-3 h-full">
              <Card className="p-4 bg-gradient-to-br from-orange-50 to-white flex flex-col items-center justify-center">
                <TrendingUp className="w-8 h-8 text-orange-500 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{profile.user.stats.totalTrips}</p>
                <p className="text-xs text-gray-500">Trips</p>
              </Card>
              
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center">
                <Users className="w-8 h-8 text-blue-500 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{profile.user.stats.happyCustomers}</p>
                <p className="text-xs text-gray-500">Customers</p>
              </Card>
              
              <Card className="p-4 bg-gradient-to-br from-amber-50 to-white flex flex-col items-center justify-center">
                <Star className="w-8 h-8 text-amber-500 mb-2 fill-amber-500" />
                <p className="text-2xl font-bold text-gray-900">{profile.user.stats.rating}</p>
                <p className="text-xs text-gray-500">Rating</p>
              </Card>
            </div>
          </div>

          {/* Active Trip Card - Wide */}
          {profile.trips && profile.trips.length > 0 && (
            <div className="md:col-span-2">
              <Card className="p-0 overflow-hidden h-full bg-white">
                <div className="flex h-full">
                  <div className="relative w-2/5 flex-shrink-0">
                    <img
                      src={profile.trips[currentTripIndex].image || "/placeholder.svg?height=200&width=300"}
                      alt={profile.trips[currentTripIndex].title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                    
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-white/90 text-black hover:bg-white text-xs px-2 py-1 shadow-sm backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                        {profile.trips[currentTripIndex].status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h2 className="font-bold text-base line-clamp-2 leading-tight">
                          {profile.trips[currentTripIndex].title}
                        </h2>
                        {profile.trips.length > 1 && (
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {currentTripIndex + 1}/{profile.trips.length}
                          </span>
                        )}
                      </div>
                      
                      {profile.trips[currentTripIndex].description && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {profile.trips[currentTripIndex].description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-2">
                      <div className="space-y-1">
                        {profile.trips[currentTripIndex].deadline && (
                          <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-orange-400" />
                            <span className="font-medium">
                              {new Date(profile.trips[currentTripIndex].deadline!).toLocaleDateString('id-ID', { 
                                day: 'numeric', 
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                          <Package className="w-3.5 h-3.5 text-blue-400" />
                          <span className="font-medium">
                            {profile.trips[currentTripIndex].spotsLeft} Slots Available
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {profile.trips.length > 1 && (
                          <>
                            <button
                              onClick={() => setCurrentTripIndex((currentTripIndex - 1 + profile.trips!.length) % profile.trips!.length)}
                              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCurrentTripIndex((currentTripIndex + 1) % profile.trips!.length)}
                              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white h-8 px-4 text-xs font-semibold shadow-lg rounded-full">
                          Join Trip
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Catalog Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-bold text-lg">📦 Product Catalog</h2>
            
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
          </div>

          {paginatedCatalog.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedCatalog.map((item) => (
                <Card
                  key={item.id}
                  className={`overflow-hidden flex flex-col p-0 transition-all hover:shadow-xl ${
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
                      <Badge variant={item.type === 'goods' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0.5">
                        {item.type === 'goods' ? '📦' : '🔧'}
                      </Badge>
                      <Badge
                        className="text-[10px] px-1.5 py-0.5"
                        variant={item.available || item.type === 'tasks' ? "default" : "secondary"}
                      >
                        {item.available ? "Available" : item.type === 'tasks' ? "Available" : "Sold Out"}
                      </Badge>
                    </div>
                  </Link>
                  
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1">{item.title}</h3>
                      {item.unit && <p className="text-xs text-gray-500 truncate">{item.unit}</p>}
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t mt-2 gap-2">
                      <p className="text-orange-500 font-bold text-sm truncate">
                        Rp {item.price.toLocaleString('id-ID')}
                      </p>
                      <button
                        onClick={() => addToCart(item)}
                        disabled={!item.available && item.type !== 'tasks'}
                        className="text-orange-500 hover:text-orange-600 disabled:text-gray-300 transition-colors p-1.5 hover:bg-orange-50 rounded-full disabled:hover:bg-transparent flex-shrink-0"
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
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-white hover:bg-gray-50 border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-white hover:bg-gray-50 border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-6 border-t text-sm text-muted-foreground">
          <p>
            Powered by <span className="font-semibold text-orange-500">Jastipin.me</span>
          </p>
        </div>
      </div>
    </div>
  )
}
