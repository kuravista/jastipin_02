/**
 * Order Filters Component
 * Search bar and status filter dropdown
 * @module dashboard/validasi/OrderFilters
 */

'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import { OrderFilterType } from './types'

interface OrderFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  activeFilter: OrderFilterType
  onFilterChange: (value: OrderFilterType) => void
  pendingCount: number
}

/**
 * Search and filter component for orders
 */
export function OrderFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  pendingCount
}: OrderFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Cari nama, nomor HP, atau No. Order..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 text-sm bg-white"
        />
      </div>

      {/* Filter Select */}
      <Select value={activeFilter} onValueChange={(v) => onFilterChange(v as OrderFilterType)}>
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
  )
}
