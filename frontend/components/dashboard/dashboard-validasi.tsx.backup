"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText, CheckCircle2 } from "lucide-react"

export default function DashboardValidasi() {
  const [activeFilter, setActiveFilter] = useState("perlu-validasi")
  const [searchQuery, setSearchQuery] = useState("")

  const pendingOrders = [
    {
      id: 1,
      customerName: "Ani",
      items: 2,
      total: 450000,
      proofUrl: "#",
      orderNumber: "ORD-001",
      date: "10 Mei 2024",
      invoiceId: "250403ABCD",
    },
    {
      id: 2,
      customerName: "Budi",
      items: 1,
      total: 250000,
      proofUrl: "#",
      orderNumber: "ORD-002",
      date: "10 Mei 2024",
      invoiceId: "250403EFGH",
    },
    {
      id: 3,
      customerName: "Citra",
      items: 3,
      total: 780000,
      proofUrl: "#",
      orderNumber: "ORD-003",
      date: "11 Mei 2024",
      invoiceId: "250403IJKL",
    },
  ]

  const validatedOrders = [
    {
      id: 4,
      customerName: "Dian",
      items: 2,
      total: 350000,
      orderNumber: "ORD-004",
      date: "9 Mei 2024",
      invoiceId: "250403MNOP",
    },
  ]

  const displayOrders = activeFilter === "perlu-validasi" ? pendingOrders : validatedOrders

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Validasi Order</h1>
        <p className="text-gray-600">Kelola semua order yang masuk</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Cari nama penitip atau No. Order..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 bg-white"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          onClick={() => setActiveFilter("semua")}
          variant={activeFilter === "semua" ? "default" : "outline"}
          className={activeFilter === "semua" ? "bg-[#F26B8A] hover:bg-[#E05576]" : ""}
          size="sm"
        >
          Semua
        </Button>
        <Button
          onClick={() => setActiveFilter("perlu-validasi")}
          variant={activeFilter === "perlu-validasi" ? "default" : "outline"}
          className={activeFilter === "perlu-validasi" ? "bg-[#F26B8A] hover:bg-[#E05576]" : ""}
          size="sm"
        >
          Perlu Validasi ({pendingOrders.length})
        </Button>
        <Button
          onClick={() => setActiveFilter("sudah-validasi")}
          variant={activeFilter === "sudah-validasi" ? "default" : "outline"}
          className={activeFilter === "sudah-validasi" ? "bg-[#F26B8A] hover:bg-[#E05576]" : ""}
          size="sm"
        >
          Sudah Validasi
        </Button>
      </div>

      {/* Order List */}
      <div className="space-y-3">
        {displayOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-900">Penitip: {order.customerName}</div>
                <div className="text-sm text-gray-600">{order.orderNumber}</div>
                <div className="text-xs text-gray-500">{order.date}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">Rp{order.total.toLocaleString("id-ID")}</div>
                <div className="text-sm text-gray-600">{order.items} Item</div>
              </div>
            </div>
            {activeFilter !== "sudah-validasi" && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <FileText className="w-4 h-4 mr-1" />
                  Lihat Bukti
                </Button>
                <Button size="sm" className="flex-1 bg-[#7C3AED] hover:bg-[#6D28D9]">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Validasi
                </Button>
              </div>
            )}
            {activeFilter === "sudah-validasi" && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Sudah Divalidasi
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/inv/${order.invoiceId}`, "_blank")}
                  className="text-xs"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Lihat Invoice
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {displayOrders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Tidak ada order untuk ditampilkan</p>
        </div>
      )}
    </div>
  )
}
