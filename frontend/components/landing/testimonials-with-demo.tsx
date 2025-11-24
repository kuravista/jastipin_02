"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Star } from "lucide-react"
import Link from "next/link"

export function TestimonialsWithDemo() {
  const reviewers = [
    {
      name: "Tina Jastip",
      handle: "@tina_jastip",
      quote: "Dulu rekap order bisa 2 jam, sekarang semua otomatis. Penitip juga senang karena infonya cepat.",
      avatar: "/indonesian-woman-profile-1.jpg",
      demoSlug: "tina",
      tripTitle: "Fall Sale — Sneakers",
      tripImage: "/athletic-shoes.jpg",
    },
    {
      name: "Ana Shop",
      handle: "@ana_shop",
      quote: "Sekarang aku bisa fokus hunting barang, bukan rekap order. Dashboard-nya rapi banget!",
      avatar: "/indonesian-woman-profile-2.jpg",
      demoSlug: "ana",
      tripTitle: "Korea Beauty Haul",
      tripImage: "/korean-beauty-products.jpg",
    },
    {
      name: "Jastip SG",
      handle: "@jastip.sg",
      quote: "Setup 5 menit langsung jalan. Customer lebih percaya karena ada profil profesional.",
      avatar: "/indonesian-man-profile.jpg",
      demoSlug: "sg",
      tripTitle: "Singapore Electronics",
      tripImage: "/electronics-gadget.jpg",
    },
  ]

  return (
    <section id="testimoni" className="py-10 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Cerita dari Jastiper — <span className="text-[#F26B8A]">Lihat Profil Mereka Langsung</span>
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Jastipin bikin mereka hemat waktu, tampil profesional, dan dipercaya penitip. Sekarang giliran kamu.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {reviewers.map((reviewer, index) => (
            <Card
              key={index}
              className="border-2 hover:border-pink-200 transition-all hover:shadow-lg group overflow-hidden"
            >
              <CardContent className="pt-6 space-y-4">
                {/* Rating */}
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#F26B8A] text-[#F26B8A]" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-sm leading-relaxed text-pretty min-h-[4rem]">"{reviewer.quote}"</blockquote>

                {/* Author Info */}
                <div className="flex items-center gap-3 pt-2 border-t">
                  <img
                    src={reviewer.avatar || "/placeholder.svg"}
                    alt={reviewer.name}
                    className="w-12 h-12 rounded-full border-2 border-[#F26B8A]"
                  />
                  <div>
                    <p className="font-semibold text-sm">{reviewer.name}</p>
                    <p className="text-xs text-muted-foreground">{reviewer.handle}</p>
                  </div>
                </div>

                {/* Mini Profile Preview */}
                <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-pink-200 bg-pink-50/50 p-3">
                  <Badge className="absolute top-2 right-2 bg-[#F26B8A] text-white text-xs">Demo Profil Aktif</Badge>
                  <div className="flex items-center gap-3">
                    <img
                      src={reviewer.tripImage || "/placeholder.svg"}
                      alt={reviewer.tripTitle}
                      className="w-16 h-16 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{reviewer.tripTitle}</p>
                      <p className="text-xs text-muted-foreground">jastipin.me/{reviewer.demoSlug}</p>
                    </div>
                  </div>
                </div>

                <Button asChild className="w-full bg-[#F26B8A] hover:bg-[#E05576] text-white">
                  <Link href={`/demo/${reviewer.demoSlug}`} target="_blank">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Lihat Profil Demo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
