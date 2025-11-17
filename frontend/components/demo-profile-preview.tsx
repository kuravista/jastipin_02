import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Send } from "lucide-react"

export function DemoProfilePreview() {
  const sampleItems = [
    { name: "Sepatu Nike Air Max", price: "Rp 850.000", image: "/athletic-shoes.png" },
    { name: "Tas Coach Original", price: "Rp 1.200.000", image: "/coach-bag.jpg" },
    {
      name: "Parfum Chanel No.5",
      price: "Rp 950.000",
      image: "/chanel-perfume.jpg",
    },
  ]

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-violet-100 text-violet-700 border-violet-200">
            Demo • Contoh Trip Aktif
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Lihat Profil Demo <span className="text-[#F26B8A]">Langsung</span>
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Klik untuk melihat bagaimana pelanggan akan melihat profil Anda
          </p>
        </div>

        <Card className="max-w-3xl mx-auto border-2 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4 mb-4">
              <img
                src="/indonesian-woman-professional-profile.jpg"
                alt="Tina"
                className="w-16 h-16 rounded-full border-2 border-[#F26B8A]"
              />
              <div>
                <CardTitle className="text-xl">Tina's Japan Trip 🇯🇵</CardTitle>
                <CardDescription className="text-base">@tina_jastip • Verified</CardDescription>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Trip ke Tokyo 15-25 Maret • Pre-order ditutup 10 Maret
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {sampleItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-16 h-16 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-sm text-[#F26B8A] font-semibold">{item.price}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1 bg-[#F26B8A] hover:bg-[#E05576] text-white">
                <ExternalLink className="w-4 h-4 mr-2" />
                Lihat Profil Demo
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-violet-300 text-violet-700 hover:bg-violet-50 bg-transparent"
              >
                <Send className="w-4 h-4 mr-2" />
                Simulasi Kirim Notifikasi
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Demo tidak mengirim pesan nyata • Hanya simulasi
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
