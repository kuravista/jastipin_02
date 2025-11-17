import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-blue-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#F26B8A] mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-2">Profil tidak ditemukan</h2>
        <p className="text-muted-foreground mb-6">Profil yang kamu cari tidak ada atau sudah tidak aktif.</p>
        <Button asChild className="bg-[#F26B8A] hover:bg-[#E05576]">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Link>
        </Button>
      </div>
    </div>
  )
}
