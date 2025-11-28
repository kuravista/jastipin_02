/**
 * Validation Actions Component
 * Action buttons and forms for order validation
 * @module dashboard/validasi/ValidationActions
 */

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Calculator, 
  CheckCircle, 
  CheckCircle2, 
  Loader2, 
  XCircle, 
  FileText,
  TrendingUp 
} from 'lucide-react'
import { Order, ValidationFormState } from './types'

interface ValidationActionsProps {
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
}

/**
 * Validation actions component with forms and buttons
 */
export function ValidationActions({
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
  onCalculateMedian
}: ValidationActionsProps) {
  const shippingFee = formState.shippingFees[order.id] || ''
  const serviceFee = formState.serviceFees[order.id] || ''
  const rejectionReason = formState.rejectionReasons[order.id] || ''
  const showReject = formState.showRejectForm[order.id] || false

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Tindakan
      </h4>

      {/* Final Validation State */}
      {order.status === 'awaiting_final_validation' ? (
        <FinalValidationActions
          orderId={order.id}
          order={order}
          processing={processing}
          onApproveFinal={onApproveFinal}
        />
      ) : order.status === 'awaiting_final_payment' ? (
        <AwaitingPaymentState />
      ) : isValidated ? (
        <CompletedState orderId={order.id} />
      ) : (
        <ValidationForm
          order={order}
          shippingFee={shippingFee}
          serviceFee={serviceFee}
          rejectionReason={rejectionReason}
          showReject={showReject}
          processing={processing}
          calculatingShipping={calculatingShipping}
          shippingOptionsAvailable={shippingOptionsAvailable}
          onUpdateFormField={onUpdateFormField}
          onValidate={onValidate}
          onCalculateShipping={onCalculateShipping}
          onCalculateMedian={onCalculateMedian}
        />
      )}
    </div>
  )
}

/**
 * Final validation approval buttons
 */
function FinalValidationActions({
  orderId,
  order,
  processing,
  onApproveFinal
}: {
  orderId: string
  order: Order
  processing: boolean
  onApproveFinal: (orderId: string, action: 'accept' | 'reject') => void
}) {
  // Get breakdown values (from finalBreakdown or individual fields)
  const breakdown = order.finalBreakdown || {
    shippingFee: order.shippingFee || 0,
    serviceFee: order.serviceFee || 0,
    platformCommission: order.platformCommission || 0,
    remainingAmount: order.finalAmount || 0
  }

  return (
    <div className="space-y-3">
      {/* Fee Breakdown Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
        <h5 className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-2">
          Rincian Biaya
        </h5>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-blue-700">Biaya Ongkir</span>
            <span className="font-medium text-blue-900">
              Rp {breakdown.shippingFee.toLocaleString('id-ID')}
            </span>
          </div>
          {breakdown.serviceFee > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-blue-700">Fee Tambahan</span>
              <span className="font-medium text-blue-900">
                Rp {breakdown.serviceFee.toLocaleString('id-ID')}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-blue-700">Fee System</span>
            <span className="font-medium text-blue-900">
              Rp {breakdown.platformCommission.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs font-medium text-amber-900 mb-1">
          Menunggu Approval Pelunasan
        </p>
        <p className="text-xs text-amber-700">
          Customer telah upload bukti pelunasan. Periksa dan validasi pembayaran.
        </p>
      </div>

      {/* DP Paid and Final Payment Amount */}
      <div className="bg-gradient-to-r from-green-50 to-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">DP Terbayar</span>
          <span className="font-semibold text-green-600">
            Rp {order.dpAmount.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="pt-2 border-t border-purple-200 flex justify-between items-center">
          <span className="text-sm font-semibold text-purple-900">Nominal Pelunasan</span>
          <span className="text-base font-bold text-purple-700">
            Rp {breakdown.remainingAmount.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onApproveFinal(orderId, 'accept')
          }}
          disabled={processing}
          className="flex-1 h-9 bg-green-600 hover:bg-green-700 text-white text-sm"
        >
          {processing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-1.5" />
          )}
          Terima
        </Button>
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onApproveFinal(orderId, 'reject')
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
  )
}

/**
 * Awaiting final payment state display
 */
function AwaitingPaymentState() {
  return (
    <div className="flex flex-col items-center justify-center py-4 text-center space-y-3">
      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
        <CheckCircle2 className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <p className="font-medium text-gray-900">DP Telah Divalidasi</p>
        <p className="text-xs text-gray-500">Menunggu customer upload bukti pelunasan</p>
      </div>
    </div>
  )
}

/**
 * Completed order state display
 */
function CompletedState({ orderId }: { orderId: string }) {
  return (
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
        onClick={() => window.open(`/inv/${orderId}`, '_blank')}
        className="w-full mt-2"
      >
        <FileText className="w-4 h-4 mr-2" />
        Lihat Invoice
      </Button>
    </div>
  )
}

/**
 * Validation form with shipping and service fee inputs
 */
function ValidationForm({
  order,
  shippingFee,
  serviceFee,
  rejectionReason,
  showReject,
  processing,
  calculatingShipping,
  shippingOptionsAvailable,
  onUpdateFormField,
  onValidate,
  onCalculateShipping,
  onCalculateMedian
}: {
  order: Order
  shippingFee: string
  serviceFee: string
  rejectionReason: string
  showReject: boolean
  processing: boolean
  calculatingShipping: boolean
  shippingOptionsAvailable: boolean
  onUpdateFormField: (field: keyof ValidationFormState, orderId: string, value: string | boolean) => void
  onValidate: (orderId: string, action: 'accept' | 'reject') => void
  onCalculateShipping: (orderId: string) => void
  onCalculateMedian: (orderId: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* Input Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium text-gray-700">
              Ongkir <span className="text-red-500">*</span>
            </Label>
            {order.Address && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCalculateShipping(order.id)
                  }}
                  disabled={calculatingShipping}
                  className="text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  {calculatingShipping ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Calculator className="w-3 h-3 mr-1" />
                  )}
                  Hitung
                </button>
                {shippingOptionsAvailable && (
                  <>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCalculateMedian(order.id)
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
              value={shippingFee}
              onChange={(e) => onUpdateFormField('shippingFees', order.id, e.target.value)}
              placeholder="0"
              className="h-9 pl-8 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">
            Jasa <span className="text-gray-400">(Opsional)</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
            <Input
              type="number"
              value={serviceFee}
              onChange={(e) => onUpdateFormField('serviceFees', order.id, e.target.value)}
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
            e.stopPropagation()
            onValidate(order.id, 'accept')
          }}
          disabled={processing}
          className="flex-1 bg-[#F26B8A] hover:bg-[#E05576] text-white h-10 shadow-sm"
        >
          {processing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          Terima Order
        </Button>
        <Button
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            onUpdateFormField('showRejectForm', order.id, !showReject)
          }}
          disabled={processing}
          className="h-10 px-3 border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <XCircle className="w-4 h-4" />
        </Button>
      </div>

      {/* Reject Form */}
      {showReject && (
        <div className="pt-3 border-t border-gray-100 animate-in slide-in-from-top-1">
          <Label className="text-xs font-medium text-red-600 mb-1.5 block">
            Alasan Penolakan:
          </Label>
          <Textarea
            value={rejectionReason}
            onChange={(e) => onUpdateFormField('rejectionReasons', order.id, e.target.value)}
            placeholder="Jelaskan kenapa order ditolak..."
            rows={2}
            className="text-sm mb-2 resize-none"
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onValidate(order.id, 'reject')
            }}
            disabled={processing}
            className="w-full h-8 text-xs"
          >
            Konfirmasi Tolak
          </Button>
        </div>
      )}
    </div>
  )
}
