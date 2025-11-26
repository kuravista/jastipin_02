/**
 * Order Details Component
 * Expanded order details with items, address, proof, and actions
 * @module dashboard/validasi/OrderDetails
 */

'use client'

import { Button } from '@/components/ui/button'
import { MapPin, ImageIcon, ExternalLink, AlertCircle } from 'lucide-react'
import { Order, ValidationFormState } from './types'
import { ValidationActions } from './validation-actions'

interface OrderDetailsProps {
  order: Order
  isValidated: boolean
  formState: ValidationFormState
  onUpdateFormField: (field: keyof ValidationFormState, orderId: string, value: string | boolean) => void
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
 * Get proof URL and label based on order status
 */
function getProofInfo(order: Order): { url: string | null; label: string } {
  if (order.status === 'awaiting_validation' && order.dpProofUrl) {
    return { url: order.dpProofUrl, label: 'Bukti DP' }
  } else if (order.status === 'awaiting_final_payment' && order.dpProofUrl) {
    return { url: order.dpProofUrl, label: 'Bukti DP' }
  } else if (order.status === 'awaiting_final_validation' && order.finalProofUrl) {
    return { url: order.finalProofUrl, label: 'Bukti Pelunasan' }
  } else if (order.status === 'paid' && order.finalProofUrl) {
    return { url: order.finalProofUrl, label: 'Bukti Pelunasan' }
  } else if (order.proofUrl) {
    return { url: order.proofUrl, label: 'Bukti Tersedia' }
  }
  return { url: null, label: '' }
}

/**
 * Expanded order details component
 */
export function OrderDetails({
  order,
  isValidated,
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
}: OrderDetailsProps) {
  const proofInfo = getProofInfo(order)

  return (
    <div className="border-t border-gray-100 bg-gray-50/50 animate-in slide-in-from-top-2 duration-200">
      <div className="p-4 space-y-4">
        
        {/* Grid Layout for Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Left Column: Items & Address */}
          <div className="space-y-4">
            {/* Order Items */}
            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Detail Pesanan
              </h4>
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
                <span className="font-semibold text-green-600">
                  Rp {order.dpAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Address */}
            {order.Address && (
              <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Pengiriman
                </h4>
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
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Bukti Pembayaran
              </h4>
              {proofInfo.url ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-md border border-green-100 shadow-sm">
                      <ImageIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-900">{proofInfo.label}</p>
                      <p className="text-xs text-green-600">Diunggah oleh pembeli</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenProof(proofInfo.url!, proofInfo.label)
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
              )}
            </div>

            {/* Actions Section */}
            <ValidationActions
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
            />
          </div>
        </div>
      </div>
    </div>
  )
}
