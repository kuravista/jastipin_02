"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useState, useEffect, useRef } from "react"

export function FloatingUsernameInput() {
  const [username, setUsername] = useState("")
  const [shouldHide, setShouldHide] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  useEffect(() => {
    // Detect scroll to show floating input
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setHasScrolled(true)
      } else {
        setHasScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Check initial position

    // Observe CTA section to hide floating input when it's visible
    const ctaSection = document.querySelector('[data-section="final-cta"]')
    
    if (!ctaSection) {
      return () => {
        window.removeEventListener("scroll", handleScroll)
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Hide when CTA section is in viewport
          setShouldHide(entry.isIntersecting)
        })
      },
      {
        threshold: 0.2,
        rootMargin: "-100px 0px 0px 0px"
      }
    )

    observer.observe(ctaSection)

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll)
      observer.disconnect()
    }
  }, [])

  const handleClaimUsername = () => {
    if (username.trim()) {
      window.location.href = `/auth?username=${encodeURIComponent(username)}`
    }
  }

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 transition-all duration-500 ease-in-out ${
        hasScrolled && !shouldHide
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-8 pointer-events-none"
      }`}
    >
      <div className="flex items-center bg-white rounded-full p-1.5 shadow-2xl border border-pink-100 gap-2">
        <div className="flex items-center px-4 flex-[0.7] min-w-0">
          <span className="text-gray-400 font-medium mr-1 shrink-0">jastipin.me/</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
            placeholder="username-anda"
            className="flex-1 outline-none text-gray-900 font-medium placeholder:text-gray-300 min-w-0"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleClaimUsername()
              }
            }}
          />
        </div>
        <Button
          onClick={handleClaimUsername}
          className="bg-[#F26B8A] hover:bg-[#E05576] text-white px-6 py-2 h-10 rounded-full shadow-lg hover:shadow-xl transition-all whitespace-nowrap flex-[0.3] shrink-0"
        >
          Claim
          <ArrowRight className="ml-1.5 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
