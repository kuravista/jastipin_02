# 🗄️ DATABASE SETUP & CONNECTION

**Purpose:** Configure PostgreSQL database connection and initialize schema  
**Time Required:** 20-30 minutes  
**Prerequisites:** [04-nodejs-setup.md](04-nodejs-setup.md) ✅  
**Next Step:** [06-github-ssh-setup.md](06-github-ssh-setup.md)

---

## 📋 WHAT WE'LL DO

1. ✅ Verify Supabase connection
2. ✅ Test database connectivity
3. ✅ Run migrations (if needed)
4. ✅ Configure backup strategy
5. ✅ Setup connection pooling
6. ✅ Verify schema

---

## ⚠️ NOTE: SUPABASE vs LOCAL POSTGRESQL

**Your project uses SUPABASE** (managed PostgreSQL).

**Supabase provides:**
- ✅ Managed PostgreSQL database
- ✅ Automatic backups
- ✅ Built-in connection pooling
- ✅ Real-time capabilities
- ✅ Easy scaling

**Local PostgreSQL** (optional, if you want local development):
- For local testing only
- Requires more manual management
- Not recommended for production

---

## 🔐 STEP 1: GATHER SUPABASE CREDENTIALS

**From Supabase Dashboard:**

1. Go to: https://app.supabase.com
2. Login with your account
3. Select your project: `jastipin` (or your project name)
4. Go to: **Settings** → **Database**
5. Copy these values:

```
Host: project-id.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: your-password (you set during project creation)
```

**Alternative - Get Connection String:**

1. In Settings → Database, find **"Connection string"**
2. Select: **"URI"** (not "Parameter syntax")
3. Copy the full connection string:

```
postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=public
```

⚠️ **IMPORTANT:** Replace `[PASSWORD]` and `[HOST]` with your actual values!

---

## 🔗 STEP 2: VERIFY DATABASE_URL IN .ENV

**Check your application .env file:**

```bash
# SSH into server
ssh -i ~/.ssh/server-deploy deploy@YOUR_SERVER_IP

# View .env file (be careful with secrets!)
cat /var/www/jastipin-api/.env | grep DATABASE_URL

# Should show:
# DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=public
```

**If not set correctly:**

```bash
# Edit .env
nano /var/www/jastipin-api/.env

# Find DATABASE_URL and update with your Supabase connection string
# Replace [PASSWORD] and [HOST] with actual values

# Save: Ctrl+X → Y → Enter
```

---

## 🧪 STEP 3: TEST DATABASE CONNECTION

**Connect directly to Supabase:**

```bash
# Test connection using psql
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# If psql not installed:
sudo apt install -y postgresql-client

# If connection successful, you'll see:
# postgres=> (at the prompt)

# List databases
\l

# Connect to your database
\c postgres

# Show tables
\dt

# Exit
\q
```

**If connection fails:**

```bash
# Check if host is accessible
ping [HOST]

# Check if port is open
telnet [HOST] 5432

# Verify credentials are correct
# Wrong password: "FATAL: password authentication failed"
# Wrong host: "could not translate host name"
```

---

## 🔄 STEP 4: RUN PRISMA MIGRATIONS

**Check current database status:**

```bash
# Navigate to application
cd /var/www/jastipin-api

# Check Prisma status
pnpm exec prisma migrate status

# Should show:
# Database schema is up to date
# OR
# X pending migrations
```

**Apply any pending migrations:**

```bash
# Deploy pending migrations
pnpm exec prisma migrate deploy

# Should show:
# Migrations applied: X successful
# OR
# No pending migrations
```

**If migrations fail:**

```bash
# Check migration files exist
ls -la prisma/migrations/

# View migration error details
pnpm exec prisma migrate deploy --verbose

# If stuck, try:
pnpm exec prisma db push --force-reset

# ⚠️ WARNING: --force-reset wipes data! Only for development!
```

---

## 🌍 STEP 5: SETUP CONNECTION POOLING

**Supabase provides built-in pooling:**

```bash
# Your DATABASE_URL already uses connection pooling
# It points to: project.supabase.co (pooler)

# Verify your .env uses pooler endpoint:
cat /var/www/jastipin-api/.env | grep DATABASE_URL

# Should contain: supabase.co (not supabase.co:6543 which is direct connection)
```

**For local testing with local PostgreSQL (optional):**

```bash
# Install PgBouncer for connection pooling
sudo apt install -y pgbouncer

# Configure PgBouncer
sudo nano /etc/pgbouncer/pgbouncer.ini

# Set connection pooling:
[databases]
postgres = host=localhost port=5432 user=postgres password=your-password dbname=postgres

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 10
```

---

## 💾 STEP 6: BACKUP STRATEGY

**Supabase handles automatic backups**, but here's what you should know:

**Daily automated backups in Supabase:**

```bash
# Backup features (included in Supabase):
# - Daily backups (24-30 days retention)
# - Point-in-time recovery
# - Backup to external storage (optional)

# Access backups from Supabase Dashboard:
# 1. Go to: https://app.supabase.com
# 2. Project → Database → Backups
# 3. View backup history
# 4. Download or restore if needed
```

**Manual backup (recommended for extra safety):**

```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
pg_dump postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres > ~/backups/backup-$(date +%Y%m%d).sql

# Compress backup
gzip ~/backups/backup-*.sql

# List backups
ls -lh ~/backups/
```

**Automated daily backup script (optional):**

```bash
# Create backup script
nano ~/backup-db.sh

# Add this content:
```

```bash
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d)
HOST="[HOST]"
USER="postgres"
PASSWORD="[PASSWORD]"

# Create backup
PGPASSWORD=$PASSWORD pg_dump -h $HOST -U $USER postgres > $BACKUP_DIR/backup-$DATE.sql

# Compress
gzip $BACKUP_DIR/backup-$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup-*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup-$DATE.sql.gz"
```

Make executable and add to cron:

```bash
# Make executable
chmod +x ~/backup-db.sh

# Add to cron (daily at 2 AM)
crontab -e

# Add this line:
# 0 2 * * * /home/deploy/backup-db.sh
```

---

## 🔐 STEP 7: VERIFY DATA INTEGRITY

**Check database schema:**

```bash
# View Prisma schema
cat /var/www/jastipin-api/prisma/schema.prisma | head -50

# Your schema should include:
# - User model
# - Trip model
# - Participant model
# - Product model
# - Order model
# - Address model
```

**Verify tables exist in database:**

```bash
# Connect to database
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# List tables
\dt public.*

# Should show: _prisma_migrations and your app tables:
# - "User"
# - "Trip"
# - "Participant"
# - "Product"
# - "Order"
# - "Address"

# Check table structure
\d public."User"

# Should show columns: id, email, name, password_hash, etc.

# Exit
\q
```

---

## 🔍 STEP 8: TEST APPLICATION DATABASE CONNECTIVITY

**Test from Node.js application:**

```bash
# Create test script
nano /var/www/jastipin-api/test-db.js

# Add this code:
```

```javascript
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  try {
    // Test connection
    const users = await prisma.user.findMany({
      take: 1,
    });
    console.log("✅ Database connection successful!");
    console.log("Sample user:", users[0] || "No users yet");
  } catch (error) {
    console.error("❌ Database connection failed!");
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

**Run test:**

```bash
# Run test script
cd /var/www/jastipin-api
node test-db.js

# Should show:
# ✅ Database connection successful!
# Sample user: {...} or No users yet
```

---

## 📊 STEP 9: MONITOR DATABASE

**Check database status in Supabase:**

```bash
# Go to: https://app.supabase.com
# Project → Database → Connections
# Shows:
# - Current connections
# - Connection trends
# - Performance metrics
```

**Check from application:**

```bash
# View database size
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres -c "SELECT pg_size_pretty(pg_database_size('postgres'))"

# Should show: 50MB, 100MB, etc.

# View active connections
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres -c "SELECT count(*) FROM pg_stat_activity;"

# View slow queries (if enabled)
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres -c "SELECT query FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;"
```

---

## 🔐 STEP 10: DATABASE SECURITY

**Verify security settings in Supabase:**

```bash
# Go to: https://app.supabase.com
# Project → Settings → Security
# Verify:
# - SSL enforced ✅
# - IP Whitelisting (if needed)
# - Backup encryption enabled ✅
```

**Network security:**

```bash
# Your application should be on same network or use SSL
# Supabase enforces SSL by default (good!)

# Verify connection string uses SSL
cat /var/www/jastipin-api/.env | grep DATABASE_URL
# Should include: ?schema=public or ?sslmode=require
```

**User permissions:**

```bash
# Best practice: Create separate Prisma user (optional)
# For now, using default postgres user is acceptable

# If you want to create a limited user:
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# CREATE USER app_user WITH PASSWORD 'strong-password';
# GRANT CONNECT ON DATABASE postgres TO app_user;
# GRANT USAGE ON SCHEMA public TO app_user;
# GRANT CREATE ON SCHEMA public TO app_user;

# Then update DATABASE_URL to use app_user
```

---

## 🧪 STEP 11: VERIFY APPLICATION CAN QUERY DATA

**Check application logs:**

```bash
# View PM2 logs
pm2 logs jastipin-api --lines 50

# Should show:
# Database connected: ✅
# Listening on port 3000

# If errors, check:
# - DATABASE_URL is correct
# - Migrations have run
# - Network access is allowed
```

**Test API endpoint:**

```bash
# Test API that requires database access
curl -s https://jastipin.me/api/health | jq .

# Or specific endpoint:
curl -s https://jastipin.me/api/users | jq .

# Should return JSON without database errors
```

---

## 📝 TROUBLESHOOTING

### "ECONNREFUSED" or "connection refused"?
```bash
# Database host is not reachable
# Check:
# 1. DATABASE_URL is correct
# 2. Supabase project is active
# 3. Network connectivity: ping [HOST]
# 4. Firewall allows outbound on port 5432

# Test connection:
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

### "password authentication failed"?
```bash
# Wrong password in DATABASE_URL
# Check in Supabase Dashboard:
# 1. Settings → Database
# 2. Verify password you set during setup
# 3. Update .env file

# Try resetting password:
# 1. Supabase Dashboard → Settings → Database
# 2. Click "Reset database password"
# 3. Update .env with new password
```

### "Migrations pending" error?
```bash
# Run migrations:
cd /var/www/jastipin-api
pnpm exec prisma migrate deploy

# Check status:
pnpm exec prisma migrate status

# View migration files:
ls -la prisma/migrations/
```

### Too many connections?
```bash
# Connection pool exhausted
# Check in Supabase:
# Settings → Database → Connections

# Solutions:
# 1. Increase pool size (Settings → Connection Pooling)
# 2. Restart application: pm2 restart jastipin-api
# 3. Close unused connections: kill idle connections
```

### Slow queries?
```bash
# Enable query logging (Supabase)
# Settings → Database → Query Performance

# Or view from psql:
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

# Analyze slow query:
EXPLAIN ANALYZE SELECT ...
```

---

## ✅ COMPLETION CHECKLIST

Before moving to GitHub SSH setup, verify:

- [ ] Supabase connection credentials obtained
- [ ] DATABASE_URL configured in .env
- [ ] Direct database connection tested (psql works)
- [ ] Prisma migrations deployed
- [ ] Schema verified in database
- [ ] Application connects to database successfully
- [ ] Backup strategy configured
- [ ] Database monitoring setup

---

## 🚀 NEXT STEP

Database is connected and working!

Next: [06-github-ssh-setup.md](06-github-ssh-setup.md) - Setup GitHub SSH access

---

**Previous:** [04-nodejs-setup.md](04-nodejs-setup.md)  
**Next:** [06-github-ssh-setup.md](06-github-ssh-setup.md)  
**Duration:** 20-30 minutes  
**Difficulty:** ⭐⭐⭐☆☆

✅ **DATABASE SETUP COMPLETE - DATA LAYER IS CONNECTED!**

