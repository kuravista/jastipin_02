import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FAQ() {
  const faqs = [
    {
      question: "Apakah pesan dikirim ke grup WhatsApp?",
      answer:
        "Tidak. Jastipin mengirim notifikasi langsung ke pesan pribadi (1-on-1) setiap penitip menggunakan WhatsApp Cloud API resmi dari Meta. Ini lebih profesional dan tidak mengganggu grup.",
    },
    {
      question: "Apakah demo mengirim pesan WhatsApp nyata?",
      answer:
        "Tidak. Demo bersifat simulasi untuk menunjukkan bagaimana sistem bekerja tanpa mengirim pesan nyata. Setelah daftar dan verifikasi nomor WhatsApp, baru pesan akan terkirim ke pelanggan Anda.",
    },
    {
      question: "Bagaimana metode pembayaran yang tersedia?",
      answer:
        "Saat ini kami akan mengintegrasikan dengan Midtrans dan Xendit untuk berbagai metode pembayaran seperti transfer bank, e-wallet (GoPay, OVO, Dana), dan kartu kredit.",
    },
    {
      question: "Apakah nomor WhatsApp saya aman?",
      answer:
        "Sangat aman. Kami menggunakan WhatsApp Cloud API resmi dari Meta dengan enkripsi end-to-end. Nomor Anda tidak akan dibagikan ke pihak ketiga dan hanya digunakan untuk mengirim notifikasi ke pelanggan Anda.",
    },
    {
      question: "Berapa lama waktu setup?",
      answer:
        "Setup awal hanya membutuhkan 3-5 menit untuk membuat profil dan upload produk pertama. Setelah itu, sistem sudah siap digunakan. Anda bisa langsung membagikan link profil Anda (jastipin.me/nama-anda) ke pelanggan.",
    },
  ]

  return (
    <section className="py-10 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Pertanyaan <span className="text-[#F26B8A]">Umum</span>
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">Yang sering ditanyakan</p>
        </div>

        <Accordion type="single" collapsible className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-base font-semibold">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
