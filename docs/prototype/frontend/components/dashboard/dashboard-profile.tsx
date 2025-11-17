"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ExternalLink, Camera, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DashboardProfile({ onBack }: { onBack?: () => void }) {
  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Halaman Profil</h1>
          <p className="text-gray-600">Kelola tampilan halaman publik Anda</p>
        </div>
      </div>

      {/* Preview Link */}
      <div className="bg-gradient-to-r from-pink-100 to-blue-100 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-900 mb-1">Halaman Publik Anda</div>
            <Link href="/tina" className="text-sm text-[#3A86FF] hover:underline flex items-center gap-1">
              jastipin.me/tina
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <Button asChild size="sm">
            <Link href="/tina" target="_blank">
              Lihat Profil
            </Link>
          </Button>
        </div>
      </div>

      {/* Profile Settings Form */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
        <div>
          <Label>Foto Profil</Label>
          <div className="mt-2 flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">T</span>
            </div>
            <Button variant="outline" size="sm">
              <Camera className="w-4 h-4 mr-2" />
              Ganti Foto
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="display-name">Nama Tampilan</Label>
          <Input id="display-name" defaultValue="Tina - Jastip Jepang & Korea" className="mt-2" />
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            rows={3}
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F26B8A]"
            defaultValue="Jastip terpercaya dari Jepang & Korea 🇯🇵🇰🇷 | Order via WA | Trusted seller sejak 2023"
          />
        </div>

        <div>
          <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
          <Input id="whatsapp" defaultValue="+62 812-3456-7890" className="mt-2" />
        </div>

        <div>
          <Label htmlFor="instagram">Instagram</Label>
          <Input id="instagram" defaultValue="@jastip.tina" className="mt-2" />
        </div>

        <div>
          <Label htmlFor="cover-image">Cover Image</Label>
          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#F26B8A] transition-colors cursor-pointer">
            <Camera className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Upload gambar cover</p>
          </div>
        </div>

        <Button className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] h-11 font-semibold">Simpan Perubahan</Button>
      </div>
    </div>
  )
}
