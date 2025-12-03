"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Info, Package, UserCircle2, Plane, ChevronLeft, ChevronRight } from "lucide-react"
import { CreateProductDialog } from "@/components/dialogs/create-product-dialog"
import { EditProductDialog } from "@/components/dialogs/edit-product-dialog"
import { apiGet } from "@/lib/api-client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Product {
  id: string
  title: string
  stock: number | null
  isUnlimitedStock?: boolean
  price: number
  description?: string
  tripId: string
  Trip?: { title: string } // Backend returns Trip (capital T)
  image?: string
  type?: 'goods' | 'tasks'
}

interface Trip {
  id: string
  title: string
}

// Utility function to generate a color based on trip title string
const getTripColor = (title: string) => {
  const colors = [
    'bg-blue-50 text-blue-600 border-blue-100',
    'bg-green-50 text-green-600 border-green-100',
    'bg-purple-50 text-purple-600 border-purple-100',
    'bg-rose-50 text-rose-600 border-rose-100',
    'bg-amber-50 text-amber-600 border-amber-100',
    'bg-cyan-50 text-cyan-600 border-cyan-100',
    'bg-indigo-50 text-indigo-600 border-indigo-100',
  ]
  
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

export default function DashboardProduk({ initialFilterTrip }: { initialFilterTrip?: string | null }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTrip, setFilterTrip] = useState("all")
  const [uploadProductOpen, setUploadProductOpen] = useState(false)
  const [editProductOpen, setEditProductOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    if (initialFilterTrip) {
      setFilterTrip(initialFilterTrip)
    }
  }, [initialFilterTrip])

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

  // Filtered products with search and trip filter
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTrip = filterTrip === "all" || product.tripId === filterTrip
      
      return matchesSearch && matchesTrip
    })
  }, [products, searchQuery, filterTrip])

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setEditProductOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Katalog Produk</h1>
          <p className="text-gray-600">Kelola semua produk Anda</p>
        </div>
        <Button
          onClick={() => setUploadProductOpen(true)}
          size="icon"
          className="bg-[#FB923C] hover:bg-[#EA7C2C] text-white rounded-xl sm:w-auto sm:px-4"
        >
          <Plus className="w-5 h-5 sm:mr-2" />
          <span className="hidden sm:inline">Upload Produk Baru</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari nama produk..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1) // Reset to page 1 on search
            }}
            className="pl-9 bg-white"
          />
        </div>
        <Select 
          value={filterTrip} 
          onValueChange={(val) => {
            setFilterTrip(val)
            setCurrentPage(1) // Reset to page 1 on filter change
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px] bg-white">
            <SelectValue placeholder="Filter Trip" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Trip</SelectItem>
            {trips.map((trip) => (
              <SelectItem key={trip.id} value={trip.id}>
                {trip.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading produk...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedProducts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500 mb-2">Tidak ada produk ditemukan</p>
              {products.length === 0 && (
                <Button
                  onClick={() => setUploadProductOpen(true)}
                  variant="outline"
                  className="mt-2 border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Produk Pertama
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* 2-Column Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {paginatedProducts.map((product) => {
                  const isUnlimited = product.isUnlimitedStock === true
                  const stock = product.stock ?? 0
                  const stockPercentage = isUnlimited ? 100 : (stock > 0 ? Math.min((stock / 50) * 100, 100) : 0)
                  const stockLabel = isUnlimited ? "∞ Unlimited" : (stock === 0 ? "HABIS" : `${stock} tersisa`)
                  
                  return (
                    <div 
                      key={product.id} 
                      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all"
                    >
                      {/* Image Section */}
                      <div className="relative h-32 overflow-hidden group">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Type Badge - Desktop Only (top-right) */}
                        <div className="absolute top-2 right-2 hidden sm:block">
                          {product.type === 'tasks' ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-purple-500 text-white rounded-lg text-[10px] font-bold shadow-md">
                              <UserCircle2 className="w-3 h-3" />
                              Jasa
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded-lg text-[10px] font-bold shadow-md">
                              <Package className="w-3 h-3" />
                              Barang
                            </div>
                          )}
                        </div>

                        {/* Mobile Overlay - Badge & Detail Button */}
                        <div className="absolute inset-0 bg-black/30 flex items-end p-2 sm:hidden">
                          <div className="flex items-center justify-between gap-2 w-full">
                            {/* Type Badge - Mobile (left) */}
                            {product.type === 'tasks' ? (
                              <div className="flex items-center gap-1 px-2 py-1 bg-purple-500 text-white rounded-lg text-[10px] font-bold shadow-md">
                                <UserCircle2 className="w-3 h-3" />
                                Jasa
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded-lg text-[10px] font-bold shadow-md">
                                <Package className="w-3 h-3" />
                                Barang
                              </div>
                            )}
                            {/* Detail Button - Mobile (right) */}
                            <Button
                              size="icon"
                              onClick={() => handleEditProduct(product)}
                              className="h-7 w-7 bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              <Info className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-3 space-y-2">
                        {/* Title */}
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{product.title}</h3>
                        
                        {/* Trip & Price */}
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${getTripColor(product.Trip?.title || '')}`}>
                            <Plane className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate font-medium max-w-[80px]">{product.Trip?.title}</span>
                          </div>
                          <span className="text-xs font-bold text-gray-900">
                            Rp{product.price.toLocaleString("id-ID")}
                          </span>
                        </div>

                        {/* Stock Progress */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-gray-500">Stok</span>
                            <span className={`text-[10px] font-bold ${
                              isUnlimited
                                ? "text-blue-600"
                                : stock === 0
                                ? "text-red-600"
                                : stock < 5
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}>
                              {stockLabel}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                isUnlimited
                                  ? "bg-blue-500"
                                  : stock === 0
                                  ? "bg-red-500"
                                  : stock < 5
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${stockPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Action Button - Desktop Only */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          className="hidden sm:flex w-full h-8 text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                        >
                          <Info className="w-3 h-3 mr-1.5" />
                          Detail Produk
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} dari {filteredProducts.length} produk
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
