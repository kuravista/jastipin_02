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
    <div className="min-h-screen bg-[#f6f7f8]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 items-start mb-6">
          <div className="flex gap-4 flex-col items-start w-full">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl min-h-24 w-24 shadow-sm"
              style={{ backgroundImage: `url(${profile.user.avatar || "/placeholder.svg?height=120&width=120"})` }}
            />
            <div className="flex flex-col">
              <h1 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-[#111518] theme-primary-text">
                {profile.user.profileName}
              </h1>
              <p className="text-base font-normal leading-normal text-[#617989]">
                {profile.user.slug} | {profile.user.stats.rating} ★
              </p>
            </div>
          </div>
        </div>

        {profile.user.profileBio && (
          <p className="text-base font-normal leading-normal pb-6 pt-1 text-[#111518]">
            {profile.user.profileBio}
          </p>
        )}

        <div className="w-full border-t border-gray-200 mb-8" />

        {/* Active Trips Section */}
        {profile.trips && profile.trips.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold leading-tight tracking-widest pb-4 text-[#617989]">ACTIVE TRIPS</h3>
            <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
              <div className="flex w-max gap-4">
                {profile.trips.map((trip, idx) => (
                  <div 
                    key={trip.id}
                    onClick={() => setCurrentTripIndex(idx)}
                    className={`flex h-full w-64 flex-col rounded-lg border bg-white p-4 transition-all cursor-pointer hover:shadow-md ${
                      currentTripIndex === idx ? 'border-2 theme-primary-border' : 'border-gray-200'
                    }`}
                  >
                    <div 
                      className="mb-2 aspect-[4/3] w-full rounded-md bg-cover bg-center"
                      style={{ backgroundImage: `url(${trip.image || "/placeholder.svg?height=200&width=300"})` }}
                    />
                    <p className="font-medium text-[#111518] line-clamp-1">{trip.title}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-[#617989]">{trip.deadline ? new Date(trip.deadline).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }) : 'No date'}</p>
                      <Badge variant="secondary" className="text-[10px] px-1.5 h-5">{trip.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="w-full border-t border-gray-200 mb-8" />

        {/* Shop My Gear / Catalog Section */}
        <div className="mb-8">
          <div className="flex justify-between items-end pb-2 pt-4">
            <h3 className="text-sm font-bold leading-tight tracking-widest text-[#617989]">SHOP MY GEAR</h3>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 w-48">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-xs min-w-0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-0">
            {paginatedCatalog.length > 0 ? (
              paginatedCatalog.map((item) => (
                <Link
                  href={`/${username}/p/${item.slug}?tripId=${item.tripId}`}
                  key={item.id}
                  className="group block hover:bg-black/5 transition-colors duration-200 cursor-pointer border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-4 px-2 min-h-[80px] py-3 justify-between">
                    <div className="w-16 h-16 rounded-md bg-gray-100 flex-shrink-0 overflow-hidden">
                      <img 
                        src={item.image || "/placeholder.svg?height=64&width=64"} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex flex-1 flex-col justify-center min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-base font-medium leading-normal line-clamp-1 text-[#111518] group-hover:theme-primary-text transition-colors">
                          {item.title}
                        </p>
                        {!item.available && item.type !== 'tasks' && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Habis</Badge>
                        )}
                      </div>
                      <p className="text-sm font-normal leading-normal line-clamp-1 text-[#617989]">
                        {item.unit || "Item"} • {item.type === 'goods' ? 'Product' : 'Service'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <p className="shrink-0 text-sm font-medium text-[#111518]">
                        Rp {item.price.toLocaleString('id-ID')}
                      </p>
                      <button
                        onClick={(e) => {
                          e.preventDefault(); // Prevent navigation when clicking add to cart
                          e.stopPropagation();
                          addToCart(item);
                        }}
                        disabled={!item.available && item.type !== 'tasks'}
                        className="flex size-8 items-center justify-center rounded-full hover:bg-white hover:shadow-sm transition-all disabled:opacity-30"
                      >
                        <Plus className="w-5 h-5 theme-primary-text" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-8 text-center text-gray-500 text-sm">No items found</div>
            )}
          </div>

          {/* Pagination */}
          {filteredCatalog.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-xs font-medium text-gray-500">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Social Links Footer */}
        <div className="flex items-center justify-center gap-6 pt-4 pb-8">
          {profile.user.socialMedia && profile.user.socialMedia.map((social) => {
            const config = getSocialMediaConfig(social.platform)
            const Icon = config.icon
            return (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#617989] hover:theme-primary-text transition-colors"
                title={config.label}
              >
                <Icon className="w-6 h-6" />
              </a>
            )
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-[#617989]">
          <p>Powered by <span className="font-semibold theme-primary-text">Jastipin.me</span></p>
        </div>
      </div>
    </div>
  )
}
