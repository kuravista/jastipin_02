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

interface NeoBrutalistLayoutProps {
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

export function NeoBrutalistLayout({
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
}: NeoBrutalistLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#0A0A0A] text-black dark:text-white font-mono">
      <main className="w-full max-w-2xl mx-auto p-4 md:p-6">
        <div className="flex w-full flex-col gap-8">
          
          {/* Profile Header */}
          <div className="flex w-full flex-col gap-4 items-center">
            <div className="relative">
              <div 
                className="bg-center bg-no-repeat aspect-square bg-cover w-32 h-32 border-4 border-black dark:border-white rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
                style={{ backgroundImage: `url(${profile.user.avatar || "/placeholder.svg?height=128&width=128"})` }}
              />
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <h1 className="text-[28px] font-bold leading-tight tracking-[-0.015em] uppercase">
                @{profile.user.profileName}
              </h1>
              {profile.user.profileBio && (
                <p className="text-lg font-normal leading-normal text-center max-w-sm mt-2">
                  {profile.user.profileBio}
                </p>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="flex w-full justify-center gap-4 flex-wrap">
            {profile.user.socialMedia?.map((social) => {
              const config = getSocialMediaConfig(social.platform)
              const Icon = config.icon
              return (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none bg-white dark:bg-black"
                  title={config.label}
                >
                  <Icon className="w-7 h-7" />
                </a>
              )
            })}
          </div>

          {/* Active Trips */}
          {profile.trips && profile.trips.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold leading-tight tracking-[-0.015em] py-4 text-center uppercase border-b-4 border-black dark:border-white mb-4">
                Active Trips
              </h3>
              <div className="relative">
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar">
                  {profile.trips.map((trip, idx) => (
                    <div 
                      key={trip.id}
                      className="flex-shrink-0 w-[85%] snap-center"
                      onClick={() => setCurrentTripIndex(idx)}
                    >
                      <div className={`flex flex-col items-stretch justify-start rounded-lg border-4 border-black dark:border-white bg-transparent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] ${currentTripIndex === idx ? 'ring-2 ring-offset-2 ring-black dark:ring-white' : ''}`}>
                        <div 
                          className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-t-sm border-b-4 border-black dark:border-white"
                          style={{ backgroundImage: `url(${trip.image || "/placeholder.svg?height=300&width=400"})` }}
                        />
                        <div className="flex w-full flex-col items-stretch justify-center gap-2 p-4 bg-white dark:bg-black">
                          <p className="text-xl font-bold leading-tight tracking-[-0.015em] uppercase line-clamp-1">
                            {trip.title}
                          </p>
                          <div className="flex flex-col gap-2">
                            {trip.deadline && (
                              <p className="text-base font-normal leading-normal">
                                {new Date(trip.deadline).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()}
                              </p>
                            )}
                            {trip.description && (
                              <p className="text-base font-normal leading-normal line-clamp-2">
                                {trip.description}
                              </p>
                            )}
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <Badge className="bg-theme-primary text-black border-2 border-black rounded-none font-bold uppercase">
                              {trip.status}
                            </Badge>
                            <span className="font-bold">{trip.spotsLeft} SLOTS LEFT</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* My Gear / Catalog */}
          <div>
            <div className="flex justify-between items-center border-b-4 border-black dark:border-white mb-6 pb-2">
              <h3 className="text-2xl font-bold leading-tight tracking-[-0.015em] uppercase">
                MY GEAR
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                <input
                  type="text"
                  placeholder="SEARCH..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border-2 border-black dark:border-white rounded-none bg-transparent font-bold text-sm focus:outline-none focus:ring-0 w-40 uppercase placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {paginatedCatalog.length > 0 ? (
                paginatedCatalog.map((item) => (
                  <Link 
                    href={`/${username}/p/${item.slug}?tripId=${item.tripId}`}
                    key={item.id}
                    className="flex flex-col rounded-lg border-4 border-black dark:border-white bg-transparent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none group"
                  >
                    <div 
                      className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-t-sm border-b-4 border-black dark:border-white"
                      style={{ backgroundImage: `url(${item.image || "/placeholder.svg?height=200&width=200"})` }}
                    />
                    <div className="p-3 flex justify-between items-start bg-white dark:bg-black flex-1">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="font-bold text-sm uppercase leading-tight line-clamp-2 mb-1">
                          {item.title}
                        </p>
                        <p className="font-bold text-base theme-primary-text">
                          Rp {item.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(item);
                        }}
                        disabled={!item.available && item.type !== 'tasks'}
                        className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-black dark:border-white bg-theme-primary text-black shrink-0 hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 font-bold border-4 border-black border-dashed p-4">
                  NO ITEMS FOUND
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredCatalog.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t-4 border-black dark:border-white">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 font-bold border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                  PREV
                </button>
                <span className="font-bold">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 font-bold border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
                >
                  NEXT
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <footer className="mt-8 border-t-4 border-black dark:border-white py-6">
            <p className="text-center text-sm font-bold uppercase tracking-widest">
              POWERED BY <span className="theme-primary-text">JASTIPIN.ME</span>
            </p>
          </footer>

        </div>
      </main>
    </div>
  )
}
