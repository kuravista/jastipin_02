import { Shield, Zap, Users, CheckCircle2 } from "lucide-react"

export function TrustBadges() {
  const badges = [
    {
      icon: CheckCircle2,
      text: "WhatsApp Cloud API (Meta)",
    },
    {
      icon: Shield,
      text: "SSL Secure",
    },
    {
      icon: Users,
      text: "Dipakai 100+ jastiper",
    },
    {
      icon: Zap,
      text: "Respon Real-time",
    },
  ]

  return (
    <section className="py-12 bg-muted/30 border-y">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {badges.map((badge, index) => {
            const Icon = badge.icon
            return (
              <div key={index} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className="w-5 h-5 text-teal-600" />
                <span>{badge.text}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
