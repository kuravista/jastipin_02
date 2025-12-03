"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CreditCard, History, Package, ChevronLeft, CheckCircle2, Upload } from "lucide-react"

interface BillingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface BillingHistory {
  id: string
  date: string
  amount: string
  status: 'paid' | 'pending' | 'failed'
  description: string
}

const MOCK_HISTORY: BillingHistory[] = [
  { id: 'INV-001', date: '01 Des 2025', amount: 'Rp 99.000', status: 'paid', description: 'Paket Pro - Bulanan' },
  { id: 'INV-002', date: '01 Nov 2025', amount: 'Rp 99.000', status: 'paid', description: 'Paket Pro - Bulanan' },
  { id: 'INV-003', date: '01 Okt 2025', amount: 'Rp 99.000', status: 'paid', description: 'Paket Pro - Bulanan' },
  { id: 'INV-004', date: '01 Sep 2025', amount: 'Rp 99.000', status: 'paid', description: 'Paket Pro - Bulanan' },
  { id: 'INV-005', date: '01 Agu 2025', amount: 'Rp 99.000', status: 'paid', description: 'Paket Pro - Bulanan' },
  { id: 'INV-006', date: '01 Jul 2025', amount: 'Rp 99.000', status: 'paid', description: 'Paket Pro - Bulanan' },
  { id: 'INV-007', date: '01 Jun 2025', amount: 'Rp 99.000', status: 'paid', description: 'Paket Pro - Bulanan' },
]

const PACKAGES_DATA = [
  {
    id: 'basic',
    name: 'Basic',
    basePrice: 0,
    originalPrice: 0,
    features: ['Maksimal 5 Postingan', 'Support Standar', 'Analitik Dasar'],
    description: 'Cocok untuk pemula yang baru memulai jastip.'
  },
  {
    id: 'pro',
    name: 'Pro',
    basePrice: 49000,
    originalPrice: 99000,
    features: ['Unlimited Postingan', 'Prioritas Support', 'Analitik Lengkap', 'Verifikasi Akun'],
    description: 'Pilihan terbaik untuk jastiper aktif.'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    basePrice: 149000,
    originalPrice: 299000,
    features: ['Semua Fitur Pro', 'Dedicated Account Manager', 'API Access', 'Custom Branding'],
    description: 'Solusi lengkap untuk bisnis jastip skala besar.'
  }
]

type ViewState = 'overview' | 'packages' | 'payment'

export function BillingDialog({ open, onOpenChange }: BillingDialogProps) {
  const [view, setView] = useState<ViewState>('overview')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedPackage, setSelectedPackage] = useState<typeof PACKAGES_DATA[0] | null>(null)

  const currentPlan = {
    name: "Pro Plan",
    price: "Rp 99.000/bulan",
    status: "Active",
    nextBilling: "01 Jan 2026",
  }

  const handlePackageSelect = (pkg: typeof PACKAGES_DATA[0]) => {
    setSelectedPackage(pkg)
    setView('payment')
  }

  const handleBack = () => {
    if (view === 'payment') setView('packages')
    else if (view === 'packages') setView('overview')
  }

  const renderOverview = () => (
    <div className="flex flex-col h-full">
      {/* Fixed Top Section */}
      <div className="px-6 pb-6 pt-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Paket Saat Ini</h3>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Package className="w-24 h-24" />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{currentPlan.name}</h2>
                <p className="text-sm text-gray-500">{currentPlan.price}</p>
              </div>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                {currentPlan.status}
              </Badge>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tagihan Berikutnya</span>
                <span className="font-medium text-gray-900">{currentPlan.nextBilling}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setView('packages')}
                className="flex-1 bg-gray-900 hover:bg-gray-800 h-10 text-sm"
              >
                Upgrade Paket
              </Button>
              <Button variant="outline" className="flex-1 h-10 text-sm border-gray-200">
                Kelola
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable History Section */}
      <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Riwayat Tagihan</h3>
          <Button variant="ghost" size="sm" className="h-6 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2">
            Lihat Semua
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {MOCK_HISTORY.map((item, index) => (
              <div 
                key={item.id} 
                className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  index !== MOCK_HISTORY.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.description}</p>
                    <p className="text-xs text-gray-500">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{item.amount}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                    Lunas
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderPackages = () => {
    const calculatePrice = (basePrice: number) => {
      if (basePrice === 0) return 'Gratis'
      if (billingCycle === 'monthly') {
        return `Rp ${basePrice.toLocaleString('id-ID')}/bln`
      } else {
        const yearlyPrice = basePrice * 12 * 0.8 // 20% discount
        return `Rp ${(yearlyPrice / 12).toLocaleString('id-ID')}/bln`
      }
    }

    return (
      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
        {/* 
        <div className="flex justify-center mb-6">
          <Tabs defaultValue="monthly" className="w-full max-w-xs" onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Bulanan</TabsTrigger>
              <TabsTrigger value="yearly">Tahunan</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        */}

        {billingCycle === 'yearly' && (
          <div className="bg-green-50 text-green-700 text-xs font-medium px-3 py-2 rounded-lg mb-4 text-center border border-green-100">
            🎉 Hemat 20% dengan pembayaran tahunan!
          </div>
        )}

        <div className="space-y-4">
          {PACKAGES_DATA.map((pkg) => {
             const priceDisplay = calculatePrice(pkg.basePrice)
             const yearlyTotal = pkg.basePrice * 12 * 0.8
             
             return (
              <div key={pkg.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm relative overflow-hidden">
                {billingCycle === 'yearly' && pkg.basePrice > 0 && (
                   <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                     HEMAT 20%
                   </div>
                )}
                
                {billingCycle === 'monthly' && pkg.originalPrice > 0 && (
                   <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                     DISKON 50%
                   </div>
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{pkg.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <p className="text-orange-600 font-semibold">{priceDisplay}</p>
                      {billingCycle === 'yearly' && pkg.basePrice > 0 && (
                        <span className="text-xs text-gray-400 line-through">
                          Rp {(pkg.basePrice).toLocaleString('id-ID')}
                        </span>
                      )}
                      {billingCycle === 'monthly' && pkg.originalPrice > 0 && (
                        <span className="text-xs text-gray-400 line-through">
                          Rp {(pkg.originalPrice).toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                    {billingCycle === 'yearly' && pkg.basePrice > 0 && (
                       <p className="text-xs text-gray-500 mt-0.5">
                         Tagihan Rp {yearlyTotal.toLocaleString('id-ID')} / tahun
                       </p>
                    )}
                  </div>
                  {pkg.id === 'pro' && billingCycle === 'monthly' && (
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">Populer</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4">{pkg.description}</p>
                
                <Accordion type="single" collapsible className="w-full mb-4">
                  <AccordionItem value="features" className="border-b-0">
                    <AccordionTrigger className="py-2 text-sm hover:no-underline text-gray-600">
                      Lihat Detail Fitur
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 pt-2">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Button 
                  onClick={() => handlePackageSelect(pkg)}
                  className="w-full bg-gray-900 hover:bg-gray-800"
                >
                  Pilih Paket
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderPayment = () => {
    const price = selectedPackage ? (
        billingCycle === 'monthly' 
        ? selectedPackage.basePrice 
        : selectedPackage.basePrice * 12 * 0.8
    ) : 0
    
    const priceString = price === 0 ? 'Gratis' : `Rp ${price.toLocaleString('id-ID')}`
    const cycleString = billingCycle === 'monthly' ? '/ bulan' : ' / tahun'

    return (
    <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-1">Paket yang dipilih:</h3>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-orange-700">{selectedPackage?.name} ({billingCycle === 'monthly' ? 'Bulanan' : 'Tahunan'})</span>
          <span className="font-semibold text-gray-900">{priceString}{price > 0 && cycleString}</span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Instruksi Pembayaran</h3>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Transfer ke Bank BCA</p>
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="font-mono font-semibold text-lg">123 456 7890</span>
                <Button variant="ghost" size="sm" className="h-8 text-xs">Salin</Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">a.n PT Jastipin Indonesia</p>
            </div>
            <div className="text-sm text-gray-600">
              <p>1. Transfer sesuai nominal tagihan.</p>
              <p>2. Simpan bukti transfer.</p>
              <p>3. Upload bukti transfer di bawah ini.</p>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="proof">Upload Bukti Pembayaran</Label>
          <div className="mt-2 border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-900">Klik untuk upload</p>
            <p className="text-xs text-gray-500">JPG, PNG (Max 2MB)</p>
            <Input id="proof" type="file" className="hidden" />
          </div>
        </div>

        <Button className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-lg font-semibold">
          Konfirmasi Pembayaran
        </Button>
      </div>
    </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={(val) => {
      onOpenChange(val)
      if (!val) setTimeout(() => setView('overview'), 300) // Reset view on close
    }}>
      <SheetContent side="bottom" className="rounded-t-3xl px-0 max-h-[90vh] h-[90vh] flex flex-col bg-white">
        <SheetHeader className="px-6 pt-4 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {view !== 'overview' && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 -ml-2 mr-1" 
                onClick={handleBack}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <div>
              <SheetTitle className="flex items-center gap-2">
                {view === 'overview' && <CreditCard className="w-5 h-5" />}
                {view === 'overview' ? 'Paket & Tagihan' : 
                 view === 'packages' ? 'Pilih Paket' : 'Pembayaran'}
              </SheetTitle>
              <SheetDescription>
                {view === 'overview' ? 'Kelola paket berlangganan dan riwayat pembayaran' :
                 view === 'packages' ? 'Upgrade akunmu untuk fitur lebih lengkap' :
                 'Selesaikan pembayaran untuk mengaktifkan paket'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {view === 'overview' && renderOverview()}
        {view === 'packages' && renderPackages()}
        {view === 'payment' && renderPayment()}
      </SheetContent>
    </Sheet>
  )
}
