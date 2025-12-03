import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Poppins, Inter } from "next/font/google"
import { AuthProvider } from "@/lib/auth-context"
import { SupabaseAuthProvider } from "@/lib/supabase-auth-context"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"
import "@/lib/mobile-fullscreen"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Jastipin.me - Otomatisasi Jastip via WhatsApp",
  description:
    "Ubah bisnis jastip jadi otomatis & profesional. Kirim update produk lewat WhatsApp resmi dan bereskan rekap pesanan di 1 dashboard.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jastipin.me",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FB923C" },
    { media: "(prefers-color-scheme: dark)", color: "#EA7C2C" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="//web.webpushs.com/js/push/f5be80477f0c908cb18284a4803a4d0e_1.js"
          strategy="afterInteractive"
          async
        />
      </head>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        <SupabaseAuthProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </SupabaseAuthProvider>
        <Script
          src="https://static.sppopups.com/assets/loader.js"
          data-chats-widget-id="5340006e-dc13-44fb-b75d-99e826dcf2bd"
          strategy="lazyOnload"
          async
        />
      </body>
    </html>
  )
}
