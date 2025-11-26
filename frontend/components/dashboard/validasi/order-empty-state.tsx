/**
 * Order Empty State Component
 * Empty state display when no orders are found
 * @module dashboard/validasi/OrderEmptyState
 */

'use client'

import { Package, Loader2 } from 'lucide-react'

interface OrderEmptyStateProps {
  loading: boolean
  hasSearchQuery: boolean
}

/**
 * Empty state component for order list
 */
export function OrderEmptyState({ loading, hasSearchQuery }: OrderEmptyStateProps) {
  if (loading) {
    return (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#F26B8A] mx-auto mb-2" />
          <p className="text-sm text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center py-12">
      <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
      <p className="text-sm text-gray-500">
        {hasSearchQuery 
          ? 'Tidak ada order yang cocok dengan pencarian' 
          : 'Tidak ada order untuk ditampilkan'}
      </p>
    </div>
  )
}
