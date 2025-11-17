# 🧭 **JASTIPIN.ME — Product Requirements Document (PRD v4.2 - With Prototype Alignment)**

> *Powered by Bringly Engine*
> Fokus: MVP Domestik (Indonesia)
> Last Updated: Nov 2025
> **Status**: Prototype Frontend Ready, Backend & Integration In Progress

---

## 1. 📖 Ringkasan Produk

**Jastipin** adalah platform web berbasis WhatsApp yang membantu *jastiper* (penyedia jasa titip) mengelola trip, pesanan, dan update barang secara otomatis — tanpa harus mencatat manual di grup WhatsApp.

Dengan menggabungkan dashboard web sederhana dan sistem notifikasi otomatis via WhatsApp Official, Jastipin menjadikan bisnis *jastip* lebih cepat, teratur, dan profesional.

---

## 2. 🎯 Tujuan Produk

### Tujuan Utama

* Mengotomasi proses jastip tradisional yang saat ini dilakukan manual via grup WhatsApp.
* Mengurangi beban rekap dan komunikasi manual antara jastiper dan penitip.
* Memberikan pengalaman profesional tanpa mengubah kebiasaan pengguna (tetap di WhatsApp).

### Tujuan Tambahan

* Membangun kepercayaan komunitas jastip terhadap solusi digital lokal.
* Mengumpulkan data perilaku untuk validasi pasar sebelum ekspansi regional.
* Menciptakan pondasi produk yang siap dikembangkan secara global oleh Bringly Engine.

---

## 3. 👥 Target Pengguna

### 🧍‍♀️ *Jastiper Aktif (Seller)*

* Wanita usia 22–40 tahun.
* Aktif di Instagram dan WhatsApp.
* Sering membuka jastip untuk produk luar negeri atau event lokal.
* Kendala utama: rekap pesanan manual, update stok lambat, pengingat pembayaran tidak efisien.

### 🧍‍♀️ *Penitip (Buyer)*

* Pengguna aktif WhatsApp (18–40 tahun).
* Ingin membeli produk lewat jastip, tapi ingin transparansi dan komunikasi cepat.
* Tidak mau bergabung grup WA atau aplikasi tambahan.

---

## 4. 💡 Value Proposition

| Masalah                               | Solusi dari Jastipin                     |
| ------------------------------------- | ---------------------------------------- |
| Rekap pesanan dari grup WA berantakan | Form order otomatis + dashboard          |
| Update stok sulit disampaikan         | Broadcast otomatis ke penitip terdaftar  |
| Grup WA terlalu ramai                 | Notifikasi dikirim 1:1 oleh bot resmi    |
| Banyak penitip lupa transfer          | Reminder otomatis via WhatsApp           |
| Pelanggan kehilangan info produk      | Setiap penitip dapat notifikasi langsung |

---

## 5. 🔄 Alur Pengguna (User Flow) — **[REFAKTORED v4.2]**

Alur pengguna kini berpusat pada Halaman Profil Publik Jastiper sebagai "etalase" utama dengan link-in-bio pattern (seperti Beacons.ai/Linktree).

### **A. Jastiper Flow**

1. Login / Register ke dashboard.
2. **[BARU]** Setup Profil Publik: Jastiper mengatur *username* unik (misal: "tina") dan deskripsi singkat. Sistem menghasilkan link profil permanen:
   👉 `jastipin.me/tina`
3. Membuat **Trip Jastip Baru** (misal "Jastip Jepang Mei 2025") dan mengaturnya sebagai "Aktif" agar muncul di Halaman Profil.
4. **[BERUBAH]** Jastiper membagikan **satu link profil (`jastipin.me/tina`)** ke grup WhatsApp atau Instagram Bio mereka.
5. Jastiper mengunggah produk baru (gambar, harga, stok) ke dalam trip yang aktif.
6. Peserta yang sudah bergabung dengan trip tersebut otomatis menerima notifikasi produk via WhatsApp.
7. Penitip mengisi form order dan mengirim bukti transfer.
8. Jastiper memvalidasi order di dashboard dan sistem mengirim konfirmasi otomatis ke penitip.

### **B. Penitip Flow (Alur Profil Utama) — [RECOMMENDED]**

1. **[BERUBAH]** Klik link profil jastiper dari grup atau story:
   👉 `jastipin.me/tina`
2. **[BARU]** Melihat Halaman Profil Jastiper (link-in-bio style) dengan:
   - Avatar + nama + bio
   - Stats (total trip, happy customers, rating)
   - Current trip card dengan countdown
   - Product grid katalog
   - Social links (WhatsApp, Instagram)
3. **[BARU]** Penitip memilih trip yang diminati (klik card atau "Join" button).
4. Diarahkan ke Halaman Join Trip (`/t/jpn25`) dengan info lengkap trip.
5. Pilih tombol **"Ikut via WhatsApp"** → WhatsApp terbuka otomatis dengan pesan prefilled.
6. Penitip mengirim pesan "JOIN jpn25 | Nama: [Nama]"
7. Setelah dikirim, penitip otomatis terdaftar di trip tersebut (via webhook).
8. Menerima notifikasi setiap kali ada produk baru untuk trip tersebut.
9. Klik link produk → isi order → upload bukti transfer.
10. Dapat pesan konfirmasi dari jastiper setelah validasi.

### **C. Penitip Flow (Alur Alternatif - Direct Trip Link) — [SUPPORTED]**

(Alur ini tetap didukung jika Jastiper ingin mempromosikan satu trip secara spesifik)

1. Klik link jastip spesifik dari grup atau story:
   👉 `jastipin.me/t/jpn25`
2. Langsung ke Halaman Join Trip.
3. Pilih tombol **"Ikut via WhatsApp"**.
4. (Lanjut ke Langkah 5 dari alur utama).

---

## 6. 🔗 Struktur Link — **[REFAKTORED v4.2]**

| Tipe Link | Contoh | Deskripsi | Status |
| --- | --- | --- | --- |
| **Profil** | `jastipin.me/tina` | Halaman etalase publik Jastiper (link-in-bio style). **[BARU]** | ✅ Ready (Prototype) |
| Trip | `jastipin.me/t/jpn25` | Halaman informasi trip dan join. | 🔄 In Progress |
| Order | `jastipin.me/o/pd12a` | Form pemesanan produk. | 🔄 In Progress |
| Unsubscribe | `jastipin.me/u/jpn25` | Hentikan notifikasi trip. | 🧭 Planned |

**Karakteristik:**
* Link pendek, mudah diingat, tanpa token rumit.
* Aman (slug unik per profil dan per trip).
* Dapat dibagikan bebas di grup/Instagram.
* Resolver via **Cloudflare Worker** untuk redirect cepat.

---

## 7. 💬 WhatsApp Interaction Model

### 7.1 Jenis Komunikasi

| Jenis                   | Deskripsi                                      | Status Biaya           |
| ----------------------- | ---------------------------------------------- | ---------------------- |
| User-initiated          | Pengguna mengirim pesan ke bisnis (JOIN, INFO) | Gratis (24 jam window) |
| Business-initiated      | Bisnis kirim pesan ke user (broadcast)         | Berbayar               |
| Auto-reply (24h window) | Balasan otomatis dalam periode aktif           | Gratis                 |

### 7.2 Strategi Penghematan

* Semua flow utama menggunakan *click-to-chat* (user memulai percakapan).
* Notifikasi dikirim gratis selama jendela 24 jam masih aktif.
* Broadcast berbayar hanya digunakan untuk pengingat atau peserta non-aktif.
* Dashboard menampilkan estimasi biaya sebelum jastiper mengirim broadcast.

---

## 8. ⚙️ Fitur Utama (MVP) — **[REFAKTORED v4.2]**

### Untuk **Jastiper**

* **[BARU] Manajemen Profil Publik:** Mengatur *username* unik (`/tina`), foto profil, bio, cover image untuk halaman "link-in-bio".
* Buat Trip Jastip baru (dan memilih untuk "Tampilkan di Profil" dengan toggle `is_active`).
* Upload produk (gambar via R2, harga, stok, status).
* Dashboard order & status penitip dengan validasi.
* Validasi order dan kirim konfirmasi otomatis via WhatsApp.
* Tombol **"Copy Text Reminder"** untuk grup WA.
* Opsi broadcast berbayar (dengan estimasi biaya).
* Mini analytics: Revenue, Total Orders, Participants dengan growth indicators.

### Untuk **Penitip**

* **[BARU]** Melihat halaman profil Jastiper dan memilih trip yang tersedia (link-in-bio layout).
* Join trip lewat WhatsApp dengan pesan prefilled.
* Lihat produk katalog & order langsung dari link.
* Upload bukti transfer untuk konfirmasi pembayaran.
* Dapat notifikasi order & update otomatis via WhatsApp.
* Bisa balas "STOP" untuk berhenti menerima pesan.

---

## 9. 📱 Desain & UX Principles — **[PROTOTYPE ALIGNED v4.2]**

### Color Palette (OKLCH Color Space)
* **Primary CTA**: Orange (#FB923C) — Upload Produk, Titip Sekarang, Join buttons
* **Accent/Links**: Violet (#7C3AED) — active states, highlights, form focus
* **Secondary**: Soft Blush (#FFB6B9) — subtle backgrounds, secondary accents
* **Background**: Cloud White (#FFFFFF), Mist Gray (#F8F9FA) for sections
* **Text**: Charcoal (#363636) for headings, Muted (#556B80) for secondary text
* **Border Radius**: 8px for soft, modern feel

### Design System (Next.js + Tailwind v4)
* **Mobile-first** (95% traffic dari WhatsApp).
* 1–2 langkah maksimum untuk tindakan penting (Join → Chat).
* CTA besar & jelas dengan high contrast.
* Bahasa lokal yang santai tapi profesional.
* Tone: hangat, percaya, efisien.

### Component Standards
| Element | Style | Example |
| --- | --- | --- |
| Primary Button | Orange bg, rounded-lg, py-3 px-6 | `bg-orange-500 hover:bg-orange-600` |
| Secondary Button | Violet border, transparent bg | `border-2 border-violet-500 text-violet-500` |
| Link | Violet text, underline on hover | `text-violet-600 hover:underline` |
| Card | Soft shadow, 8px radius, white bg | `rounded-lg shadow-sm border border-gray-200` |
| Form Input | Violet focus ring, gray border | `border-gray-300 focus:ring-violet-400` |
| Badge | Orange/Violet with white text | `bg-orange-500 text-white rounded-full` |
| Navigation | Bottom sticky (mobile), top horizontal (desktop) | Fixed 768px breakpoint |

### Typography
* **Heading Font**: Poppins (weights: 400, 500, 600, 700)
* **Body Font**: Inter (weights: 400, 500)
* **H1**: 32px/40px, bold, Poppins
* **H2**: 24px/32px, bold, Poppins
* **Body**: 14px/20px, regular, Inter
* **Small**: 12px/16px, regular, Inter

### Spacing System (Tailwind utilities)
* **Section padding**: `py-8 md:py-12` (compact for modern feel)
* **Container**: `max-w-7xl mx-auto px-4` (landing), `max-w-2xl mx-auto px-4` (profile/invoice)
* **Card padding**: `p-4 md:p-6` for responsive padding
* **Gap between elements**: `gap-3 md:gap-4`, `gap-4 md:gap-6`

---

## 10. 📊 KPI & Validasi Awal

| KPI                      | Target (90 Hari Pertama) | Notes |
| ------------------------ | ------------------------ | --- |
| 300 jastiper aktif       | Market validation        | Email signup → verified |
| 3.000 penitip registrasi | Initial traction         | Join via WhatsApp |
| 5.000 order              | Transaction validation   | Order completion rate |
| Delivery rate > 95%      | Reliability goal         | Message delivery success |
| NPS ≥ 8                  | Product satisfaction     | Post-pilot feedback |

---

## 11. 💰 Monetisasi

* **Free Plan:**
  1 trip aktif, max 100 peserta, notifikasi dasar (no broadcast).
* **Pro Plan (Rp99.000–199.000/bulan):**
  Unlimited trip, custom slug, broadcast harian (5 templates/day).
* **Fee per order sukses (opsional di fase berikut).**
* Premium fitur ke depan:
  * AI rekap order otomatis.
  * Export laporan PDF/CSV.
  * Multi-trip analytics & insights.

---

## 12. 🗓️ Roadmap MVP (12 Minggu) — **[ALIGNED WITH PROTOTYPE]**

| Phase | Minggu | Fokus | Deliverables | Status |
| --- | --- | --- | --- | --- |
| 1 | 1–2 | Backend Setup | Express API, Prisma schema, Auth endpoints | 🔄 In Progress |
| 1 | 3–4 | Shortlink Resolver | Cloudflare Worker for /:slug, /t/:slug | 🧭 Planned |
| 2 | 5–6 | WhatsApp Integration | Webhook receiver, JOIN parser, auto-reply | 🧭 Planned |
| 2 | 7–8 | Frontend Alignment | Color update (Violet/Orange), Profile page dynamic | 🔄 In Progress |
| 3 | 9–10 | Queue Worker | BullMQ setup, notification queue, retry logic | 🧭 Planned |
| 3 | 11–12 | Testing & Pilot | E2E test, load test, pilot with 10 jastiper | 🧭 Planned |

---

## 13. 🎯 Strategi Go-To-Market

* Fokus **100% domestik (Indonesia)** untuk validasi pasar.
* Target awal: wanita 22–40 tahun di kota besar (Jakarta, Bandung, Surabaya).
* Kampanye Meta Ads:
  "Stop rekap manual. Buka Jastip lewat WhatsApp di Jastipin.me."
* Kolaborasi dengan komunitas jastip Instagram & Facebook.
* Feedback loop cepat via WA community group (untuk insight produk).

---

## 14. 🌍 Visi Jangka Panjang

> "Jastipin adalah pondasi ekosistem perdagangan sosial Indonesia."
>
> * Fase 1: Validasi pasar & adopsi jastiper lokal. **(Current)**
> * Fase 2: Ekspansi ke regional (SEA) dengan brand Bringly.
> * Fase 3: Platform global untuk *personal commerce automation* via chat.

---

## 15. 🔄 Implementation Notes for Developers

### Prototype Status ✅
* **Frontend**: Next.js 16 with React 19, Tailwind v4, shadcn/ui components ready
* **Pages built**: Landing page, Public profile (/[username]), Auth page, Dashboard, Invoice page
* **Color system**: OKLCH-based in globals.css (needs update from #F26B8A to #7C3AED/#FB923C)
* **Responsive**: Mobile-first approach with Tailwind breakpoints (md: 768px)

### Backend Needs 🔄
* Express.js API with Prisma ORM
* PostgreSQL database with schema: Users, Profiles, Trips, Participants, Products, Orders
* JWT authentication (12h TTL) with refresh tokens
* Cloudflare Worker for shortlink resolver
* WhatsApp Cloud API webhook handler
* BullMQ queue for async notifications

### Integration Points 🔗
1. **Frontend ↔ Backend**: API calls for auth, CRUD operations
2. **Backend ↔ WhatsApp**: Webhook receiver for JOIN/INFO/STOP commands
3. **Backend ↔ Queue**: BullMQ jobs for notifications
4. **Frontend ↔ Cloudflare Worker**: Shortlink redirects (/t/:slug → /join?trip=slug)
5. **Backend ↔ Cloudflare R2**: Image upload/download for products & proofs

---

## 16. 🧾 Kesimpulan

**Jastipin.me v4.2** menggabungkan prototype frontend yang siap dengan backend architecture yang modular dan SOLID. Platform ini dirancang untuk menyelesaikan masalah nyata di pasar Indonesia: mengubah proses jastip manual di grup WhatsApp menjadi sistem otomatis, sederhana, dan terpercaya.

Dengan pendekatan *WhatsApp-first*, link-in-bio profile pattern, dan infrastruktur cloud yang efisien, Jastipin siap menjadi solusi utama bagi ribuan jastiper yang ingin naik kelas — dari "jualan via grup" menjadi bisnis digital profesional.

---
