"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useState } from "react"

export function FinalCTA() {
  const [username, setUsername] = useState("")

  const handleClaimUsername = () => {
    if (username.trim()) {
      // Navigate to auth page with username pre-filled
      window.location.href = `/auth?username=${encodeURIComponent(username)}`
    }
  }

  return (
    <section data-section="final-cta" className="py-12 md:py-20 bg-gradient-to-br from-[#F26B8A] to-[#E05576] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/abstract-pattern-texture.jpg')] opacity-10" />
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold text-balance">Ubah Grup WA Jadi Mesin Jastip Otomatis</h2>
          <p className="text-lg md:text-xl text-pink-50 text-pretty leading-relaxed">
            Mulai gratis — upgrade saat siap. Tidak perlu kartu kredit.
          </p>

          <div className="pt-4 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white rounded-2xl sm:rounded-full p-2 shadow-2xl">
              <div className="flex-1 flex items-center px-4 py-2 sm:py-0">
                <span className="text-gray-400 font-medium mr-1">jastipin.me/</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  placeholder="username-anda"
                  className="flex-1 outline-none text-gray-900 font-medium placeholder:text-gray-300"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleClaimUsername()
                    }
                  }}
                />
              </div>
              <Button
                size="lg"
                onClick={handleClaimUsername}
                className="bg-[#F26B8A] hover:bg-[#E05576] text-white text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto rounded-2xl sm:rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                Claim Username Sekarang
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-pink-100">Gratis selamanya untuk plan Free • Upgrade kapan saja</p>
        </div>
      </div>
    </section>
  )
}
