import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

export function Hero() {
  return (
    <section className="py-10 md:py-16 bg-gradient-to-b from-pink-50/50 to-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Capek rekap manual di grup WA?{" "}
                <span className="text-[#F26B8A]">Ubah bisnis jastip jadi otomatis & profesional</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground text-pretty leading-relaxed">
                Jastipin kirim update produk lewat WhatsApp resmi dan bereskan rekap pesanan di 1 dashboard.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-[#F26B8A] hover:bg-[#E05576] text-white text-base">
                Coba Gratis Sekarang
              </Button>
              <Button size="lg" variant="outline" className="text-base bg-transparent">
                Lihat Demo
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
              <span>Dipakai 100+ jastiper • Terintegrasi WhatsApp resmi</span>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-900 mb-2">Sebelum</p>
                  <p className="text-xs text-red-700">Chat berantakan, rekap manual 2 jam</p>
                </div>
                <img
                  src="/chaotic-whatsapp-group-chat-messages-stacked.jpg"
                  alt="Chat chaos"
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
              <div className="space-y-3 mt-8">
                <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-teal-900 mb-2">Sekarang</p>
                  <p className="text-xs text-teal-700">Dashboard rapi, otomatis terorganisir</p>
                </div>
                <img
                  src="/clean-organized-dashboard-order-management.jpg"
                  alt="Dashboard mockup"
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
