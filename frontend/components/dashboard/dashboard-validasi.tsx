'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Calculator, CheckCircle, CheckCircle2, Loader2, Package, XCircle, Search, FileText } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'

interface Order {
  id: string
  participant: {
    name: string
    phone: string
  }
  items: {
    product: {
      title: string
      weightGram?: number
    }
    quantity: number
    priceAtOrder: number
  }[]
  address?: {
    recipientName: string
    phone: string
    addressText: string
    districtId: string
    districtName: string
    cityName: string
    provinceName: string
  }
  dpAmount: number
  totalPrice: number
  dpPaidAt: Date
  createdAt: Date
}

interface ShippingOption {
  courier: string
  service: string
  cost: number
  etd: string
}

export default function JastiperValidationDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  // Filter and search (from old version)
  const [activeFilter, setActiveFilter] = useState('perlu-validasi')
  const [searchQuery, setSearchQuery] = useState('')

  // Validation form
  const [shippingFee, setShippingFee] = useState('')
  const [serviceFee, setServiceFee] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  
  // Shipping calculator
  const [showCalculator, setShowCalculator] = useState(false)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [calculatingShipping, setCalculatingShipping] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [activeFilter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      // Fetch orders based on active filter
      let endpoint = '/api/orders'
      if (activeFilter === 'perlu-validasi') {
        endpoint += '?status=awaiting_validation'
      } else if (activeFilter === 'sudah-validasi') {
        endpoint += '?status=validated'
      }
      
      const response = await fetch(endpoint)
      const data = await response.json()
      if (data.success) {
        setOrders(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter orders based on search query
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      order.participant.name.toLowerCase().includes(query) ||
      order.participant.phone.includes(query) ||
      order.id.toLowerCase().includes(query)
    )
  })

  const calculateShipping = async (orderId: string) => {
    setCalculatingShipping(true)
    setError('')
    try {
      const response = await fetch(`/api/orders/${orderId}/calculate-shipping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courier: 'jne:tiki:pos'
        })
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to calculate shipping')
      }

      setShippingOptions(data.data.options)
      setShowCalculator(true)
    } catch (err: any) {
      setError(err.message || 'Gagal menghitung ongkir')
    } finally {
      setCalculatingShipping(false)
    }
  }

  const handleValidate = async (orderId: string, action: 'accept' | 'reject') => {
    setProcessing(true)
    setError('')

    try {
      if (action === 'accept') {
        if (!shippingFee || isNaN(Number(shippingFee))) {
          throw new Error('Ongkir wajib diisi dengan angka yang valid')
        }
      }

      if (action === 'reject' && !rejectionReason) {
        throw new Error('Alasan penolakan wajib diisi')
      }

      const response = await fetch(`/api/orders/${orderId}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          shippingFee: action === 'accept' ? Number(shippingFee) : undefined,
          serviceFee: action === 'accept' && serviceFee ? Number(serviceFee) : undefined,
          rejectionReason: action === 'reject' ? rejectionReason : undefined
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Validation failed')
      }

      // Refresh orders
      await fetchOrders()
      
      // Reset form
      setSelectedOrder(null)
      setShippingFee('')
      setServiceFee('')
      setRejectionReason('')
      
      alert(action === 'accept' ? 'Pesanan berhasil divalidasi!' : 'Pesanan ditolak')

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setProcessing(false)
    }
  }

  const selectShippingOption = (option: ShippingOption) => {
    setShippingFee(option.cost.toString())
    setShowCalculator(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const pendingCount = orders.filter(o => o.dpPaidAt && !o.address).length

  return (
    <div className="space-y-6">
      {/* Header - from old version */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Validasi Order</h1>
        <p className="text-gray-600">Kelola semua order yang masuk</p>
      </div>

      {/* Search - from old version */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Cari nama penitip, nomor HP, atau No. Order..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 bg-white"
        />
      </div>

      {/* Filter Tabs - from old version */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          onClick={() => setActiveFilter('semua')}
          variant={activeFilter === 'semua' ? 'default' : 'outline'}
          className={activeFilter === 'semua' ? 'bg-[#F26B8A] hover:bg-[#E05576]' : ''}
          size="sm"
        >
          Semua
        </Button>
        <Button
          onClick={() => setActiveFilter('perlu-validasi')}
          variant={activeFilter === 'perlu-validasi' ? 'default' : 'outline'}
          className={activeFilter === 'perlu-validasi' ? 'bg-[#F26B8A] hover:bg-[#E05576]' : ''}
          size="sm"
        >
          Perlu Validasi {pendingCount > 0 && `(${pendingCount})`}
        </Button>
        <Button
          onClick={() => setActiveFilter('sudah-validasi')}
          variant={activeFilter === 'sudah-validasi' ? 'default' : 'outline'}
          className={activeFilter === 'sudah-validasi' ? 'bg-[#F26B8A] hover:bg-[#E05576]' : ''}
          size="sm"
        >
          Sudah Validasi
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchQuery ? 'Tidak ada order yang cocok dengan pencarian' : 'Tidak ada order untuk ditampilkan'}
          </p>
        </div>
      )}

      {/* Order List */}
      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-900">Penitip: {order.participant.name}</div>
                <div className="text-sm text-gray-600">{order.participant.phone}</div>
                <div className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">Rp {order.totalPrice.toLocaleString('id-ID')}</div>
                <div className="text-sm text-gray-600">{order.items.length} Item</div>
                <Badge className="mt-1" variant="secondary">DP Paid</Badge>
              </div>
            </div>

            <div className="space-y-3">
              {/* Order Items */}
              <div className="space-y-2">
                <p className="font-medium text-sm text-gray-500">Pesanan:</p>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.product.title} × {item.quantity}</span>
                    <span>Rp {(item.priceAtOrder * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              {/* Address */}
              {order.address && (
                <div className="border-t pt-3">
                  <p className="font-medium text-sm text-gray-500 mb-1">Alamat Pengiriman:</p>
                  <p className="text-sm">{order.address.recipientName} - {order.address.phone}</p>
                  <p className="text-sm text-gray-600">
                    {order.address.addressText}, {order.address.districtName}, 
                    {order.address.cityName}, {order.address.provinceName}
                  </p>
                </div>
              )}

              {/* DP Info */}
              <div className="border-t pt-3 flex justify-between text-sm">
                <span className="text-gray-600">DP Dibayar:</span>
                <span className="font-medium">Rp {order.dpAmount.toLocaleString('id-ID')}</span>
              </div>

              {/* Action Buttons */}
              {activeFilter === 'sudah-validasi' ? (
                <div className="flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Sudah Divalidasi
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/inv/${order.id}`, '_blank')}
                    className="text-xs"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Lihat Invoice
                  </Button>
                </div>
              ) : selectedOrder?.id === order.id ? (
                <div className="border-t pt-4 space-y-4">
                  {/* Shipping Fee */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Ongkir <span className="text-red-500">*</span></Label>
                      {order.address && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => calculateShipping(order.id)}
                          disabled={calculatingShipping}
                        >
                          {calculatingShipping ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Menghitung...
                            </>
                          ) : (
                            <>
                              <Calculator className="mr-2 h-3 w-3" />
                              Hitung Ongkir
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <Input
                      type="number"
                      value={shippingFee}
                      onChange={(e) => setShippingFee(e.target.value)}
                      placeholder="Masukkan ongkir manual"
                    />
                  </div>

                  {/* Service Fee (Optional) */}
                  <div className="space-y-2">
                    <Label>Biaya Jasa <span className="text-gray-500">(opsional)</span></Label>
                    <Input
                      type="number"
                      value={serviceFee}
                      onChange={(e) => setServiceFee(e.target.value)}
                      placeholder="Biaya jasa tambahan"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleValidate(order.id, 'accept')}
                      disabled={processing}
                      className="flex-1"
                    >
                      {processing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Terima
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedOrder(null)}
                      disabled={processing}
                    >
                      Batal
                    </Button>
                  </div>

                  {/* Reject Section */}
                  <details className="border-t pt-4">
                    <summary className="cursor-pointer text-sm text-red-600 font-medium">
                      Tolak Pesanan
                    </summary>
                    <div className="mt-3 space-y-3">
                      <Textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Alasan penolakan..."
                        rows={3}
                      />
                      <Button
                        variant="destructive"
                        onClick={() => handleValidate(order.id, 'reject')}
                        disabled={processing}
                        className="w-full"
                      >
                        {processing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Tolak Pesanan
                      </Button>
                    </div>
                  </details>
                </div>
              ) : (
                <Button
                  onClick={() => setSelectedOrder(order)}
                  className="w-full"
                >
                  Validasi Pesanan
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Shipping Calculator Dialog */}
      <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pilih Opsi Pengiriman</DialogTitle>
            <DialogDescription>
              Hasil perhitungan ongkir otomatis
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {shippingOptions.map((option, idx) => (
              <button
                key={idx}
                onClick={() => selectShippingOption(option)}
                className="w-full p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{option.courier.toUpperCase()} - {option.service}</p>
                    <p className="text-sm text-gray-500">Estimasi: {option.etd} hari</p>
                  </div>
                  <p className="font-bold">Rp {option.cost.toLocaleString('id-ID')}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
