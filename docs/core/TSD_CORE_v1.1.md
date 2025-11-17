# ⚙️ **JASTIPIN.ME — Technical Specification Document (TSD v1.1 - MVP WITH PROTOTYPE)**

> Stack: **Next.js 16 (Cloudflare Pages) + Node.js (Express + Prisma + Railway) + WhatsApp Cloud API + Cloudflare R2 + BullMQ**
> Status: Frontend Prototype Ready, Backend Architecture Defined
> Last Updated: Nov 2025

---

## 🧱 1. SYSTEM OVERVIEW — **[ALIGNED WITH PROTOTYPE v1.1]**

**Jastipin** adalah platform C2C (*Consumer-to-Consumer*) untuk bisnis *jasa titip* yang memanfaatkan:

* **Frontend:** Next.js 16 dashboard & public profile pages (Cloudflare Pages) — **PROTOTYPE READY**
* **Backend:** RESTful API (Express.js), Queue Worker (BullMQ), Database (PostgreSQL) — **IN PROGRESS**
* **Integration Layer:** WhatsApp Official API (Meta Cloud API) — **PLANNED**
* **Infra:** Cloudflare (DNS, Pages, Worker, R2), Railway (App, DB, Redis) — **DEPLOYMENT READY**

### 📦 Sistem Utama:

1. **Frontend App** — Next.js 16 (Cloudflare Pages) ✅ Prototype Ready
2. **Backend API** — Express + Prisma (Railway) 🔄 In Development
3. **Worker Service** — BullMQ + Redis (Railway) 🧭 Planned
4. **Storage Service** — Cloudflare R2 🧭 Planned
5. **Webhook Receiver** — Node.js (Express route) 🧭 Planned
6. **Cloudflare Worker** — shortlink resolver (`/:slug`, `/t/:slug`) 🧭 Planned
7. **WhatsApp API Integration** — Meta Cloud API 🧭 Planned
8. **Billing Engine** — internal service 🧭 Phase 2

---

## 🧭 2. SYSTEM ARCHITECTURE — **[REFAKTORED v1.1]**

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
│ CF Worker (JS) │         │ Next.js 16 Frontend │          │ Express API (Rail) │
│ [SHORTLINK]    │         │ Dashboard + Landing │          │ Auth, CRUD, Logic  │
│ /:slug → /prof │         │ /profile?user=...   │ ◄────────┤ @api routes        │
│ /t/:slug → /jn │         │ /join?trip=...      │          │ JWT Auth + Prisma  │
└───────┬────────┘         └──────────┬──────────┘          └─────────┬──────────┘
        │                              │                              │
        ▼                              ▼                              ▼
 ┌────────────────┐           ┌──────────────────┐           ┌─────────────────┐
 │ Prefetch Data  │           │  Browser State   │           │ Redis Queue     │
 │ Cache Headers  │           │  React 19 Hooks  │           │ BullMQ Worker   │
 └────────────────┘           └──────────────────┘           │ Notifications   │
                                                              └────────┬────────┘
                                    │                                  │
                    ┌───────────────┴──────────────────────────────────┤
                    │                                                  │
                    ▼                                                  ▼
             ┌────────────────┐                              ┌─────────────────┐
             │ WhatsApp User  │ ◄────WA Cloud API────────────┤ Postgres DB     │
             │ (Penitip)      │     Send/Receive             │ users, trips    │
             │ (Jastiper)     │                              │ products, orders│
             └────────────────┘                              └────────┬────────┘
                                                                      │
                                                         ┌────────────┴────────┐
                                                         │                     │
                                                         ▼                     ▼
                                                    ┌──────────┐         ┌──────────┐
                                                    │ CF R2 S3 │         │ Sentry   │
                                                    │ Products │         │ Errors   │
                                                    │ Proofs   │         │ Tracking │
                                                    └──────────┘         └──────────┘
```

---

## 🧩 3. CORE COMPONENTS — **[REFAKTORED v1.1]**

| Komponen | Deskripsi | Teknologi | Status |
| --- | --- | --- | --- |
| **Frontend (Web)** | Dashboard jastiper, profil publik, join page, order page, invoice | Next.js 16 + React 19 + Tailwind v4 + shadcn/ui | ✅ Prototype |
| **API Gateway** | Auth, CRUD ops, webhook receiver, profile handler | Express.js + Prisma ORM + JWT | 🔄 Dev |
| **Database** | user, profile, trip, participant, product, order tables | PostgreSQL (Railway) | 🔄 Dev |
| **Queue/Worker** | Batch WhatsApp notifications, broadcast jobs | BullMQ + Redis | 🧭 Planned |
| **Storage** | Product images, proof of payment | Cloudflare R2 (S3-compatible) | 🧭 Planned |
| **Shortlink Resolver** | Redirect /:slug → /profile, /t/:slug → /join | Cloudflare Worker (JS) | 🧭 Planned |
| **Messaging** | Send/receive WhatsApp messages | Meta Cloud API | 🧭 Planned |
| **Observability** | Error tracking, performance metrics | Sentry + Cloudflare Analytics | 🧭 Planned |

---

## 🧠 4. DATA MODEL — **[REFAKTORED v1.1]**

### Entity Relationship (Prisma Schema)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String    // bcrypt hashed
  slug          String    @unique  // [BARU] e.g., "tina"
  profileName   String?   // [BARU] e.g., "Jastip by Tina"
  profileBio    String?   // [BARU] e.g., "Korea & Jepang specialist"
  avatar        String?   // R2 URL
  coverImage    String?   // R2 URL
  
  // Relations
  trips         Trip[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Trip {
  id            String    @id @default(cuid())
  slug          String    // e.g., "jpn25"
  title         String    // e.g., "Jastip Jepang Mei 2025"
  description   String?
  deadline      DateTime?
  isActive      Boolean   @default(false)  // [BARU] toggle show in profile
  
  jastiperId    String
  jastiper      User      @relation(fields: [jastiperId], references: [id], onDelete: Cascade)
  
  participants  Participant[]
  products      Product[]
  orders        Order[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([jastiperId, slug])
}

model Participant {
  id            String    @id @default(cuid())
  phone         String    // WhatsApp number e.g., "628123456789"
  name          String
  joinedAt      DateTime  @default(now())
  
  tripId        String
  trip          Trip      @relation(fields: [tripId], references: [id], onDelete: Cascade)
  
  orders        Order[]
  
  @@unique([tripId, phone])
}

model Product {
  id            String    @id @default(cuid())
  slug          String    // e.g., "pd12a" for link /o/pd12a
  title         String
  price         Int       // in IDR
  stock         Int
  image         String?   // R2 URL
  description   String?
  status        String    @default("active")  // active, sold_out, discontinued
  
  tripId        String
  trip          Trip      @relation(fields: [tripId], references: [id], onDelete: Cascade)
  
  orders        Order[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([tripId, slug])
}

model Order {
  id            String    @id @default(cuid())
  quantity      Int
  totalPrice    Int       // in IDR
  proofUrl      String?   // R2 URL for payment proof
  status        String    @default("pending")  // pending, confirmed, rejected, shipped
  notes         String?
  
  participantId String
  participant   Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  
  productId     String
  product       Product   @relation(fields: [productId], references: [id])
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Relasi Key Points:
* `user.id` → `trip.jastiperId` (1 user bisa buat banyak trip)
* `trip.id` → `participant.tripId`, `product.tripId` (1 trip punya banyak peserta & produk)
* `participant.id` → `order.participantId` (1 peserta bisa buat banyak order)
* `product.id` → `order.productId` (1 produk bisa punya banyak order)
* **Unique constraints**: `user.slug`, `user.email`, `(trip.jastiperId, trip.slug)`, `(trip.id, product.slug)`, `(trip.id, participant.phone)`

---

## 🧾 5. API ENDPOINTS (v1.0) — **[DETAILED SPECS v1.1]**

### 🔐 Auth

```
POST /api/auth/register
  Body: { email, password, fullName }
  Response: { user: { id, email, slug }, token }
  
POST /api/auth/login
  Body: { email, password }
  Response: { user: { id, email, slug }, token, refreshToken (in httpOnly cookie) }
  
POST /api/auth/refresh
  Body: {}
  Response: { token }
  
GET /api/auth/logout
  Response: { message: "Logged out" }
```

### 👤 Profile (Publik & Privat) — **[NEW]**

```
GET /api/profile/:slug
  Params: slug (e.g., "tina")
  Response: { 
    user: { name, bio, avatar, rating },
    trips: [{ id, slug, title, isActive, products: [...] }]
  }
  Auth: Public
  Caching: 5 minutes (Cloudflare)
  
GET /api/profile/me
  Response: { 
    user: { id, email, slug, profileName, profileBio, avatar, coverImage },
    trips: [...]
  }
  Auth: Private (JWT required)
  
PATCH /api/profile/me
  Body: { profileName?, profileBio?, avatar?, coverImage? }
  Response: { user: { ... } }
  Auth: Private
```

### 🧳 Trip Management

```
POST /api/trips
  Body: { title, description, slug, deadline, isActive }
  Response: { trip: { id, slug, title, ... } }
  Auth: Private
  
GET /api/trips/:id
  Response: { trip: { id, slug, title, participants: [...], products: [...] } }
  Auth: Private
  
GET /api/trips?filter=active
  Response: { trips: [...] }
  Auth: Private
  
PATCH /api/trips/:id
  Body: { title?, description?, isActive?, deadline? }
  Response: { trip: { ... } }
  Auth: Private (owner only)
  
DELETE /api/trips/:id
  Response: { message: "Trip deleted" }
  Auth: Private (owner only)
```

### 👥 Participant Management

```
POST /api/trips/:tripId/join
  Body: { phone, name }
  Response: { participant: { id, phone, name, joinedAt } }
  Auth: Public (via WhatsApp webhook) OR Private
  Validation: Unique constraint (tripId, phone)
  
GET /api/trips/:tripId/participants
  Response: { participants: [{ id, phone, name, joinedAt, orders: [...] }] }
  Auth: Private (trip owner only)
  
PATCH /api/participants/:id/unsubscribe
  Response: { message: "Unsubscribed" }
  Auth: Private OR Public (token-based link)
```

### 🛍️ Product Management

```
POST /api/trips/:tripId/products
  Body: { slug, title, price, stock, image (multipart), description }
  Response: { product: { id, slug, title, price, stock, image, ... } }
  Auth: Private (trip owner only)
  Storage: Upload to Cloudflare R2
  
GET /api/trips/:tripId/products
  Response: { products: [...] }
  Auth: Public
  Caching: 1 minute
  
PATCH /api/products/:id
  Body: { title?, price?, stock?, status? }
  Response: { product: { ... } }
  Auth: Private (trip owner only)
  
DELETE /api/products/:id
  Response: { message: "Product deleted" }
  Auth: Private (trip owner only)
```

### 💸 Order Management

```
POST /api/orders
  Body: { productId, participantId, quantity, notes }
  Response: { order: { id, quantity, totalPrice, status, ... } }
  Auth: Private OR Public (via form)
  Validation: Check stock > 0
  
GET /api/orders/:tripId
  Response: { orders: [{ id, product, participant, quantity, status, ... }] }
  Auth: Private (trip owner only)
  
PATCH /api/orders/:id/confirm
  Body: { proofUrl (optional) }
  Response: { order: { status: "confirmed", ... } }
  Auth: Private (trip owner only)
  Queue: Trigger notification job
  
PATCH /api/orders/:id/reject
  Body: { reason? }
  Response: { order: { status: "rejected", ... } }
  Auth: Private (trip owner only)
  Queue: Trigger rejection notification
```

### 🔔 Webhook

```
POST /api/webhooks/whatsapp
  Body: { entry: [{ changes: [{ value: { messages: [...] } }] }] }
  Response: { message: "OK" }
  Auth: Verify token (X-Hub-Signature)
  Logic:
    1. Parse message (JOIN, INFO, STOP commands)
    2. Find trip by slug
    3. Create participant if not exists
    4. Send auto-reply via WhatsApp API
    5. Trigger notification job if product added
  Error handling: Log to Sentry, return 200 OK (webhook must not retry)
```

---

## 💬 6. WHATSAPP INTEGRATION — **[DETAILED FLOW v1.1]**

### Provider Setup

* **Provider**: Meta Cloud API (Official)
* **Endpoint for sending**: `POST https://graph.facebook.com/v19.0/{PHONE_ID}/messages`
* **Webhook endpoint**: `POST https://jastipin.me/api/webhooks/whatsapp`
* **Webhook verify**: Token-based (X-Hub-Signature verification)

### Message Types & Cost

| Type      | Usage                   | Cost   | Example |
| --------- | ----------------------- | ------ | --- |
| Template  | Broadcast CTA           | Paid   | "Klik link untuk join trip jpn25" |
| Free-form | Auto reply (within 24h) | Free   | "Terima kasih sudah join jpn25! Silakan lihat produk di..." |
| HSM       | Pre-approved message    | Paid   | Order confirmation |

### Join Flow Implementation

```
1. User clicks "Ikut via WhatsApp" on /join?trip=jpn25
2. Opens WhatsApp with prefilled message:
   "JOIN jpn25 | Nama: [Name from form]"
3. User sends message manually
4. Webhook receiver gets callback:
   {
     "object": "whatsapp_business_account",
     "entry": [{
       "changes": [{
         "value": {
           "contacts": [{ "wa_id": "628123456789" }],
           "messages": [{
             "from": "628123456789",
             "text": { "body": "JOIN jpn25 | Nama: Siti" },
             "id": "wamid.xxx"
           }]
         }
       }]
     }]
   }
5. Backend parses: trip_slug = "jpn25", name = "Siti"
6. Query trip by slug, create participant
7. Send auto-reply: "Terima kasih Siti! Kamu sekarang tergabung di trip jpn25..."
8. Queue job to send product notifications to new participant
```

### Message Parser (Regex)

```javascript
// JOIN command
const joinRegex = /^JOIN\s+([a-zA-Z0-9_-]{3,10})\s*\|\s*Nama:\s*(.+)$/i
// INFO command
const infoRegex = /^INFO\s+([a-zA-Z0-9_-]{3,10})$/i
// STOP command
const stopRegex = /^STOP\s+([a-zA-Z0-9_-]{3,10})$/i

// Example: "JOIN jpn25 | Nama: Siti"
const [fullMatch, tripSlug, name] = message.match(joinRegex)
```

### Error Handling & Retry

* **Webhook timeout**: Return 200 OK immediately, process async via queue
* **Message send failure**: Retry queue logic (3x with exponential backoff)
* **Invalid message**: Log to Sentry, don't reply
* **Duplicate join**: Check unique constraint, return 200 OK (webhook should be idempotent)

---

## 🧵 7. QUEUE WORKER (BULLMQ) — **[ARCHITECTURE v1.1]**

### Queue Types

| Queue Name | Purpose | Trigger | Priority |
| --- | --- | --- | --- |
| `notifications` | Send product updates to participants | Product created | Normal |
| `broadcast` | Send broadcast messages (paid) | Jastiper initiates | Normal |
| `proof_notify` | Notify jastiper of payment proof upload | Order proof updated | High |
| `confirmation` | Send order confirmation to participant | Order confirmed | High |

### Job Retry Strategy

```javascript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000  // 2s, 4s, 8s
  },
  removeOnComplete: true,
  removeOnFail: false  // Keep failed jobs for debugging
}
```

### Rate Limiting

```javascript
const limiter = {
  max: 10,        // 10 messages per 1 second
  duration: 1000
}
```

### Example: Notification Job

```javascript
// Job definition
export async function sendNotification(job) {
  const { productId, tripId } = job.data
  
  const product = await db.product.findUnique({ where: { id: productId } })
  const trip = await db.trip.findUnique({ where: { id: tripId } })
  const participants = await db.participant.findMany({ where: { tripId } })
  
  for (const participant of participants) {
    try {
      await whatsappAPI.send({
        to: participant.phone,
        body: `Produk baru: ${product.title}\nHarga: Rp${product.price}\nKlik: jastipin.me/o/${product.slug}`
      })
    } catch (error) {
      job.log(`Failed to send to ${participant.phone}`)
      throw error  // Retry
    }
  }
}

// Trigger from product creation
POST /api/trips/:tripId/products
  → Create product
  → await notificationQueue.add('sendNotification', { productId, tripId })
```

### Bull Board (Monitoring)

```javascript
import { createBullBoard } from '@bull-board/express'
import { ExpressAdapter } from '@bull-board/express'
import { BullAdapter } from '@bull-board/api/bullAdapter'

const serverAdapter = new ExpressAdapter()
createBullBoard({
  queues: [
    new BullAdapter(notificationQueue),
    new BullAdapter(broadcastQueue)
  ],
  serverAdapter
})

app.use('/admin/queues', serverAdapter.getRouter())
```

---

## 🌩️ 8. CLOUDFLARE WORKER (Shortlink Resolver) — **[IMPLEMENTATION v1.1]**

### Deployed Worker Code

```javascript
// wrangler.toml
name = "jastipin-shortlink-resolver"
main = "src/index.ts"
compatibility_date = "2025-11-01"

// src/index.ts
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const { pathname } = url

    // Split path: "/t/jpn25" → ["t", "jpn25"] or "/tina" → ["tina"]
    const pathParts = pathname.split('/').filter(Boolean)

    // Handle prefixed shortlinks (/t/, /o/, /u/)
    if (pathParts.length === 2) {
      const [type, slug] = pathParts

      if (type === 't') {
        return Response.redirect(`${url.origin}/join?trip=${slug}`, 302)
      }
      if (type === 'o') {
        return Response.redirect(`${url.origin}/order?product=${slug}`, 302)
      }
      if (type === 'u') {
        return Response.redirect(`${url.origin}/unsubscribe?trip=${slug}`, 302)
      }
    }

    // Handle root profile slug (/:slug)
    if (pathParts.length === 1) {
      const slug = pathParts[0]

      // Ignore reserved paths (Next.js internal routes)
      const ignoreList = ['api', '_next', 'join', 'order', 'profile', 'dashboard', 
                         'auth', 'login', 'register', 'invite', 'favicon.ico', 
                         'robots.txt', 'sitemap.xml']

      if (!ignoreList.includes(slug.toLowerCase())) {
        // This is a profile slug, redirect to Next.js profile page
        return Response.redirect(`${url.origin}/profile?user=${encodeURIComponent(slug)}`, 302)
      }
    }

    // Let Next.js handle everything else
    return fetch(request)
  }
}
```

### Deployment

```bash
npm install -g wrangler
wrangler deploy
# Assigns to *.jastipin.me workers
```

---

## 💾 9. STORAGE (CLOUDFLARE R2) — **[CONFIGURATION v1.1]**

### R2 Bucket Setup

| File Type        | Folder Path                   | ACL     | TTL | Notes |
| --- | --- | --- | --- | --- |
| Product Image    | `/products/{tripSlug}/{uuid}.jpg` | public  | 1yr | Optimize with Sharp |
| Payment Proof    | `/orders/{orderId}/{uuid}.jpg`    | private | 90d | Archive after confirmed |
| Cover Image      | `/covers/{userSlug}.jpg`          | public  | 1yr | Max 5MB |
| Avatar           | `/avatars/{userId}.jpg`           | public  | 1yr | Max 2MB |

### Image Upload Flow (Backend)

```javascript
import sharp from 'sharp'
import { s3Client } from '@/lib/r2'

export async function uploadProductImage(file: Express.Multer.File, tripSlug: string) {
  // Optimize image
  const buffer = await sharp(file.buffer)
    .resize(1200, 1200, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer()

  const key = `products/${tripSlug}/${uuid()}.webp`
  
  await s3Client.putObject({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/webp'
  })

  return `${process.env.R2_PUBLIC_URL}/${key}`
}
```

---

## 🔐 10. AUTHENTICATION — **[JWT STRATEGY v1.1]**

### Token Strategy

```javascript
// JWT Payload
{
  sub: userId,
  slug: userSlug,
  email: userEmail,
  iat: timestamp,
  exp: timestamp + 12h
}

// Refresh Token (httpOnly cookie)
{
  sub: userId,
  type: 'refresh',
  iat: timestamp,
  exp: timestamp + 7d
}
```

### Middleware

```javascript
export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'Missing token' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Protected route example
app.get('/api/trips', authMiddleware, (req, res) => {
  // req.user available here
})
```

### Password Hashing

```javascript
import bcrypt from 'bcrypt'

// Register
const hashedPassword = await bcrypt.hash(password, 10)
await db.user.create({ email, password: hashedPassword })

// Login
const user = await db.user.findUnique({ where: { email } })
const isValid = await bcrypt.compare(password, user.password)
```

---

## 📈 11. OBSERVABILITY — **[MONITORING v1.1]**

### Error Tracking (Sentry)

```javascript
import * as Sentry from "@sentry/node"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
})

// Express integration
app.use(Sentry.Handlers.requestHandler())
app.use(Sentry.Handlers.errorHandler())

// Manual capture
try {
  // logic
} catch (error) {
  Sentry.captureException(error)
}
```

### Metrics & Logs

| Metric | Tool | Example |
| --- | --- | --- |
| API latency | Cloudflare Analytics | p95 latency: 200ms |
| Queue jobs | Bull Board | 95% success rate |
| WhatsApp delivery | Sentry logs | Failed sends per hour |
| Database queries | Prisma logging | Query count/duration |

---

## 🧮 12. COST TRACKING (PHASE 2) — **[DESIGN v1.1]**

### WhatsApp API Pricing Estimation

```javascript
export async function estimateBroadcastCost(tripId: string, templateId: string) {
  const participants = await db.participant.count({ where: { tripId } })
  const ratePerMessage = 0.0055  // USD, for Indonesia
  const estimatedCostUSD = participants * ratePerMessage
  const estimatedCostIDR = estimatedCostUSD * 15500  // Exchange rate

  return {
    participantCount: participants,
    costPerMessage: `Rp${Math.round(ratePerMessage * 15500)}`,
    totalCostIDR: `Rp${Math.round(estimatedCostIDR)}`,
    recommendation: estimatedCostIDR > 50000 ? 'High cost - consider opt-in' : 'OK'
  }
}

// Dashboard endpoint
GET /api/trips/:tripId/broadcast/estimate?template=template_id
  Response: { participantCount, costPerMessage, totalCostIDR, recommendation }
```

---

## 🧱 13. DEPLOYMENT ENVIRONMENT — **[CONFIGURATION v1.1]**

### Layer Deployments

| Layer    | Platform           | Config | Auto-deploy |
| --- | --- | --- | --- |
| Frontend | Cloudflare Pages   | wrangler.toml | GitHub (main branch) |
| API      | Railway.app        | railway.json | GitHub (api/ dir) |
| Worker   | Railway.app        | railway.json | GitHub (worker/ dir) |
| Redis    | Railway Redis      | Managed | Auto |
| DB       | Railway PostgreSQL | Managed | Manual (migration) |
| Storage  | Cloudflare R2      | wrangler.toml | N/A |
| Domain   | Cloudflare DNS     | Managed | N/A |

### Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.jastipin.me
NEXT_PUBLIC_R2_URL=https://assets.jastipin.me

# Backend (.env)
DATABASE_URL=postgresql://user:pass@railway:5432/jastipin
REDIS_URL=redis://:pass@railway:6379
JWT_SECRET=<random_secret>
WA_PHONE_ID=<meta_phone_id>
WA_ACCESS_TOKEN=<meta_access_token>
WA_VERIFY_TOKEN=<custom_verify_token>
R2_BUCKET=jastipin-assets
R2_PUBLIC_URL=https://assets.jastipin.me
SENTRY_DSN=<sentry_dsn>
```

---

## 🧰 14. LOCAL DEV SETUP — **[QUICK START v1.1]**

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Redis (Docker: `docker run redis`)
- Wrangler CLI

### Installation

```bash
# Clone repo
git clone https://github.com/jastipin/jastipin.git
cd jastipin

# Setup frontend
cd frontend
npm install
npm run dev  # localhost:3000

# Setup backend (new terminal)
cd ../backend
npm install
cp .env.example .env
npx prisma migrate dev  # Setup DB
npm run dev  # localhost:4000

# Setup worker (new terminal)
cd ../worker
npm install
wrangler dev

# Test API
curl http://localhost:4000/api/health
```

---

## 🧪 15. TESTING STRATEGY — **[APPROACH v1.1]**

| Type | Tool | Scope | Coverage Target |
| --- | --- | --- | --- |
| Unit | Jest | API routes, utils, parsers | 80% |
| Integration | Supertest + Jest | Auth flow, CRUD ops | 70% |
| E2E | Playwright | Join flow, order simulation | Core flows |
| Load | k6 | Broadcast queue, webhook | 100 msg/sec |

### Test Example

```javascript
// __tests__/api/trips.test.ts
describe('GET /api/trips/:id', () => {
  it('should return trip with products', async () => {
    const trip = await db.trip.create({ /* data */ })
    const res = await request(app).get(`/api/trips/${trip.id}`)
    expect(res.status).toBe(200)
    expect(res.body.products).toBeDefined()
  })
})
```

---

## 🚨 16. RISK & MITIGATION — **[ASSESSMENT v1.1]**

| Risk | Impact | Mitigation |
| --- | --- | --- |
| WhatsApp API rate limit | Notifications fail | Queue with rate limiter (10 msg/sec) |
| Worker timeout | Profile links fail | Cache metadata in KV, fallback to origin |
| Duplicate joins | Data inconsistency | Unique constraint (tripId, phone) + dedup |
| R2 upload failure | Lost images | Retry job + S3 fallback |
| DB connection pool exhausted | API timeouts | Connection pooling (Prisma) + monitoring |
| JWT secret exposure | Security breach | Use Cloudflare Secret Management |

---

## 🚀 17. PHASE 2 PLAN (POST-MVP) — **[ROADMAP v1.1]**

* Multi-language support (ID, EN)
* Payment gateway (Midtrans / Xendit)
* AI order summary generator
* Broadcast scheduler (cron-like)
* Referral & affiliate system
* Analytics dashboard with charts
* PWA capabilities
* API SDK (jastipin-js)

---

## ✅ 18. STATUS IMPLEMENTASI — **[CURRENT v1.1]**

| Modul                   | Status   | Catatan | Owner |
| --- | --- | --- | --- |
| **Frontend Prototype**   | ✅ Done   | Pages, components ready | Frontend Team |
| **API Auth + Trips**     | 🔄 Dev   | Prisma schema done | Backend Team |
| **WA Webhook Receiver**  | 🧭 Planned | Parser ready, deploy pending | Backend Team |
| **Queue Worker**         | 🧭 Planned | BullMQ setup next | Backend Team |
| **Cloudflare Worker**    | 🧭 Planned | Shortlink resolver | DevOps Team |
| **Frontend Integration** | 🔄 Dev   | API calls, auth flow | Frontend Team |
| **Testing Suite**        | 🧭 Planned | Jest + Playwright | QA Team |
| **Deployment**           | 🧭 Planned | Railway + CF setup | DevOps Team |

---

## 🧩 19. SUMMARY — **[ARCHITECTURE v1.1]**

> **Jastipin v1.0** dibangun dengan prinsip *modular, scalable, dan cost-aware*.
>
> **Stack Highlights**:
> * **Frontend**: Next.js 16 on Cloudflare Pages (edge deployment)
> * **Backend**: Express + Prisma on Railway (auto-scaling)
> * **Messaging**: Meta Cloud API with webhook integration
> * **Queue**: BullMQ + Redis for async notifications
> * **Storage**: Cloudflare R2 for images (S3-compatible)
> * **Observability**: Sentry for error tracking
>
> Stack ini memungkinkan:
> * Deployment ringan & cepat
> * Integrasi WhatsApp yang reliable
> * Frontend yang super cepat via edge
> * Queue system yang cost-efficient
> * Monitoring end-to-end

---

## 📚 APPENDIX: Quick Reference

### Key Files & Directories

```
jastipin/
├── frontend/                 # Next.js 16 app
│   ├── app/                 # Pages & layouts
│   ├── components/          # React components
│   ├── styles/              # Tailwind config
│   └── package.json         # Next.js deps
│
├── backend/                 # Express API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth, error handling
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helpers
│   ├── prisma/
│   │   └── schema.prisma    # Data model
│   └── package.json         # Express deps
│
├── worker/                  # Cloudflare Worker
│   ├── src/index.ts         # Shortlink resolver
│   └── wrangler.toml        # CF config
│
└── docs/
    ├── PRD_MVP_v4.2.md      # This document (Product)
    └── TSD_CORE_v1.1.md     # This document (Technical)
```

---
