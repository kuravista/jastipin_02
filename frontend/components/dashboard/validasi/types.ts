/**
 * Type definitions for Order Validation Dashboard
 * @module dashboard/validasi/types
 */

/**
 * Final price breakdown stored in order
 */
export interface FinalBreakdown {
  subtotal: number
  shippingFee: number
  jastipherMarkup: number
  taskFee: number
  serviceFee: number
  platformCommission: number
  totalFinal: number
  dpAmount: number
  remainingAmount: number
}

/**
 * Order interface representing a customer order
 */
export interface Order {
  id: string
  orderCode: string | null
  status: string
  dpAmount: number
  totalPrice: number
  finalAmount?: number
  dpPaidAt: string | null
  proofUrl: string | null
  dpProofUrl: string | null
  finalProofUrl: string | null
  createdAt: string
  shippingFee?: number
  serviceFee?: number
  platformCommission?: number
  finalBreakdown?: FinalBreakdown | null
  Participant: {
    name: string
    phone: string
  }
  OrderItem: OrderItemData[]
  Address?: AddressData | null
  Trip?: {
    id: string
    title: string
  }
}

/**
 * Order item data
 */
export interface OrderItemData {
  Product: {
    id: string
    title: string
    type: string
    weightGram?: number | null
  }
  quantity: number
  priceAtOrder: number
}

/**
 * Address data for shipping
 */
export interface AddressData {
  recipientName: string
  phone: string
  addressText: string
  districtId: string
  districtName: string
  cityName: string
  provinceName: string
  postalCode?: string | null
}

/**
 * Shipping option from courier API
 */
export interface ShippingOption {
  courier: string
  service: string
  cost: number
  etd: string
}

/**
 * Pagination data from API
 */
export interface PaginationData {
  total: number
  totalPages: number
  currentPage: number
  limit: number
}

/**
 * Order filter options
 */
export type OrderFilterType = 
  | 'semua' 
  | 'belum-bayar' 
  | 'perlu-validasi' 
  | 'sudah-validasi' 
  | 'cek-pelunasan' 
  | 'selesai'

/**
 * Filter configuration mapping filter type to API status
 */
export const FILTER_STATUS_MAP: Record<OrderFilterType, string | null> = {
  'semua': null,
  'belum-bayar': 'pending_dp',
  'perlu-validasi': 'awaiting_validation',
  'sudah-validasi': 'awaiting_final_payment',
  'cek-pelunasan': 'awaiting_final_validation',
  'selesai': 'paid'
}

/**
 * Status display configuration
 */
export const STATUS_CONFIG: Record<string, { label: string; shortLabel: string; bgClass: string }> = {
  'pending_dp': { 
    label: 'Belum Bayar', 
    shortLabel: 'Belum Bayar',
    bgClass: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200' 
  },
  'awaiting_validation': { 
    label: 'Perlu Validasi', 
    shortLabel: 'Validasi',
    bgClass: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200' 
  },
  'awaiting_final_payment': { 
    label: 'Sudah Validasi', 
    shortLabel: 'Divalidasi',
    bgClass: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' 
  },
  'awaiting_final_validation': { 
    label: 'Cek Pelunasan', 
    shortLabel: 'Cek Lunas',
    bgClass: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200' 
  },
  'paid': { 
    label: 'Selesai', 
    shortLabel: 'Selesai',
    bgClass: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' 
  }
}

/**
 * Get status configuration with fallback
 */
export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || { 
    label: status, 
    shortLabel: status,
    bgClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200' 
  }
}

/**
 * Props for validation actions
 */
export interface ValidationFormState {
  shippingFees: Record<string, string>
  serviceFees: Record<string, string>
  rejectionReasons: Record<string, string>
  showRejectForm: Record<string, boolean>
}
