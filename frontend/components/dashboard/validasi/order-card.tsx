/**
 * Order Card Component
 * Individual order card with expand/collapse functionality
 * @module dashboard/validasi/OrderCard
 */

'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Package, ChevronDown } from 'lucide-react'
import { Order, getStatusConfig } from './types'
import { OrderDetails } from './order-details'
import { ValidationFormState } from './types'

interface OrderCardProps {
  order: Order
  isExpanded: boolean
  onToggle: () => void
  // Form state
  formState: ValidationFormState
  onUpdateFormField: (field: keyof ValidationFormState, orderId: string, value: string | boolean) => void
  // Actions
  processing: boolean
  calculatingShipping: boolean
  shippingOptionsAvailable: boolean
  onValidate: (orderId: string, action: 'accept' | 'reject') => void
  onApproveFinal: (orderId: string, action: 'accept' | 'reject') => void
  onCalculateShipping: (orderId: string) => void
  onCalculateMedian: (orderId: string) => void
  onOpenProof: (url: string, type: string) => void
}

/**
 * Individual order card component
 */
export function OrderCard({
  order,
  isExpanded,
  onToggle,
  formState,
  onUpdateFormField,
  processing,
  calculatingShipping,
  shippingOptionsAvailable,
  onValidate,
  onApproveFinal,
  onCalculateShipping,
  onCalculateMedian,
  onOpenProof
}: OrderCardProps) {
  const statusConfig = getStatusConfig(order.status)
  const isValidated = order.status === 'paid'
  const hasProof = !!(order.dpProofUrl || order.finalProofUrl || order.proofUrl)

  return (
    <div 
      className={`group bg-white rounded-xl border transition-all duration-200 ${
        isExpanded 
          ? 'border-orange-200 shadow-md ring-1 ring-orange-100' 
          : 'border-gray-100 hover:border-orange-200 hover:shadow-sm'
      }`}
    >
      {/* Main Row - Clickable Header */}
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          
          {/* 1. User Info & Status (Mobile Optimized) */}
          <div className="flex items-start justify-between lg:justify-start lg:items-center gap-3 lg:w-[280px]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                isExpanded 
                  ? 'bg-orange-100 text-orange-600' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-orange-50 group-hover:text-orange-500'
              }`}>
                {order.Participant.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{order.Participant.name}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  {order.orderCode ? (
                    <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                      {order.orderCode}
                    </span>
                  ) : (
                    order.Participant.phone
                  )}
                </div>
              </div>
            </div>
            
            {/* Mobile Status Badge */}
            <div className="lg:hidden">
              <Badge
                className={`text-[10px] px-2 py-0.5 h-5 ${statusConfig.bgClass}`}
                variant="outline"
              >
                {statusConfig.shortLabel}
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

          {/* 3. Desktop Status Badges */}
          <div className="hidden lg:flex items-center gap-2">
            <Badge
              className={`text-xs font-normal ${statusConfig.bgClass.replace('hover:bg-', 'bg-').replace('-200', '-50')}`}
              variant="outline"
            >
              {statusConfig.label}
            </Badge>
            {hasProof && (
              <div className="w-2 h-2 rounded-full bg-green-500" title="Bukti Transfer Ada" />
            )}
          </div>

          {/* 4. Price & Expand Action */}
          <div className="flex items-center justify-between lg:justify-end gap-4 lg:min-w-[180px] pt-3 border-t border-gray-50 lg:pt-0 lg:border-0">
            <div className="flex flex-col lg:items-end">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium lg:hidden">
                Total Order
              </span>
              <span className="font-bold text-[#F26B8A] text-sm lg:text-base">
                Rp {order.totalPrice.toLocaleString('id-ID')}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className={`h-8 w-8 p-0 rounded-full hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 ${
                isExpanded ? 'rotate-180 bg-orange-50 text-orange-600' : 'text-gray-400'
              }`}
            >
              <ChevronDown className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <OrderDetails
          order={order}
          isValidated={isValidated}
          formState={formState}
          onUpdateFormField={onUpdateFormField}
          processing={processing}
          calculatingShipping={calculatingShipping}
          shippingOptionsAvailable={shippingOptionsAvailable}
          onValidate={onValidate}
          onApproveFinal={onApproveFinal}
          onCalculateShipping={onCalculateShipping}
          onCalculateMedian={onCalculateMedian}
          onOpenProof={onOpenProof}
        />
      )}
    </div>
  )
}
