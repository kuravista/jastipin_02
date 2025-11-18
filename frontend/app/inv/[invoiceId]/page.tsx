"use client"

import { Button } from "@/components/ui/button"
import { Download, Printer, CheckCircle2, MapPin, Phone, Share2 } from "lucide-react"
import { notFound } from "next/navigation"

// Mock data - replace with actual data fetching
const getInvoiceData = (invoiceId: string) => {
  const invoices: Record<string, any> = {
    "250403ABCD": {
      invoiceId: "250403ABCD",
      invoiceNumber: "INV/2024/05/001",
      date: "10 Mei 2024",
      validatedDate: "11 Mei 2024",
      status: "Lunas",

      // Penitip (Customer) Info
      customer: {
        name: "Ani Suryani",
        whatsapp: "+62 812-3456-7890",
        address: "Jl. Sudirman No. 123, Jakarta Selatan 12190",
        email: "ani.suryani@email.com",
      },

      // Jastiper Info
      jastiper: {
        name: "Tina - Jastip Korea",
        username: "tina",
        whatsapp: "+62 813-9876-5432",
        email: "tina@jastipin.me",
        businessAddress: "Seoul, Korea Selatan",
      },

      // Products
      items: [
        {
          id: 1,
          name: "Innisfree Green Tea Serum",
          quantity: 2,
          price: 180000,
          subtotal: 360000,
        },
        {
          id: 2,
          name: "Etude House Dear Darling Tint",
          quantity: 3,
          price: 65000,
          subtotal: 195000,
        },
        {
          id: 3,
          name: "Mediheal Sheet Mask (Box of 10)",
          quantity: 1,
          price: 150000,
          subtotal: 150000,
        },
      ],

      // Payment Summary
      subtotal: 705000,
      shippingFee: 50000,
      adminFee: 15000,
      total: 770000,

      // Payment Info
      paymentMethod: "Transfer Bank BCA",
      paymentDate: "10 Mei 2024, 14:30",
    },
  }

  return invoices[invoiceId] || null
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ invoiceId: string }>
}) {
  const { invoiceId } = await params
  const invoice = getInvoiceData(invoiceId)

  if (!invoice) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 py-4 md:py-8 px-4 pb-24 md:pb-8">
      {/* Print Actions - Hidden when printing */}
      <div className="max-w-3xl mx-auto mb-4 print:hidden hidden md:flex justify-end gap-3">
        <Button variant="outline" onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" />
          Cetak
        </Button>
        <Button variant="outline" onClick={() => window.print()} className="gap-2">
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>

      {/* Invoice Container */}
      <div className="max-w-3xl mx-auto bg-white rounded-xl md:rounded-2xl shadow-lg print:shadow-none print:rounded-none">
        <div className="p-4 md:p-8">
          <div className="rounded-xl bg-gradient-to-r from-pink-50 to-blue-50 p-4 grid grid-cols-2 gap-3 mb-6">
            <div>
              <h1 className="text-base md:text-xl font-bold text-gray-900 leading-tight">
                Invoice #{invoice.invoiceNumber}
              </h1>
              <p className="text-xs md:text-sm text-gray-600 mt-1">{invoice.date}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-lg md:text-2xl font-bold text-[#F26B8A] leading-tight">
                Rp{invoice.total.toLocaleString("id-ID")}
              </p>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full mt-1 ${
                  invoice.status === "Lunas" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" /> {invoice.status}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Jastiper Info */}
            <div className="bg-white shadow-sm rounded-xl p-4 border border-pink-200">
              <h3 className="font-semibold text-[#F26B8A] text-sm mb-3">Dari Jastiper</h3>
              <h4 className="font-bold text-gray-900 mb-2">{invoice.jastiper.name}</h4>
              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{invoice.jastiper.businessAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{invoice.jastiper.whatsapp}</span>
                </div>
              </div>
              <a
                href={`/${invoice.jastiper.username}`}
                className="text-xs text-[#3A86FF] hover:underline mt-2 inline-block"
              >
                jastipin.me/{invoice.jastiper.username}
              </a>
            </div>

            {/* Customer Info */}
            <div className="bg-white shadow-sm rounded-xl p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-600 text-sm mb-3">Untuk Penitip</h3>
              <h4 className="font-bold text-gray-900 mb-2">{invoice.customer.name}</h4>
              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{invoice.customer.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{invoice.customer.whatsapp}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Detail Produk</h3>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Produk</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Qty</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Harga</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item: any) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-900">{item.name}</td>
                      <td className="py-3 px-4 text-center text-gray-700">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-gray-700">Rp{item.price.toLocaleString("id-ID")}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        Rp{item.subtotal.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3">
              {invoice.items.map((item: any) => (
                <div key={item.id} className="border border-gray-100 rounded-lg p-3 flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} × Rp{item.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <p className="font-bold text-[#F26B8A] text-right ml-2">Rp{item.subtotal.toLocaleString("id-ID")}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end mb-6">
            <div className="w-full md:w-72 space-y-2 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span className="font-semibold">Rp{invoice.subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Biaya Pengiriman</span>
                <span className="font-semibold">Rp{invoice.shippingFee.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Biaya Admin</span>
                <span className="font-semibold">Rp{invoice.adminFee.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-gray-200 text-lg md:text-xl">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-[#F26B8A]">Rp{invoice.total.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Informasi Pembayaran</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Metode:</span>
                <span className="font-semibold text-gray-900">{invoice.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tanggal:</span>
                <span className="font-semibold text-gray-900">{invoice.paymentDate}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-1">Terima kasih telah menggunakan Jastipin.me</p>
            <p className="text-xs text-gray-500">Invoice ini dibuat secara otomatis dan sah tanpa tanda tangan</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden print:hidden">
        <Button
          onClick={() => {
            const text = encodeURIComponent(`Ini invoice kamu dari Jastipin.me:\n\n${window.location.href}`)
            window.open(`https://wa.me/?text=${text}`)
          }}
          className="w-full bg-green-500 hover:bg-green-600 text-white gap-2"
        >
          <Share2 className="w-4 h-4" />
          Bagikan via WhatsApp
        </Button>
      </div>

      {/* Desktop back button */}
      <div className="max-w-3xl mx-auto mt-4 print:hidden hidden md:block">
        <Button variant="outline" onClick={() => window.history.back()} className="w-full md:w-auto">
          Kembali
        </Button>
      </div>
    </div>
  )
}
