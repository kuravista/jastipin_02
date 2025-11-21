'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Calculator, CheckCircle, CheckCircle2, Loader2, Package, XCircle, Search, FileText, ChevronDown, ChevronUp, MapPin, Phone, User } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { getApiUrl } from '@/lib/config'

interface Order {
  id: string
  status: string
  dpAmount: number
  totalPrice: number
  dpPaidAt: string | null
  createdAt: string
  Participant: {
    name: string
    phone: string
  }
  OrderItem: {
    Product: {
      id: string
      title: string
      type: string
      weightGram?: number | null
    }
    quantity: number
    priceAtOrder: number
  }[]
  Address?: {
    recipientName: string
    phone: string
    addressText: string
    districtId: string
    districtName: string
    cityName: string
    provinceName: string
  } | null
  Trip?: {
    id: string
    title: string
  }
}

interface ShippingOption {
  courier: string
  service: string
  cost: number
  etd: string
}

export default function JastiperValidationDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  // Filter and search
  const [activeFilter, setActiveFilter] = useState('perlu-validasi')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10

  // Validation form states per order
  const [shippingFees, setShippingFees] = useState<Record<string, string>>({})
  const [serviceFees, setServiceFees] = useState<Record<string, string>>({})
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})
  const [showRejectForm, setShowRejectForm] = useState<Record<string, boolean>>({})
  
  // Shipping calculator
  const [showCalculator, setShowCalculator] = useState(false)
  const [activeOrderForCalc, setActiveOrderForCalc] = useState<string | null>(null)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [calculatingShipping, setCalculatingShipping] = useState(false)

  useEffect(() => {
    setCurrentPage(1) // Reset to page 1 when filter changes
    fetchOrders(1)
  }, [activeFilter])
  
  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (searchDebounce) {
      clearTimeout(searchDebounce)
    }
    
    // Set new timeout for search (500ms delay)
    const timeout = setTimeout(() => {
      setCurrentPage(1) // Reset to page 1 on search
      fetchOrders(1)
    }, 500)
    
    setSearchDebounce(timeout)
    
    // Cleanup
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [searchQuery])

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  const fetchOrders = async (page: number = currentPage) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      
      // Add status filter based on active filter
      if (activeFilter === 'belum-bayar') {
        params.append('status', 'pending_dp')
      } else if (activeFilter === 'perlu-validasi') {
        params.append('status', 'awaiting_validation')
      } else if (activeFilter === 'sudah-validasi') {
        params.append('status', 'validated')
      }
      // If activeFilter === 'semua', no status parameter = fetch all orders
      
      // Add search query
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }
      
      // Add pagination
      params.append('limit', itemsPerPage.toString())
      params.append('offset', ((page - 1) * itemsPerPage).toString())
      
      const endpoint = `${getApiUrl()}/orders?${params.toString()}`
      
      const response = await fetch(endpoint, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch orders`)
      }
      
      const data = await response.json()
      if (data.success) {
        setOrders(data.data || [])
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1)
          setTotalCount(data.pagination.total || 0)
          setCurrentPage(page)
        }
      } else {
        throw new Error(data.error || 'Failed to fetch orders')
      }
    } catch (err: any) {
      console.error('Failed to fetch orders:', err)
      setError(err.message || 'Gagal memuat data order')
    } finally {
      setLoading(false)
    }
  }

  // No need for client-side filtering anymore - backend handles search
  const filteredOrders = orders

  const toggleExpand = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null)
    } else {
      setExpandedOrderId(orderId)
      setError('')
    }
  }

  const calculateShipping = async (orderId: string) => {
    setCalculatingShipping(true)
    setError('')
    try {
      const response = await fetch(`${getApiUrl()}/orders/${orderId}/calculate-shipping`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          courier: 'jne:tiki:pos'
        })
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to calculate shipping')
      }

      setShippingOptions(data.data.options || [])
      setActiveOrderForCalc(orderId)
      setShowCalculator(true)
    } catch (err: any) {
      setError(err.message || 'Gagal menghitung ongkir')
    } finally {
      setCalculatingShipping(false)
    }
  }

  const handleValidate = async (orderId: string, action: 'accept' | 'reject') => {
    setProcessing(true)
    setError('')

    try {
      const shippingFee = shippingFees[orderId] || ''
      const serviceFee = serviceFees[orderId] || ''
      const rejectionReason = rejectionReasons[orderId] || ''

      if (action === 'accept') {
        if (!shippingFee || isNaN(Number(shippingFee))) {
          throw new Error('Ongkir wajib diisi dengan angka yang valid')
        }
      }

      if (action === 'reject' && !rejectionReason) {
        throw new Error('Alasan penolakan wajib diisi')
      }

      const response = await fetch(`${getApiUrl()}/orders/${orderId}/validate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action,
          shippingFee: action === 'accept' ? Number(shippingFee) : undefined,
          serviceFee: action === 'accept' && serviceFee ? Number(serviceFee) : undefined,
          rejectionReason: action === 'reject' ? rejectionReason : undefined
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Validation failed')
      }

      // Refresh orders
      await fetchOrders()
      
      // Reset form for this order
      setExpandedOrderId(null)
      setShippingFees(prev => {
        const newState = { ...prev }
        delete newState[orderId]
        return newState
      })
      setServiceFees(prev => {
        const newState = { ...prev }
        delete newState[orderId]
        return newState
      })
      setRejectionReasons(prev => {
        const newState = { ...prev }
        delete newState[orderId]
        return newState
      })
      setShowRejectForm(prev => {
        const newState = { ...prev }
        delete newState[orderId]
        return newState
      })
      
      alert(action === 'accept' ? 'Pesanan berhasil divalidasi!' : 'Pesanan ditolak')

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setProcessing(false)
    }
  }

  const selectShippingOption = (option: ShippingOption) => {
    if (activeOrderForCalc) {
      setShippingFees(prev => ({
        ...prev,
        [activeOrderForCalc]: option.cost.toString()
      }))
    }
    setShowCalculator(false)
    setActiveOrderForCalc(null)
  }

  const pendingCount = orders.filter(o => o.status === 'awaiting_validation').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Validasi Order</h1>
        <p className="text-sm text-gray-600 mt-1">Kelola semua order yang masuk</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Cari nama, nomor HP, atau No. Order..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 text-sm bg-white"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button
          onClick={() => setActiveFilter('semua')}
          variant={activeFilter === 'semua' ? 'default' : 'outline'}
          className={activeFilter === 'semua' ? 'bg-[#F26B8A] hover:bg-[#E05576]' : ''}
          size="sm"
        >
          Semua
        </Button>
        <Button
          onClick={() => setActiveFilter('belum-bayar')}
          variant={activeFilter === 'belum-bayar' ? 'default' : 'outline'}
          className={activeFilter === 'belum-bayar' ? 'bg-[#F26B8A] hover:bg-[#E05576]' : ''}
          size="sm"
        >
          Belum Bayar
        </Button>
        <Button
          onClick={() => setActiveFilter('perlu-validasi')}
          variant={activeFilter === 'perlu-validasi' ? 'default' : 'outline'}
          className={activeFilter === 'perlu-validasi' ? 'bg-[#F26B8A] hover:bg-[#E05576]' : ''}
          size="sm"
        >
          Perlu Validasi {pendingCount > 0 && `(${pendingCount})`}
        </Button>
        <Button
          onClick={() => setActiveFilter('sudah-validasi')}
          variant={activeFilter === 'sudah-validasi' ? 'default' : 'outline'}
          className={activeFilter === 'sudah-validasi' ? 'bg-[#F26B8A] hover:bg-[#E05576]' : ''}
          size="sm"
        >
          Sudah Validasi
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Order List - Compact & Responsive with Loading State */}
      <div className="relative min-h-[300px]">
        {/* Loading Overlay - Only shows over table */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#F26B8A] mx-auto mb-2" />
              <p className="text-sm text-gray-600">Memuat data...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {searchQuery ? 'Tidak ada order yang cocok dengan pencarian' : 'Tidak ada order untuk ditampilkan'}
            </p>
          </div>
        )}

        {/* Order List */}
        <div className="space-y-2">
        {filteredOrders.map((order) => {
          const isExpanded = expandedOrderId === order.id
          const isValidated = activeFilter === 'sudah-validasi' || order.status === 'validated'
          
          return (
            <div 
              key={order.id} 
              className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow"
            >
              {/* Collapsed Header - Always Visible */}
              <div className="p-3">
                {/* Mobile & Tablet Layout (< 1024px) */}
                <div className="lg:hidden">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{order.Participant.name}</div>
                        <div className="text-xs text-gray-500">{order.Participant.phone}</div>
                      </div>
                    </div>
                    <Badge 
                      className="text-xs" 
                      variant={
                        order.status === 'pending_dp' ? 'destructive' :
                        order.status === 'awaiting_validation' ? 'default' :
                        'secondary'
                      }
                    >
                      {order.status === 'pending_dp' ? 'Belum Bayar' :
                       order.status === 'awaiting_validation' ? 'Perlu Validasi' :
                       order.status === 'validated' ? 'Sudah Validasi' :
                       order.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                    <span>{new Date(order.createdAt).toLocaleDateString('id-ID')}</span>
                    <span>{order.OrderItem.length} item</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#F26B8A]">Rp {order.totalPrice.toLocaleString('id-ID')}</span>
                    <Button
                      onClick={() => toggleExpand(order.id)}
                      size="sm"
                      variant={isExpanded ? "outline" : "default"}
                      className={!isExpanded ? 'bg-[#F26B8A] hover:bg-[#E05576] h-8 text-xs' : 'h-8 text-xs'}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1" />
                          Tutup
                        </>
                      ) : (
                        <>
                          {isValidated ? 'Detail' : 'Validasi'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Desktop Layout (>= 1024px) - Table-like */}
                <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">{order.Participant.name}</div>
                      <div className="text-xs text-gray-500">{order.Participant.phone}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                  </div>
                  <div className="text-xs text-gray-600 text-center w-16">
                    {order.OrderItem.length} item
                  </div>
                  <div className="font-bold text-[#F26B8A] text-sm w-32 text-right">
                    Rp {order.totalPrice.toLocaleString('id-ID')}
                  </div>
                  <Badge 
                    className="text-xs" 
                    variant={
                      order.status === 'pending_dp' ? 'destructive' :
                      order.status === 'awaiting_validation' ? 'default' :
                      'secondary'
                    }
                  >
                    {order.status === 'pending_dp' ? 'Belum Bayar' :
                     order.status === 'awaiting_validation' ? 'Perlu Validasi' :
                     order.status === 'validated' ? 'Sudah Validasi' :
                     order.status}
                  </Badge>
                  <Button
                    onClick={() => toggleExpand(order.id)}
                    size="sm"
                    variant={isExpanded ? "outline" : "default"}
                    className={!isExpanded ? 'bg-[#F26B8A] hover:bg-[#E05576] h-8 text-xs w-24' : 'h-8 text-xs w-24'}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3 mr-1" />
                        Tutup
                      </>
                    ) : (
                      <>
                        {isValidated ? 'Detail' : 'Validasi'}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-3">
                  {/* Order Items */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Pesanan:</p>
                    <div className="space-y-1">
                      {order.OrderItem.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-gray-700 bg-white px-2 py-1.5 rounded">
                          <span className="truncate">{item.Product.title} <span className="text-gray-500">× {item.quantity}</span></span>
                          <span className="font-medium ml-2">Rp {(item.priceAtOrder * item.quantity).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Address */}
                  {order.Address && (
                    <div className="bg-white p-2 rounded">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs">
                          <p className="font-medium text-gray-700">{order.Address.recipientName}</p>
                          <p className="text-gray-600 mt-0.5">
                            {order.Address.addressText}, {order.Address.districtName}, {order.Address.cityName}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DP Info */}
                  <div className="flex justify-between text-xs bg-white px-2 py-1.5 rounded">
                    <span className="text-gray-600">DP Dibayar:</span>
                    <span className="font-semibold text-gray-900">Rp {order.dpAmount.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Validation Form or Status */}
                  {isValidated ? (
                    <div className="flex items-center justify-between bg-white p-2 rounded">
                      <div className="flex items-center gap-2 text-green-600 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Sudah Divalidasi
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/inv/${order.id}`, '_blank')}
                        className="h-7 text-xs"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Invoice
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 bg-white p-3 rounded">
                      {/* Shipping Fee */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-medium">
                            Ongkir <span className="text-red-500">*</span>
                          </Label>
                          {order.Address && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => calculateShipping(order.id)}
                              disabled={calculatingShipping}
                              className="h-7 text-xs"
                            >
                              {calculatingShipping ? (
                                <>
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  Hitung...
                                </>
                              ) : (
                                <>
                                  <Calculator className="mr-1 h-3 w-3" />
                                  Hitung Ongkir
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        <Input
                          type="number"
                          value={shippingFees[order.id] || ''}
                          onChange={(e) => setShippingFees(prev => ({ ...prev, [order.id]: e.target.value }))}
                          placeholder="Masukkan ongkir"
                          className="h-9 text-sm"
                        />
                      </div>

                      {/* Service Fee */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">
                          Biaya Jasa <span className="text-gray-500">(opsional)</span>
                        </Label>
                        <Input
                          type="number"
                          value={serviceFees[order.id] || ''}
                          onChange={(e) => setServiceFees(prev => ({ ...prev, [order.id]: e.target.value }))}
                          placeholder="Biaya jasa tambahan"
                          className="h-9 text-sm"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleValidate(order.id, 'accept')}
                          disabled={processing}
                          className="flex-1 bg-[#F26B8A] hover:bg-[#E05576] h-9 text-sm"
                        >
                          {processing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                          )}
                          Terima
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowRejectForm(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                          disabled={processing}
                          className="h-9 text-sm"
                        >
                          <XCircle className="mr-1.5 h-3.5 w-3.5" />
                          Tolak
                        </Button>
                      </div>

                      {/* Reject Form */}
                      {showRejectForm[order.id] && (
                        <div className="pt-2 border-t space-y-2">
                          <Label className="text-xs font-medium text-red-600">Alasan Penolakan:</Label>
                          <Textarea
                            value={rejectionReasons[order.id] || ''}
                            onChange={(e) => setRejectionReasons(prev => ({ ...prev, [order.id]: e.target.value }))}
                            placeholder="Jelaskan alasan penolakan..."
                            rows={3}
                            className="text-sm"
                          />
                          <Button
                            variant="destructive"
                            onClick={() => handleValidate(order.id, 'reject')}
                            disabled={processing}
                            className="w-full h-9 text-sm"
                          >
                            {processing ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="mr-2 h-4 w-4" />
                            )}
                            Konfirmasi Tolak
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        </div>
      </div>

      {/* Pagination - Minimalist */}
      {!loading && filteredOrders.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-3 border-t">
          <div className="text-xs text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="h-8 w-8 p-0"
            >
              ‹
            </Button>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1
              // Show first, last, current, and adjacent pages
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => fetchOrders(page)}
                    disabled={loading}
                    className={`h-8 w-8 p-0 ${currentPage === page ? 'bg-[#F26B8A] hover:bg-[#E05576]' : ''}`}
                  >
                    {page}
                  </Button>
                )
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return <span key={page} className="text-gray-400 px-1">•••</span>
              }
              return null
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="h-8 w-8 p-0"
            >
              ›
            </Button>
          </div>
        </div>
      )}

      {/* Shipping Calculator Dialog */}
      <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">Pilih Opsi Pengiriman</DialogTitle>
            <DialogDescription className="text-sm">
              Hasil perhitungan ongkir otomatis
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {shippingOptions.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-4">Tidak ada opsi pengiriman tersedia</p>
            ) : (
              shippingOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => selectShippingOption(option)}
                  className="w-full p-3 border rounded-lg hover:bg-gray-50 hover:border-[#F26B8A] text-left transition-colors"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900">{option.courier.toUpperCase()} - {option.service}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Estimasi: {option.etd} hari</p>
                    </div>
                    <p className="font-bold text-sm text-[#F26B8A] whitespace-nowrap">Rp {option.cost.toLocaleString('id-ID')}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
