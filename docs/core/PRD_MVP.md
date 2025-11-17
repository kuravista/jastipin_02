# 🧭 **JASTIPIN.ME — Product Requirements Document (PRD v4.1 - Clean Edition)**

> *Powered by Bringly Engine*
> Fokus: MVP Domestik (Indonesia)

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

## 5\. 🔄 Alur Pengguna (User Flow) — **[REFAKTORED]**

Alur pengguna kini berpusat pada Halaman Profil Publik Jastiper sebagai "etalase" utama.

### **A. Jastiper Flow**

1.  Login / Register ke dashboard.
2.  **[BARU] Setup Profil Publik:** Jastiper mengatur *username* unik (misal: "tina") dan deskripsi singkat. Sistem menghasilkan link profil permanen:
    👉 `jastipin.me/tina`
3.  Membuat **Trip Jastip Baru** (misal “Jastip Jepang Mei 2025”) dan mengaturnya sebagai "Aktif" agar muncul di Halaman Profil.
4.  **[BERUBAH]** Jastiper membagikan **satu link profil (`jastipin.me/tina`)** ke grup WhatsApp atau Instagram Bio mereka.
5.  Jastiper mengunggah produk baru (gambar, harga, stok) ke dalam trip yang aktif.
6.  Peserta yang sudah bergabung dengan trip tersebut otomatis menerima notifikasi produk via WhatsApp.
7.  Penitip mengisi form order dan mengirim bukti transfer.
8.  Jastiper memvalidasi order di dashboard dan sistem mengirim konfirmasi otomatis ke penitip.

-----

### **B. Penitip Flow (Alur Profil Utama)**

1.  **[BERUBAH]** Klik link profil jastiper dari grup atau story:
    👉 `jastipin.me/tina`
2.  **[BARU]** Melihat Halaman Profil Jastiper (ala Linktree) yang menampilkan daftar semua trip yang sedang aktif (misal: "Jastip Jepang" dan "Jastip Korea").
3.  **[BARU]** Penitip memilih trip yang diminati (misal: "Jastip Jepang").
4.  Diarahkan ke Halaman Join Trip (`/t/jpn25`) dan memilih tombol **“Ikut via WhatsApp”**.
5.  WhatsApp terbuka otomatis dengan pesan prefilled:
    “JOIN jpn25 | Nama: \<Nama\>”.
6.  Setelah dikirim, penitip otomatis terdaftar di trip tersebut.
7.  Menerima notifikasi setiap kali ada produk baru untuk trip tersebut.
8.  Klik link produk → isi order → upload bukti transfer.
9.  Dapat pesan konfirmasi dari jastiper setelah validasi.

### **C. Penitip Flow (Alur Alternatif - Direct Link)**

(Alur ini tetap didukung jika Jastiper ingin mempromosikan satu trip secara spesifik)

1.  Klik link jastip spesifik dari grup atau story:
    👉 `jastipin.me/t/jpn25`
2.  Pilih tombol **“Ikut via WhatsApp”**.
3.  (Lanjut ke Langkah 5 dari alur utama).

---

## 6\. 🔗 Struktur Link — **[REFAKTORED]**

| Tipe Link | Contoh | Deskripsi |
| --- | --- | --- |
| **Profil** | `jastipin.me/tina` | **[BARU]** Halaman etalase publik Jastiper (ala model Beacons.ai/Linktree). |
| Trip | `jastipin.me/t/jpn25` | Halaman informasi trip dan join. |
| Order | `jastipin.me/o/pd12a` | Form pemesanan produk. |
| Unsubscribe | `jastipin.me/u/jpn25` | Hentikan notifikasi trip. |

**Karakteristik:**

  * Link pendek, mudah diingat, tanpa token rumit.
  * Aman (slug unik per profil dan per trip).
  * Dapat dibagikan bebas di grup/Instagram.


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

## 8\. ⚙️ Fitur Utama (MVP) — **[REFAKTORED]**

### Untuk **Jastiper**

  * **[BARU] Manajemen Profil Publik:** Mengatur *username* unik (`/tina`), foto profil, dan deskripsi singkat untuk halaman "link-in-bio".
  * Buat Trip Jastip baru (dan memilih untuk "Tampilkan di Profil").
  * Upload produk (gambar, harga, stok, status).
  * Dashboard order & status penitip.
  * Validasi order dan kirim konfirmasi otomatis.
  * Tombol **“Copy Text Reminder”** untuk grup WA.
  * Opsi broadcast berbayar (dengan estimasi biaya).

### Untuk **Penitip**

  * **[BARU]** Melihat halaman profil Jastiper dan memilih trip yang tersedia.
  * Join trip lewat WhatsApp.
  * Lihat produk & order langsung dari link.
  * Upload bukti transfer.
  * Dapat notifikasi order & update otomatis.
  * Bisa balas “STOP” untuk berhenti menerima pesan.

---

## 9. 📱 Desain & UX Principles

* **Mobile-first** (95% traffic dari WhatsApp).
* 1–2 langkah maksimum untuk tindakan penting (Join → Chat).
* Warna dominan: Violet (#7C3AED) & Orange (#FB923C).
* CTA besar & jelas (“Ikut via WhatsApp”, “Titip Sekarang”).
* Bahasa lokal yang santai tapi profesional.
* Tone: hangat, percaya, efisien.

---

## 10. 📊 KPI & Validasi Awal

| KPI                      | Target (90 Hari Pertama) |
| ------------------------ | ------------------------ |
| 300 jastiper aktif       | Market validation        |
| 3.000 penitip registrasi | Initial traction         |
| 5.000 order              | Transaction validation   |
| Delivery rate > 95%      | Reliability goal         |
| NPS ≥ 8                  | Product satisfaction     |

---

## 11. 💰 Monetisasi

* **Free Plan:**
  1 trip aktif, max 100 peserta, notifikasi dasar.
* **Pro Plan (Rp99.000–199.000/bulan):**
  Unlimited trip, custom slug, broadcast harian.
* **Fee per order sukses (opsional di fase berikut).**
* Premium fitur ke depan:

  * AI rekap order otomatis.
  * Export laporan.
  * Multi-trip analytics.

---

## 12. 🗓️ Roadmap MVP (3 Bulan)

| Minggu | Fokus                          | Hasil               |
| ------ | ------------------------------ | ------------------- |
| 1–2    | Pembuatan trip + shortlink     | CRUD Trip aktif     |
| 3–4    | Join via WhatsApp              | Flow penitip aktif  |
| 5–6    | Upload produk + notifikasi WA  | Worker online       |
| 7–8    | Order form + validasi          | End-to-end MVP      |
| 9–10   | Broadcast + billing            | Monetisasi internal |
| 11–12  | Pilot test (10 jastiper aktif) | MVP Launch          |

---

## 13. 🎯 Strategi Go-To-Market

* Fokus **100% domestik (Indonesia)** untuk validasi pasar.
* Target awal: wanita 22–40 tahun di kota besar (Jakarta, Bandung, Surabaya).
* Kampanye Meta Ads:
  “Stop rekap manual. Buka Jastip lewat WhatsApp di Jastipin.me.”
* Kolaborasi dengan komunitas jastip Instagram & Facebook.
* Feedback loop cepat via WA community group (untuk insight produk).

---

## 14. 🌍 Visi Jangka Panjang

> “Jastipin adalah pondasi ekosistem perdagangan sosial Indonesia.”
>
> * Fase 1: Validasi pasar & adopsi jastiper lokal.
> * Fase 2: Ekspansi ke regional (SEA) dengan brand Bringly.
> * Fase 3: Platform global untuk *personal commerce automation* via chat.

---

## 15. 🧾 Kesimpulan

**Jastipin.me** dirancang untuk menyelesaikan masalah nyata di pasar Indonesia:
mengubah proses jastip manual di grup WhatsApp menjadi sistem otomatis, sederhana, dan terpercaya.

Dengan pendekatan *WhatsApp-first* dan infrastruktur cloud yang efisien, Jastipin siap menjadi solusi utama bagi ribuan jastiper yang ingin naik kelas — dari “jualan via grup” menjadi bisnis digital profesional.

---
