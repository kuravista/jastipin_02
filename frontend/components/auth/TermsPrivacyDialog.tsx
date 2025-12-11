"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TermsPrivacyDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function TermsPrivacyDialog({ isOpen, onClose }: TermsPrivacyDialogProps) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms")

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {activeTab === "terms" ? "Syarat & Ketentuan" : "Kebijakan Privasi"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-6 pt-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("terms")}
            className={`pb-4 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "terms"
                ? "text-orange-600 border-orange-600"
                : "text-gray-600 border-transparent hover:text-gray-900"
            }`}
          >
            Syarat & Ketentuan
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`pb-4 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "privacy"
                ? "text-orange-600 border-orange-600"
                : "text-gray-600 border-transparent hover:text-gray-900"
            }`}
          >
            Kebijakan Privasi
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-gray-700 text-sm leading-relaxed space-y-4">
          {activeTab === "terms" ? (
            <div className="space-y-4">
              <section>
                <h3 className="font-bold text-gray-900 mb-2">1. Penerimaan Syarat dan Ketentuan</h3>
                <p>
                  Dengan mengakses dan menggunakan platform Jastipin, Anda setuju untuk terikat oleh semua syarat dan ketentuan yang berlaku. Jika Anda tidak setuju dengan bagian manapun dari syarat dan ketentuan ini, harap hentikan penggunaan platform kami.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-gray-900 mb-2">2. Penggunaan Layanan</h3>
                <p>
                  Anda setuju untuk menggunakan platform ini hanya untuk tujuan yang sah dan tidak akan melakukan aktivitas yang melanggar hukum atau merusak pengalaman pengguna lain. Dilarang menggunakan platform ini untuk spam, phishing, malware, atau aktivitas berbahaya lainnya.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-gray-900 mb-2">3. Akun Pengguna</h3>
                <p>
                  Anda bertanggung jawab atas kerahasiaan informasi akun Anda dan semua aktivitas yang terjadi di akun Anda. Harap segera hubungi kami jika Anda mencurigai aktivitas tidak sah pada akun Anda.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-gray-900 mb-2">4. Konten Pengguna</h3>
                <p>
                  Anda memberi Jastipin lisensi untuk menggunakan, mereproduksi, dan mendistribusikan konten yang Anda posting di platform kami. Anda menjamin bahwa konten tersebut tidak melanggar hak pihak ketian mana pun.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-gray-900 mb-2">5. Batasan Tanggung Jawab</h3>
                <p>
                  Jastipin tidak bertanggung jawab atas kerugian langsung, tidak langsung, atau konsekuensial yang timbul dari penggunaan platform kami. Penggunaan platform ini sepenuhnya atas risiko Anda sendiri.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-gray-900 mb-2">6. Penghentian Layanan</h3>
                <p>
                  Kami berhak untuk menghentikan akses Anda ke platform kami kapan saja jika kami menentukan bahwa Anda telah melanggar syarat dan ketentuan ini atau aktivitas Anda membahayakan pengguna lain.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-gray-900 mb-2">7. Perubahan Syarat</h3>
                <p>
                  Kami berhak untuk mengubah syarat dan ketentuan ini kapan saja. Perubahan akan berlaku segera setelah dipublikasikan. Penggunaan berkelanjutan dari platform kami setelah perubahan berarti Anda menerima syarat yang baru.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-4">
              <section>
                <h3 className="font-bold text-gray-900 mb-2">1. Informasi yang Kami Kumpulkan</h3>
                <p>
                  Kami mengumpulkan informasi pribadi seperti nama, email, nomor telepon, dan alamat yang Anda berikan saat mendaftar. Kami juga mengumpulkan data penggunaan seperti IP address, tipe browser, dan halaman yang Anda kunjungi.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-gray-900 mb-2">2. Penggunaan Informasi</h3>
                <p>
                  Informasi yang kami kumpulkan digunakan untuk menyediakan, meningkatkan, dan mempersonalisasi layanan kami. Kami juga menggunakan informasi ini untuk berkomunikasi dengan Anda tentang pembaruan, penawaran khusus, dan informasi penting lainnya.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-gray-900 mb-2">3. Keamanan Data</h3>
                <p>
                  Kami mengimplementasikan tindakan keamanan teknis dan organisasi untuk melindungi informasi pribadi Anda dari akses, pengubahan, pengungkapan, atau penghancuran yang tidak sah. Namun, tidak ada sistem keamanan yang 100% aman.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-gray-900 mb-2">4. Pembagian Informasi</h3>
                <p>
                  Kami tidak menjual, menyewakan, atau membagikan informasi pribadi Anda kepada pihak ketiga tanpa persetujuan Anda, kecuali jika diperlukan oleh hukum. Kami dapat membagikan informasi dengan mitra layanan yang membantu kami menjalankan platform.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-gray-900 mb-2">5. Cookie dan Teknologi Pelacakan</h3>
                <p>
                  Kami menggunakan cookie dan teknologi serupa untuk meningkatkan pengalaman Anda di platform kami. Anda dapat mengonfigurasi browser Anda untuk menolak cookie, tetapi ini mungkin mempengaruhi fungsionalitas platform.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-gray-900 mb-2">6. Hak Privasi Anda</h3>
                <p>
                  Anda memiliki hak untuk mengakses, memperbaiki, dan menghapus informasi pribadi Anda. Untuk melakukan permintaan ini, silakan hubungi kami melalui formulir kontak kami. Kami akan merespons dalam waktu 30 hari.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-gray-900 mb-2">7. Perubahan Kebijakan Privasi</h3>
                <p>
                  Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Kami akan memberitahukan Anda tentang perubahan yang signifikan melalui email atau pemberitahuan di platform kami.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-gray-900 mb-2">8. Hubungi Kami</h3>
                <p>
                  Jika Anda memiliki pertanyaan tentang kebijakan privasi kami atau praktik privasi kami, silakan hubungi kami di privacy@jastipin.com
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex gap-3 justify-end">
          <Button
            onClick={onClose}
            className="px-6 h-10 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}
