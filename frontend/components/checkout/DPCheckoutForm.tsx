'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import AddressForm from './AddressForm'

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
}

const GUEST_PROFILE_KEY = 'jastipin_guest_profile'

interface GuestProfile {
  guestId: string
  name: string
  phone: string
  email?: string
  rememberMe: boolean
}

export default function DPCheckoutForm({ 
  tripId, 
  tripTitle,
  products, 
  items,
  mode = 'page',
  onSuccess,
  onCancel
}: DPCheckoutFormProps) {
  const router = useRouter()
  
  const [participantName, setParticipantName] = useState('')
  const [participantPhone, setParticipantPhone] = useState('')
  const [participantEmail, setParticipantEmail] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [notes, setNotes] = useState('')
  const [address, setAddress] = useState<any>({})
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadGuestProfile()
  }, [])

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

  const saveGuestProfile = (guestId: string) => {
    if (!rememberMe) {
      localStorage.removeItem(GUEST_PROFILE_KEY)
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

  // Check if any product requires address (type = goods)
  const requiresAddress = products.some(p => p.type === 'goods')

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId)
    return sum + (product?.price || 0) * item.quantity
  }, 0)

  // Calculate DP amount (20%, min 10k)
  const dpAmount = Math.max(Math.ceil(subtotal * 0.2 / 1000) * 1000, 10000)

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
          postalCode: address.postalCode
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

      // Save guest profile to localStorage
      if (data.data.guestId) {
        saveGuestProfile(data.data.guestId)
      }

      // Handle success based on mode
      if (onSuccess) {
        // Modal mode: call callback
        onSuccess(data.data)
      } else {
        // Page mode: redirect to payment
        router.push(`/checkout/payment/${data.data.orderId}`)
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
          <CardContent>
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
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>DP yang harus dibayar (20%)</span>
              <span className="text-blue-600">
                Rp {dpAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="text-blue-800">
              <strong>Catatan:</strong> Anda hanya perlu membayar DP sebesar 20% terlebih dahulu. 
              Sisa pembayaran akan diinformasikan setelah jastiper memvalidasi pesanan Anda.
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
            <>Bayar DP Rp {dpAmount.toLocaleString('id-ID')}</>
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
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 space-y-6">
            {content}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            ← Kembali
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{tripTitle || 'Checkout'}</h1>
          <p className="text-sm text-gray-600">Checkout dengan sistem DP</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {content}
        </form>
      </div>
    </div>
  )
}
