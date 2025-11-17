# ⚙️ **JASTIPIN.ME — Technical Specification Document (TSD v1.0 - MVP DOMESTIK)**

> Stack: **Next.js (Cloudflare Pages) + Node.js (Express + Prisma + Railway) + WhatsApp Cloud API + Cloudflare R2 + BullMQ**

---

## 🧱 1. SYSTEM OVERVIEW

**Jastipin** adalah platform C2C (*Consumer-to-Consumer*) untuk bisnis *jasa titip* yang memanfaatkan:

* **Frontend:** web dashboard & shortlink landing (Next.js, Cloudflare Pages).
* **Backend:** RESTful API (Express.js), Queue Worker (BullMQ), Database (PostgreSQL).
* **Integration Layer:** WhatsApp Official API (Meta Cloud API).
* **Infra:** Cloudflare (DNS, Pages, Worker, R2), Railway (App, DB, Redis).

### 📦 Sistem Utama:

1. **Frontend App** — Next.js (Cloudflare Pages)
2. **Backend API** — Express + Prisma (Railway)
3. **Worker Service** — BullMQ + Redis (Railway)
4. **Storage Service** — Cloudflare R2
5. **Webhook Receiver** — Node.js (Express route)
6. **Cloudflare Worker** — shortlink resolver (`/t/:slug`, `/o/:slug`)
7. **WhatsApp API Integration** — Meta Cloud API
8. **Billing Engine** — internal service (Phase 2)

---

## 🧭 2. SYSTEM ARCHITECTURE — **[REFAKTORED]**

```
                    ┌──────────────────────────────────────────┐
                    │             Cloudflare DNS               │
                    │ jastipin.me  → Pages / Workers / API     │
                    └────────────────┬─────────────────────────┘
                                     │
       ┌─────────────────────────────┼──────────────────────────────┐
       │                             │                              │
       ▼                             ▼                              ▼
┌────────────────┐         ┌─────────────────────┐          ┌────────────────────┐
│ CF Worker (JS) │         │ Next.js Frontend    │          │ Express API (Rail) │
│ [REFAKTORED]   │         │ Dashboard + Landing │          │ Auth, CRUD, Logic  │
│ /:slug → Profile │         │ /profile?slug=...   │          └─────────┬──────────┘
│ /t/:slug → Trip  │         │ /join?trip=...      │                    │
└───────┬─────────┘         └──────────┬──────────┘                    │
        │                              │                               ▼
        ▼                              ▼                        ┌─────────────────┐
 ┌───────────────┐             ┌───────────────┐              │ Redis Queue     │
 │ WhatsApp User │ ↔ WA Cloud  │ Postgres DB   │              │ BullMQ (notif)  │
 │ (Penitip)     │ API <──────>│ users, trips  │ <── Worker ─▶└─────────────────┘
 └───────────────┘             └───────────────┘              
                               │
                               ▼
                        ┌────────────┐
                        │ CF R2 S3   │
                        │ Product Img│
                        └────────────┘
```

---

## 🧩 3. CORE COMPONENTS — **[REFAKTORED]**

| Komponen | Deskripsi | Teknologi |
| --- | --- | --- |
| **Frontend (Web)** | Dashboard jastiper, halaman profil publik, join page, order page | Next.js (SSG) + Tailwind |
| **API Gateway** | Auth, CRUD, webhook, **[BARU]** profile data handler | Express.js + Prisma |
| **Database** | Simpan user, profile, trip, participant, product, order | PostgreSQL |
| **Queue/Worker** | Mengelola batch WhatsApp notif | BullMQ + Redis |
| **Storage** | Upload produk & bukti transfer | Cloudflare R2 |
| **Shortlink Resolver** | **[REFAKTORED]** Redirect `/:slug` → profil, `/t/:slug` → trip | Cloudflare Worker |
| **Messaging** | Kirim/terima pesan WA | WhatsApp Cloud API |
| **Observability** | Monitoring dan alert | Sentry + Cloudflare Analytics |

---

## 🧠 4. DATA MODEL — **[REFAKTORED]**

### Entity Relationship (simplified)

```
JASTIPER (user)
  id
  email
  password
  slug             # [BARU] (cth: "tina", unik)
  profile_name     # [BARU] (cth: "Jastip by Tina")
  profile_bio      # [BARU] (cth: "Jastip Korea & Jepang...")
  
  └── TRIP (slug, title, date, is_active) # [is_active BARU]
        ├── PARTICIPANT (phone, name)
        ├── PRODUCT (title, price, status)
        └── ORDER (participant_id, proof, total)
```

Relasi:

  * `user.id` → `trip.jastiper_id`
  * `trip.id` → `participant.trip_id`, `product.trip_id`
  * `participant.id` → `order.participant_id`
  * `user.slug` (slug profil) digunakan untuk lookup publik.

---

## 🧾 5. API ENDPOINTS (v1) — **[REFAKTORED]**

### 🔐 Auth

```
POST /api/auth/register
POST /api/auth/login
```

### 👤 Profile (Publik & Privat) — **[BARU]**

```
GET  /api/profile/:slug        # [BARU] (Publik) Mengambil data profil Jastiper + daftar trip (is_active=true)
GET  /api/profile/me           # [BARU] (Privat) Mengambil data profil Jastiper yang sedang login
PATCH /api/profile/me          # [BARU] (Privat) Update info profil (slug, name, bio)
```

### 🧳 Trip

```
POST /api/trips
GET  /api/trips/:id
GET  /api/trips/:slug
PATCH /api/trips/:id           # [BARU] (Untuk toggle is_active)
```


### 👥 Participant

```
POST /api/trips/:id/join
GET  /api/trips/:id/participants
PATCH /api/participants/:id/unsubscribe
```

### 🛍️ Product

```
POST /api/trips/:id/products
GET  /api/trips/:id/products
PATCH /api/products/:id (update stock/status)
```

### 💸 Order

```
POST /api/orders
PATCH /api/orders/:id/confirm
```

### 🔔 Notification / Webhook

```
POST /api/webhooks/whatsapp
```

→ menerima pesan masuk (`JOIN`, `INFO`, `STOP`)
→ auto-create participant + reply message

---

## 💬 6. WHATSAPP INTEGRATION

### Provider:

* **Meta Cloud API (Official)**
* Endpoint:

  * Send message: `POST https://graph.facebook.com/v19.0/{PHONE_ID}/messages`
  * Webhook: `POST /api/webhooks/whatsapp`

### Message Type:

| Type      | Usage                   | Cost | Example                           |
| --------- | ----------------------- | ---- | --------------------------------- |
| Template  | Broadcast CTA           | Paid | “Klik link untuk join trip jpn25” |
| Free-form | Auto reply (within 24h) | Free | “Terima kasih sudah join”         |

### Join Command Parser:

```
Regex:
  /^JOIN\s+([a-zA-Z0-9_-]{3,10})/i
Actions:
  1. Find trip by slug
  2. Register participant
  3. Send auto reply message
```

### Webhook Payload Example:

```json
{
  "contacts": [{ "wa_id": "628123456789" }],
  "messages": [{ "from": "628123456789", "text": { "body": "JOIN jpn25" } }]
}
```

---

## 🧵 7. WORKER LOGIC (BULLMQ)

### Queues

| Queue           | Fungsi                           |
| --------------- | -------------------------------- |
| `notifications` | Kirim pesan produk ke peserta    |
| `broadcast`     | Kirim CTA template (berbayar)    |
| `proof_notify`  | Kirim bukti transfer ke jastiper |

### Retry Strategy

```
max_attempts = 3
backoff = exponential (2s, 4s, 8s)
```

### Rate Limit

```
per_worker_limit = 10 msg/sec
max_concurrent_jobs = 5
```

### Failure Handling

* Failed job → requeued
* 3x failure → flagged as `failed`
* Error logged ke Sentry

---

## 🌩️ 8. CLOUDFLARE WORKER (Shortlink Resolver) — **[REFAKTORED]**

Logika worker kini harus membedakan antara *shortlink ber-prefiks* (`/t/`, `/o/`, `/u/`) dan *root slug* untuk profil.

### Routes

```
/t/:slug   → redirect to /join?trip=slug
/o/:slug   → redirect to /order?product=slug
/u/:slug   → redirect to /unsubscribe?trip=slug
/:slug     → [BARU] redirect to /profile?user=slug (cth: /tina → /profile?user=tina)
```

### Pseudocode (Refactored):

```js
addEventListener('fetch', event => {
  const { pathname } = new URL(event.request.url)
  
  // Memecah path, cth: "/t/jpn25" -> ["t", "jpn25"] atau "/tina" -> ["tina"]
  const pathParts = pathname.split('/').filter(Boolean)

  // 1. Handle prefiks shortlink (Trip, Order, Unsubscribe)
  if (pathParts.length === 2) {
    const [type, slug] = pathParts
    
    if (type === 't') {
      return Response.redirect(`/join?trip=${slug}`, 302)
    }
    if (type === 'o') {
      return Response.redirect(`/order?product=${slug}`, 302)
    }
    if (type === 'u') {
      // (Asumsi dari TSD lama, jika Anda mendukungnya)
      return Response.redirect(`/unsubscribe?trip=${slug}`, 302)
    }
  }

  // 2. [BARU] Handle root slug untuk Profil
  if (pathParts.length === 1) {
    const slug = pathParts[0]
    
    // Daftar path internal Next.js/API yang harus diabaikan
    const ignoreList = ['api', '_next', 'join', 'order', 'profile', 'dashboard', 'login', 'favicon.ico']
    
    if (!ignoreList.includes(slug)) {
       // Ini adalah profile slug, redirect ke halaman Next.js yang menanganinya
       return Response.redirect(`/profile?user=${slug}`, 302)
    }
  }

  // 3. Biarkan request lain (/, /api/*, /_next/*, /join, dll)
  //    ditangani langsung oleh Cloudflare Pages (Next.js)
  return fetch(event.request)
})
```

---

## 💾 9. STORAGE (R2 / S3)

| File Type        | Path                               | ACL     |
| ---------------- | ---------------------------------- | ------- |
| Product Image    | `/trip/{slug}/products/{uuid}.jpg` | public  |
| Proof of Payment | `/orders/{id}/proof/{uuid}.jpg`    | private |
| Trip Cover       | `/trip/{slug}/cover.jpg`           | public  |

---

## 🔐 10. AUTHENTICATION

* JWT-based (short-lived token, 12h TTL)
* Refresh token via secure cookie
* Auth middleware on `/api/trips`, `/api/products`, `/api/orders`

---

## 📈 11. OBSERVABILITY

| Tool                     | Purpose                      |
| ------------------------ | ---------------------------- |
| **Sentry**               | Error tracking (API, Worker) |
| **Cloudflare Analytics** | Frontend metrics             |
| **Bull Board**           | Queue monitoring             |
| **Prometheus Exporter**  | Latency & throughput         |

---

## 🧮 12. COST ENGINE (Phase 2)

### Logic:

* Track every template sent (paid)
* Store metadata: `template_id`, `price`, `country_code`, `timestamp`
* Aggregate usage per jastiper
* Estimate cost before send (`participants × rate`)
* Dashboard: “Perkiraan Biaya: RpX.XXX”

---

## 🧱 13. DEPLOYMENT ENVIRONMENT

| Layer    | Platform              | Notes                         |
| -------- | --------------------- | ----------------------------- |
| Frontend | Cloudflare Pages      | Build from GitHub main branch |
| API      | Railway.app           | Auto-deploy from `api/` dir   |
| Worker   | Railway.app           | Separated service             |
| Redis    | Railway Redis         | Queue system                  |
| DB       | Railway PostgreSQL    | Primary                       |
| Storage  | Cloudflare R2         | Static assets                 |
| Domain   | Cloudflare DNS        | Root + subdomain              |
| SSL      | Managed by Cloudflare | Auto renew                    |

---

## 🧰 14. LOCAL DEV SETUP

```
# prerequisites
- Node.js 20+
- Docker (optional)
- Railway CLI

# env vars
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
WA_ACCESS_TOKEN=...
WA_PHONE_ID=...
CF_R2_KEY=...
```

---

## 🧪 15. TESTING STRATEGY

| Type             | Tools      | Scope                      |
| ---------------- | ---------- | -------------------------- |
| Unit Test        | Jest       | API routes, message parser |
| Integration Test | Supertest  | Auth, order flow           |
| E2E Test         | Playwright | Join + Order simulation    |
| Load Test        | K6         | Broadcast job throughput   |

---

## 🚨 16. RISK & MITIGATION

| Risiko                      | Dampak         | Solusi                           |
| --------------------------- | -------------- | -------------------------------- |
| WhatsApp API limit exceeded | Notif gagal    | Rate-limit queue                 |
| Cloudflare Worker timeout   | Redirect gagal | Cache metadata                   |
| Duplicate join (same phone) | Double records | Unique constraint + dedupe logic |
| Broadcast berbiaya tinggi   | Margin turun   | Cost estimator & opt-in          |
| Redis full                  | Worker stuck   | Auto prune + TTL job logs        |

---

## 🚀 17. PHASE 2 PLAN (POST-MVP)

* Integrasi multi-trip per jastiper
* AI order summary generator
* Payment gateway (Midtrans / Xendit)
* Broadcast scheduler (cron-like)
* Referral & affiliate system
* API SDK (jastipin-js)

---

## ✅ 18. STATUS IMPLEMENTASI

| Modul               | Status     | Catatan        |
| ------------------- | ---------- | -------------- |
| API Auth + Trip     | ✅ Done     | Base endpoint  |
| WA Webhook Receiver | 🔄 Dev     | Parser + reply |
| Queue Worker        | 🔄 Dev     | Batch sender   |
| Frontend Join Page  | ⏳          | SSG version    |
| Dashboard           | ⏳          | Tailwind UI    |
| Cost Engine         | 🧭 Planned |                |
| Observability       | 🧭 Planned |                |

---

## 🧩 19. SUMMARY

> **Jastipin v1.0** dibangun dengan prinsip *modular, scalable, dan cost-aware*.
> Stack ini memungkinkan:
>
> * deployment ringan di Railway,
> * integrasi WhatsApp resmi,
> * frontend cepat di Cloudflare Pages,
> * serta flow otomatis yang meminimalkan biaya template.

---
