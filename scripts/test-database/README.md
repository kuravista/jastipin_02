# 🧪 Jastipin Database Test Scripts

Collection of test scripts for verifying and monitoring Jastipin database performance, connectivity, and data integrity.

---

## 📁 Scripts Overview

### 1. **verify-new-db.mjs** - Database Connection Verification
Comprehensive database verification script that tests connection, performance, and configuration.

```bash
node verify-new-db.mjs
```

**Tests:**
- ✅ Basic database connection
- ✅ First query response time
- ✅ Connection pool warmup (multiple queries)
- ✅ User data verification
- ✅ Database information retrieval
- ✅ Connection string validation

**Output:** Connection status, query times, database details, performance assessment

---

### 2. **test-supabase-connection.mjs** - Direct Supabase Connection Test
Tests direct Prisma connection to Supabase database.

```bash
node test-supabase-connection.mjs
```

**Tests:**
- ✅ Prisma client initialization
- ✅ Database connectivity
- ✅ Basic query execution

**Output:** Connection status, timestamps, error details (if any)

---

### 3. **test-api-endpoints.mjs** - API Endpoint Testing
Tests multiple API endpoints for responsiveness and performance.

```bash
node test-api-endpoints.mjs
```

**Tests:**
- ✅ GET /api/users - User endpoint
- ✅ GET /api/health - Health check
- ✅ GET /api/orders - Orders endpoint

**Output:** Response times, status codes, average latency

---

### 4. **test-api-health.mjs** - API Health Check
Simple health check for local API server.

```bash
node test-api-health.mjs
```

**Tests:**
- ✅ API server availability
- ✅ Response time from localhost:4000

**Output:** Server status, response time

---

### 5. **test-performance-final.mjs** - Comprehensive Performance Analysis
End-to-end performance comparison and analysis.

```bash
node test-performance-final.mjs
```

**Tests:**
- ✅ Database query performance
- ✅ API response times
- ✅ Concurrent request handling
- ✅ Data fetch performance
- ✅ System resource usage
- ✅ Before/after comparison

**Output:** 
- Database performance metrics
- API performance metrics
- Concurrent load results
- Memory usage
- Comparison tables

---

### 6. **test-performance-load.mjs** - Load Testing
Stress test with concurrent requests.

```bash
node test-performance-load.mjs
```

**Tests:**
- ✅ Multiple concurrent database queries
- ✅ Connection pool stress testing

**Output:** Performance under load, concurrency results

---

### 7. **test-optimization-analysis.mjs** - Database Optimization Analysis
Analyzes database performance and provides optimization metrics.

```bash
node test-optimization-analysis.mjs
```

**Tests:**
- ✅ Query warmup performance
- ✅ Database optimization metrics

**Output:** Warmup metrics, optimization recommendations

---

## 🚀 Quick Start

### Run Individual Tests

```bash
# Test database connection
cd /app/scripts/test-database
node verify-new-db.mjs

# Test API endpoints
node test-api-endpoints.mjs

# Run comprehensive performance test
node test-performance-final.mjs
```

### Run All Tests (Sequential)

```bash
cd /app/scripts/test-database

echo "=== Database Connection ===" && node verify-new-db.mjs && \
echo -e "\n=== API Endpoints ===" && node test-api-endpoints.mjs && \
echo -e "\n=== API Health ===" && node test-api-health.mjs && \
echo -e "\n=== Performance Analysis ===" && node test-performance-final.mjs
```

---

## 📊 Test Results Interpretation

### Query Performance Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Average Query | <20ms | 13.40ms | ✅ EXCELLENT |
| First Query | <500ms | 330ms | ✅ EXCELLENT |
| API Response | <10ms | 4.60ms | ✅ EXCELLENT |
| Concurrent (10x) | <50ms | 11ms | ✅ EXCELLENT |

### Expected Performance After Jakarta Migration

```
Database Query:      13.40ms (was 471ms in Sydney)
First Connection:    330ms (was 1545ms in Sydney)
API Response:        4.60ms (was 16ms in Sydney)
Network Latency:     ~250ms (was 300-400ms to Sydney)
```

---

## 🔧 Configuration & Dependencies

### Requirements
- Node.js v20+
- Prisma Client v5.7.0+
- Database connection via .env DATABASE_URL

### Environment Variables Required
```
DATABASE_URL=postgresql://[user]@[host]:[port]/[database]
```

### Install Dependencies
```bash
cd /app/backend
npm install @prisma/client
```

---

## 📈 Performance Monitoring

### What to Monitor

1. **Query Performance**
   - Target: <20ms average
   - Alert: >50ms
   - Critical: >100ms

2. **Connection Pool**
   - Monitor connection reuse
   - Watch for pool exhaustion
   - Check concurrent request handling

3. **Data Integrity**
   - Verify user count: 34
   - Verify item count: 155
   - Check for orphaned records: 0

4. **Network Latency**
   - DNS: ~225ms (expected)
   - TCP: ~227ms (expected)
   - Total: ~250ms (expected)

---

## 🐛 Troubleshooting

### Connection Issues

**Error: "FATAL: Tenant or user not found"**
- ✅ Expected for CLI connections, not a problem
- ✅ Prisma connections should work fine

**Error: "Connection timeout"**
- Check DATABASE_URL in .env
- Verify network connectivity
- Ensure Supabase is accessible

### Performance Degradation

**If queries suddenly slow down:**
1. Run `verify-new-db.mjs` to get current baseline
2. Check Supabase dashboard for issues
3. Verify no resource exhaustion on server
4. Check for network latency spikes

---

## 📝 Test Documentation

For detailed test results and analysis, see:
- 📄 `/app/docs/DATABASE_MIGRATION_TEST_REPORT.md` - Comprehensive test report
- 📊 Latest test outputs in terminal

---

## 🔄 Recommended Test Schedule

| Frequency | Test | Purpose |
|-----------|------|---------|
| Daily | `verify-new-db.mjs` | Quick health check |
| Weekly | `test-performance-final.mjs` | Performance trending |
| Monthly | All tests | Full system validation |
| As-needed | `test-api-endpoints.mjs` | Verify API functionality |

---

## 📞 Support

For issues or questions about test scripts:
1. Check `/app/docs/DATABASE_MIGRATION_TEST_REPORT.md` for detailed analysis
2. Review test script comments for usage details
3. Check Supabase dashboard for database status
4. Monitor application logs for errors

---

**Last Updated:** December 3, 2025  
**Test Scripts Location:** `/app/scripts/test-database/`  
**Documentation:** `/app/docs/DATABASE_MIGRATION_TEST_REPORT.md`
