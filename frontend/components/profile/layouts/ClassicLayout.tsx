import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Star, Search, Plus, ChevronLeft, ChevronRight, Calendar, Package, MapPin } from "lucide-react"
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

interface ClassicLayoutProps {
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

export function ClassicLayout({
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
}: ClassicLayoutProps) {
  return (
    <>
      <div className="relative w-full h-48 overflow-hidden rounded-b-3xl">
        {profile.user.coverImage ? (
          <img
            src={profile.user.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
            style={{ objectPosition: `center ${profile.user.coverPosition || 50}%` }}
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${getGradientBySeed(profile.user.slug).className}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Profile Container - Link-in-bio style */}
      <div className="max-w-2xl mx-auto px-4 pb-8 flex-1 w-full flex flex-col">
        {/* Profile Header - Compact Card Design */}
        <div className="relative z-10 mb-8">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-6 pb-8 text-center -mt-20 mx-2 border border-white/50">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
              <div className="relative">
                <img
                  src={profile.user.avatar || "/placeholder.svg?height=120&width=120"}
                  alt={profile.user.profileName}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                />
                <Badge className="absolute bottom-1 right-1 bg-green-500 border-2 border-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </Badge>
              </div>
            </div>

            <div className="mt-12 space-y-3">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{profile.user.profileName}</h1>
                <Badge className="theme-primary-bg text-white border-none flex items-center gap-1 px-2 h-6 rounded-full shadow-sm">
                  <Star className="w-3 h-3 fill-white" />
                  {profile.user.stats.rating}
                </Badge>
              </div>
              
              {profile.user.profileBio && (
                <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line text-pretty max-w-md mx-auto">
                  {profile.user.profileBio}
                </p>
              )}

              {/* Social Links - Moved here & Compact */}
              {profile.user.socialMedia && profile.user.socialMedia.length > 0 && (
                <div className="flex justify-center gap-3 flex-wrap pt-2">
                  {profile.user.socialMedia.map((social) => {
                    const config = getSocialMediaConfig(social.platform)
                    const Icon = config.icon
                    return (
                      <button
                        key={social.id}
                        onClick={() => window.open(social.url, "_blank")}
                        title={`${config.label} - ${social.handle}`}
                        className="group p-2.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-all duration-200 border border-gray-100 hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5"
                      >
                        <Icon className={`w-5 h-5 text-gray-600 group-hover:text-gray-900`} />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
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

            <div className="relative group">
              {/* Current Trip Card - Compact Horizontal Design */}
              <div className="overflow-hidden border border-gray-100 shadow-lg rounded-2xl bg-white">
                <div className="flex h-40 sm:h-44">
                  {/* Image Section */}
                  <div className="relative w-1/3 sm:w-2/5 flex-shrink-0">
                    <img
                      src={profile.trips[currentTripIndex].image || "/placeholder.svg?height=320&width=400"}
                      alt={profile.trips[currentTripIndex].title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-white/90 text-black hover:bg-white text-[10px] px-2 h-5 shadow-sm backdrop-blur-sm border-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                        {profile.trips[currentTripIndex].status}
                      </Badge>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0 bg-white">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-sm sm:text-base line-clamp-2 leading-tight text-gray-900">
                          {profile.trips[currentTripIndex].title}
                        </h3>
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md whitespace-nowrap flex-shrink-0 border border-gray-100">
                          {currentTripIndex + 1} / {profile.trips.length}
                        </span>
                      </div>
                      
                      {profile.trips[currentTripIndex].description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
                          {profile.trips[currentTripIndex].description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-2 mt-2">
                      <div className="space-y-1">
                        {profile.trips[currentTripIndex].deadline && (
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                            <Calendar className="w-3.5 h-3.5 theme-primary-text" />
                            <span className="font-medium">
                              {new Date(profile.trips[currentTripIndex].deadline!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                          <Package className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-medium">
                            {profile.trips[currentTripIndex].spotsLeft} Slot
                          </span>
                        </div>
                      </div>

                      <Button 
                        className="theme-primary-button h-8 px-4 text-xs font-semibold shadow-lg rounded-full"
                      >
                        Ikut
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons - Integrated into the card sides for cleaner look */}
              {profile.trips.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentTripIndex((currentTripIndex - 1 + profile.trips!.length) % profile.trips!.length);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-gray-700 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentTripIndex((currentTripIndex + 1) % profile.trips!.length);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-gray-700 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {/* Mobile Navigation Dots */}
                  <div className="flex justify-center gap-1.5 mt-3 sm:hidden">
                    {profile.trips.map((_: Trip, idx: number) => (
                      <div 
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentTripIndex ? 'theme-primary-bg w-3' : 'bg-gray-300'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Catalog Preview */}
        {profile.catalog.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="font-bold text-lg flex-shrink-0">📦 Katalog</h3>
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 flex-1 max-w-[200px]">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm min-w-0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-0">
              {paginatedCatalog.map((item) => (
                <Card
                  key={item.id}
                  className={`overflow-hidden flex flex-col gap-0 p-0 transition-all min-w-0 ${!item.available && item.type !== 'tasks' ? "opacity-50" : ""}`}
                >
                  <Link 
                    href={`/${username}/p/${item.slug}?tripId=${item.tripId}`}
                    className="relative w-full h-32 flex-shrink-0 block cursor-pointer group/image"
                  >
                    <img
                      src={item.image || "/placeholder.svg?height=128&width=200"}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform group-hover/image:scale-105"
                    />
                    <div className="absolute top-2 left-2 right-2 flex justify-between gap-1">
                      <Badge
                        variant={item.type === 'goods' ? 'default' : 'secondary'}
                        className="text-[10px] px-1.5 py-0.5"
                      >
                        {item.type === 'goods' ? '📦' : '🔧'}
                      </Badge>
                      <Badge
                        className="ml-auto text-[10px] px-1.5 py-0.5"
                        variant={item.available || item.type === 'tasks' ? "default" : "secondary"}
                      >
                        {item.available ? "Ada" : item.type === 'tasks' ? "Ada" : "Habis"}
                      </Badge>
                    </div>
                  </Link>
                  <div className="p-2 flex-1 flex flex-col justify-between min-w-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm line-clamp-2 break-words mb-0">{item.title}</p>
                      <div className="flex items-center justify-between mt-0.5 gap-1 min-w-0">
                        {item.unit && <p className="text-xs text-gray-500 truncate">{item.unit}</p>}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t gap-1 min-w-0">
                      <p className="theme-primary-text font-bold text-xs sm:text-sm truncate">Rp {item.price.toLocaleString('id-ID')}</p>
                      <button
                        onClick={() => addToCart(item)}
                        disabled={!item.available && item.type !== 'tasks'}
                        className="theme-primary-text hover:brightness-90 disabled:text-gray-300 transition-colors p-1 hover:bg-gray-100 rounded disabled:hover:bg-transparent flex-shrink-0"
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
              <div className="flex items-center justify-between mt-6 pt-4 border-t gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>
                <span className="text-xs sm:text-sm text-gray-600 text-center min-w-0">
                  <span className="hidden sm:inline">Halaman <span className="font-semibold">{currentPage}</span> dari <span className="font-semibold">{totalPages}</span></span>
                  <span className="sm:hidden font-semibold">{currentPage}/{totalPages}</span>
                  <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">({filteredCatalog.length})</span>
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-auto pt-8 text-sm text-muted-foreground">
          <p>
            Powered by <span className="font-semibold theme-primary-text">Jastipin.me</span>
          </p>
        </div>
      </div>
    </>
  )
}
