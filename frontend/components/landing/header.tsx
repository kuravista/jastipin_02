"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useState } from "react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="z-40 mx-auto max-w-7xl px-4 mt-4">
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-3xl shadow-lg">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F26B8A] rounded-lg flex items-center justify-center text-white font-bold">
                J
              </div>
              <span className="font-bold text-xl">Jastipin.me</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="#fitur" className="text-sm font-medium hover:text-[#F26B8A] transition-colors">
                Fitur
              </Link>
              <Link href="#demo" className="text-sm font-medium hover:text-[#F26B8A] transition-colors">
                Demo
              </Link>
              <Link href="#harga" className="text-sm font-medium hover:text-[#F26B8A] transition-colors">
                Harga
              </Link>
              <Link href="#testimoni" className="text-sm font-medium hover:text-[#F26B8A] transition-colors">
                Testimoni
              </Link>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-violet-200 text-violet-700 hover:bg-violet-50 bg-transparent"
              >
                <Link href="/auth">Login</Link>
              </Button>
              <Button asChild size="sm" className="bg-[#F26B8A] hover:bg-[#E05576] text-white">
                <Link href="/auth">Coba Gratis</Link>
              </Button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <nav className="flex flex-col gap-4">
                <Link href="#fitur" className="text-sm font-medium hover:text-[#F26B8A] transition-colors">
                  Fitur
                </Link>
                <Link href="#demo" className="text-sm font-medium hover:text-[#F26B8A] transition-colors">
                  Demo
                </Link>
                <Link href="#harga" className="text-sm font-medium hover:text-[#F26B8A] transition-colors">
                  Harga
                </Link>
                <Link href="#testimoni" className="text-sm font-medium hover:text-[#F26B8A] transition-colors">
                  Testimoni
                </Link>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    asChild
                    variant="outline"
                    className="border-violet-200 text-violet-700 hover:bg-violet-50 w-full bg-transparent"
                  >
                    <Link href="/auth">Login</Link>
                  </Button>
                  <Button asChild className="bg-[#F26B8A] hover:bg-[#E05576] text-white w-full">
                    <Link href="/auth">Coba Gratis</Link>
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
