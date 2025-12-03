# System Architecture

## Request Flow: Sync vs Async

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│                   Port 3000 (pm2:0)                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
    ┌───▼────────────────┐          ┌─────────▼──────────┐
    │  SYNC REQUESTS     │          │   ASYNC REQUESTS   │
    │  (INSTANT)         │          │   (BACKGROUND)     │
    │  ──────────────────│          │ ──────────────────  │
    │  GET /api/users    │          │ POST /refund       │
    │  POST /orders      │          │ POST /expire-dp    │
    │  PUT /products     │          │ POST /notification │
    │  GET /trips        │          │ POST /release-stock│
    └───┬────────────────┘          └─────────┬──────────┘
        │                                     │
        │                                     │
    ┌───▼──────────────────────────────────────▼─────┐
    │         API Server (Node.js, port 4000)        │
    │  Express.js routes + Prisma ORM               │
    └───┬──────────────────────────────────────┬─────┘
        │                                      │
        │ Direct Prisma query                 │ enqueueJob()
        │ (no queue)                          │
        │                                      │
    ┌───▼──────────────────────┐           ┌──▼──────────┐
    │   Supabase PostgreSQL    │           │  pgmq Queue │
    │   (port 6543 pooler)     │           │ (jastipin_) │
    │                          │           │   jobs)    │
    │ User, Trip, Product      │           │            │
    │ Order, Participant, etc  │           └──┬─────────┘
    │ (13 tables)              │              │
    │                          │              │
    │ Response: INSTANT ✅     │              │
    └──────────────────────────┘              │
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │ Queue Worker     │
                                    │ (pm2:2)          │
                                    │ ─────────────────│
                                    │ Polls: 100ms     │
                                    │ Processes jobs   │
                                    │ Retry: exp.backoff│
                                    │ 4 handlers       │
                                    └──────────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │ Supabase DB      │
                                    │ (port 5432 direct)
                                    │                  │
                                    │ Process: DELAYED │
                                    │ (eventually)     │
                                    └──────────────────┘
```

**KEY DIFFERENCE:**
- **SYNC (Direct DB):** Request → Query → Response (instantly visible)
- **ASYNC (Queue):** Request → Enqueue → Worker Process → DB (eventual consistency)

---

## API Routing: Queue vs Direct Database

### ✅ SYNC APIs (Direct Database - INSTANT RESPONSE)

These bypass the queue and query Supabase directly via Prisma:

```
API Request → Prisma ORM → PostgreSQL → Response (instantly)

Examples:
  GET /api/users              # Fetch users
  GET /api/trips/{id}         # Fetch trip details
  POST /api/orders            # Create new order
  PUT /api/products/{id}      # Update product
  DELETE /api/participants    # Delete participant
  GET /api/addresses          # List addresses
  POST /api/socialMedia       # Add social media
```

**Characteristics:**
- User sees response immediately
- Synchronous processing
- Real-time data visibility
- Database query happens instantly

### ❌ ASYNC APIs (Queue - BACKGROUND PROCESSING)

These enqueue jobs for the worker to process asynchronously:

```
API Request → enqueueJob() → pgmq Queue → Return immediately
                                    ↓
                              (Worker processes separately)
                                    ↓
                                Background update to DB

Examples:
  (via timers/events, not direct API)
  ORDER_AUTO_REFUND           # Auto-reject 24h+ awaiting validation
  ORDER_EXPIRE_DP             # Cancel 30min+ pending_dp orders
  NOTIFICATION_SEND_WHATSAPP  # Send WhatsApp notifications
  STOCK_RELEASE               # Release locked inventory
```

**Characteristics:**
- Request returns immediately (job enqueued)
- Processing happens asynchronously in background
- Eventual consistency (data updated later)
- Retry logic if job fails

### Comparison

| Aspect | Sync (Direct DB) | Async (Queue) |
|--------|------------------|---------------|
| **User Experience** | Instant feedback | Immediate response, delayed processing |
| **Use Case** | Data retrieval/creation | Background/batch operations |
| **Response Time** | <100ms | Instant enqueue |
| **Processing Time** | Immediate | Eventually (100ms - 5min) |
| **API Count** | ~80% of APIs | ~20% (background jobs) |
| **Examples** | GET, POST, PUT, DELETE | Auto-refund, expiry, notifications |
| **Visibility** | Real-time | Eventual |

---

## Data Flow

### Job Creation (Async)

```
Background Process (e.g., timer)
  ↓
Identify jobs to process
  (e.g., orders > 24 hours)
  ↓
enqueueAutoRefundJob(orderIds)
  ↓
order-queue.service.enqueue()
  ↓
queue.service.enqueue()
  ↓
pgmq.send() → jastipin_jobs table
  ↓
✅ Function returns IMMEDIATELY
   (job not yet processed)
```

### Job Processing (Async)

```
Worker Loop (polls every 100ms)
  ↓
pgmq.read('jastipin_jobs', vt=30, qty=1)
  → Get next available message
  ↓
Deserialize message
  ↓
executeJob() → Route to handler
  ├─ handleAutoRefund()
  ├─ handleExpireDP()
  ├─ handleSendWhatsApp()
  └─ handleStockRelease()
  ↓
[Job Execution]
  ├─ Try execute
  │   ├─ SUCCESS → complete(msgId)
  │   │   └─ pgmq.delete() from queue
  │   │
  │   └─ FAILURE → fail(msgId, job, error)
  │       ├─ Check retries
  │       ├─ If retries < 3:
  │       │   └─ Re-enqueue with backoff
  │       │       (5s → 30s → 5min)
  │       └─ If retries = 3:
  │           └─ Log and discard
  ↓
Data persisted to Supabase
```

---

## Table Dependencies

```
User (11)
 ├→ Trip (40)
 │   ├→ Participant (46)
 │   │   └→ Order (95)
 │   │       ├→ OrderItem (145)
 │   │       └→ Address (34)
 │   └→ Product (31)
 │       └→ OrderItem (145)
 ├→ SocialMedia (0)
 ├→ BankAccount (2)
 └→ [Guest-related]
     ├→ Guest (13)
     ├→ GuestAccessToken (75)
     └→ NotificationLog (0)

FeesConfig (1) - Standalone

TOTAL: 493 records
```

---

## Job Types

```
ORDER_AUTO_REFUND
└─ Payload: { orderIds: string[] }
└─ Handler: handleAutoRefund()
└─ Purpose: Auto-reject 24h+ awaiting validation orders
└─ Priority: normal

ORDER_EXPIRE_DP
└─ Payload: { orderIds: string[] }
└─ Handler: handleExpireDP()
└─ Purpose: Cancel 30min+ pending_dp orders
└─ Priority: normal

NOTIFICATION_SEND_WHATSAPP
└─ Payload: { messageId: string }
└─ Handler: handleSendWhatsApp()
└─ Purpose: Send WhatsApp notification
└─ Priority: low

STOCK_RELEASE
└─ Payload: { productId: string, quantity: number }
└─ Handler: handleStockRelease()
└─ Purpose: Release locked inventory
└─ Priority: normal
```

---

## Error Handling Flow

```
Job Processing
  ↓
[Try Execute]
  ├─ SUCCESS ✅
  │   ↓
  │   complete(msgId)
  │   ↓
  │   pgmq.delete()
  │
  └─ FAILURE ❌
      ↓
      fail(msgId, job, error)
      ↓
      [Check Retries]
        ├─ Retries Remaining (< 3)
        │   ↓
        │   Re-enqueue with delay
        │   ├─ Attempt 1: +5s
        │   ├─ Attempt 2: +30s
        │   └─ Attempt 3: +5min
        │
        └─ Max Retries Exceeded (= 3)
            ↓
            Log to console
            (TODO: Dead Letter Queue)
```

---

## Files Structure

```
backend/
├── src/
│   ├── types/
│   │   └── queue.types.ts          # Type definitions
│   │
│   ├── services/
│   │   ├── queue.service.ts        # pgmq wrapper
│   │   ├── order-queue.service.ts  # API wrappers
│   │   └── queue.service.test.ts   # Unit tests
│   │
│   ├── workers/
│   │   ├── queue-worker.ts         # Consumer loop
│   │   ├── job-handlers.ts         # Business logic
│   │   ├── job-handlers.test.ts    # Handler tests
│   │   └── index.ts                # Module exports
│   │
│   ├── routes/
│   │   └── monitoring.ts           # Queue endpoints
│   │
│   ├── index.ts                    # App entry + queue init
│   └── worker.ts                   # Standalone worker
│
├── prisma/
│   ├── schema.prisma               # DB schema
│   └── migrations/
│       ├── 20251112082740_init/
│       ├── ... (8 more)
│       ├── 20251201000000_add_missing_tables/
│       └── 20251201000001_add_missing_columns/
│
├── dist/                           # Compiled JS
├── package.json                    # Scripts
└── .env                            # Connection strings
```

---

## API Endpoints

```
Monitoring:
  GET /api/monitoring/queue/stats  → Queue statistics
  GET /api/monitoring/queue/health → Worker health + success rates
  GET /api/monitoring/queue/info   → Detailed queue info

Job Enqueueing (via services):
  - enqueueAutoRefundJob(orderIds)
  - enqueueExpireDPJob(orderIds)
  - enqueueStockReleaseJob(productId, qty)
  - enqueueNotificationJob(messageId)
```

---

## Technology Stack

- **Database:** PostgreSQL 17.6 (Supabase)
- **Queue:** pgmq (PostgreSQL Message Queue) v1.5.1
- **ORM:** Prisma 5.7.0
- **Runtime:** Node.js
- **Process Manager:** PM2
- **Language:** TypeScript
- **Testing:** Jest

---

## Performance Characteristics

| Metric | Value |
|--------|-------|
| Poll Interval | 100ms |
| Visibility Timeout | 30s |
| Max Retries | 3 |
| Backoff Strategy | Exponential (5s, 30s, 5min) |
| Connections | Supabase pooler (6543) |
| Expected Throughput | 10-50 jobs/sec |
| Memory per Worker | 60-100MB |
| CPU Usage | <5% idle |

---

## Security

- ✅ Credentials in `.env` (gitignored)
- ✅ No hardcoded secrets
- ✅ Type-safe queries via Prisma
- ✅ SQL injection prevention (parameterized)
- ✅ Worker token for future authentication
- ⏳ TODO: API authentication/authorization

---

## Monitoring & Health Checks

**Queue Health:**
- `totalQueued` - Messages waiting
- `totalProcessing` - Messages being processed
- `totalCompleted` - Successfully processed
- `oldestJob` - Age of oldest message

**Worker Health:**
- Process uptime
- Success rate (%)
- Job processing time
- Error count

---

## Scaling Considerations

**Current State:** Single worker instance  

**To Scale:**
1. Add multiple worker instances (with different job types)
2. Use job routing based on type
3. Implement distributed locking for concurrent jobs
4. Consider partitioned queues for high volume

**Current Limits:**
- Single worker can handle ~50 jobs/sec
- Supabase connection pool limit: 100 connections
- Local PostgreSQL backup: unlimited
