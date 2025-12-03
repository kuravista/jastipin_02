# Implementation & Deployment Guide

## Queue System Architecture

### Components

**1. Queue Types** (`src/types/queue.types.ts`)
- JobType: ORDER_AUTO_REFUND, ORDER_EXPIRE_DP, NOTIFICATION_SEND_WHATSAPP, STOCK_RELEASE
- JobPriority: high, normal, low
- Full TypeScript interfaces for type safety

**2. Queue Service** (`src/services/queue.service.ts`)
- `initializeQueue()` - Creates pgmq queue on startup
- `enqueue(job)` - Add job with priority
- `dequeue()` - Get next job (30s visibility timeout)
- `complete(msgId)` - Delete from queue
- `fail(msgId, job, error)` - Retry with exponential backoff
- `getQueueStats()` - Queue metrics
- `purgeQueue()` - Clear queue (testing only)

**3. Job Handlers** (`src/workers/job-handlers.ts`)
- `handleAutoRefund()` - Auto-reject 24h+ awaiting validation orders
- `handleExpireDP()` - Cancel 30min+ pending_dp orders
- `handleSendWhatsApp()` - WhatsApp notifications (stub)
- `handleStockRelease()` - Release locked inventory

**4. Queue Worker** (`src/workers/queue-worker.ts`)
- Main consumer loop (100ms polling)
- Graceful shutdown (30s timeout)
- Error handling with retry
- Health checks every 30s

**5. API Wrappers** (`src/services/order-queue.service.ts`)
- `enqueueAutoRefundJob(orderIds)`
- `enqueueExpireDPJob(orderIds)`
- `enqueueStockReleaseJob(productId, quantity)`

**6. Monitoring Endpoints** (`src/routes/monitoring.ts`)
- `GET /api/monitoring/queue/stats` - Queue statistics
- `GET /api/monitoring/queue/health` - Worker health
- `GET /api/monitoring/queue/info` - Detailed info

---

## Database

### Connection Strings

**Production (Supabase):**
```
DATABASE_URL=postgresql://postgres.ascucdkibziqamaaovqw:123EMpatlima@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.ascucdkibziqamaaovqw:123EMpatlima@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
```

**Backup (Local):**
```
postgresql://ismail:123empatLima@localhost:5432/jastipin
```

### Migrations Applied

1. `20251112082740_init` - Initial schema (User, Trip, Order, etc.)
2. `20251113033239_add_start_date_to_trip`
3. `20251113034837_add_url_img_to_trip`
4. `20251113073639_add_social_media_to_user`
5. `20251113073915_add_social_media_model`
6. `20251114203129_add_email_address_to_participant`
7. `20251114211309_add_shipping_fields_to_participant`
8. `20251118133730_add_dp_flow_support` - Address, OrderItem, FeesConfig
9. `20251201000000_add_missing_tables` - Guest, GuestAccessToken, BankAccount, NotificationLog
10. `20251201000001_add_missing_columns` - Added: originCityName, paymentType, isUnlimitedStock, finalProofUrl

### Tables (13 total)

**Core:** User, Trip, Product, Participant, Order, OrderItem  
**Related:** Address, SocialMedia  
**Config:** FeesConfig  
**Guest:** Guest, GuestAccessToken, BankAccount, NotificationLog  

---

## Deployment

### Starting Services

```bash
# Start API (if not running)
pm2 start npm --name "jastipin-api" -- start

# Start Queue Worker
pm2 start npm --name "jastipin-worker" -- run start:worker

# View status
pm2 status
```

### Checking Logs

```bash
# API logs
pm2 logs jastipin-api

# Worker logs
pm2 logs jastipin-worker

# Raw log files
tail -f /root/.pm2/logs/jastipin-api-out.log
tail -f /root/.pm2/logs/jastipin-worker-out.log
```

### Health Checks

```bash
# API health
curl http://localhost:4000/health

# Queue health
curl http://localhost:4000/api/monitoring/queue/health

# Queue stats
curl http://localhost:4000/api/monitoring/queue/stats
```

---

## Retry Logic

### Exponential Backoff

```
Attempt 1: 5 seconds
Attempt 2: 30 seconds  
Attempt 3: 5 minutes
Max Retries: 3
```

### When Jobs Fail

1. Job execution fails
2. `fail(msgId, job, error)` called
3. If retries remain:
   - Increment retry count
   - Re-enqueue with delay
   - Log retry attempt
4. If max retries exceeded:
   - Log to console
   - Job discarded (TODO: implement dead letter queue)

---

## Adding New Job Types

1. Add to `JobType` union in `queue.types.ts`:
```typescript
type JobType = '...' | 'YOUR_NEW_JOB'
```

2. Define interface in `queue.types.ts`:
```typescript
interface YourNewJobPayload {
  // fields
}

interface YourNewJob extends BaseJob {
  type: 'YOUR_NEW_JOB'
  payload: YourNewJobPayload
}
```

3. Add handler in `job-handlers.ts`:
```typescript
async function handleYourNewJob(payload: YourNewJobPayload) {
  // implementation
}

// Add to jobHandlers map
```

4. Add enqueue wrapper in `order-queue.service.ts`:
```typescript
export async function enqueueYourNewJob(params: any) {
  return enqueue({
    type: 'YOUR_NEW_JOB',
    payload: params,
    priority: 'normal'
  })
}
```

---

## Testing

### Run Tests

```bash
# All tests
npm test

# Specific file
npm test src/services/queue.service.test.ts

# With coverage
npm test -- --coverage
```

### Local Testing

```bash
# Enqueue a test job via API
curl -X POST http://localhost:4000/api/test-queue \
  -H "Content-Type: application/json" \
  -d '{"type":"ORDER_AUTO_REFUND","orderIds":["order1"]}'
```

---

## Performance Notes

- Queue polling: 100ms intervals (configurable)
- Visibility timeout: 30 seconds
- pgmq uses PostgreSQL native features (no external dependency)
- Connection pooling via Supabase (port 6543)

---

## Known Limitations

1. No dead letter queue yet (jobs discarded after max retries)
2. WhatsApp handler is a stub (needs implementation)
3. No distributed queue (single worker process)
4. No job priority enforcement (all treated equally in dequeue)

---

## Troubleshooting

See TROUBLESHOOTING.md for common issues
