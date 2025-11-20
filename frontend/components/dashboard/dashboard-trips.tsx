"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Calendar, MapPin, Package, ArrowLeft, Edit2, ShoppingBag, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { CreateTripDialog } from "@/components/dialogs/create-trip-dialog"
import { EditTripDialog } from "@/components/dialogs/edit-trip-dialog"
import { apiGet } from "@/lib/api-client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Trip {
  id: string
  title: string
  description?: string
  url_img?: string
  deadline?: Date | string
  isActive: boolean
  jastiperId: string
  paymentType?: 'full' | 'dp'
  dpPercentage?: number
  createdAt?: string // Assuming createdAt exists for sorting
}

export default function DashboardTrips({ onBack }: { onBack?: () => void }) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | undefined>(undefined)
  
  // Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    try {
      setLoading(true)
      const data = await apiGet<Trip[]>("/trips")
      setTrips(data)
    } catch (err) {
      console.error("Failed to fetch trips", err)
    } finally {
      setLoading(false)
    }
  }

  // Derived state for filtered trips
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      const matchesSearch = trip.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = 
        statusFilter === "all" ? true :
        statusFilter === "active" ? trip.isActive :
        !trip.isActive
      
      return matchesSearch && matchesStatus
    })
  }, [trips, searchQuery, statusFilter])

  // Derived state for pagination
  const totalPages = Math.ceil(filteredTrips.length / ITEMS_PER_PAGE)
  const paginatedTrips = filteredTrips.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Trip Saya</h1>
          <p className="text-gray-600">Kelola semua trip jastip Anda</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          size="icon"
          className="bg-[#FB923C] hover:bg-[#EA7C2C] text-white rounded-xl sm:w-auto sm:px-4"
        >
          <Plus className="w-5 h-5 sm:mr-2" />
          <span className="hidden sm:inline">Buat Trip Baru</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Cari trip..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1) // Reset to page 1 on search
            }}
            className="pl-9 bg-white"
          />
        </div>
        <Select 
          value={statusFilter} 
          onValueChange={(val: any) => {
            setStatusFilter(val)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-[150px] bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trips List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading trips...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedTrips.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500 mb-2">Tidak ada trip ditemukan</p>
              {trips.length === 0 && (
                <Button
                  onClick={() => setDialogOpen(true)}
                  variant="outline"
                  className="mt-2 border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Trip Pertama
                </Button>
              )}
            </div>
          ) : (
            <>
              {paginatedTrips.map((trip) => (
                <div key={trip.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col sm:flex-row">
                  {/* Image Section - Compact on mobile, fixed width on desktop */}
                  <div className="relative h-32 sm:h-auto sm:w-48 overflow-hidden group shrink-0">
                    {trip.url_img ? (
                      <img 
                        src={trip.url_img} 
                        alt={trip.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                    )}
                    
                    {/* Mobile Overlay Badges & Actions */}
                    <div className="absolute inset-0 bg-black/30 flex items-end p-2 sm:hidden">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            trip.isActive 
                              ? "bg-green-500 text-white" 
                              : "bg-gray-600 text-white"
                          }`}
                        >
                          {trip.isActive ? "Aktif" : "Tidak Aktif"}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSelectedTrip(trip)
                              setEditDialogOpen(true)
                            }}
                            className="h-7 w-7 bg-white/90 hover:bg-white border-white/50"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="icon"
                            onClick={() => window.location.href = '/dashboard?tab=produk&trip=' + trip.id}
                            className="h-7 w-7 bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            <ShoppingBag className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-gray-900 text-base line-clamp-1">{trip.title}</h3>
                        {/* Desktop Status Badge */}
                        <span
                          className={`hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            trip.isActive 
                              ? "bg-green-100 text-green-700 border border-green-200" 
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {trip.isActive ? "Aktif" : "Tidak Aktif"}
                        </span>
                      </div>
                      
                      {trip.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1 mb-2">{trip.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-2">
                        {trip.paymentType === 'dp' && (
                          <div className="flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-medium">
                            <span>DP {trip.dpPercentage || 20}%</span>
                          </div>
                        )}
                        {trip.deadline ? (
                          <div className="flex items-center gap-1 text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded text-[10px]">
                            <Calendar className="w-3 h-3" />
                            {new Date(trip.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded text-[10px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                            <span>Lifetime</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions - Desktop Only */}
                    <div className="hidden sm:flex justify-end gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTrip(trip)
                          setEditDialogOpen(true)
                        }}
                        className="h-8 text-xs hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                      >
                        <Edit2 className="w-3 h-3 mr-1.5" />
                        Edit
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => window.location.href = '/dashboard?tab=produk&trip=' + trip.id}
                        className="h-8 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 shadow-none"
                      >
                        <ShoppingBag className="w-3 h-3 mr-1.5" />
                        Produk
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredTrips.length)} dari {filteredTrips.length} trip
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Create Trip Dialog */}
      <CreateTripDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchTrips} />

      {/* Edit Trip Dialog */}
      <EditTripDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        onSuccess={fetchTrips}
        trip={selectedTrip}
      />
    </div>
  )
}
