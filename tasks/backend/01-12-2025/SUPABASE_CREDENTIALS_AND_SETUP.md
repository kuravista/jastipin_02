# SUPABASE CREDENTIALS & ENVIRONMENT SETUP
**Project**: Jastipin (ascucdkibziqamaaovqw)  
**Region**: ap-southeast-2  
**Database**: PostgreSQL 17.6.1.054  
**Status**: ACTIVE_HEALTHY  
**Updated**: 2025-12-01

---

## 🔐 SUPABASE PROJECT CREDENTIALS

### Project Information
```
Project Name:      Jastipin_01
Project ID:        ascucdkibziqamaaovqw
Organization ID:   lrcrzxzowvymbnzgcsec
Region:            ap-southeast-2 (Sydney, Australia)
Database Host:     db.ascucdkibziqamaaovqw.supabase.co
Database Version:  PostgreSQL 17.6.1.054 (Release Channel: GA)
Status:            ACTIVE_HEALTHY
Created:           2025-12-01 03:13:04 UTC
```

### Public URLs & Keys

**Frontend (Next.js - Already configured):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://ascucdkibziqamaaovqw.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_1cG9a-KeacJa3kUzBJq9Vw_tGefzHJu
```

**Legacy Anon Key (Deprecated - Do NOT use for new code):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzY3VjZGtpYnppcWFtYWFvdnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTg3ODQsImV4cCI6MjA4MDEzNDc4NH0.RfS8LK27aIcDrOlVeAHVnHjmUGOfGlTD_8mxuaKrj4Q
```
Status: Active but should be rotated for security
Type: JWT (anon/public role)

---

## 🗄️ DATABASE CONNECTION STRINGS

### Backend (Node.js/Express/Prisma)

**For LOCAL DEVELOPMENT** (keep existing):
```env
DATABASE_URL="postgresql://ismail:123empatLima@localhost:5432/jastipin"
```

**For SUPABASE CONNECTION** (NEW):
```env
DATABASE_URL="postgresql://postgres:[SUPABASE_PASSWORD]@db.ascucdkibziqamaaovqw.supabase.co:5432/postgres?sslmode=require"
```

**Connection Details:**
- Host: `db.ascucdkibziqamaaovqw.supabase.co`
- Port: `5432` (standard PostgreSQL)
- Database: `postgres` (default)
- Username: `postgres` (Supabase default)
- Password: **[See Supabase Dashboard > Project Settings > Database > Password]**
- SSL Mode: `require` (MANDATORY for Supabase)

⚠️ **IMPORTANT**: You must retrieve the actual Supabase password from:
1. Go to https://app.supabase.com
2. Select project: Jastipin_01
3. Go to Settings → Database
4. Copy the password from "Password reset" section OR look in connection pooler

### Connection Pooler (Optional - For High Concurrency)
```env
# Use this if experiencing connection limit issues
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.ascucdkibziqamaaovqw.supabase.co:6543/postgres?sslmode=require&schema=public"
```
- Port: `6543` (PgBouncer pooled connections)
- Better for serverless/high-concurrency scenarios

---

## 📋 COMPLETE .env.supabase FILE

Create `/app/backend/.env.supabase` with all configuration:

```env
# ============================================
# DATABASE (SUPABASE)
# ============================================
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.ascucdkibziqamaaovqw.supabase.co:5432/postgres?sslmode=require"
NODE_ENV="production"

# ============================================
# JWT & AUTHENTICATION
# ============================================
JWT_SECRET="12c77957acabe4c4be6afc936a038e673479c4f41867c18ad34561f4c5e49104"
JWT_REFRESH_SECRET="e51b211c186c2493e5fd5048e0249e02e5bdda9a930cc69696d0a03bcf60e8f8"

# ============================================
# API CONFIGURATION
# ============================================
API_PORT=4000
FRONTEND_URL="https://jastipin.me,https://www.jastipin.me"

# ============================================
# RAJAONGKIR (SHIPPING)
# ============================================
RAJAONGKIR_API_KEY="09066b80d82f1a14b23a1b97893f7298"

# ============================================
# MAINTENANCE
# ============================================
MAINTENANCE_MODE=false
MAINTENANCE_BYPASS_IPS="103.186.166.5"
WORKER_TOKEN="dev-worker-secret-change-in-production"

# ============================================
# EMAIL (SENDPULSE)
# ============================================
SENDPULSE_API_ID="b3f8aa3be78c7cc355dbe7a7c924cc88"
SENDPULSE_API_SECRET="3bde515bc9a01af7d00ef56137b19bd3"
SENDPULSE_TOKEN_STORAGE="/tmp/sendpulse-tokens"
SENDPULSE_FROM_EMAIL="no-reply@jastipin.me"
SENDPULSE_FROM_NAME="Jastipin Team"
SENDPULSE_ENABLED=true

# ============================================
# STORAGE (CLOUDFLARE R2)
# ============================================
R2_ACCOUNT_ID="51ce7a9cc119da5eca7c222834b5f216"
R2_ACCESS_KEY_ID="1fddc3c253b20c6c4c370c59c113398b"
R2_SECRET_ACCESS_KEY="8a1a420a2fc9e5b13ea23130e0cd07d6931b696f71ecf95db07678df74d8442d"
R2_BUCKET_NAME="jastipin-bucket"
R2_PUBLIC_URL="https://pub-534a057d6816411a95c99b23b675ec45.r2.dev"
R2_CUSTOMED_DOMAIN="https://cdn.jastipin.me"

# ============================================
# SUPABASE (FRONTEND)
# ============================================
NEXT_PUBLIC_SUPABASE_URL="https://ascucdkibziqamaaovqw.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="sb_publishable_1cG9a-KeacJa3kUzBJq9Vw_tGefzHJu"
```

---

## 🔌 PRISMA SCHEMA CONNECTION

Current `schema.prisma` already supports Supabase:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**NO CHANGES NEEDED** ✓ - Just update `DATABASE_URL` env variable

---

## 🔍 DATABASE EXTENSIONS AVAILABLE ON SUPABASE

**Currently Installed:**
- ✅ `uuid-ossp` v1.1 - UUID generation
- ✅ `pgcrypto` v1.3 - Cryptographic functions
- ✅ `pg_stat_statements` v1.11 - Query performance monitoring
- ✅ `pg_graphql` v1.5.11 - GraphQL API (Supabase RealtimeDB)
- ✅ `supabase_vault` v0.3.1 - Secrets management
- ✅ `plpgsql` v1.0 - Stored procedures

**Available for Install (Not needed for schema):**
- PostGIS, Vector search, TimescaleDB, pg_cron, etc.

**For this schema**: NO additional extensions needed ✓

---

## 📦 SUPABASE MCP TOOLS AVAILABLE

Tools you can use for migration via Factory CLI:

```bash
# List projects
supabase___list_projects

# Get project details
supabase___get_project "ascucdkibziqamaaovqw"

# List all tables
supabase___list_tables "ascucdkibziqamaaovqw"

# List extensions
supabase___list_extensions "ascucdkibziqamaaovqw"

# Get API keys
supabase___get_publishable_keys "ascucdkibziqamaaovqw"

# Apply migrations
supabase___apply_migration "ascucdkibziqamaaovqw" "migration_name" "SQL_QUERY"

# Execute SQL
supabase___execute_sql "ascucdkibziqamaaovqw" "SELECT * FROM users"

# Get logs
supabase___get_logs "ascucdkibziqamaaovqw" "postgres"

# Get advisors (security/performance)
supabase___get_advisors "ascucdkibziqamaaovqw" "security"
supabase___get_advisors "ascucdkibziqamaaovqw" "performance"

# Create branches (dev databases)
supabase___create_branch "ascucdkibziqamaaovqw" "develop" "cost_confirmation_id"
```

---

## 🚀 MIGRATION WORKFLOW

### Step 1: Get Supabase Password
1. Open https://app.supabase.com
2. Select "Jastipin_01" project
3. Go to Settings → Database
4. Find "Password" section
5. Copy password

### Step 2: Update Environment
```bash
# Copy template
cp /app/backend/.env.supabase /app/backend/.env.production

# Edit and add Supabase password
# Change: DATABASE_URL="postgresql://postgres:[PASSWORD]@..."
# To:     DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@..."
```

### Step 3: Deploy Schema to Supabase
```bash
# Using Prisma migrate (RECOMMENDED)
export DATABASE_URL="postgresql://postgres:PASSWORD@db.ascucdkibziqamaaovqw.supabase.co:5432/postgres?sslmode=require"
npx prisma migrate deploy

# Verify
npx prisma db push --skip-generate
```

### Step 4: Verify Schema
```bash
# Check all tables created
npx prisma db pull

# Generate fresh types
npx prisma generate
```

### Step 5: Validate Connection
```bash
# Test connection
npm run build
DATABASE_URL="postgresql://postgres:PASSWORD@..." npm start
```

---

## 🛡️ SECURITY CHECKLIST

- [ ] **Credentials Storage**
  - ✅ Never commit `.env` files
  - ✅ Use `.env.local` for local dev
  - ✅ Use `.env.supabase` for Supabase (don't commit)
  - ✅ Use environment variables in production (Docker secrets, Vercel env, etc.)

- [ ] **SSL/TLS**
  - ✅ `sslmode=require` in connection string (MANDATORY)
  - ✅ PostgreSQL 17 supports all modern SSL versions
  - ✅ Supabase enforces SSL by default

- [ ] **Password Security**
  - ⚠️ Store Supabase password in secure vault
  - ⚠️ Rotate password every 90 days
  - ⚠️ Don't share Supabase password via email/Slack
  - ⚠️ Use different passwords for dev/staging/prod

- [ ] **Access Control**
  - ✅ Prisma schema uses standard `postgres` role
  - ✅ Row-Level Security (RLS) can be enabled later if needed
  - ✅ For API authorization: Use JWT tokens (configured)

- [ ] **Secrets Not in Database**
  - ✅ JWT_SECRET: In env vars ✓
  - ✅ JWT_REFRESH_SECRET: In env vars ✓
  - ✅ API keys: In env vars ✓
  - ✅ No passwords stored in `User` table ✓ (hashed via bcrypt)

---

## 📊 PERFORMANCE NOTES

### Connection Pool Configuration
```prisma
// In schema.prisma (already configured)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Prisma manages connection pool automatically
  // Default: min=2, max=10
}
```

### Latency Expectations
- **Local DB → Local API**: ~1ms
- **Local DB → Supabase API**: ~5-10ms (network round trip)
- **Supabase → Sydney Region**: ~10-20ms (within region latency)
- **Supabase → Different Region**: +50-200ms (depends on distance)

### Optimization Tips
1. Use connection pooler on port 6543 for serverless/high concurrency
2. Enable query caching for read-heavy operations
3. Monitor slow queries via `pg_stat_statements`
4. Use indexes effectively (19+ already defined in schema)

---

## 🔄 DOCKER DEPLOYMENT

When deploying with Docker, use environment variables:

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci --only=production
ENV DATABASE_URL="postgresql://postgres:$DB_PASSWORD@db.ascucdkibziqamaaovqw.supabase.co:5432/postgres?sslmode=require"
CMD ["npm", "start"]
```

```bash
# Deploy with Docker
docker build -t jastipin-api:latest .
docker run \
  -e DATABASE_URL="postgresql://postgres:PASSWORD@db.ascucdkibziqamaaovqw.supabase.co:5432/postgres?sslmode=require" \
  -e JWT_SECRET="12c77957..." \
  -p 4000:4000 \
  jastipin-api:latest
```

---

## 📞 TROUBLESHOOTING

### Connection Issues
```
Error: "connect ECONNREFUSED localhost:5432"
→ Solution: Check DATABASE_URL is pointing to Supabase, not localhost
```

```
Error: "SSL: CERTIFICATE_VERIFY_FAILED"
→ Solution: Ensure ?sslmode=require in connection string
```

```
Error: "FATAL: Ident authentication failed"
→ Solution: Check password is URL-encoded (use node-postgres to encode)
```

### Prisma Errors
```
Error: "Unknown database"
→ Solution: Database name should be 'postgres' (Supabase default)
```

```
Error: "Migration already applied"
→ Solution: Clear _prisma_migrations table if re-running migrations
```

---

## ✅ FINAL VALIDATION BEFORE CUTOVER

```sql
-- Run on Supabase to verify schema
SELECT 
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = schemaname || '.' || tablename) as index_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected output:
```
Address          | 4 indexes
BankAccount      | 2 indexes
FeesConfig       | 2 indexes
Guest            | 3 indexes
GuestAccessToken | 4 indexes
NotificationLog  | 6 indexes
Order            | 7 indexes
OrderItem        | 2 indexes
Participant      | 2 indexes
Product          | 3 indexes
SocialMedia      | 2 indexes
Trip             | 2 indexes
User             | 2 indexes
```

---

**Document Version**: 1.0  
**Credentials Updated**: 2025-12-01  
**Status**: READY FOR CONFIGURATION
