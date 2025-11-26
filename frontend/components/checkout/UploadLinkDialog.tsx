'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Building2, CreditCard, User, X, Upload, Loader2, AlertCircle, Copy, Check } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface BankAccount {
  bankName: string
  accountNumber: string
  accountHolderName: string
}

interface UploadLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  uploadLink: string
  dpAmount: number
  bankAccount?: BankAccount | null
  participantPhone?: string // NEW: For auto-verify
  jastiperSlug?: string // NEW: For redirect after upload
}

export default function UploadLinkDialog({
  open,
  onOpenChange,
  orderId,
  uploadLink,
  dpAmount,
  bankAccount,
  participantPhone,
  jastiperSlug
}: UploadLinkDialogProps) {
  const router = useRouter()
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState('')
  const [copiedAccount, setCopiedAccount] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(7)

  // Extract token from uploadLink
  const uploadToken = uploadLink.split('/').pop() || ''

  // Get last 4 digits from phone for auto-verify
  const getLast4Digits = (phone: string) => {
    // Remove country code if present (62)
    const cleaned = phone.replace(/^62/, '')
    // Get last 4 digits
    return cleaned.slice(-4)
  }

  // Auto-redirect after successful upload
  useEffect(() => {
    if (uploadSuccess) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            // Redirect to jastiper profile
            const redirectUrl = jastiperSlug ? `/${jastiperSlug}` : '/'
            router.push(redirectUrl)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [uploadSuccess, jastiperSlug, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB')
        toast({
          title: 'File terlalu besar',
          description: 'Ukuran file maksimal 5MB',
          variant: 'destructive'
        })
        return
      }
      setFile(selectedFile)
      setError('')

      // Generate preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(selectedFile)
      } else {
        setImagePreview(null) // No preview for PDFs
      }
    }
  }

  const handleCopyAccount = async () => {
    if (!bankAccount) return

    try {
      await navigator.clipboard.writeText(bankAccount.accountNumber)
      setCopiedAccount(true)
      toast({
        title: 'Tersalin!',
        description: 'Nomor rekening berhasil disalin'
      })

      setTimeout(() => setCopiedAccount(false), 2000)
    } catch (err) {
      toast({
        title: 'Gagal menyalin',
        description: 'Silakan salin manual',
        variant: 'destructive'
      })
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Pilih file terlebih dahulu')
      return
    }

    if (!participantPhone) {
      setError('Nomor WhatsApp tidak tersedia')
      return
    }

    setUploading(true)
    setError('')

    try {
      // Step 1: Validate token
      const validateResponse = await fetch(`/api/upload/validate?token=${encodeURIComponent(uploadToken)}`)
      const validateData = await validateResponse.json()

      if (!validateResponse.ok || !validateData.valid) {
        throw new Error(validateData.error || 'Token tidak valid')
      }

      // Step 2: Verify challenge (auto-verify with last 4 digits from phone)
      const last4Digits = getLast4Digits(participantPhone)

      const verifyResponse = await fetch('/api/upload/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: uploadToken,
          challengeResponse: last4Digits // Use last 4 digits from phone input
        })
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok || !verifyData.verified) {
        throw new Error(verifyData.error || 'Verifikasi gagal')
      }

      // Step 3: Upload file
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch(`/api/upload/${verifyData.orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${uploadToken}`
        },
        body: formData
      })

      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'Gagal mengupload file')
      }

      setUploadSuccess(true)
      toast({
        title: 'Berhasil!',
        description: 'Bukti pembayaran telah diterima. Jastiper akan segera memverifikasi.'
      })
    } catch (err: any) {
      setError(err.message || 'Gagal mengupload bukti pembayaran')
      toast({
        title: 'Upload Gagal',
        description: err.message || 'Gagal mengupload bukti pembayaran',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (uploadSuccess) {
      onOpenChange(false)
    } else {
      setShowCloseConfirm(true)
    }
  }

  const confirmClose = () => {
    setShowCloseConfirm(false)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}} modal={true}>
        <DialogContent 
          className="w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-md max-h-[95vh] overflow-y-auto p-0 gap-0"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {/* Header with close button */}
          <div className="sticky top-0 bg-white border-b z-10">
            <div className="flex justify-end p-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogHeader className="px-4 sm:px-6 pb-4">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-lg sm:text-xl">
                Pesanan Berhasil!
              </DialogTitle>
              <p className="text-center text-xs sm:text-sm text-muted-foreground mt-1">
                Order #{orderId.slice(0, 8)}
              </p>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-4 space-y-3 sm:space-y-4">
            {/* DP Amount */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 sm:p-4 text-center">
              <p className="text-xs sm:text-sm text-emerald-800 mb-1">Total DP:</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-700">
                Rp {dpAmount.toLocaleString('id-ID')}
              </p>
            </div>

            {/* Bank Account Info */}
            {bankAccount && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs sm:text-sm">
                  <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Transfer ke Rekening:</span>
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-700 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-blue-700 mb-0.5">Bank</p>
                      <p className="font-semibold text-blue-900 break-words">{bankAccount.bankName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-700 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-blue-700 mb-0.5">Nomor Rekening</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-bold text-blue-900 text-sm sm:text-base break-all flex-1">
                          {bankAccount.accountNumber}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                          onClick={handleCopyAccount}
                        >
                          {copiedAccount ? (
                            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-700 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-blue-700 mb-0.5">Atas Nama</p>
                      <p className="font-semibold text-blue-900 break-words">{bankAccount.accountHolderName}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Section */}
            {!uploadSuccess ? (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 sm:p-4 space-y-3">
                <p className="text-xs sm:text-sm font-semibold text-purple-900 text-center">
                  Upload Bukti Transfer
                </p>

                {error && (
                  <Alert variant="destructive" className="text-xs sm:text-sm">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="file" className="text-xs sm:text-sm">Pilih File Bukti Pembayaran</Label>

                  {/* File Input Area */}
                  <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 sm:p-6 text-center hover:border-purple-500 transition-colors cursor-pointer">
                    <input
                      id="file"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploading}
                    />
                    <label htmlFor="file" className="cursor-pointer">
                      <Upload className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-purple-400" />
                      {file ? (
                        <div>
                          <p className="font-medium text-purple-900 text-xs sm:text-sm break-words px-2">{file.name}</p>
                          <p className="text-[10px] sm:text-xs text-purple-700 mt-1">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-purple-900 text-xs sm:text-sm mb-1">
                            Klik untuk memilih file
                          </p>
                          <p className="text-[10px] sm:text-xs text-purple-700">
                            PNG, JPG, atau PDF (maks. 5MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-3 rounded-lg overflow-hidden border-2 border-purple-200 bg-white">
                      <div className="bg-purple-100 px-3 py-2 border-b border-purple-200 flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-semibold text-purple-900">Preview:</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] sm:text-xs text-purple-700 hover:text-purple-900"
                          onClick={() => {
                            setFile(null)
                            setImagePreview(null)
                            const input = document.getElementById('file') as HTMLInputElement
                            if (input) input.value = ''
                          }}
                        >
                          Ganti File
                        </Button>
                      </div>
                      <div className="p-2 sm:p-3">
                        <img
                          src={imagePreview}
                          alt="Preview bukti pembayaran"
                          className="w-full h-auto max-h-64 sm:max-h-80 object-contain rounded"
                        />
                      </div>
                    </div>
                  )}

                  {/* PDF Info (no preview) */}
                  {file && !imagePreview && file.type === 'application/pdf' && (
                    <div className="mt-3 rounded-lg border-2 border-purple-200 bg-purple-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm text-purple-800 flex-1 text-left">
                          📄 <span className="font-semibold">{file.name}</span>
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] sm:text-xs text-purple-700 hover:text-purple-900 flex-shrink-0"
                          onClick={() => {
                            setFile(null)
                            const input = document.getElementById('file') as HTMLInputElement
                            if (input) input.value = ''
                          }}
                        >
                          Ganti
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-purple-100 border border-purple-300 rounded-lg p-2 sm:p-3 text-[10px] sm:text-xs">
                  <p className="text-purple-900 font-semibold mb-1">Pastikan bukti transfer mencakup:</p>
                  <ul className="list-disc list-inside text-purple-800 space-y-0.5">
                    <li>Nominal transfer yang sesuai</li>
                    <li>Tanggal dan waktu transfer</li>
                    <li>Nama rekening tujuan</li>
                  </ul>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm sm:text-base"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Bukti Pembayaran
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 sm:p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto" />
                <div>
                  <p className="text-base sm:text-lg font-bold text-green-900">Upload Berhasil!</p>
                  <p className="text-xs sm:text-sm text-green-800 mt-2">
                    Bukti pembayaran Anda telah diterima. Jastiper akan segera memverifikasi pembayaran Anda.
                  </p>
                </div>

                {/* Countdown and redirect info */}
                <div className="bg-white border-2 border-green-300 rounded-lg p-3 mt-3">
                  <p className="text-xs sm:text-sm text-green-900 font-medium">
                    Mengarahkan ke halaman jastiper dalam <span className="font-bold text-lg text-green-600">{countdown}</span> detik...
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs sm:text-sm"
                    onClick={() => {
                      const redirectUrl = jastiperSlug ? `/${jastiperSlug}` : '/'
                      router.push(redirectUrl)
                    }}
                  >
                    Kembali Sekarang
                  </Button>
                </div>
              </div>
            )}

            {/* Important Note & Alternative Upload */}
            {!uploadSuccess && (
              <div className="space-y-2">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 sm:p-3">
                  <p className="text-[10px] sm:text-xs text-amber-900 leading-relaxed">
                    <strong>Penting:</strong> Upload bukti transfer maksimal 24 jam setelah pemesanan.
                    Pesanan akan diproses setelah pembayaran diverifikasi.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3">
                  <p className="text-[10px] sm:text-xs text-blue-900 leading-relaxed">
                    <strong>💡 Upload Nanti:</strong> Jika belum transfer sekarang, Anda bisa upload nanti melalui link yang sudah dikirim ke email Anda.
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              {file && !uploadSuccess ? 'File Belum Diupload' : 'Tutup Konfirmasi Pesanan?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              {file && !uploadSuccess ? (
                <>
                  Anda sudah memilih file tetapi belum menguploadnya. Apakah Anda yakin ingin menutup dialog ini?
                  <br /><br />
                  <strong>Tip:</strong> Klik tombol &quot;Submit Bukti Pembayaran&quot; untuk langsung upload sekarang.
                </>
              ) : (
                <>
                  Pastikan Anda sudah mencatat informasi rekening. Anda masih bisa upload bukti pembayaran nanti melalui link yang dikirim ke email.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="text-sm sm:text-base m-0">
              Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClose}
              className="text-sm sm:text-base m-0"
            >
              Ya, Tutup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
