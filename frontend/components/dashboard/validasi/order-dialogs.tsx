/**
 * Order Dialogs Component
 * Modal dialogs for shipping calculator and proof preview
 * @module dashboard/validasi/OrderDialogs
 */

'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ExternalLink, AlertCircle } from 'lucide-react'
import { ShippingOption } from './types'

interface ShippingCalculatorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: ShippingOption[]
  onSelect: (option: ShippingOption) => void
}

/**
 * Shipping calculator dialog with courier options
 */
export function ShippingCalculatorDialog({
  open,
  onOpenChange,
  options,
  onSelect
}: ShippingCalculatorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Pilih Opsi Pengiriman</DialogTitle>
          <DialogDescription className="text-sm">
            Hasil perhitungan ongkir otomatis
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {options.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-4">
              Tidak ada opsi pengiriman tersedia
            </p>
          ) : (
            options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => onSelect(option)}
                className="w-full p-3 border rounded-lg hover:bg-gray-50 hover:border-[#F26B8A] text-left transition-colors"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">
                      {option.courier.toUpperCase()} - {option.service}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Estimasi: {option.etd} hari
                    </p>
                  </div>
                  <p className="font-bold text-sm text-[#F26B8A] whitespace-nowrap">
                    Rp {option.cost.toLocaleString('id-ID')}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ProofPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proofUrl: string | null
  proofType: string
}

/**
 * Proof preview dialog for viewing payment proof images
 */
export function ProofPreviewDialog({
  open,
  onOpenChange,
  proofUrl,
  proofType
}: ProofPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-lg">{proofType}</DialogTitle>
          <DialogDescription className="text-sm">
            Preview bukti pembayaran yang diupload oleh customer
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {proofUrl ? (
            <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
              <div className="relative w-full max-h-[60vh] overflow-auto bg-white rounded border">
                <img
                  src={proofUrl}
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
                          <a href="${proofUrl}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-600 hover:underline mt-2">Buka di tab baru</a>
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
                  onClick={() => window.open(proofUrl, '_blank')}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Buka di Tab Baru
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
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
  )
}
