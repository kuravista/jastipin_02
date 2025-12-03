# Troubleshooting Guide

## Common Issues

### 1. Queue Worker Not Connecting to Supabase

**Error:** `ERROR: function pgmq.read(...) does not exist`

**Cause:** SQL function signature mismatch

**Solution:**
```typescript
// CORRECT: Named parameters with type casts
SELECT * FROM pgmq.read(
  queue_name => 'queue_name'::text,
  vt => 30::integer,
  qty => 1::integer
)

// WRONG: Positional parameters
SELECT * FROM pgmq.read('queue_name', 30, 1)
```

The pgmq extension uses named parameters. Always use `=>` syntax and cast numbers explicitly.

---

### 2. API Not Connecting to Supabase

**Error:** `Error: P1000 authentication failed`

**Cause:** Wrong connection string format or special characters in password

**Solution:**
- Use pooler port `6543` for applications (not `5432`)
- Password without special characters (no @, %, &, etc.)
- Connection string format:
  ```
  postgresql://user:password@region.pooler.supabase.com:6543/database
  ```

**Current Setup:**
```
DATABASE_URL=postgresql://postgres.ascucdkibziqamaaovqw:123EMpatlima@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres
```

---

### 3. Schema Mismatch Errors During Migration

**Error:** `The column 'columnName' does not exist in the current database`

**Cause:** Local database schema newer than Supabase schema

**Solution:**
1. Identify missing columns from error message
2. Add them to Prisma schema (`schema.prisma`)
3. Create new migration:
   ```bash
   npm run prisma migrate dev --name add_missing_columns
   ```
4. Deploy to Supabase:
   ```bash
   npm run db:deploy
   ```

**Missing Columns Fixed:**
- `user.originCityName`
- `trip.paymentType`
- `product.isUnlimitedStock`
- `order.finalProofUrl`

---

### 4. Worker Process Crashes on Startup

**Error:** `PrismaClientInitializationError`

**Cause:** Database connection failed or wrong environment variables

**Solution:**
1. Check `.env` file has Supabase credentials
2. Verify DATABASE_URL is set:
   ```bash
   echo $DATABASE_URL
   ```
3. Test connection manually:
   ```bash
   psql postgresql://user:pass@host/db
   ```
4. Restart worker:
   ```bash
   pm2 restart jastipin-worker
   ```

---

### 5. Jobs Not Processing

**Check List:**
1. ✅ Queue initialized?
   ```bash
   curl http://localhost:4000/api/monitoring/queue/stats
   ```
   
2. ✅ Worker running?
   ```bash
   pm2 status
   ```
   
3. ✅ Queue has jobs?
   ```bash
   psql $SUPABASE_DATABASE_URL -c "SELECT COUNT(*) FROM pgmq.q_jastipin_jobs"
   ```
   
4. ✅ Check worker logs:
   ```bash
   pm2 logs jastipin-worker
   ```

---

### 6. TypeScript Compilation Errors

**Error:** `error TS2322: Type mismatch`

**Solution:**
- Check return types match expected types
- Use `::type` casts in SQL queries
- All parameters must be explicit types

**Example Fix:**
```typescript
// WRONG
const result = await prisma.$queryRaw`SELECT * FROM queue`

// RIGHT
const result = await prisma.$queryRaw<Array<{msg_id: number}>>`
  SELECT * FROM pgmq.read(...)
`
```

---

### 7. Database Connection Pool Exhausted

**Error:** `Sorry, too many clients already`

**Cause:** Too many connections to database

**Solution:**
1. Check active connections:
   ```bash
   psql $SUPABASE_DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"
   ```

2. Kill idle connections:
   ```bash
   psql $SUPABASE_DATABASE_URL -c "
     SELECT pg_terminate_backend(pid) 
     FROM pg_stat_activity 
     WHERE state='idle'
   "
   ```

3. Increase pool size in Prisma (if on Supabase tier that allows):
   ```prisma
   datasource db {
     url = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```

---

### 8. Jobs Stuck in Processing

**Symptoms:** Job count stays high, success rate drops

**Solution:**
1. Check if worker is alive:
   ```bash
   pm2 status
   ```

2. Check worker logs for errors:
   ```bash
   tail -50 /root/.pm2/logs/jastipin-worker-error.log
   ```

3. If stuck, purge queue (⚠️ deletes all jobs):
   ```bash
   curl -X POST http://localhost:4000/api/monitoring/queue/purge
   ```

4. Restart worker:
   ```bash
   pm2 restart jastipin-worker
   ```

---

### 9. High Memory Usage

**Cause:** Queue worker polling too frequently or memory leak

**Solution:**
1. Check current poll interval (100ms is default)
2. Reduce if needed in `queue-worker.ts`:
   ```typescript
   const POLL_INTERVAL = 500 // increase to 500ms
   ```

3. Monitor memory:
   ```bash
   pm2 monit
   ```

4. Check for memory leaks in job handlers

---

### 10. Migration Failed

**Error:** `Migration failed to apply`

**Solution:**
1. Check migration error:
   ```bash
   npm run prisma migrate status
   ```

2. If migration is stuck:
   ```bash
   npm run prisma migrate resolve --rolled-back <migration_name>
   ```

3. Fix the migration file and retry:
   ```bash
   npm run db:deploy
   ```

---

## Debugging Tips

### 1. Enable Detailed Logging

In `queue-worker.ts`:
```typescript
if (process.env.DEBUG_QUEUE === 'true') {
  console.log(`[DEBUG] Job details:`, job)
}
```

Then run:
```bash
DEBUG_QUEUE=true pm2 restart jastipin-worker
```

### 2. Inspect Queue State

```bash
# Check queue table
psql $SUPABASE_DATABASE_URL -c "SELECT * FROM pgmq.q_jastipin_jobs LIMIT 10"

# Check queue metrics
psql $SUPABASE_DATABASE_URL -c "SELECT * FROM pgmq.metrics('jastipin_jobs')"

# Check archive
psql $SUPABASE_DATABASE_URL -c "SELECT * FROM pgmq.a_jastipin_jobs LIMIT 10"
```

### 3. Manual Job Execution

For testing handlers directly:
```typescript
import { executeJob } from './src/workers/job-handlers'

const testJob = {
  type: 'ORDER_AUTO_REFUND' as const,
  payload: { orderIds: ['order1'] },
  priority: 'normal',
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date(),
}

await executeJob(testJob)
```

### 4. Check Connectivity

```bash
# Test Supabase connection
psql postgresql://postgres:password@host:5432/database -c "SELECT 1"

# Test pooler connection (what API uses)
psql postgresql://postgres:password@host:6543/database -c "SELECT 1"

# Test from running container
docker exec <container_id> curl http://localhost:4000/health
```

---

## Performance Baseline

- Queue size: 0-100 jobs
- Polling interval: 100ms
- Processing time: <1s per job average
- Memory usage: 60-100MB
- CPU usage: <5% idle

---

## When to Escalate

If issues persist after checking above:
1. Check PM2 logs for stack traces
2. Check Supabase project dashboard for quota issues
3. Contact Supabase support if database issues
4. Review recent code changes

---

## Useful Commands

```bash
# Restart all services
pm2 restart jastipin-api jastipin-worker

# Stop queue worker
pm2 stop jastipin-worker

# Delete and restart worker
pm2 delete jastipin-worker
pm2 start npm --name "jastipin-worker" -- run start:worker

# View real-time logs
pm2 logs --lines 100 --format

# Save PM2 process list
pm2 save

# Check Supabase status
curl https://status.supabase.com/api/v2/status.json
```
