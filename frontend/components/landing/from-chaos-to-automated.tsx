import { MessageSquareWarning, Smartphone, LayoutDashboard, Wand2, Package, CheckCircle } from "lucide-react"

export function FromChaosToAutomated() {
  const journeyCards = [
    {
      icon: MessageSquareWarning,
      title: "Sebelum (Chaos)",
      description: "Order numpuk di grup, lupa siapa transfer, info tercecer.",
      color: "red",
      image: "/chaotic-whatsapp-chat-messages.jpg",
    },
    {
      icon: Smartphone,
      title: "Proses (Otomatis)",
      description: "Upload produk → kami kirim notifikasi otomatis ke penitip via WA resmi.",
      color: "pink",
      image: "/smartphone-sending-whatsapp-notification.jpg",
    },
    {
      icon: LayoutDashboard,
      title: "Sesudah (Profesional)",
      description: "Semua pesanan masuk dashboard. Tinggal validasi — beres.",
      color: "teal",
      image: "/clean-professional-dashboard-interface.jpg",
    },
  ]

  const miniSteps = [
    {
      icon: Wand2,
      title: "Buat Profil",
      subtitle: "jastipin.me/nama-anda",
      time: "(3 menit)",
    },
    {
      icon: Package,
      title: "Upload Produk Sekali",
      subtitle: "Broadcast otomatis ke semua penitip.",
      time: "",
    },
    {
      icon: CheckCircle,
      title: "Validasi Order",
      subtitle: "Rekap otomatis, penitip puas.",
      time: "",
    },
  ]

  return (
    <section id="cara-kerja" className="py-8 md:py-12 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Headline + Subheadline */}
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
            Dari Chaos ke Profesional — <br />
            <span className="text-[#F26B8A]">Dalam 3 Langkah Super Mudah</span>
          </h2>
          <p className="text-lg text-muted-foreground text-pretty leading-relaxed">
            Jastipin bantu kamu ubah grup WA berantakan jadi sistem otomatis yang rapi, profesional, dan hemat waktu.
          </p>
        </div>

        {/* 3 Cards: Before / Process / After */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
          {journeyCards.map((card, index) => {
            const Icon = card.icon
            const colorClasses = {
              red: "border-red-200 bg-red-50/50",
              pink: "border-pink-200 bg-pink-50/50",
              teal: "border-teal-200 bg-teal-50/50",
            }
            const iconColorClasses = {
              red: "text-red-600",
              pink: "text-[#F26B8A]",
              teal: "text-teal-600",
            }

            return (
              <div
                key={index}
                className={`p-6 rounded-2xl border-2 ${colorClasses[card.color as keyof typeof colorClasses]} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="mb-4 overflow-hidden rounded-lg">
                  <img src={card.image || "/placeholder.svg"} alt={card.title} className="w-full h-40 object-cover" />
                </div>
                <Icon className={`w-10 h-10 mb-3 ${iconColorClasses[card.color as keyof typeof iconColorClasses]}`} />
                <h3 className="font-bold text-xl mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
              </div>
            )
          })}
        </div>

        {/* 3 Steps mini flow */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="grid md:grid-cols-3 gap-8">
            {miniSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="relative">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 bg-[#F26B8A] rounded-full flex items-center justify-center text-white shadow-lg">
                      <Icon className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-base">{step.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.subtitle}</p>
                      {step.time && (
                        <span className="inline-block text-xs text-[#F26B8A] font-medium">{step.time}</span>
                      )}
                    </div>
                  </div>
                  {index < miniSteps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-[#F26B8A] to-pink-300 -translate-x-1/2" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
