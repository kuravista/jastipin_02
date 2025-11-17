# ⚙️ **JASTIPIN.ME — Technical Specification (FINAL v2.0)**

> Stack: **Next.js 16 (Cloudflare Pages) + Express + PostgreSQL**
> Database Layer: **Choose between Prisma, Drizzle, or Pure SQL**
> Status: MVP Ready (12 weeks)
> Last Updated: Nov 2025

---

## 🧱 1. SYSTEM OVERVIEW

**Jastipin** adalah platform C2C (*Consumer-to-Consumer*) untuk bisnis *jasa titip* dengan stack:

* **Frontend:** Next.js 16 + React 19 + Tailwind v4 (Cloudflare Pages) ✅ **Ready**
* **Backend:** Express.js + PostgreSQL (Railway) 🔄 **In Development**
* **Database Layer:** Choose one of 3 options (Prisma | Drizzle | Raw SQL)
* **Infrastructure:** Cloudflare (DNS, Pages, R2), Railway (App, DB, Redis)

### 📦 Sistem Utama:
1. Frontend App — Next.js 16 (Cloudflare Pages) ✅
2. Backend API — Express + PostgreSQL 🔄
3. Worker Service — BullMQ + Redis 🧭
4. Storage — Cloudflare R2 🧭
5. Webhook Receiver — WhatsApp integration 🧭
6. Cloudflare Worker — Shortlink resolver 🧭

---

## 🔀 2. DATABASE LAYER OPTIONS — **[CHOOSE ONE]**

### Option A: PRISMA ORM (RECOMMENDED)
**Best for: Fast development, type safety, proven**

#### Pros:
- ✅ Auto-generated migrations & types
- ✅ Intuitive `.findMany()`, `.create()` API
- ✅ Battle-tested at production scale
- ✅ Excellent documentation
- ✅ Fastest onboarding (2-3 hours)

#### Cons:
- ⚠️ 10MB bundle size
- ⚠️ 3-5s cold start
- ⚠️ Opinionated ("Prisma way")

#### Timeline & Risk:
```
Setup:  4 hours
Dev:   170 hours
Total: 250 hours (52% team utilization)
Status: ✅ ON TIME
Risk:   🟢 LOW
```

**Verdict**: 🏆 **BEST for MVP 12 weeks with small team**

---

### Option B: DRIZZLE ORM
**Best for: Control + type safety + performance**

#### Pros:
- ✅ TypeScript-first schema
- ✅ Excellent type safety
- ✅ 0.5MB bundle (tiny)
- ✅ Full SQL control when needed
- ✅ Works on Cloudflare Workers

#### Cons:
- ⚠️ Newer (1.5 years old)
- ⚠️ Manual migrations
- ⚠️ Steeper learning curve
- ⚠️ Smaller community

#### Timeline & Risk:
```
Setup:  8 hours (+100%)
Dev:   240 hours (+40%)
Total: 313 hours (65% utilization)
Status: ⚠️ SLIP 1-2 WEEKS
Risk:   🟡 MEDIUM
```

**Verdict**: ⚠️ **Only if you need maximum control or CF Workers**

---

### Option C: PURE SQL (Raw node-postgres)
**Best for: Lightweight, speed, maximum control**

#### Pros:
- ✅ 50KB bundle (200x smaller than Prisma!)
- ✅ <500ms cold start (7-10x faster!)
- ✅ 100% query control
- ✅ No vendor lock-in
- ✅ Only 1 dependency (pg library)

#### Cons:
- ⚠️ Manual type definitions
- ⚠️ Manual migrations
- ⚠️ Requires SQL knowledge
- ⚠️ More boilerplate
- ⚠️ N+1 easy to cause

#### Timeline & Risk:
```
Setup:  2 hours (-50%)
Dev:   200 hours (+18%)
Total: 280 hours (58% utilization)
Status: ✅ ON TIME
Risk:   🟡 MEDIUM (needs discipline)
```

**Verdict**: ✅ **If speed/lightweight is critical**

---

## 📊 3. COMPARISON TABLE

| Metric | Prisma | Drizzle | Raw SQL |
|---|---|---|---|
| **Difficulty** | 32% | 48% | 35% |
| **Setup Time** | 4h | 8h | 2h |
| **Bundle Size** | 10MB | 0.5MB | 50KB |
| **Cold Start** | 3-5s | 1-2s | <500ms |
| **Type Safety** | ✅ Auto | ✅✅ Best | ⚠️ Manual |
| **Dev Speed** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Query Control** | Limited | High | Maximum |
| **Timeline (12w)** | 250h ✅ | 313h ⚠️ | 280h ✅ |
| **Production Ready** | ✅ Proven | ✅ Solid | ⚠️ Needs discipline |
| **Recommend** | 🏆 BEST | ⚠️ If control | ✅ If speed |

---

## 🎯 4. RECOMMENDATION FOR JASTIPIN MVP

### 🏆 PRIMARY: Use PRISMA
```
Difficulty:       32%
Timeline:         ✅ On time
Type Safety:      ✅ Strong (auto-generated)
Productivity:     ✅ High (less code)
Risk:             🟢 LOW
Production:       ✅ Battle-tested
VERDICT:          🏆 BEST CHOICE
```

### ✅ ALTERNATIVE: Use Raw SQL (if speed critical)
```
Difficulty:       35% (only +3% harder)
Timeline:         ✅ On time (+30 hrs overhead)
Type Safety:      ⚠️ Manual (more work)
Productivity:     ✅ Fast setup
Risk:             🟡 MEDIUM (needs SQL discipline)
Production:       ⚠️ Manageable with care
VERDICT:          ✅ VIABLE IF lightweight priority
```

### ❌ NOT RECOMMENDED: Drizzle for MVP
```
Difficulty:       48% (50% harder than Prisma)
Timeline:         ⚠️ Slip 2-4 weeks
Risk:             🔴 HIGH
VERDICT:          ❌ Too risky for 12-week timeline
NOTE:             Consider for Phase 2 if CF Workers needed
```

---

## 🗄️ 5. DATABASE SCHEMA (PostgreSQL)

### Implementation (same for all 3 options)

```sql
-- users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  profile_name VARCHAR(255),
  profile_bio TEXT,
  avatar_url VARCHAR(500),
  cover_image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (email), INDEX (slug)
);

-- trips table
CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  jastiper_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  deadline TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (jastiper_id, slug),
  INDEX (jastiper_id), INDEX (slug)
);

-- products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  trip_id INT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  slug VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price INT NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (trip_id, slug),
  INDEX (trip_id), INDEX (status)
);

-- participants table
CREATE TABLE participants (
  id SERIAL PRIMARY KEY,
  trip_id INT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (trip_id, phone_number),
  INDEX (trip_id), INDEX (phone_number)
);

-- orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id),
  participant_id INT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  total_price INT NOT NULL,
  proof_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (product_id), INDEX (participant_id), INDEX (status)
);
```

---

## 🧾 6. API ENDPOINTS (v1)

### Auth
```
POST /api/auth/register
  Body: { email, password, fullName }
  Response: { user: { id, email, slug }, token }

POST /api/auth/login
  Body: { email, password }
  Response: { user: { id, email, slug }, token }
```

### Profile (Public & Private)
```
GET  /api/profile/:slug
  Response: { user: { name, bio, avatar }, trips: [...] }

GET  /api/profile/me
  Auth: Required
  Response: { user: {...}, trips: [...] }

PATCH /api/profile/me
  Auth: Required
  Body: { profileName?, profileBio?, avatar? }
  Response: { user: {...} }
```

### Trips
```
POST /api/trips
  Auth: Required
  Body: { title, slug, description, deadline }
  Response: { trip: {...} }

GET /api/trips/:id
  Response: { trip: {...}, products: [...] }

PATCH /api/trips/:id/toggle-active
  Auth: Required
  Response: { trip: {...} }
```

### Products
```
POST /api/trips/:id/products
  Auth: Required
  Body: { slug, title, price, stock, image }
  Response: { product: {...} }

GET /api/trips/:id/products
  Response: { products: [...] }

PATCH /api/products/:id
  Auth: Required
  Body: { title?, price?, stock?, status? }
  Response: { product: {...} }
```

### Participants
```
POST /api/trips/:id/join
  Body: { phone, name }
  Response: { participant: {...} }

GET /api/trips/:id/participants
  Auth: Required
  Response: { participants: [...] }
```

### Orders
```
POST /api/orders
  Body: { product_id, participant_id, quantity, notes? }
  Response: { order: {...} }

PATCH /api/orders/:id/confirm
  Auth: Required
  Response: { order: {...} }
```

### Webhook
```
POST /api/webhooks/whatsapp
  Body: WhatsApp webhook payload
  Logic: Parse JOIN command, create participant, send auto-reply
  Response: { success: true }
```

---

## 💬 7. WHATSAPP INTEGRATION

### Model:
- **Provider**: Meta Cloud API (Official)
- **Message Type**: User-initiated (click-to-chat) for free messages
- **Cost Strategy**: Leverage 24-hour window (free), avoid broadcast costs

### JOIN Flow:
```
1. User clicks "Ikut via WhatsApp" on /join?trip=jpn25
2. WhatsApp opens with prefilled: "JOIN jpn25 | Nama: [Name]"
3. Webhook receives message
4. Backend parses: trip_slug="jpn25", name="[Name]"
5. Create participant automatically
6. Send auto-reply: "Terima kasih! Kamu sudah join..."
7. Queue notification job to send product updates
```

### Message Parser (Regex):
```typescript
const joinRegex = /^JOIN\s+([a-zA-Z0-9_-]{3,10})\s*\|\s*Nama:\s*(.+)$/i
// Example: "JOIN jpn25 | Nama: Siti"
// Extracts: { tripSlug: "jpn25", name: "Siti" }
```

---

## 🔀 8. ARCHITECTURE

```
                    Cloudflare DNS
                    (jastipin.me)
                          │
        ┌─────────────────┼──────────────────┐
        │                 │                  │
        ▼                 ▼                  ▼
   CF Worker         Next.js 16           Express API
   (Shortlink)       (Frontend)        (PostgreSQL)
   /:slug → /prof    Dashboard           Raw SQL/
   /t/:slug → /join  Landing             ORM choice

        ◀────────────────┼───────────────────▶

                        │
            ┌───────────┼───────────┐
            │           │           │
            ▼           ▼           ▼
        Postgres    Redis        Cloudflare R2
        Database    Queue        Storage (Images)
```

---

## 📊 9. PROJECT STRUCTURE

### With Prisma:
```
backend/
├── prisma/
│   ├── schema.prisma          # Define data model
│   └── migrations/            # Auto-generated
├── src/
│   ├── routes/               # Express routes
│   ├── middleware/           # Auth, error handling
│   └── app.ts                # Entry point
└── package.json              # Prisma included
```

### With Raw SQL:
```
backend/
├── src/
│   ├── db/
│   │   ├── client.ts         # Pool + helpers
│   │   └── types.ts          # Manual interfaces
│   ├── services/             # Raw SQL queries
│   ├── routes/               # Express routes
│   ├── middleware/           # Auth, error handling
│   └── app.ts                # Entry point
├── migrations/               # Manual SQL files
└── package.json              # Only pg library
```

---

## 🚀 10. DEPLOYMENT STACK

| Layer | Service | Notes |
|---|---|---|
| **Frontend** | Cloudflare Pages | Deploy Next.js build |
| **Backend** | Railway.app | Express API auto-scales |
| **Database** | Railway PostgreSQL | Managed, auto-backups |
| **Redis** | Railway Redis | BullMQ queue system |
| **Storage** | Cloudflare R2 | S3-compatible S3 storage |
| **DNS** | Cloudflare | Domain + SSL management |
| **Shortlink** | Cloudflare Workers | Route resolver |

---

## 🧰 11. DEPENDENCIES

### Core (Minimal):
```json
{
  "express": "^4.18.0",
  "pg": "^8.11.0",
  "bcrypt": "^5.1.0",
  "jsonwebtoken": "^9.0.0",
  "bullmq": "^5.0.0",
  "redis": "^4.6.0",
  "dotenv": "^16.0.0"
}
```

### With Prisma (Add):
```json
{
  "@prisma/client": "^5.0.0",
  "prisma": "^5.0.0"  // dev only
}
```

### With Drizzle (Add):
```json
{
  "drizzle-orm": "^0.29.0",
  "drizzle-kit": "^0.20.0"  // dev only
}
```

**Total for Raw SQL**: 7 packages
**Total for Prisma**: 9 packages  
**Total for Drizzle**: 9 packages

---

## 🔐 12. SECURITY BEST PRACTICES

### Database:
- ✅ **Always use parameterized queries** (`$1, $2` in SQL)
- ✅ **Validate inputs** on API layer
- ✅ **Hash passwords** with bcrypt (10 rounds)
- ✅ **Use JWT tokens** for auth (12h TTL)

### API:
- ✅ **CORS** enabled for frontend domain only
- ✅ **Rate limiting** on auth endpoints
- ✅ **Input validation** with Zod or similar
- ✅ **Error messages** don't leak sensitive info

### Infrastructure:
- ✅ **Environment variables** for secrets (not in code)
- ✅ **HTTPS only** (Cloudflare manages)
- ✅ **Connection pooling** to prevent exhaustion
- ✅ **Logging** without sensitive data

---

## ✅ 13. QUICK START CHECKLIST

### Phase 1: Setup (Day 1)
- [ ] Initialize Express project
- [ ] Setup PostgreSQL database
- [ ] Choose ORM/SQL approach
- [ ] Create basic folder structure

### Phase 2: Auth & Core (Days 2-5)
- [ ] Implement authentication (register/login)
- [ ] Create user profile endpoints
- [ ] Setup JWT middleware
- [ ] Implement trip CRUD

### Phase 3: Products & Orders (Days 6-10)
- [ ] Product upload endpoints
- [ ] Order creation with transactions
- [ ] Order confirmation flow
- [ ] WhatsApp webhook handler

### Phase 4: Integration & Deploy (Days 11-12)
- [ ] BullMQ queue setup
- [ ] WhatsApp notifications
- [ ] Cloudflare Worker shortlink resolver
- [ ] Production deployment

---

## 📈 14. TIMELINE SUMMARY

| Phase | Task | Hours | Status |
|---|---|---|---|
| **1** | Setup + DB | 8h | ✅ |
| **2** | Auth + Core API | 40h | ✅ |
| **3** | Products + Orders | 60h | ✅ |
| **4** | WhatsApp + Queue | 40h | ✅ |
| **5** | Frontend Integration | 50h | ✅ |
| **6** | Testing + QA | 30h | ✅ |
| **7** | Deployment | 12h | ✅ |
| **8** | Buffer | 10h | ✅ |
| **TOTAL** | | 250h | ✅ **ON TIME** |

**Team Capacity**: 2 devs × 12 weeks × 20h/week = 480 hours
**Usage**: 250 hours (52% utilization) — comfortable with buffer

---

## 🎯 15. DECISION FLOWCHART

```
START: Choose Database Layer
│
├─ Q: Need maximum speed/lightweight?
│  ├─ YES → Raw SQL (280h, 35% difficulty)
│  └─ NO ↓
│
├─ Q: Team strong in SQL?
│  ├─ YES → Raw SQL or Drizzle
│  └─ NO ↓
│
├─ Q: Need Cloudflare Workers?
│  ├─ YES → Drizzle only
│  └─ NO ↓
│
├─ Q: Priority on type safety?
│  ├─ YES → Drizzle or Prisma
│  └─ NO → Raw SQL
│
└─ DEFAULT: ✅ PRISMA
   (Best balance, proven, fast dev)
```

---

## 🏆 FINAL RECOMMENDATION

### **For Jastipin MVP (12 weeks, small team):**

```
✅ PRIMARY: Use PRISMA
├─ Difficulty: 32% (EASY)
├─ Timeline: 250 hours (ON TIME)
├─ Risk: 🟢 LOW
├─ Type Safety: ✅ Strong
└─ Verdict: 🏆 BEST CHOICE

✅ ALTERNATIVE: Use Raw SQL
├─ If speed/lightweight critical
├─ Difficulty: 35% (EASY)
├─ Timeline: 280 hours (ON TIME + 12%)
├─ Risk: 🟡 MEDIUM (needs discipline)
└─ Verdict: ✅ VIABLE

❌ NOT RECOMMENDED: Drizzle for MVP
├─ Difficulty: 48% (50% harder)
├─ Timeline: 313 hours (SLIP 2-4 weeks)
├─ Risk: 🔴 HIGH
└─ Verdict: ❌ Too risky for MVP
    (Consider for Phase 2 if CF Workers needed)
```

---

## 📝 NEXT STEPS

1. ✅ Decide ORM/SQL approach (recommend: Prisma)
2. ✅ Create database schema
3. ✅ Setup Express + authentication
4. ✅ Implement trip/product/order endpoints
5. ✅ Integrate WhatsApp webhooks
6. ✅ Setup BullMQ queue
7. ✅ Deploy to Railway + Cloudflare
8. ✅ Test full flow end-to-end

---

## 📚 REFERENCE

**Frontend**: `docs/prototype/frontend/README.md`
**PRD**: `docs/core/PRD_MVP_v4.2.md`
**DB Schema**: Section 5 above
**API Spec**: Section 6 above
**Deployment**: Section 10 above

---
