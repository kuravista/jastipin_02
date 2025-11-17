# ⚙️ **Technical Specification — Worker & Messaging System (TSD_WORKER v1.0)**

> Bagian dari Jastipin v1.0 MVP (Domestik)

---

## 🧭 1. TUJUAN DOKUMEN

Dokumen ini menjelaskan bagaimana sistem *worker dan messaging* di Jastipin berjalan untuk:

* Mengirim notifikasi produk secara otomatis.
* Memproses pesan WhatsApp masuk (JOIN, INFO, STOP).
* Menjaga efisiensi biaya dengan logika broadcast pintar.
* Menghindari overload API dan duplikasi pesan.

---

## 🧱 2. SISTEM UTAMA

| Komponen                  | Fungsi                                              | Platform    |
| ------------------------- | --------------------------------------------------- | ----------- |
| **Redis Queue (BullMQ)**  | Menyimpan & menjadwalkan job pengiriman pesan       | Railway     |
| **Worker Service**        | Mengeksekusi job (notif, broadcast, bukti transfer) | Railway     |
| **Webhook Receiver**      | Menerima pesan WA masuk, mendaftarkan participant   | Express API |
| **WA Sender Module**      | Abstraksi pengiriman pesan via Meta Cloud API       | Node.js     |
| **Cost Engine (planned)** | Estimasi biaya sebelum broadcast                    | Phase 2     |

---

## 🔄 3. FLOW OVERVIEW

### A. *Outbound Flow* (Jastiper → Penitip)

```
Jastiper Upload Produk
     ↓
Backend simpan produk → enqueue job ke Redis
     ↓
Worker mengambil job (tripId)
     ↓
Worker ambil daftar participant aktif
     ↓
Bangun pesan WhatsApp (template / free-form)
     ↓
Kirim via Meta Cloud API
     ↓
Catat log ke notifications_log
     ↓
Update status success/failed
```

### B. *Inbound Flow* (Penitip → Sistem)

```
Penitip kirim pesan WA (JOIN jpn25 / INFO / STOP)
     ↓
Webhook Receiver (Express)
     ↓
Parse text & identifikasi command
     ↓
Validasi slug trip
     ↓
Perbarui database participant (status/joined_at)
     ↓
Kirim auto-reply (free, 24h window)
```

---

## 🧩 4. JENIS QUEUE

| Queue Name      | Fungsi                        | Priority | Mode       |
| --------------- | ----------------------------- | -------- | ---------- |
| `notifications` | Kirim update produk           | High     | Batch      |
| `broadcast`     | Kirim CTA template (paid)     | Medium   | Sequential |
| `proof_notify`  | Kirim bukti order ke jastiper | Low      | Direct     |

---

## 📬 5. STRUKTUR JOB

### Job Payload Format (JSON)

```json
{
  "tripId": "jpn25",
  "productId": "prd_123",
  "participants": [
    { "id": "p1", "phone": "628123456789", "name": "Ani" }
  ],
  "template": "product_update",
  "message": "Ada produk baru: Action Figure A - Rp450.000"
}
```

---

## ⚙️ 6. WORKER CONFIGURATION

### BullMQ Options

```js
{
  concurrency: 5,
  limiter: { max: 10, duration: 1000 }, // 10 msg/sec
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  }
}
```

---

## 🧠 7. MESSAGE FLOW DETAIL

### Step 1 — Enqueue

* Dipanggil oleh `POST /api/trips/:id/products`
* Sistem membuat job baru: `notifications.add(jobData)`
* Disimpan ke Redis

### Step 2 — Worker Consume

* Worker mengambil batch 1 job
* Query participants aktif (`status='active'`)
* Untuk setiap participant → render template pesan

### Step 3 — Send via WA API

* Endpoint:
  `POST https://graph.facebook.com/v19.0/${PHONE_ID}/messages`
* Header: `Authorization: Bearer {WA_ACCESS_TOKEN}`
* Body (contoh free-form):

  ```json
  {
    "messaging_product": "whatsapp",
    "to": "628123456789",
    "type": "text",
    "text": { "body": "Ada produk baru: Action Figure A" }
  }
  ```

### Step 4 — Response Handler

* Jika `status=sent`, tandai sukses.
* Jika gagal (`rate limit`, `timeout`, `invalid`), retry 3x exponential.
* Jika tetap gagal → tandai `failed` di log & kirim alert ke Sentry.

---

## 📊 8. LOGGING & MONITORING

### notifications_log Table

| Field           | Tipe      | Keterangan            |
| --------------- | --------- | --------------------- |
| id              | UUID      | Primary               |
| participant_id  | UUID      | Relasi ke participant |
| trip_id         | UUID      | Trip terkait          |
| message_type    | TEXT      | ex: `product_update`  |
| status          | ENUM      | queued/sent/failed    |
| provider_msg_id | TEXT      | ID dari WA API        |
| attempts        | INT       | Jumlah percobaan      |
| created_at      | TIMESTAMP | Timestamp             |

### Tools:

* **Bull Board UI** → monitor queue
* **Sentry** → error WA API
* **Prometheus Exporter** → metrics queue depth, success rate

---

## 💬 9. COMMANDS SUPPORTED (Inbound)

| Command       | Aksi                         | Respon                                 |
| ------------- | ---------------------------- | -------------------------------------- |
| `JOIN {slug}` | Mendaftarkan penitip ke trip | “Terima kasih sudah join!”             |
| `INFO`        | Menampilkan 3 produk terbaru | “Berikut produk terbaru trip {title}…” |
| `STOP`        | Unsubscribe penitip          | “Anda berhenti menerima notifikasi.”   |

### Parser Logic:

```js
if (text.startsWith('JOIN')) handleJoin()
else if (text.startsWith('INFO')) handleInfo()
else if (text.startsWith('STOP')) handleStop()
```

---

## 🧮 10. BROADCAST STRATEGY

### Tujuan:

Minimalkan biaya dari **Business-initiated Messages (paid templates)**.

### Logika:

* Default = *tidak broadcast otomatis*.
* Hanya jastiper yang memilih broadcast → sistem estimasi biaya:

  ```
  total = participants × rate (Rp 35/msg)
  ```
* Dashboard menampilkan:

  > “Kirim pesan ke 100 peserta = Rp3.500”

### Filtering:

* Hanya peserta aktif dalam 7 hari terakhir.
* Hindari kirim ke user dengan `unsubscribed_at != null`.

---

## ⚡ 11. ERROR & RETRY HANDLING

| Error                 | Penyebab      | Tindakan       |
| --------------------- | ------------- | -------------- |
| 400 Bad Request       | Nomor salah   | tandai failed  |
| 429 Rate Limit        | Terlalu cepat | delay + retry  |
| 5xx Provider Error    | API down      | requeue        |
| Network Timeout       | Worker hang   | retry          |
| Redis connection lost | Infrastruktur | restart worker |

---

## 🔐 12. SECURITY

* Semua WA API call menggunakan `Bearer {access_token}`.
* Redis queue terhubung dengan password dan TLS (Railway default).
* Phone number sanitized ke format E.164 sebelum disimpan.
* Tidak ada data pribadi disimpan di log pesan.

---

## 🕓 13. FUTURE ENHANCEMENTS

| Fitur                     | Deskripsi                          | Status    |
| ------------------------- | ---------------------------------- | --------- |
| Cost Engine               | Hitung biaya real-time             | Planned   |
| Template Manager          | UI drag-and-drop template WA       | Planned   |
| Worker Pool Scaling       | Auto scale berdasarkan queue depth | Planned   |
| Smart Segmenting          | Kirim pesan hanya ke penitip aktif | In Design |
| Delivery Receipt Tracking | Sinkron status delivered/read      | Phase 2   |

---

## 🧾 14. DEPLOYMENT NOTES

| Komponen   | Environment              | Scale                         |
| ---------- | ------------------------ | ----------------------------- |
| Worker     | Railway                  | 1 dyno awal, scale horizontal |
| Redis      | Railway                  | Persistent, TTL logs 3 hari   |
| Bull Board | `/admin/queues`          | Protected via token           |
| Webhook    | `/api/webhooks/whatsapp` | Hosted di API service         |

---

## 🧠 15. RESUME ARSITEKTUR WORKER

```
[Backend] 
  └── enqueue job → [Redis Queue] 
       └── [Worker] 
            ├── call WA API 
            ├── retry if fail 
            ├── log result 
            └── alert on error
                ↓
          [Sentry + Prometheus]
```

---

## ✅ 16. STATUS IMPLEMENTASI

| Modul          | Status     | Catatan                 |
| -------------- | ---------- | ----------------------- |
| Queue setup    | ✅ Done     | BullMQ OK               |
| Job schema     | ✅ Done     | notifications_log ready |
| Worker script  | 🔄 Dev     | retry logic             |
| Webhook parser | 🔄 Dev     | JOIN/STOP handling      |
| Cost estimator | 🧭 Planned | Phase 2                 |
| Monitoring     | ⏳ Next     | integrate Prometheus    |

---

## 🔚 17. KESIMPULAN

Worker & messaging system di Jastipin didesain untuk:

* **andalan (reliable)**: retry otomatis, log lengkap, rate limit aman,
* **hemat (cost-aware)**: gunakan 24-hour free window,
* **modular (scalable)**: semua antrian & job independen per fungsi.

Arsitektur ini siap scale dari 100 ke 10.000 penitip hanya dengan menambah worker instance baru — tanpa rewrite sistem.

---
