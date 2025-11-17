"use client"

import { Button } from "@/components/ui/button"
import { Plus, Calendar, MapPin, Package, ArrowLeft } from "lucide-react"

export default function DashboardTrips({ onBack }: { onBack?: () => void }) {
  const trips = [
    {
      id: 1,
      name: "Jastip Jepang Mei",
      destination: "Tokyo, Jepang",
      date: "15 Mei - 25 Mei 2025",
      products: 24,
      status: "Aktif",
    },
    {
      id: 2,
      name: "Jastip Korea Juni",
      destination: "Seoul, Korea",
      date: "1 Juni - 10 Juni 2025",
      products: 18,
      status: "Aktif",
    },
    {
      id: 3,
      name: "Jastip Singapura April",
      destination: "Singapura",
      date: "10 April - 12 April 2025",
      products: 35,
      status: "Selesai",
    },
  ]

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
      <Button className="w-full h-12 bg-[#FB923C] hover:bg-[#EA7C2C] text-white font-semibold rounded-xl">
        <Plus className="w-5 h-5 mr-2" />
        Buat Trip Baru
      </Button>

      {/* Trips List */}
      <div className="space-y-4">
        {trips.map((trip) => (
          <div key={trip.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{trip.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {trip.destination}
                  </div>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  trip.status === "Aktif" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}
              >
                {trip.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {trip.date}
              </div>
              <div className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                {trip.products} produk
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                Edit Trip
              </Button>
              <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                Lihat Produk
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
