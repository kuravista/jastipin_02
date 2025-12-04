"use client"

import { useEffect } from "react"
import { THEME_OPTIONS } from "@/lib/design-config"

export function ThemeWrapper({ themeId, children }: { themeId: string, children: React.ReactNode }) {
  useEffect(() => {
    const theme = THEME_OPTIONS.find(t => t.id === themeId) || THEME_OPTIONS[0]
    
    // Convert Hex to HSL or just use Hex directly if Tailwind supports it via var
    // Here we assume Tailwind config is set to use these vars or we use inline styles for specific components
    // For this implementation, we will set CSS variables on the root element of this wrapper
    
    if (theme) {
      const root = document.documentElement
      root.style.setProperty('--color-primary', theme.colors.primary)
      root.style.setProperty('--color-secondary', theme.colors.secondary)
    }
  }, [themeId])

  return (
    <div className="w-full h-full contents">
      {children}
    </div>
  )
}
