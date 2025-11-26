/**
 * Order Header Component
 * Displays title and export dropdown
 * @module dashboard/validasi/OrderHeader
 */

'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, Tag, ChevronDown, Loader2 } from 'lucide-react'

interface OrderHeaderProps {
  exporting: boolean
  loading: boolean
  onExportExcel: () => void
  onExportLabels: () => void
}

/**
 * Header component with title and export dropdown
 */
export function OrderHeader({ 
  exporting, 
  loading, 
  onExportExcel, 
  onExportLabels 
}: OrderHeaderProps) {
  return (
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
            onClick={onExportExcel}
            disabled={exporting}
            className="cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
            <span>Export Excel</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onExportLabels}
            disabled={exporting}
            className="cursor-pointer"
          >
            <Tag className="w-4 h-4 mr-2 text-blue-600" />
            <span>Export Label</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
