'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import AddressForm from './AddressForm'
import UploadLinkDialog from './UploadLinkDialog'

interface Product {
  id: string
  title: string
  price: number
  type: 'goods' | 'tasks'
  unit?: string
  stock?: number | null
}

interface CheckoutItem {
  productId: string
  quantity: number
}

interface DPCheckoutFormProps {
  tripId: string
  tripTitle?: string
  products: Product[]
  items: CheckoutItem[]
  mode?: 'page' | 'modal'
  onSuccess?: (data: any) => void
  onCancel?: () => void
  jastiperSlug?: string // NEW: For redirect after upload
  dpPercentage?: number // DP percentage from trip (default: 20)
  paymentType?: 'full' | 'dp' // Payment type (default: 'dp')
}

const GUEST_PROFILE_KEY = 'jastipin_guest_profile'
const GUEST_ADDRESS_KEY = 'jastipin_guest_address'

interface GuestProfile {
  guestId: string
  name: string
  phone: string
  email?: string
  rememberMe: boolean
}

interface SavedAddress {
  recipientName: string
  phone: string
  provinceId: string
  provinceName: string
  cityId: string
  cityName: string
  districtId: string
  districtName: string
  villageId?: string
  villageName?: string
  addressText: string
  postalCode?: string
  rajaOngkirDistrictId?: string
}

export default function DPCheckoutForm({
  tripId,
  tripTitle,
  products,
  items,
  mode = 'page',
  onSuccess,
  onCancel,
  jastiperSlug,
  dpPercentage = 20,
  paymentType = 'dp'
}: DPCheckoutFormProps) {
  const [participantName, setParticipantName] = useState('')
  const [participantPhone, setParticipantPhone] = useState('')
  const [participantEmail, setParticipantEmail] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [notes, setNotes] = useState('')
  const [address, setAddress] = useState<any>({})
  const [sameAsBuyer, setSameAsBuyer] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check if any product requires address (type = goods)
  const requiresAddress = products.some(p => p.type === 'goods')

  // Upload Link Dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadDialogData, setUploadDialogData] = useState<{
    orderId: string
    uploadLink: string
    dpAmount: number
    bankAccount?: {
      bankName: string
      accountNumber: string
      accountHolderName: string
    } | null
    participantPhone?: string
    jastiperSlug?: string
    paymentType?: 'full' | 'dp'
  } | null>(null)

  useEffect(() => {
    loadGuestProfile()
  }, [])

  useEffect(() => {
    if (requiresAddress) {
      loadGuestAddress()
    }
  }, [requiresAddress])

  const loadGuestProfile = () => {
    try {
      const stored = localStorage.getItem(GUEST_PROFILE_KEY)
      if (stored) {
        const profile: GuestProfile = JSON.parse(stored)
        setParticipantName(profile.name || '')
        setParticipantPhone(profile.phone || '')
        setParticipantEmail(profile.email || '')
        setRememberMe(profile.rememberMe ?? true)
      }
    } catch (err) {
      console.error('Failed to load guest profile:', err)
    }
  }

  const loadGuestAddress = async () => {
    try {
      const stored = localStorage.getItem(GUEST_ADDRESS_KEY)
      if (stored) {
        const savedAddress: SavedAddress = JSON.parse(stored)

        // Use a small delay to ensure AddressForm is mounted and ready
        await new Promise(resolve => setTimeout(resolve, 100))

        setAddress(savedAddress)
      }
    } catch (err) {
      console.error('Failed to load guest address:', err)
    }
  }

  const saveGuestProfile = (guestId: string) => {
    if (!rememberMe) {
      localStorage.removeItem(GUEST_PROFILE_KEY)
      localStorage.removeItem(GUEST_ADDRESS_KEY)
      return
    }

    try {
      const profile: GuestProfile = {
        guestId,
        name: participantName,
        phone: participantPhone,
        email: participantEmail,
        rememberMe: true
      }
      localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile))
    } catch (err) {
      console.error('Failed to save guest profile:', err)
    }
  }

  const saveGuestAddress = () => {
    if (!rememberMe || !requiresAddress) {
      localStorage.removeItem(GUEST_ADDRESS_KEY)
      return
    }

    try {
      const savedAddress: SavedAddress = {
        recipientName: address.recipientName || '',
        phone: address.phone || '',
        provinceId: address.provinceId || '',
        provinceName: address.provinceName || '',
        cityId: address.cityId || '',
        cityName: address.cityName || '',
        districtId: address.districtId || '',
        districtName: address.districtName || '',
        villageId: address.villageId,
        villageName: address.villageName,
        addressText: address.addressText || '',
        postalCode: address.postalCode
      }
      localStorage.setItem(GUEST_ADDRESS_KEY, JSON.stringify(savedAddress))
    } catch (err) {
      console.error('Failed to save guest address:', err)
    }
  }

  const handleSameAsBuyerChange = (checked: boolean) => {
    setSameAsBuyer(checked)

    if (checked) {
      // Copy data from buyer info to address
      setAddress({
        ...address,
        recipientName: participantName,
        phone: participantPhone
      })
    }
  }

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId)
    return sum + (product?.price || 0) * item.quantity
  }, 0)

  // Calculate payment amount based on payment type
  const paymentAmount = paymentType === 'full' 
    ? subtotal 
    : Math.max(Math.ceil(subtotal * (dpPercentage / 100) / 1000) * 1000, 10000)
  
  // Keep dpAmount for backward compatibility with dialog
  const dpAmount = paymentAmount
  
  const isFullPayment = paymentType === 'full'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate required fields
      if (!participantName || !participantPhone) {
        throw new Error('Nama dan nomor HP wajib diisi')
      }

      if (requiresAddress) {
        if (!address.provinceId || !address.cityId || !address.districtId || !address.addressText) {
          throw new Error('Alamat lengkap wajib diisi untuk produk barang')
        }
      }

      // Validate stock availability before checkout (real-time check)
      const goodsItems = items.filter(item => {
        const product = products.find(p => p.id === item.productId)
        return product?.type === 'goods'
      })

      for (const item of goodsItems) {
        const product = products.find(p => p.id === item.productId)
        if (!product) continue

        // Check if product has stock tracking and if stock is sufficient
        if (product.stock !== null && product.stock !== undefined) {
          if (product.stock < item.quantity) {
            throw new Error(
              `Maaf, stok ${product.title} tidak mencukupi. Tersedia: ${product.stock}, diminta: ${item.quantity}`
            )
          }
        }
      }

      // Prepare checkout data
      const checkoutData = {
        tripId,
        participantName,
        participantPhone,
        participantEmail: participantEmail || undefined,
        rememberMe,
        items,
        ...(requiresAddress && { address: {
          recipientName: address.recipientName,
          phone: address.phone,
          addressText: address.addressText,
          provinceId: address.provinceId,
          provinceName: address.provinceName,
          cityId: address.cityId,
          cityName: address.cityName,
          districtId: address.districtId,
          districtName: address.districtName,
          villageId: address.villageId,
          villageName: address.villageName,
          postalCode: address.postalCode,
          rajaOngkirDistrictId: address.rajaOngkirDistrictId
        }}),
        ...(notes && { notes })
      }

      // Call checkout API
      const response = await fetch('/api/checkout/dp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkoutData)
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Checkout failed')
      }

      // Save guest profile and address to localStorage
      if (data.guestId) {
        saveGuestProfile(data.guestId)
        saveGuestAddress()
      }

      // Show upload link dialog
      setUploadDialogData({
        orderId: data.orderId,
        uploadLink: data.uploadLink,
        dpAmount: data.dpAmount,
        bankAccount: data.bankAccount,
        participantPhone: participantPhone, // Pass phone for auto-verify
        jastiperSlug: jastiperSlug, // Pass jastiper slug for redirect
        paymentType: paymentType // Pass payment type for label adaptation
      })
      setShowUploadDialog(true)

      // Handle success based on mode
      if (onSuccess) {
        // Modal mode: call callback (after dialog is shown)
        onSuccess(data)
      }

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat checkout')
    } finally {
      setLoading(false)
    }
  }

  // Wrapper component based on mode
  const FormWrapper = mode === 'modal' ? 'div' : 'form'
  const formProps = mode === 'modal' ? {} : { onSubmit: handleSubmit }

  const content = (
    <>
      {/* Modal Header - only in modal mode */}
      {mode === 'modal' && (
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <div>
            <h2 className="text-xl font-bold">Bayar Down Payment</h2>
            {tripTitle && <p className="text-sm text-gray-600">Trip: {tripTitle}</p>}
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Participant Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pembeli</CardTitle>
          <CardDescription>Data diri untuk konfirmasi pesanan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nama Lengkap <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Nama lengkap Anda"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              No. WhatsApp <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={participantPhone}
              onChange={(e) => setParticipantPhone(e.target.value)}
              placeholder="08123456789"
              required
            />
            <p className="text-sm text-gray-500">
              Notifikasi pesanan akan dikirim via WhatsApp
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-gray-500">(opsional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={participantEmail}
              onChange={(e) => setParticipantEmail(e.target.value)}
              placeholder="email@example.com"
            />
            <p className="text-sm text-gray-500">
              Untuk notifikasi tambahan dan invoice
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            />
            <Label
              htmlFor="remember"
              className="text-sm font-normal cursor-pointer"
            >
              Ingat data saya untuk pembelian berikutnya
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Catatan <span className="text-gray-500">(opsional)</span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan untuk jastiper..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address (conditional) */}
      {requiresAddress && (
        <Card>
          <CardHeader>
            <CardTitle>Alamat Pengiriman</CardTitle>
            <CardDescription>
              Alamat untuk pengiriman barang
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Same as Buyer Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sameAsBuyer"
                checked={sameAsBuyer}
                onCheckedChange={handleSameAsBuyerChange}
              />
              <Label
                htmlFor="sameAsBuyer"
                className="text-sm font-normal cursor-pointer"
              >
                Sama dengan Informasi Pembeli
              </Label>
            </div>

            <AddressForm
              value={address}
              onChange={setAddress}
              required={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Pesanan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Product List */}
          {items.map((item) => {
            const product = products.find(p => p.id === item.productId)
            if (!product) return null

            const itemTotal = product.price * item.quantity

            return (
              <div key={item.productId} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">{product.title}</p>
                  <p className="text-sm text-gray-500">
                    {item.quantity} {product.unit || 'pcs'} × Rp {product.price.toLocaleString('id-ID')}
                  </p>
                </div>
                <p className="font-medium">
                  Rp {itemTotal.toLocaleString('id-ID')}
                </p>
              </div>
            )
          })}

          <div className="border-t pt-3 space-y-2">
            {!isFullPayment && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>{isFullPayment ? 'Total yang harus dibayar' : `DP yang harus dibayar (${dpPercentage}%)`}</span>
              <span className="text-blue-600">
                Rp {dpAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className={`border rounded-lg p-3 text-sm ${isFullPayment ? 'bg-blue-50 border-blue-200' : 'bg-blue-50 border-blue-200'}`}>
            <p className={isFullPayment ? 'text-blue-800' : 'text-blue-800'}>
              <strong>Catatan:</strong> {isFullPayment 
                ? 'Anda harus membayar seluruh jumlah pesanan. Pesanan akan diproses setelah pembayaran diverifikasi.'
                : `Anda hanya perlu membayar DP sebesar ${dpPercentage}% terlebih dahulu. Sisa pembayaran akan diinformasikan setelah jastiper memvalidasi pesanan Anda.`
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className={mode === 'modal' ? 'flex gap-2' : ''}>
        {mode === 'modal' && onCancel && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Batal
          </Button>
        )}
        <Button 
          type="button"
          onClick={handleSubmit}
          size="lg" 
          className={mode === 'modal' ? 'flex-1' : 'w-full'}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memproses...
            </>
          ) : (
            <>{isFullPayment ? 'Bayar ' : 'Bayar DP '} Rp {dpAmount.toLocaleString('id-ID')}</>
          )}
        </Button>
      </div>

      <p className="text-center text-sm text-gray-500">
        Dengan melanjutkan, Anda menyetujui syarat dan ketentuan kami
      </p>
    </>
  )

  // Return based on mode
  if (mode === 'modal') {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              {content}
            </div>
          </div>
        </div>

        {/* Upload Link Dialog */}
        {uploadDialogData && (
          <UploadLinkDialog
            open={showUploadDialog}
            onOpenChange={setShowUploadDialog}
            orderId={uploadDialogData.orderId}
            uploadLink={uploadDialogData.uploadLink}
            dpAmount={uploadDialogData.dpAmount}
            bankAccount={uploadDialogData.bankAccount}
            participantPhone={uploadDialogData.participantPhone}
            jastiperSlug={uploadDialogData.jastiperSlug}
            paymentType={uploadDialogData.paymentType}
          />
        )}
      </>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {content}
      </form>

      {/* Upload Link Dialog */}
      {uploadDialogData && (
        <UploadLinkDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          orderId={uploadDialogData.orderId}
          uploadLink={uploadDialogData.uploadLink}
          dpAmount={uploadDialogData.dpAmount}
          bankAccount={uploadDialogData.bankAccount}
          participantPhone={uploadDialogData.participantPhone}
          jastiperSlug={uploadDialogData.jastiperSlug}
          paymentType={uploadDialogData.paymentType}
        />
      )}
    </>
  )
}
