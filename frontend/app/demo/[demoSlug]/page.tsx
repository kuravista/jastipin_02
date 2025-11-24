"use client"

import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Instagram, MessageCircle, Heart, Calendar, MapPin, Package, CheckCircle2 } from "lucide-react"

// Demo data
const demoProfiles = {
  tina: {
    name: "Tina Jastip",
    username: "tina",
    bio: "🇺🇸 NYC based | Sneaker & Fashion Hunter\n✈️ Trip bulanan | Trusted 3+ tahun",
    avatar: "/indonesian-woman-profile-1.jpg",
    coverImage: "/new-york-street.jpg",
    stats: {
      totalTrips: 47,
      happyCustomers: 320,
      rating: 4.9,
    },
    currentTrip: {
      title: "Fall Sale — Nike & Adidas Sneakers",
      image: "/athletic-shoes.jpg",
      location: "New York, USA",
      deadline: "25 Nov 2024",
      status: "Buka",
      spotsLeft: 12,
    },
    catalog: [
      { name: "Nike Air Max", price: "Rp 2.1jt", image: "/athletic-shoes.jpg", available: true },
      { name: "Adidas Ultraboost", price: "Rp 2.4jt", image: "/athletic-shoes.jpg", available: true },
      { name: "New Balance 574", price: "Rp 1.8jt", image: "/athletic-shoes.jpg", available: false },
    ],
    social: {
      instagram: "tina_jastip",
      whatsapp: "+628123456789",
    },
  },
  ana: {
    name: "Ana Shop",
    username: "ana",
    bio: "🇰🇷 Seoul Beauty Expert | K-Beauty Specialist\n💄 Skincare & Makeup | Authentic guarantee",
    avatar: "/indonesian-woman-profile-2.jpg",
    coverImage: "/seoul-beauty-store.jpg",
    stats: {
      totalTrips: 62,
      happyCustomers: 580,
      rating: 5.0,
    },
    currentTrip: {
      title: "Korea Beauty Haul — December Edition",
      image: "/korean-beauty-products.jpg",
      location: "Seoul, South Korea",
      deadline: "30 Nov 2024",
      status: "Buka",
      spotsLeft: 8,
    },
    catalog: [
      { name: "COSRX Snail Mucin", price: "Rp 280k", image: "/korean-beauty-products.jpg", available: true },
      { name: "Laneige Cream Skin", price: "Rp 420k", image: "/korean-beauty-products.jpg", available: true },
      { name: "Innisfree Green Tea", price: "Rp 190k", image: "/korean-beauty-products.jpg", available: true },
    ],
    social: {
      instagram: "ana_shop",
      whatsapp: "+628234567890",
    },
  },
  sg: {
    name: "Jastip SG",
    username: "sg",
    bio: "🇸🇬 Singapore Electronics & Tech Gadgets\n⚡ Fast shipping | Official warranty",
    avatar: "/indonesian-man-profile.jpg",
    coverImage: "/singapore-electronics-mall.jpg",
    stats: {
      totalTrips: 89,
      happyCustomers: 1240,
      rating: 4.8,
    },
    currentTrip: {
      title: "Singapore Electronics — Black Friday Deals",
      image: "/electronics-gadget.jpg",
      location: "Singapore",
      deadline: "28 Nov 2024",
      status: "Buka",
      spotsLeft: 15,
    },
    catalog: [
      { name: "AirPods Pro", price: "Rp 3.2jt", image: "/electronics-gadget.jpg", available: true },
      { name: "Apple Watch Series 9", price: "Rp 6.5jt", image: "/electronics-gadget.jpg", available: true },
      { name: "iPad Air", price: "Rp 8.9jt", image: "/electronics-gadget.jpg", available: false },
    ],
    social: {
      instagram: "jastip.sg",
      whatsapp: "+628345678901",
    },
  },
}

export default async function DemoProfilePage({ params }: { params: Promise<{ demoSlug: string }> }) {
  const { demoSlug } = await params
  const profile = demoProfiles[demoSlug as keyof typeof demoProfiles]

  if (!profile) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      {/* Demo Banner */}
      <div className="bg-[#F26B8A] text-white py-3 px-4 text-center">
        <p className="text-sm font-medium">
          🎯 Ini adalah <strong>Demo Profil</strong> — Lihat betapa mudah & profesionalnya! Klik tombol di bawah untuk
          mulai setup milik kamu.
        </p>
      </div>

      <div className="relative w-full h-48 overflow-hidden rounded-b-3xl">
        <img
          src={profile.coverImage || "/placeholder.svg?height=200&width=600"}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Profile Container - Link-in-bio style */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        {/* Profile Header */}
        <div className="text-center mb-6 -mt-20 relative z-10">
          <div className="inline-block relative mb-3">
            <img
              src={profile.avatar || "/placeholder.svg?height=120&width=120"}
              alt={profile.name}
              className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover"
            />
            <Badge className="absolute bottom-0 right-0 bg-green-500 border-2 border-white">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Aktif
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{profile.name}</h1>
          <p className="text-muted-foreground text-sm mb-3 whitespace-pre-line text-pretty">{profile.bio}</p>

          {/* Stats */}
          <div className="flex justify-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-xl font-bold text-[#F26B8A]">{profile.stats.totalTrips}+</p>
              <p className="text-xs text-muted-foreground">Total Trip</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#F26B8A]">{profile.stats.happyCustomers}+</p>
              <p className="text-xs text-muted-foreground">Pelanggan</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#F26B8A]">{profile.stats.rating}</p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
          </div>
        </div>

        {/* Current Trip Card */}
        <Card className="mb-6 overflow-hidden border-2 border-[#F26B8A] shadow-lg">
          <div className="relative h-40">
            <img
              src={profile.currentTrip.image || "/placeholder.svg?height=160&width=400"}
              alt={profile.currentTrip.title}
              className="w-full h-full object-cover"
            />
            <Badge className="absolute top-3 right-3 bg-green-500">{profile.currentTrip.status}</Badge>
          </div>
          <div className="p-5 space-y-3">
            <h3 className="font-bold text-lg text-balance">{profile.currentTrip.title}</h3>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile.currentTrip.location}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Tutup {profile.currentTrip.deadline}
              </div>
              <div className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                {profile.currentTrip.spotsLeft} slot tersisa
              </div>
            </div>
            <Button className="w-full bg-[#F26B8A] hover:bg-[#E05576] text-white hover:text-white">
              <Heart className="w-4 h-4 mr-2" />
              Ikut Trip Ini
            </Button>
          </div>
        </Card>

        {/* Catalog Preview */}
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-4">📦 Katalog Barang</h3>
          <div className="grid grid-cols-1 gap-3">
            {profile.catalog.map((item, index) => (
              <Card key={index} className={`p-4 ${!item.available ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-4">
                  <img
                    src={item.image || "/placeholder.svg?height=60&width=60"}
                    alt={item.name}
                    className="w-16 h-16 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-[#F26B8A] font-bold">{item.price}</p>
                  </div>
                  <Badge variant={item.available ? "default" : "secondary"}>
                    {item.available ? "Tersedia" : "Habis"}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-3 mb-8">
          <Button
            variant="outline"
            className="w-full h-14 border-2 hover:border-[#F26B8A] hover:bg-pink-50 hover:text-foreground bg-transparent"
            onClick={() => window.open(`https://wa.me/${profile.social.whatsapp}`, "_blank")}
          >
            <MessageCircle className="w-5 h-5 mr-3 text-green-600" />
            <span className="font-semibold">WhatsApp — Order & Tanya-tanya</span>
          </Button>
          <Button
            variant="outline"
            className="w-full h-14 border-2 hover:border-[#F26B8A] hover:bg-pink-50 hover:text-foreground bg-transparent"
            onClick={() => window.open(`https://instagram.com/${profile.social.instagram}`, "_blank")}
          >
            <Instagram className="w-5 h-5 mr-3 text-pink-600" />
            <span className="font-semibold">Follow di Instagram</span>
          </Button>
        </div>

        {/* CTA to get started */}
        <Card className="bg-gradient-to-r from-[#F26B8A] to-[#3A86FF] text-white p-6 text-center">
          <h3 className="font-bold text-xl mb-2">Mau profil seperti ini?</h3>
          <p className="text-sm mb-4 opacity-90">Setup cuma 5 menit. Gratis selamanya untuk fitur dasar!</p>
          <Button size="lg" className="bg-white text-[#F26B8A] hover:bg-gray-100 hover:text-[#F26B8A] font-bold">
            <ExternalLink className="w-4 h-4 mr-2" />
            Buat Profil Jastipin Sekarang
          </Button>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            Powered by <span className="font-semibold text-[#F26B8A]">Jastipin.me</span>
          </p>
        </div>
      </div>
    </div>
  )
}
