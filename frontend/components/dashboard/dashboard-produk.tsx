"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Plus, ChevronDown, CheckCircle2, Settings, Filter, Info } from "lucide-react"
import { CreateProductDialog } from "@/components/dialogs/create-product-dialog"
import { EditProductDialog } from "@/components/dialogs/edit-product-dialog"
import { apiGet } from "@/lib/api-client"

interface Product {
  id: string
  title: string
  stock: number
  price: number
  description?: string
  tripId: string
  trip?: { title: string }
  image?: string
}

interface Trip {
  id: string
  title: string
}

export default function DashboardProduk() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTrip, setFilterTrip] = useState("all")
  const [showTripMenu, setShowTripMenu] = useState(false)
  const [uploadProductOpen, setUploadProductOpen] = useState(false)
  const [editProductOpen, setEditProductOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [productsData, tripsData] = await Promise.all([
        apiGet<Product[]>("/products"),
        apiGet<Trip[]>("/trips"),
      ])
      setProducts(productsData)
      setTrips(tripsData)
    } catch (err) {
      console.error("Failed to fetch data", err)
    } finally {
      setLoading(false)
    }
  }

  const allTripsForFilter = [
    { id: "all", title: "SEMUA TRIP" },
    ...trips,
  ]

  const displayProducts =
    filterTrip === "all"
      ? products.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
      : products
          .filter((p) => p.tripId === filterTrip)
          .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setEditProductOpen(true)
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
        onClick={() => setUploadProductOpen(true)}
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
            Filter Trip: {allTripsForFilter.find((t) => t.id === filterTrip)?.title}
          </span>
          <ChevronDown className={`w-5 h-5 transition-transform ${showTripMenu ? "rotate-180" : ""}`} />
        </Button>

        {showTripMenu && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg z-10">
            {allTripsForFilter.map((trip) => (
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
                {trip.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product List - Episode Style */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading produk...</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {displayProducts.map((product) => {
              const stockPercentage = product.stock > 0 ? Math.min((product.stock / 100) * 100, 100) : 0
              const stockLabel = product.stock === 0 ? "HABIS" : `${product.stock} left`
              
              return (
                <div 
                  key={product.id} 
                  className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-gray-400">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title & Subtitle */}
                      <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">{product.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500">{product.trip?.title}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs font-semibold text-gray-700">
                          Rp{product.price.toLocaleString("id-ID")}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              product.stock === 0
                                ? "bg-red-500"
                                : product.stock < 5
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${stockPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Button & Stock Count */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1.5"
                        >
                          <Info className="w-3 h-3" />
                          Info Produk
                        </button>
                        <span className={`text-xs font-bold ml-auto ${
                          product.stock === 0
                            ? "text-red-600"
                            : product.stock < 5
                            ? "text-yellow-600"
                            : "text-gray-600"
                        }`}>
                          {stockLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {displayProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Tidak ada produk untuk ditampilkan</p>
            </div>
          )}
        </>
      )}

      {/* Create Product Dialog */}
      <CreateProductDialog open={uploadProductOpen} onOpenChange={setUploadProductOpen} onSuccess={fetchData} />

      {/* Edit Product Dialog */}
      <EditProductDialog 
        open={editProductOpen} 
        onOpenChange={setEditProductOpen}
        onSuccess={fetchData}
        product={selectedProduct || undefined}
      />
    </div>
  )
}
