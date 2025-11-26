/**
 * Custom hook for order management
 * Handles state, API calls, and business logic for order validation
 * @module dashboard/validasi/useOrderManagement
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/config'
import { useAuth } from '@/lib/auth-context'
import { exportToExcel, exportShippingLabels, type ExportOrder, type SenderInfo } from '@/lib/export-utils'
import { 
  Order, 
  ShippingOption, 
  OrderFilterType, 
  FILTER_STATUS_MAP,
  ValidationFormState 
} from './types'

const ITEMS_PER_PAGE = 10

/**
 * Get authorization headers for API requests
 */
function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

/**
 * Hook for managing order validation dashboard state and actions
 */
export function useOrderManagement() {
  const { user } = useAuth()
  
  // Core state
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  
  // UI state
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  
  // Filter and search
  const [activeFilter, setActiveFilter] = useState<OrderFilterType>('perlu-validasi')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // Validation form states
  const [formState, setFormState] = useState<ValidationFormState>({
    shippingFees: {},
    serviceFees: {},
    rejectionReasons: {},
    showRejectForm: {}
  })
  
  // Shipping calculator
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [calculatingShipping, setCalculatingShipping] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [activeOrderForCalc, setActiveOrderForCalc] = useState<string | null>(null)
  
  // Proof preview
  const [showProofPreview, setShowProofPreview] = useState(false)
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null)
  const [selectedProofType, setSelectedProofType] = useState<string>('Bukti Transfer')

  /**
   * Fetch orders from API
   */
  const fetchOrders = useCallback(async (page: number = currentPage) => {
    setLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams()
      
      // Add status filter
      const status = FILTER_STATUS_MAP[activeFilter]
      if (status) {
        params.append('status', status)
      }
      
      // Add search query
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }
      
      // Add pagination
      params.append('limit', ITEMS_PER_PAGE.toString())
      params.append('offset', ((page - 1) * ITEMS_PER_PAGE).toString())
      
      const endpoint = `${getApiUrl()}/orders?${params.toString()}`
      const response = await fetch(endpoint, { headers: getAuthHeaders() })
      
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memuat data order'
      console.error('Failed to fetch orders:', err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [activeFilter, searchQuery, currentPage])

  // Fetch on filter change
  useEffect(() => {
    setCurrentPage(1)
    fetchOrders(1)
  }, [activeFilter])
  
  // Debounced search
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce)
    }
    
    const timeout = setTimeout(() => {
      setCurrentPage(1)
      fetchOrders(1)
    }, 500)
    
    setSearchDebounce(timeout)
    
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [searchQuery])

  /**
   * Toggle order expansion
   */
  const toggleExpand = useCallback((orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null)
    } else {
      setExpandedOrderId(orderId)
      setError('')
    }
  }, [expandedOrderId])

  /**
   * Calculate shipping options for an order
   */
  const calculateShipping = useCallback(async (orderId: string) => {
    setCalculatingShipping(true)
    setError('')
    
    try {
      const response = await fetch(`${getApiUrl()}/orders/${orderId}/calculate-shipping`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ courier: 'jne:tiki:pos' })
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to calculate shipping')
      }

      setShippingOptions(data.data.options || [])
      setActiveOrderForCalc(orderId)
      setShowCalculator(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menghitung ongkir'
      setError(message)
    } finally {
      setCalculatingShipping(false)
    }
  }, [])

  /**
   * Calculate median shipping cost
   */
  const calculateMedianShipping = useCallback((orderId: string) => {
    if (!shippingOptions || shippingOptions.length === 0) {
      setError('Belum ada data ongkir. Klik "Hitung" terlebih dahulu.')
      return
    }

    const sortedCosts = shippingOptions.map(opt => opt.cost).sort((a, b) => a - b)
    const mid = Math.floor(sortedCosts.length / 2)
    
    let median: number
    if (sortedCosts.length % 2 === 0) {
      median = (sortedCosts[mid - 1] + sortedCosts[mid]) / 2
    } else {
      median = sortedCosts[mid]
    }

    const medianRounded = Math.round(median)
    
    setFormState(prev => ({
      ...prev,
      shippingFees: { ...prev.shippingFees, [orderId]: medianRounded.toString() }
    }))

    if (showCalculator && activeOrderForCalc === orderId) {
      setShowCalculator(false)
      setActiveOrderForCalc(null)
    }
  }, [shippingOptions, showCalculator, activeOrderForCalc])

  /**
   * Select a shipping option
   */
  const selectShippingOption = useCallback((option: ShippingOption) => {
    if (activeOrderForCalc) {
      setFormState(prev => ({
        ...prev,
        shippingFees: { ...prev.shippingFees, [activeOrderForCalc]: option.cost.toString() }
      }))
    }
    setShowCalculator(false)
    setActiveOrderForCalc(null)
  }, [activeOrderForCalc])

  /**
   * Validate an order (accept or reject)
   */
  const handleValidate = useCallback(async (orderId: string, action: 'accept' | 'reject') => {
    setProcessing(true)
    setError('')

    try {
      const shippingFee = formState.shippingFees[orderId] || ''
      const serviceFee = formState.serviceFees[orderId] || ''
      const rejectionReason = formState.rejectionReasons[orderId] || ''

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

      await fetchOrders()

      // Reset form for this order
      setExpandedOrderId(null)
      setFormState(prev => ({
        shippingFees: Object.fromEntries(Object.entries(prev.shippingFees).filter(([k]) => k !== orderId)),
        serviceFees: Object.fromEntries(Object.entries(prev.serviceFees).filter(([k]) => k !== orderId)),
        rejectionReasons: Object.fromEntries(Object.entries(prev.rejectionReasons).filter(([k]) => k !== orderId)),
        showRejectForm: Object.fromEntries(Object.entries(prev.showRejectForm).filter(([k]) => k !== orderId))
      }))

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

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(message)
      toast.error('Gagal memvalidasi pesanan', {
        description: message,
        duration: 5000,
      })
    } finally {
      setProcessing(false)
    }
  }, [formState, fetchOrders])

  /**
   * Approve or reject final payment
   */
  const handleApproveFinal = useCallback(async (orderId: string, action: 'accept' | 'reject') => {
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

      await fetchOrders()
      setExpandedOrderId(null)

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

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(message)
      toast.error('Gagal memproses approval', {
        description: message,
        duration: 5000,
      })
    } finally {
      setProcessing(false)
    }
  }, [fetchOrders])

  /**
   * Fetch all orders for export
   */
  const fetchAllOrdersForExport = useCallback(async (): Promise<ExportOrder[]> => {
    const params = new URLSearchParams()
    
    const status = FILTER_STATUS_MAP[activeFilter]
    if (status) {
      params.append('status', status)
    }
    
    if (searchQuery.trim()) {
      params.append('search', searchQuery.trim())
    }
    
    params.append('limit', '500')
    params.append('offset', '0')
    
    const endpoint = `${getApiUrl()}/orders?${params.toString()}`
    const response = await fetch(endpoint, { headers: getAuthHeaders() })
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders for export')
    }
    
    const data = await response.json()
    return data.data || []
  }, [activeFilter, searchQuery])

  /**
   * Export orders to Excel
   */
  const handleExportExcel = useCallback(async () => {
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
    } catch {
      toast.error('Gagal export', {
        description: 'Terjadi kesalahan saat export data',
        duration: 3000
      })
    } finally {
      setExporting(false)
    }
  }, [fetchAllOrdersForExport])

  /**
   * Export shipping labels to PDF
   */
  const handleExportLabels = useCallback(async () => {
    setExporting(true)
    try {
      const senderInfo: SenderInfo = {
        name: user?.profileName || user?.slug || 'Jastiper',
        phone: user?.whatsappNumber || '-',
        address: user?.originAddressText || user?.originDistrictName || '-',
        city: user?.originCityName || '-',
        province: user?.originProvinceName || '-',
        postalCode: user?.originPostalCode
      }

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
    } catch {
      toast.error('Gagal membuat label', {
        description: 'Terjadi kesalahan saat membuat label pengiriman',
        duration: 3000
      })
    } finally {
      setExporting(false)
    }
  }, [user, fetchAllOrdersForExport])

  /**
   * Update form field
   */
  const updateFormField = useCallback((
    field: keyof ValidationFormState, 
    orderId: string, 
    value: string | boolean
  ) => {
    setFormState(prev => ({
      ...prev,
      [field]: { ...prev[field], [orderId]: value }
    }))
  }, [])

  /**
   * Open proof preview
   */
  const openProofPreview = useCallback((url: string, type: string) => {
    setSelectedProofUrl(url)
    setSelectedProofType(type)
    setShowProofPreview(true)
  }, [])

  /**
   * Close proof preview
   */
  const closeProofPreview = useCallback(() => {
    setShowProofPreview(false)
    setSelectedProofUrl(null)
  }, [])

  return {
    // Data
    orders,
    user,
    
    // Loading states
    loading,
    processing,
    exporting,
    error,
    
    // UI state
    expandedOrderId,
    toggleExpand,
    
    // Filter and search
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    
    // Pagination
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage: ITEMS_PER_PAGE,
    fetchOrders,
    
    // Form state
    formState,
    updateFormField,
    
    // Shipping calculator
    shippingOptions,
    calculatingShipping,
    showCalculator,
    setShowCalculator,
    activeOrderForCalc,
    calculateShipping,
    calculateMedianShipping,
    selectShippingOption,
    
    // Proof preview
    showProofPreview,
    selectedProofUrl,
    selectedProofType,
    openProofPreview,
    closeProofPreview,
    
    // Actions
    handleValidate,
    handleApproveFinal,
    handleExportExcel,
    handleExportLabels,
  }
}
