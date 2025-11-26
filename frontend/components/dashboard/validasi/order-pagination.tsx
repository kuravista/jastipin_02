/**
 * Order Pagination Component
 * Pagination controls for order list
 * @module dashboard/validasi/OrderPagination
 */

'use client'

import { Button } from '@/components/ui/button'

interface OrderPaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  itemsPerPage: number
  loading: boolean
  onPageChange: (page: number) => void
}

/**
 * Pagination component for order list
 */
export function OrderPagination({
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  loading,
  onPageChange
}: OrderPaginationProps) {
  if (totalPages <= 1) return null

  const startItem = ((currentPage - 1) * itemsPerPage) + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalCount)

  return (
    <div className="flex items-center justify-between px-2 py-3 border-t">
      <div className="text-xs text-gray-600">
        Showing {startItem}-{endItem} of {totalCount}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
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
                onClick={() => onPageChange(page)}
                disabled={loading}
                className={`h-8 w-8 p-0 ${
                  currentPage === page ? 'bg-[#F26B8A] hover:bg-[#E05576]' : ''
                }`}
              >
                {page}
              </Button>
            )
          } else if (page === currentPage - 2 || page === currentPage + 2) {
            return (
              <span key={page} className="text-gray-400 px-1">
                •••
              </span>
            )
          }
          return null
        })}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="h-8 w-8 p-0"
        >
          ›
        </Button>
      </div>
    </div>
  )
}
