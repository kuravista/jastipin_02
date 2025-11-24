'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Copy, ExternalLink, Mail } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface UploadLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  uploadLink: string
  dpAmount: number
}

export default function UploadLinkDialog({
  open,
  onOpenChange,
  orderId,
  uploadLink,
  dpAmount
}: UploadLinkDialogProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(uploadLink)
      setCopied(true)
      toast({
        variant: 'success',
        title: 'Link berhasil disalin!',
        description: 'Link upload telah disalin ke clipboard',
      })

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Gagal menyalin link',
        description: 'Silakan salin link secara manual',
      })
    }
  }

  const handleUploadNow = () => {
    onOpenChange(false)
    router.push(uploadLink)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Pesanan Berhasil Dibuat!
          </DialogTitle>
          <DialogDescription className="text-center">
            Order ID: <span className="font-mono font-semibold text-foreground">{orderId}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* DP Amount Info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
            <p className="text-sm text-emerald-800 mb-1">Total DP yang harus dibayar:</p>
            <p className="text-2xl font-bold text-emerald-700">
              Rp {dpAmount.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Upload Link Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              Langkah Selanjutnya:
            </p>
            <p className="text-sm text-blue-800 mb-3">
              Upload bukti pembayaran DP Anda menggunakan link di bawah ini
            </p>

            {/* Link Display with Copy Button */}
            <div className="bg-white border border-blue-200 rounded-md p-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-gray-500 mb-1">Link Upload:</p>
                  <p className="text-sm font-mono text-gray-700 truncate">
                    {uploadLink}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={handleCopyLink}
                  className={copied ? 'bg-emerald-50 border-emerald-300' : ''}
                >
                  <Copy className={`w-4 h-4 ${copied ? 'text-emerald-600' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Email Backup Info */}
            <div className="flex items-start gap-2 text-xs text-blue-700">
              <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                Link juga telah dikirim ke email Anda sebagai backup
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleUploadNow}
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Upload Bukti Pembayaran Sekarang
            </Button>

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              size="lg"
              className="w-full"
            >
              Saya akan upload nanti
            </Button>
          </div>

          {/* Important Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-900">
              <strong>Penting:</strong> Pesanan Anda akan diproses setelah kami menerima dan memverifikasi bukti pembayaran DP.
              Silakan upload bukti pembayaran maksimal 24 jam setelah pemesanan.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
