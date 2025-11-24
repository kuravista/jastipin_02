import { TopBar } from "@/components/landing/top-bar"
import { Header } from "@/components/landing/header"
import { Hero } from "@/components/landing/hero"
import { LiveDemoStrip } from "@/components/landing/live-demo-strip"
import { FromChaosToAutomated } from "@/components/landing/from-chaos-to-automated"
import { TestimonialsWithDemo } from "@/components/landing/testimonials-with-demo"
import { TrustBadges } from "@/components/landing/trust-badges"
import { Pricing } from "@/components/landing/pricing"
import { FAQ } from "@/components/landing/faq"
import { FinalCTA } from "@/components/landing/final-cta"
import { Footer } from "@/components/landing/footer"
import { FloatingUsernameInput } from "@/components/landing/floating-username-input"

export default function Home() {
  return (
    <main className="min-h-screen">
      <TopBar />
      <Header />
      <Hero />
      <LiveDemoStrip />
      <FromChaosToAutomated />
      <TestimonialsWithDemo />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <TrustBadges />
      <FloatingUsernameInput />
    </main>
  )
}
