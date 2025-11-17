"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Calendar, MapPin, Package, ArrowLeft, Edit2, ShoppingBag } from "lucide-react"
import { CreateTripDialog } from "@/components/dialogs/create-trip-dialog"
import { EditTripDialog } from "@/components/dialogs/edit-trip-dialog"
import { apiGet } from "@/lib/api-client"

interface Trip {
  id: string
  title: string
  description?: string
  url_img?: string
  deadline?: Date | string
  isActive: boolean
  jastiperId: string
}

export default function DashboardTrips({ onBack }: { onBack?: () => void }) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | undefined>(undefined)

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
      </div>

      {/* Create New Trip Button */}
      <Button
        onClick={() => setDialogOpen(true)}
        className="w-full h-12 bg-[#FB923C] hover:bg-[#EA7C2C] text-white font-semibold rounded-xl"
      >
        <Plus className="w-5 h-5 mr-2" />
        Buat Trip Baru
      </Button>

      {/* Trips List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading trips...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Belum ada trip</p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-[#FB923C] hover:bg-[#EA7C2C] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Buat Trip Pertama
              </Button>
            </div>
          ) : (
            trips.map((trip) => (
              <div key={trip.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                {/* Image Container with Overlay */}
                <div className="relative h-32 overflow-hidden group">
                  {trip.url_img ? (
                    <img 
                      src={trip.url_img} 
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                  )}
                  
                  {/* Overlay with Date and Status */}
                  <div className="absolute inset-0 bg-black/30 flex items-end p-3">
                    <div className="flex items-center justify-between w-full">
                      {trip.deadline && (
                        <div className="flex items-center gap-1 text-white text-xs font-semibold bg-black/40 px-2 py-1 rounded-full">
                          <Calendar className="w-3 h-3" />
                          {new Date(trip.deadline).toLocaleDateString('id-ID')}
                        </div>
                      )}
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          trip.isActive 
                            ? "bg-green-500 text-white" 
                            : "bg-gray-600 text-white"
                        }`}
                      >
                        {trip.isActive ? "Aktif" : "Tidak Aktif"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex gap-3 items-start">
                  {/* Left Column - Title & Description */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{trip.title}</h3>
                    {trip.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">{trip.description}</p>
                    )}
                  </div>

                  {/* Right Column - Icon Buttons */}
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setSelectedTrip(trip)
                        setEditDialogOpen(true)
                      }}
                      className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Edit Trip"
                    >
                      <Edit2 className="w-4 h-4 text-[#FB923C]" />
                    </button>
                    <button 
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Lihat Produk"
                    >
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
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
