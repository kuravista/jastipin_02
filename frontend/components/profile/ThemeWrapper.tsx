"use client"

import { useEffect } from "react"
import { THEME_OPTIONS } from "@/lib/design-config"

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

export function ThemeWrapper({ themeId, children }: { themeId: string; children: React.ReactNode }) {
  useEffect(() => {
    const theme = THEME_OPTIONS.find((t) => t.id === themeId) || THEME_OPTIONS[0]

    if (theme) {
      const root = document.documentElement

      // Set colors as-is (browsers support hex colors in CSS variables)
      root.style.setProperty("--color-primary", theme.colors.primary)
      root.style.setProperty("--color-secondary", theme.colors.secondary)

      // Also set RGB versions for use with opacity in CSS (e.g., rgb(var(--color-primary-rgb) / 0.5))
      const primaryRgb = hexToRgb(theme.colors.primary)
      const secondaryRgb = hexToRgb(theme.colors.secondary)

      if (primaryRgb) {
        root.style.setProperty(
          "--color-primary-rgb",
          `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`
        )
      }

      if (secondaryRgb) {
        root.style.setProperty(
          "--color-secondary-rgb",
          `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`
        )
      }

      // Log for debugging
      console.log(`[ThemeWrapper] Applied theme: ${themeId}`, {
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
      })
    }
  }, [themeId])

  return (
    <div className="w-full h-full contents">
      {children}
    </div>
  )
}
