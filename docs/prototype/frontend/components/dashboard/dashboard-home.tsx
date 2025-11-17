"use client"

import { Button } from "@/components/ui/button"
import { Plus, ChevronRight, AlertCircle, TrendingDown, Users, TrendingUp, ShoppingBag, DollarSign } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface DashboardHomeProps {
  onNavigate: (tab: string) => void
}

export default function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const [selectTripOpen, setSelectTripOpen] = useState(false)
  const [uploadProductOpen, setUploadProductOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState("")

  const activeTrips = [
    { id: 1, name: "Jastip Jepang Mei", status: "Aktif" },
    { id: 2, name: "Jastip Korea Juni", status: "Aktif" },
  ]

  const handleTripSelect = (tripName: string) => {
    setSelectedTrip(tripName)
    setSelectTripOpen(false)
    setUploadProductOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Halo, Tina! 👋</h1>
        <p className="text-gray-600">Ini ringkasan bisnis Anda hari ini</p>
      </div>

      {/* CTA Aksi Cepat Global */}
      <Sheet open={selectTripOpen} onOpenChange={setSelectTripOpen}>
        <SheetTrigger asChild>
          <Button className="w-full h-14 bg-[#FB923C] hover:bg-[#EA7C2C] text-white font-semibold text-lg rounded-xl shadow-lg">
            <Plus className="w-6 h-6 mr-2" />
            Upload Produk Cepat
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Pilih Trip</SheetTitle>
            <SheetDescription>Upload produk ini ke trip mana?</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {activeTrips.map((trip) => (
              <Button
                key={trip.id}
                onClick={() => handleTripSelect(trip.name)}
                variant="outline"
                className="w-full h-14 justify-start text-left border-2 hover:border-[#FB923C] hover:bg-orange-50"
              >
                <div>
                  <div className="font-semibold">{trip.name}</div>
                  <div className="text-xs text-gray-500">{trip.status}</div>
                </div>
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Upload Product Form Sheet */}
      <Sheet open={uploadProductOpen} onOpenChange={setUploadProductOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Upload Produk</SheetTitle>
            <SheetDescription>Ke: {selectedTrip}</SheetDescription>
          </SheetHeader>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              setUploadProductOpen(false)
            }}
          >
            <div>
              <Label>Gambar Produk</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#FB923C] transition-colors cursor-pointer">
                <Plus className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Upload atau ambil foto</p>
              </div>
            </div>
            <div>
              <Label htmlFor="product-name">Nama Produk</Label>
              <Input id="product-name" placeholder="Contoh: KitKat Matcha" className="mt-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-price">Harga</Label>
                <Input id="product-price" type="number" placeholder="50000" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="product-stock">Stok Awal</Label>
                <Input id="product-stock" type="number" placeholder="10" className="mt-2" />
              </div>
            </div>
            <Button type="submit" className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] h-12 font-semibold">
              Simpan
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <div className="bg-gradient-to-br from-[#F26B8A] to-[#F26B8A]/80 rounded-2xl p-5 shadow-lg">
        <div className="text-white/90 text-sm mb-4 font-medium">Analitik Bulan Ini</div>
        <div className="grid grid-cols-3 gap-3">
          {/* Total Pendapatan */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">8.5M</div>
            <div className="text-xs text-white/80">Pendapatan</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-green-300" />
              <span className="text-xs text-green-300 font-medium">+12%</span>
            </div>
          </div>

          {/* Total Order */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">142</div>
            <div className="text-xs text-white/80">Total Order</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-green-300" />
              <span className="text-xs text-green-300 font-medium">+8%</span>
            </div>
          </div>

          {/* Total Peserta */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">68</div>
            <div className="text-xs text-white/80">Peserta</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-green-300" />
              <span className="text-xs text-green-300 font-medium">+5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Ringkasan Anda */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Ringkasan Anda</h2>

        {/* Card Summary 1: Validasi */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">Validasi Order</div>
              <div className="text-lg font-bold text-gray-900 mb-3">
                Anda punya <span className="text-red-500">3</span> order baru yang perlu divalidasi
              </div>
              <Button
                onClick={() => onNavigate("validasi")}
                variant="outline"
                size="sm"
                className="w-full border-[#F26B8A] text-[#F26B8A] hover:bg-pink-50"
              >
                Lihat Detail
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Card Summary 2: Stok Produk */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">Stok Produk</div>
              <div className="text-lg font-bold text-gray-900 mb-3">
                Ada <span className="text-orange-500">5</span> produk yang stoknya menipis
              </div>
              <Button
                onClick={() => onNavigate("produk")}
                variant="outline"
                size="sm"
                className="w-full border-[#F26B8A] text-[#F26B8A] hover:bg-pink-50"
              >
                Lihat Detail
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Card Summary 3: Peserta Baru (Optional) */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">Peserta Baru</div>
              <div className="text-lg font-bold text-gray-900 mb-3">
                Ada <span className="text-blue-500">12</span> peserta baru bergabung di 'Jastip Jepang'
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-[#F26B8A] text-[#F26B8A] hover:bg-pink-50 bg-transparent"
              >
                Lihat Peserta
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
