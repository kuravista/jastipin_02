import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

export function Testimonials() {
  const testimonials = [
    {
      quote: "Dulu rekap 2 jam, sekarang tinggal validasi. Penitip senang karena dapat notifikasi langsung.",
      author: "@tina_jastip",
      context: "Group size: 500",
      avatar: "/indonesian-woman-profile-1.jpg",
    },
    {
      quote: "WhatsApp resmi bikin lebih profesional. Customer lebih percaya dibanding broadcast biasa.",
      author: "@jastip_korea",
      context: "Trip bulanan ke Seoul",
      avatar: "/indonesian-woman-profile-2.jpg",
    },
    {
      quote: "Setup 5 menit langsung jalan. Dashboard-nya gampang banget dipake, ga ribet.",
      author: "@jastip.sg",
      context: "Baru pakai 2 minggu",
      avatar: "/indonesian-man-profile.jpg",
    },
  ]

  return (
    <section id="testimoni" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Cerita dari <span className="text-[#F26B8A]">Jastiper Lain</span>
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">Mereka sudah lebih produktif</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-2 hover:border-pink-200 transition-colors">
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#F26B8A] text-[#F26B8A]" />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed text-pretty">{testimonial.quote}</blockquote>
                <div className="flex items-center gap-3 pt-2">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.author}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-sm">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.context}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
