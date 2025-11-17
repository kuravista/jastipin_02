"use client"

import { Button } from "@/components/ui/button"
import { Plus, ChevronRight, AlertCircle, TrendingDown, Users, TrendingUp, ShoppingBag, DollarSign } from "lucide-react"
import { CreateTripDialog } from "@/components/dialogs/create-trip-dialog"
import { CreateProductDialog } from "@/components/dialogs/create-product-dialog"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"

interface DashboardHomeProps {
  onNavigate: (tab: string) => void
}

export default function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const { user } = useAuth()
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [createTripOpen, setCreateTripOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Halo, {user?.profileName || 'Pengguna'}! 👋
        </h1>
        <p className="text-gray-600">Ini ringkasan bisnis Anda hari ini</p>
      </div>

      {/* CTA Aksi Cepat Global */}
      <div className="flex gap-3">
        {/* Upload Produk Cepat - 4 parts */}
        <Button 
          onClick={() => setProductDialogOpen(true)}
          className="flex-[4] h-14 bg-[#FB923C] hover:bg-[#EA7C2C] text-white font-semibold text-lg rounded-xl shadow-lg"
        >
          <Plus className="w-6 h-6 mr-2" />
          Upload Produk Cepat
        </Button>

        {/* Tambah Trip - 1 part */}
        <Button 
          onClick={() => setCreateTripOpen(true)}
          className="flex-1 h-14 bg-white hover:bg-gray-50 text-[#FB923C] border-2 border-[#FB923C] font-semibold rounded-xl shadow-lg"
        >
          <Plus className="w-5 h-5" />Trip
        </Button>
      </div>

      {/* Create Product Dialog */}
      <CreateProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
      />

      {/* Create Trip Dialog */}
      <CreateTripDialog 
        open={createTripOpen} 
        onOpenChange={setCreateTripOpen}
        onSuccess={() => onNavigate("trips")}
      />

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
