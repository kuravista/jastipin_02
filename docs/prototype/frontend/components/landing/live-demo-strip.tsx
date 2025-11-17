import { Button } from "@/components/ui/button"
import { ExternalLink, Sparkles } from "lucide-react"
import Link from "next/link"

export function LiveDemoStrip() {
  return (
    <section id="demo" className="py-8 bg-violet-50 border-y border-violet-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            <span className="font-semibold text-violet-900">Coba lihat contoh profil:</span>
          </div>
          <Link
            href="/demo/tina"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border-2 border-violet-200 hover:border-violet-400 transition-colors font-mono text-violet-700 hover:text-violet-900"
          >
            jastipin.me/tina
            <ExternalLink className="w-4 h-4" />
          </Link>
          <span className="text-sm text-violet-600">(Demo — tidak menerima transaksi)</span>
          <Button
            variant="outline"
            size="sm"
            className="border-violet-300 text-violet-700 hover:bg-violet-100 bg-transparent"
          >
            Lihat Demo
          </Button>
        </div>
      </div>
    </section>
  )
}
