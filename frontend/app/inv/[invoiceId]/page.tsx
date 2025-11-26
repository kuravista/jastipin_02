"use client"

import { useState, useEffect } from "react"
import { getApiUrl } from "@/lib/config"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer } from "lucide-react"
import Link from "next/link"

export default function InvoicePage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setInvoiceId(resolvedParams.invoiceId)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (!invoiceId) return

    const fetchInvoice = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/orders/${invoiceId}/invoice`)
        if (!response.ok) {
          throw new Error('Failed to fetch invoice')
        }
        const data = await response.json()
        setInvoice(data.invoice)
      } catch (err: any) {
        setError(err.message || 'Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [invoiceId])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">{error || 'Invoice tidak tersedia'}</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .invoice-container {
            box-shadow: none !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* Header Actions (No Print) */}
        <div className="flex justify-between items-center mb-6 no-print">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <Button onClick={handlePrint} size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Cetak Invoice
          </Button>
        </div>

        {/* Invoice Container */}
        <div className="invoice-container bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="border-b-2 border-gray-200 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                <p className="text-gray-600">#{invoice.invoiceNumber}</p>
                <p className="text-sm text-gray-500 mt-1">Kode Order: {invoice.orderCode}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 mb-2">Jastipin.me</div>
                <p className="text-sm text-gray-600">Platform Jastip Terpercaya</p>
                <p className="text-sm text-gray-600">Indonesia</p>
              </div>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Informasi Invoice</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal Invoice:</span>
                  <span className="font-medium">{invoice.date}</span>
                </div>
                {invoice.validatedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal Validasi:</span>
                    <span className="font-medium">{invoice.validatedDate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    invoice.status === 'Lunas' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Pembayaran</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Metode:</span>
                  <span className="font-medium">{invoice.paymentMethod}</span>
                </div>
                {invoice.dpPaidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">DP Dibayar:</span>
                    <span className="font-medium text-xs">{invoice.dpPaidAt}</span>
                  </div>
                )}
                {invoice.finalPaidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lunas:</span>
                    <span className="font-medium text-xs">{invoice.finalPaidAt}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer & Jastiper Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Customer</h3>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-900">{invoice.customer.name}</p>
                <p className="text-gray-600">WhatsApp: {invoice.customer.whatsapp}</p>
                <p className="text-gray-600">Email: {invoice.customer.email}</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Jastiper</h3>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-900">{invoice.jastiper.name}</p>
                <p className="text-gray-600">@{invoice.jastiper.username}</p>
                <p className="text-gray-600">WhatsApp: {invoice.jastiper.whatsapp}</p>
                <p className="text-gray-600">Email: {invoice.jastiper.email}</p>
                <p className="text-gray-600 text-xs mt-2">{invoice.jastiper.businessAddress}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="mb-8">
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Alamat Pengiriman</h3>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-900">{invoice.recipientName}</p>
                <p className="text-gray-600">Telepon: {invoice.recipientPhone}</p>
                <p className="text-gray-600 text-xs mt-2">{invoice.shippingAddress}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Detail Produk</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Produk</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Qty</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Harga</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4 text-sm text-gray-900">{item.name}</td>
                      <td className="py-3 px-4 text-sm text-center text-gray-600">{item.quantity}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-600">
                        Rp {item.price.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t-2 border-gray-200 pt-6">
            <div className="max-w-sm ml-auto space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal Produk:</span>
                <span className="font-medium">Rp {invoice.subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ongkos Kirim:</span>
                <span className="font-medium">Rp {invoice.shippingFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Biaya Layanan:</span>
                <span className="font-medium">Rp {invoice.serviceFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Komisi Platform:</span>
                <span className="font-medium">Rp {invoice.platformCommission.toLocaleString('id-ID')}</span>
              </div>
              <div className="border-t border-gray-300 pt-3 flex justify-between text-lg font-bold">
                <span className="text-gray-900">Total:</span>
                <span className="text-blue-600">Rp {invoice.total.toLocaleString('id-ID')}</span>
              </div>

              {invoice.dpAmount > 0 && (
                <>
                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">DP (Down Payment):</span>
                      <span className="font-medium text-green-600">
                        Rp {invoice.dpAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    {invoice.status === 'Lunas' ? (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pelunasan:</span>
                        <span className="font-medium text-green-600">
                          Rp {invoice.finalAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-base font-semibold">
                        <span className="text-gray-900">Sisa Pembayaran:</span>
                        <span className="text-orange-600">
                          Rp {invoice.finalAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p className="mb-2">Terima kasih telah berbelanja melalui Jastipin.me</p>
            <p>Invoice ini dibuat secara otomatis dan sah tanpa tanda tangan</p>
            <p className="mt-4 text-xs">Jastipin.me &copy; 2024 - Platform Jastip Terpercaya</p>
          </div>
        </div>
      </div>
    </div>
  )
}
