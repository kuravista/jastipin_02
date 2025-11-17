import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

export function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "Rp 0",
      period: "/bulan",
      description: "Untuk mencoba",
      features: [
        "1 profil jastip",
        "10 produk per trip",
        "Notifikasi WhatsApp (50/bulan)",
        "Dashboard dasar",
        "Support email",
      ],
      cta: "Mulai Gratis",
      variant: "outline" as const,
      popular: false,
    },
    {
      name: "Pro",
      price: "Rp 99.000",
      period: "/bulan",
      oldPrice: "Rp 199.000",
      description: "Untuk jastiper serius",
      features: [
        "Unlimited profil & trip",
        "Unlimited produk",
        "Notifikasi WhatsApp unlimited",
        "Dashboard lengkap + analytics",
        "Priority support",
        "Custom domain (jastipin.me/nama)",
      ],
      cta: "Upgrade ke Pro",
      variant: "default" as const,
      popular: true,
    },
  ]

  return (
    <section id="harga" className="py-10 md:py-16 bg-gradient-to-b from-background to-pink-50/30 bg-blue-200">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Harga <span className="text-[#3A86FF]">Transparan</span>
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">Mulai gratis — upgrade saat siap</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative border-2 ${plan.popular ? "border-[#3A86FF] shadow-xl" : "border-border"}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3A86FF] hover:bg-[#E05576] text-white">
                  Paling Populer
                </Badge>
              )}
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <div className="mt-4">
                  {plan.oldPrice && <p className="text-sm text-muted-foreground line-through">{plan.oldPrice}</p>}
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button
                  className={`w-full ${plan.popular ? "bg-[#3A86FF] hover:bg-[#E05576] text-white" : ""}`}
                  variant={plan.variant}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
