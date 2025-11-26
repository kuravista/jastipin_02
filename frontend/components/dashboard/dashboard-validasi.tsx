'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Calculator, CheckCircle, CheckCircle2, Loader2, Package, XCircle, Search, FileText, ChevronUp, MapPin, User, Image as ImageIcon, ExternalLink, Calendar, ChevronDown, TrendingUp, Filter, Download, FileSpreadsheet, Tag } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getApiUrl } from '@/lib/config'
import { toast } from 'sonner'
import { exportToExcel, exportShippingLabels, type ExportOrder, type SenderInfo } from '@/lib/export-utils'
import { useAuth } from '@/lib/auth-context'

interface Order {
  id: string
  orderCode: string | null
  status: string
  dpAmount: number
  totalPrice: number
  dpPaidAt: string | null
  proofUrl: string | null
  dpProofUrl: string | null
  finalProofUrl: string | null
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
    postalCode?: string | null
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
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

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

  // Proof preview
  const [showProofPreview, setShowProofPreview] = useState(false)
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null)
  const [selectedProofType, setSelectedProofType] = useState<string>('Bukti Transfer')

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
        params.append('status', 'awaiting_final_payment')
      } else if (activeFilter === 'cek-pelunasan') {
        params.append('status', 'awaiting_final_validation')
      } else if (activeFilter === 'selesai') {
        params.append('status', 'paid')
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

      // Show toast notification instead of alert
      if (action === 'accept') {
        toast.success('Pesanan berhasil divalidasi!', {
          description: 'Email notifikasi telah dikirim ke customer',
          duration: 5000,
        })
      } else {
        toast.error('Pesanan ditolak', {
          description: 'Customer akan menerima notifikasi penolakan',
          duration: 5000,
        })
      }

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
      toast.error('Gagal memvalidasi pesanan', {
        description: err.message || 'Terjadi kesalahan',
        duration: 5000,
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleApproveFinal = async (orderId: string, action: 'accept' | 'reject') => {
    setProcessing(true)
    setError('')

    try {
      const response = await fetch(`${getApiUrl()}/orders/${orderId}/approve-final`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? 'Bukti pembayaran final tidak valid' : undefined
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Final approval failed')
      }

      // Refresh orders
      await fetchOrders()

      // Reset expanded order
      setExpandedOrderId(null)

      // Show toast notification
      if (action === 'accept') {
        toast.success('Pembayaran final disetujui!', {
          description: 'Order telah selesai dan ditandai sebagai lunas',
          duration: 5000,
        })
      } else {
        toast.error('Pembayaran final ditolak', {
          description: 'Customer perlu upload ulang bukti pembayaran',
          duration: 5000,
        })
      }

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
      toast.error('Gagal memproses approval', {
        description: err.message || 'Terjadi kesalahan',
        duration: 5000,
      })
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

  const calculateMedianShipping = (orderId: string) => {
    if (!shippingOptions || shippingOptions.length === 0) {
      setError('Belum ada data ongkir. Klik "Hitung" terlebih dahulu.')
      return
    }

    // Sort costs in ascending order
    const sortedCosts = shippingOptions.map(opt => opt.cost).sort((a, b) => a - b)

    // Calculate median
    let median: number
    const mid = Math.floor(sortedCosts.length / 2)

    if (sortedCosts.length % 2 === 0) {
      // Even number of items: average of two middle values
      median = (sortedCosts[mid - 1] + sortedCosts[mid]) / 2
    } else {
      // Odd number of items: middle value
      median = sortedCosts[mid]
    }

    // Round to nearest integer
    const medianRounded = Math.round(median)

    // Set to shipping fee
    setShippingFees(prev => ({
      ...prev,
      [orderId]: medianRounded.toString()
    }))

    // Close calculator if open
    if (showCalculator && activeOrderForCalc === orderId) {
      setShowCalculator(false)
      setActiveOrderForCalc(null)
    }
  }

  /**
   * Fetch all orders for export (without pagination)
   */
  const fetchAllOrdersForExport = async (): Promise<ExportOrder[]> => {
    try {
      const params = new URLSearchParams()
      
      // Add status filter based on active filter
      if (activeFilter === 'belum-bayar') {
        params.append('status', 'pending_dp')
      } else if (activeFilter === 'perlu-validasi') {
        params.append('status', 'awaiting_validation')
      } else if (activeFilter === 'sudah-validasi') {
        params.append('status', 'awaiting_final_payment')
      } else if (activeFilter === 'cek-pelunasan') {
        params.append('status', 'awaiting_final_validation')
      } else if (activeFilter === 'selesai') {
        params.append('status', 'paid')
      }
      
      // Add search query
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }
      
      // Fetch with max allowed limit (backend allows max 500)
      params.append('limit', '500')
      params.append('offset', '0')
      
      const endpoint = `${getApiUrl()}/orders?${params.toString()}`
      
      const response = await fetch(endpoint, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders for export')
      }
      
      const data = await response.json()
      return data.data || []
    } catch (err) {
      console.error('Error fetching orders for export:', err)
      throw err
    }
  }

  /**
   * Handle Excel export
   */
  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const allOrders = await fetchAllOrdersForExport()
      
      if (allOrders.length === 0) {
        toast.error('Tidak ada data', {
          description: 'Tidak ada order untuk di-export',
          duration: 3000
        })
        return
      }

      exportToExcel(allOrders, 'jastipin-orders')
      
      toast.success('Export berhasil!', {
        description: `${allOrders.length} order telah di-export ke Excel`,
        duration: 3000
      })
    } catch (err) {
      toast.error('Gagal export', {
        description: 'Terjadi kesalahan saat export data',
        duration: 3000
      })
    } finally {
      setExporting(false)
    }
  }

  /**
   * Handle shipping label export (PDF)
   */
  const handleExportLabels = async () => {
    setExporting(true)
    try {
      // Build sender info from user profile
      const senderInfo: SenderInfo = {
        name: user?.profileName || user?.slug || 'Jastiper',
        phone: user?.whatsappNumber || '-',
        address: user?.originAddressText || user?.originDistrictName || '-',
        city: user?.originCityName || '-',
        province: user?.originProvinceName || '-',
        postalCode: user?.originPostalCode
      }

      // Check if sender has origin address configured
      if (!user?.originCityName) {
        toast.error('Alamat Asal Belum Diatur', {
          description: 'Silakan atur alamat asal Anda di pengaturan profil terlebih dahulu',
          duration: 5000
        })
        return
      }

      const allOrders = await fetchAllOrdersForExport()
      const result = exportShippingLabels(allOrders, senderInfo, 'jastipin-labels')
      
      if (result.success) {
        toast.success('Label berhasil dibuat!', {
          description: result.message,
          duration: 3000
        })
      } else {
        toast.error('Tidak ada label', {
          description: result.message,
          duration: 3000
        })
      }
    } catch (err) {
      toast.error('Gagal membuat label', {
        description: 'Terjadi kesalahan saat membuat label pengiriman',
        duration: 3000
      })
    } finally {
      setExporting(false)
    }
  }

  const pendingCount = orders.filter(o => o.status === 'awaiting_validation').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Validasi Order</h1>
          <p className="text-sm text-gray-600 mt-1">Kelola semua order yang masuk</p>
        </div>
        
        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 gap-2"
              disabled={exporting || loading}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Export</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={handleExportExcel}
              disabled={exporting}
              className="cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
              <span>Export Excel</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleExportLabels}
              disabled={exporting}
              className="cursor-pointer"
            >
              <Tag className="w-4 h-4 mr-2 text-blue-600" />
              <span>Export Label</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari nama, nomor HP, atau No. Order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-sm bg-white"
          />
        </div>

        {/* Filter Select */}
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-full sm:w-[220px] h-10 bg-white">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Order</SelectItem>
            <SelectItem value="belum-bayar">Belum Bayar</SelectItem>
            <SelectItem value="perlu-validasi">
              Perlu Validasi {pendingCount > 0 && `(${pendingCount})`}
            </SelectItem>
            <SelectItem value="sudah-validasi">Sudah Validasi</SelectItem>
            <SelectItem value="cek-pelunasan">Cek Pelunasan</SelectItem>
            <SelectItem value="selesai">Selesai</SelectItem>
          </SelectContent>
        </Select>
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
        <div className="space-y-3">
        {filteredOrders.map((order) => {
          const isExpanded = expandedOrderId === order.id
          const isValidated = order.status === 'paid'

          return (
            <div 
              key={order.id} 
              className={`group bg-white rounded-xl border transition-all duration-200 ${
                isExpanded ? 'border-orange-200 shadow-md ring-1 ring-orange-100' : 'border-gray-100 hover:border-orange-200 hover:shadow-sm'
              }`}
            >
              {/* Main Row - Clickable Header */}
              <div 
                className="p-4 cursor-pointer"
                onClick={() => toggleExpand(order.id)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  
                  {/* 1. User Info & Status (Mobile Optimized) */}
                  <div className="flex items-start justify-between lg:justify-start lg:items-center gap-3 lg:w-[280px]">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        isExpanded ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600 group-hover:bg-orange-50 group-hover:text-orange-500'
                      }`}>
                        {order.Participant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{order.Participant.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          {order.orderCode ? (
                            <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{order.orderCode}</span>
                          ) : (
                            order.Participant.phone
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Mobile Status Badge (Hidden on Desktop) */}
                    <div className="lg:hidden">
                      <Badge
                        className={`text-[10px] px-2 py-0.5 h-5 ${
                          order.status === 'pending_dp' ? 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200' :
                          order.status === 'awaiting_validation' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200' :
                          order.status === 'awaiting_final_payment' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' :
                          order.status === 'awaiting_final_validation' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200' :
                          order.status === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' :
                          'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                        }`}
                        variant="outline"
                      >
                        {order.status === 'pending_dp' ? 'Belum Bayar' :
                         order.status === 'awaiting_validation' ? 'Validasi' :
                         order.status === 'awaiting_final_payment' ? 'Divalidasi' :
                         order.status === 'awaiting_final_validation' ? 'Cek Lunas' :
                         order.status === 'paid' ? 'Selesai' :
                         order.status}
                      </Badge>
                    </div>
                  </div>

                  {/* 2. Order Meta (Date & Items) */}
                  <div className="flex-1 grid grid-cols-2 lg:flex lg:items-center lg:gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-xs lg:text-sm">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-xs lg:text-sm">{order.OrderItem.length} Item</span>
                    </div>
                  </div>

                  {/* 3. Desktop Status Badges (Hidden on Mobile) */}
                  <div className="hidden lg:flex items-center gap-2">
                    <Badge
                      className={`text-xs font-normal ${
                        order.status === 'pending_dp' ? 'bg-red-50 text-red-700 border-red-200' :
                        order.status === 'awaiting_validation' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        order.status === 'awaiting_final_payment' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        order.status === 'awaiting_final_validation' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        order.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                      variant="outline"
                    >
                      {order.status === 'pending_dp' ? 'Belum Bayar' :
                       order.status === 'awaiting_validation' ? 'Perlu Validasi' :
                       order.status === 'awaiting_final_payment' ? 'Sudah Validasi' :
                       order.status === 'awaiting_final_validation' ? 'Cek Pelunasan' :
                       order.status === 'paid' ? 'Selesai' :
                       order.status}
                    </Badge>
                    {(order.dpProofUrl || order.finalProofUrl || order.proofUrl) && (
                      <div className="w-2 h-2 rounded-full bg-green-500" title="Bukti Transfer Ada" />
                    )}
                  </div>

                  {/* 4. Price & Expand Action */}
                  <div className="flex items-center justify-between lg:justify-end gap-4 lg:min-w-[180px] pt-3 border-t border-gray-50 lg:pt-0 lg:border-0">
                    <div className="flex flex-col lg:items-end">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium lg:hidden">Total Order</span>
                      <span className="font-bold text-[#F26B8A] text-sm lg:text-base">
                        Rp {order.totalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-8 w-8 p-0 rounded-full hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 ${isExpanded ? 'rotate-180 bg-orange-50 text-orange-600' : 'text-gray-400'}`}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </Button>
                  </div>

                </div>
              </div>

              {/* Expanded Content - Smooth Reveal */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/50 animate-in slide-in-from-top-2 duration-200">
                  <div className="p-4 space-y-4">
                    
                    {/* Grid Layout for Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      
                      {/* Left Column: Items & Address */}
                      <div className="space-y-4">
                        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Detail Pesanan</h4>
                          <div className="space-y-2">
                            {order.OrderItem.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-start text-sm group/item">
                                <div className="flex gap-2">
                                  <div className="w-1 h-1 rounded-full bg-orange-300 mt-2" />
                                  <span className="text-gray-700 group-hover/item:text-gray-900">
                                    {item.Product.title} 
                                    <span className="text-gray-400 ml-1">x{item.quantity}</span>
                                  </span>
                                </div>
                                <span className="font-medium text-gray-900">
                                  Rp {(item.priceAtOrder * item.quantity).toLocaleString('id-ID')}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex justify-between items-center text-sm">
                            <span className="text-gray-500">DP Terbayar</span>
                            <span className="font-semibold text-green-600">Rp {order.dpAmount.toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        {order.Address && (
                          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pengiriman</h4>
                            <div className="flex items-start gap-3">
                              <div className="p-1.5 bg-blue-50 rounded-md text-blue-600 mt-0.5">
                                <MapPin className="w-4 h-4" />
                              </div>
                              <div className="text-sm">
                                <p className="font-medium text-gray-900">{order.Address.recipientName}</p>
                                <p className="text-gray-500 leading-relaxed mt-0.5">
                                  {order.Address.addressText}, {order.Address.districtName}, {order.Address.cityName}
                                </p>
                                <p className="text-xs text-blue-600 mt-1 font-medium">{order.Address.phone}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Proof & Actions */}
                      <div className="space-y-4">
                        {/* Proof Section */}
                        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Bukti Pembayaran</h4>
                          {(() => {
                            // Determine which proof URL to show based on order status
                            let proofUrl: string | null = null
                            let proofLabel = 'Bukti Tersedia'

                            if (order.status === 'awaiting_validation' && order.dpProofUrl) {
                              proofUrl = order.dpProofUrl
                              proofLabel = 'Bukti DP'
                            } else if (order.status === 'awaiting_final_payment' && order.dpProofUrl) {
                              proofUrl = order.dpProofUrl
                              proofLabel = 'Bukti DP'
                            } else if (order.status === 'awaiting_final_validation' && order.finalProofUrl) {
                              proofUrl = order.finalProofUrl
                              proofLabel = 'Bukti Pelunasan'
                            } else if (order.status === 'paid' && order.finalProofUrl) {
                              proofUrl = order.finalProofUrl
                              proofLabel = 'Bukti Pelunasan'
                            } else if (order.proofUrl) {
                              // Fallback to legacy proofUrl
                              proofUrl = order.proofUrl
                            }

                            return proofUrl ? (
                              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-white rounded-md border border-green-100 shadow-sm">
                                    <ImageIcon className="w-4 h-4 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-green-900">{proofLabel}</p>
                                    <p className="text-xs text-green-600">Diunggah oleh pembeli</p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProofUrl(proofUrl);
                                    setSelectedProofType(proofLabel);
                                    setShowProofPreview(true);
                                  }}
                                  className="h-8 text-xs bg-white hover:bg-green-50 border-green-200 text-green-700"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1.5" />
                                  Lihat
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg text-gray-500">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">Belum ada bukti transfer</span>
                              </div>
                            )
                          })()}
                        </div>

                        {/* Action Section */}
                        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tindakan</h4>

                          {/* Show final payment approval for awaiting_final_validation */}
                          {order.status === 'awaiting_final_validation' ? (
                            <div className="space-y-3">
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-amber-900 mb-1">Menunggu Approval Pelunasan</p>
                                <p className="text-xs text-amber-700">Customer telah upload bukti pelunasan. Periksa dan validasi pembayaran.</p>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveFinal(order.id, 'accept');
                                  }}
                                  disabled={processing}
                                  className="flex-1 h-9 bg-green-600 hover:bg-green-700 text-white text-sm"
                                >
                                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1.5" />}
                                  Terima
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveFinal(order.id, 'reject');
                                  }}
                                  disabled={processing}
                                  variant="outline"
                                  className="flex-1 h-9 border-red-200 text-red-700 hover:bg-red-50 text-sm"
                                >
                                  <XCircle className="w-4 h-4 mr-1.5" />
                                  Tolak
                                </Button>
                              </div>
                            </div>
                          ) : order.status === 'awaiting_final_payment' ? (
                            <div className="flex flex-col items-center justify-center py-4 text-center space-y-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">DP Telah Divalidasi</p>
                                <p className="text-xs text-gray-500">Menunggu customer upload bukti pelunasan</p>
                              </div>
                            </div>
                          ) : isValidated ? (
                            <div className="flex flex-col items-center justify-center py-4 text-center space-y-3">
                              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Order Telah Selesai</p>
                                <p className="text-xs text-gray-500">Pembayaran lunas dan transaksi selesai</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/inv/${order.id}`, '_blank')}
                                className="w-full mt-2"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Lihat Invoice
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Input Fields */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center">
                                    <Label className="text-xs font-medium text-gray-700">Ongkir <span className="text-red-500">*</span></Label>
                                    {order.Address && (
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            calculateShipping(order.id);
                                          }}
                                          disabled={calculatingShipping}
                                          className="text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center"
                                        >
                                          {calculatingShipping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calculator className="w-3 h-3 mr-1" />}
                                          Hitung
                                        </button>
                                        {shippingOptions.length > 0 && (
                                          <>
                                            <span className="text-gray-300">|</span>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                calculateMedianShipping(order.id);
                                              }}
                                              className="text-[10px] text-purple-600 hover:text-purple-700 font-medium flex items-center"
                                            >
                                              <TrendingUp className="w-3 h-3 mr-1" />
                                              Median
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                                    <Input
                                      type="number"
                                      value={shippingFees[order.id] || ''}
                                      onChange={(e) => setShippingFees(prev => ({ ...prev, [order.id]: e.target.value }))}
                                      placeholder="0"
                                      className="h-9 pl-8 text-sm"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium text-gray-700">Jasa <span className="text-gray-400">(Opsional)</span></Label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                                    <Input
                                      type="number"
                                      value={serviceFees[order.id] || ''}
                                      onChange={(e) => setServiceFees(prev => ({ ...prev, [order.id]: e.target.value }))}
                                      placeholder="0"
                                      className="h-9 pl-8 text-sm"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleValidate(order.id, 'accept');
                                  }}
                                  disabled={processing}
                                  className="flex-1 bg-[#F26B8A] hover:bg-[#E05576] text-white h-10 shadow-sm"
                                >
                                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                  Terima Order
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowRejectForm(prev => ({ ...prev, [order.id]: !prev[order.id] }));
                                  }}
                                  disabled={processing}
                                  className="h-10 px-3 border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Reject Form */}
                              {showRejectForm[order.id] && (
                                <div className="pt-3 border-t border-gray-100 animate-in slide-in-from-top-1">
                                  <Label className="text-xs font-medium text-red-600 mb-1.5 block">Alasan Penolakan:</Label>
                                  <Textarea
                                    value={rejectionReasons[order.id] || ''}
                                    onChange={(e) => setRejectionReasons(prev => ({ ...prev, [order.id]: e.target.value }))}
                                    placeholder="Jelaskan kenapa order ditolak..."
                                    rows={2}
                                    className="text-sm mb-2 resize-none"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleValidate(order.id, 'reject');
                                    }}
                                    disabled={processing}
                                    className="w-full h-8 text-xs"
                                  >
                                    Konfirmasi Tolak
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
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

      {/* Proof Preview Dialog */}
      <Dialog open={showProofPreview} onOpenChange={setShowProofPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedProofType}</DialogTitle>
            <DialogDescription className="text-sm">
              Preview bukti pembayaran yang diupload oleh customer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedProofUrl ? (
              <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
                <div className="relative w-full max-h-[60vh] overflow-auto bg-white rounded border">
                  <img
                    src={selectedProofUrl}
                    alt="Bukti Transfer"
                    className="w-full h-auto object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex flex-col items-center justify-center p-8 text-gray-500">
                            <svg class="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p class="text-sm">Gagal memuat gambar</p>
                            <a href="${selectedProofUrl}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-600 hover:underline mt-2">Buka di tab baru</a>
                          </div>
                        `
                      }
                    }}
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedProofUrl, '_blank')}
                    className="text-xs"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Buka di Tab Baru
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowProofPreview(false)
                      setSelectedProofUrl(null)
                    }}
                    className="text-xs"
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Tidak ada bukti transfer</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
