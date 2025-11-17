"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Plus, ChevronDown, CheckCircle2, Settings, Filter } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export default function DashboardProduk() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTrip, setFilterTrip] = useState("all")
  const [showTripMenu, setShowTripMenu] = useState(false)
  const [uploadProductOpen, setUploadProductOpen] = useState(false)
  const [updateStockOpen, setUpdateStockOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedTrip, setSelectedTrip] = useState("")

  const allProducts = [
    {
      id: 1,
      name: "KitKat Matcha",
      stock: 10,
      price: 50000,
      image: "/kitkat-matcha.jpg",
      trip: "Jastip Jepang Mei",
    },
    {
      id: 2,
      name: "Action Figure Luffy",
      stock: 0,
      price: 350000,
      image: "/luffy-action-figure.jpg",
      trip: "Jastip Jepang Mei",
    },
    {
      id: 3,
      name: "Samyang Buldak",
      stock: 15,
      price: 35000,
      image: "/samyang-buldak.jpg",
      trip: "Jastip Korea Juni",
    },
    {
      id: 4,
      name: "Korean Face Mask",
      stock: 2,
      price: 25000,
      image: "/korean-face-mask.jpg",
      trip: "Jastip Korea Juni",
    },
    {
      id: 5,
      name: "Pocky Strawberry",
      stock: 12,
      price: 30000,
      image: "/pocky-strawberry.jpg",
      trip: "Jastip Jepang Mei",
    },
  ]

  const trips = [
    { id: "all", name: "SEMUA TRIP" },
    { id: 1, name: "Jastip Jepang Mei" },
    { id: 2, name: "Jastip Korea Juni" },
  ]

  const displayProducts =
    filterTrip === "all"
      ? allProducts
      : allProducts.filter((p) => p.trip === trips.find((t) => t.id === filterTrip)?.name)

  const handleUploadProduct = () => {
    setSelectedTrip("")
    setUploadProductOpen(true)
  }

  const handleUpdateStock = (product: any) => {
    setSelectedProduct(product)
    setUpdateStockOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Katalog Produk</h1>
        <p className="text-gray-600">Kelola semua produk Anda</p>
      </div>

      {/* CTA Upload Produk */}
      <Button
        onClick={handleUploadProduct}
        className="w-full h-14 bg-[#FB923C] hover:bg-[#EA7C2C] text-white font-semibold text-lg rounded-xl shadow-lg"
      >
        <Plus className="w-6 h-6 mr-2" />
        Upload Produk Baru
      </Button>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Cari nama produk..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 bg-white"
        />
      </div>

      {/* Filter Trip */}
      <div className="relative">
        <Button
          onClick={() => setShowTripMenu(!showTripMenu)}
          variant="outline"
          className="w-full h-12 justify-between font-semibold bg-white"
        >
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter Trip: {trips.find((t) => t.id === filterTrip)?.name}
          </span>
          <ChevronDown className={`w-5 h-5 transition-transform ${showTripMenu ? "rotate-180" : ""}`} />
        </Button>

        {showTripMenu && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg z-10">
            {trips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => {
                  setFilterTrip(trip.id)
                  setShowTripMenu(false)
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                  filterTrip === trip.id ? "bg-pink-50 font-semibold text-[#F26B8A]" : ""
                }`}
              >
                {trip.name}
              </button>
            ))}
            <div className="border-t border-gray-200">
              <button className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2 text-[#3A86FF] font-semibold">
                <Settings className="w-4 h-4" />
                Kelola Trip / Buat Trip Baru
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="space-y-3">
        {displayProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-500 mb-1">{product.trip}</div>
                <div className="text-sm font-semibold text-gray-900">Rp{product.price.toLocaleString("id-ID")}</div>
                <div className="text-sm text-gray-600">
                  Stok:{" "}
                  <span className={product.stock === 0 ? "text-red-500 font-semibold" : "font-semibold"}>
                    {product.stock === 0 ? "HABIS" : product.stock < 5 ? `${product.stock} (Menipis)` : product.stock}
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => handleUpdateStock(product)}
              variant="outline"
              size="sm"
              className="w-full border-[#7C3AED] text-[#7C3AED] hover:bg-purple-50"
            >
              Update Stok
            </Button>
          </div>
        ))}
      </div>

      {displayProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Tidak ada produk untuk ditampilkan</p>
        </div>
      )}

      {/* Upload Product Sheet */}
      <Sheet open={uploadProductOpen} onOpenChange={setUploadProductOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Upload Produk Baru</SheetTitle>
            <SheetDescription>Tambahkan produk ke katalog Anda</SheetDescription>
          </SheetHeader>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              setUploadProductOpen(false)
            }}
          >
            <div>
              <Label>Pilih Trip</Label>
              <select className="mt-2 w-full h-12 rounded-lg border border-gray-300 px-3 bg-white">
                <option value="">Pilih trip...</option>
                <option value="1">Jastip Jepang Mei</option>
                <option value="2">Jastip Korea Juni</option>
              </select>
            </div>
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

      {/* Update Stock Sheet */}
      <Sheet open={updateStockOpen} onOpenChange={setUpdateStockOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Update Stok: {selectedProduct?.name}</SheetTitle>
            <SheetDescription>
              Stok saat ini: {selectedProduct?.stock === 0 ? "HABIS" : selectedProduct?.stock}
            </SheetDescription>
          </SheetHeader>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              setUpdateStockOpen(false)
            }}
          >
            <div>
              <Label htmlFor="new-stock">Stok Baru</Label>
              <Input
                id="new-stock"
                type="number"
                placeholder="Masukkan jumlah stok"
                className="mt-2 h-12 text-lg"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] h-12 font-semibold">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Simpan Perubahan
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
