import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="text-center">
        <FileQuestion className="w-20 h-20 text-gray-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Tidak Ditemukan</h1>
        <p className="text-gray-600 mb-8">Invoice yang Anda cari tidak ada atau sudah dihapus.</p>
        <Button asChild className="bg-[#F26B8A] hover:bg-[#E05576]">
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    </div>
  )
}
