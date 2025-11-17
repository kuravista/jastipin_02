import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F26B8A] rounded-lg flex items-center justify-center text-white font-bold">
                J
              </div>
              <span className="font-bold text-lg">Jastipin.me</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Otomatisasi jastip via WhatsApp. Profesional, cepat, dan mudah.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Produk</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#fitur" className="text-muted-foreground hover:text-foreground transition-colors">
                  Fitur
                </Link>
              </li>
              <li>
                <Link href="#harga" className="text-muted-foreground hover:text-foreground transition-colors">
                  Harga
                </Link>
              </li>
              <li>
                <Link href="#demo" className="text-muted-foreground hover:text-foreground transition-colors">
                  Demo
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-3">Update fitur AI rekap otomatis</p>
            <div className="flex gap-2">
              <Input type="email" placeholder="Email kamu" className="text-sm" />
              <Button size="sm" className="bg-[#F26B8A] hover:bg-[#E05576] shrink-0">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Jastipin.me • Otomatisasi jastip via WhatsApp</p>
        </div>
      </div>
    </footer>
  )
}
