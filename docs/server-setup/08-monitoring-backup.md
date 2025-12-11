# 📊 MONITORING, LOGGING & BACKUPS

**Purpose:** Setup monitoring, health checks, logging, and backup automation  
**Time Required:** 30-40 minutes  
**Prerequisites:** [07-ci-cd-integration.md](07-ci-cd-integration.md) ✅  
**Next Step:** [09-troubleshooting.md](09-troubleshooting.md)

---

## 📋 WHAT WE'LL DO

1. ✅ Setup PM2 monitoring
2. ✅ Configure application health checks
3. ✅ Setup log rotation
4. ✅ Configure automated backups
5. ✅ Setup uptime monitoring
6. ✅ Configure email/slack alerts

---

## 📈 STEP 1: PM2 MONITORING & LOGS

**Check PM2 status:**

```bash
# SSH into server
ssh -i ~/.ssh/server-deploy deploy@YOUR_SERVER_IP

# View all processes
pm2 list

# Should show:
# id │ name        │ status │ cpu │ memory
# ─────────────────────────────────────────
# 0  │ jastipin-api │ online │ 0%  │ 45.2 MB
```

**Real-time monitoring:**

```bash
# Watch processes in real-time
pm2 monit

# Shows:
# - CPU usage per process
# - Memory usage per process
# - Restart count
# - Uptime

# Press 'q' to quit
```

**View detailed logs:**

```bash
# View last 50 lines
pm2 logs jastipin-api --lines 50

# View specific log file
tail -f /var/log/pm2/jastipin-api.out.log

# View errors only
pm2 logs jastipin-api --err --lines 100

# Search for errors
grep -i error /var/log/pm2/jastipin-api.error.log
```

---

## 🏥 STEP 2: SETUP APPLICATION HEALTH CHECK ENDPOINT

**Add health check endpoint to your Express app:**

```bash
# Edit your Express application
cd /var/www/jastipin-api
nano src/index.ts

# Add this endpoint (at the end, before server.listen()):
```

```typescript
// Health check endpoint (add before server.listen())
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  });
});

// Ready check endpoint (includes database check)
app.get('/api/health/ready', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not-ready',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Liveness check endpoint (simple status)
app.get('/api/health/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});
```

**Rebuild and restart:**

```bash
# Build
pnpm run build

# Restart PM2
pm2 restart jastipin-api

# Wait a few seconds, then test
sleep 2

# Test health endpoint
curl http://localhost:3000/health

# Should return:
# {
#   "status": "healthy",
#   "timestamp": "2024-XX-XXT00:00:00Z",
#   "uptime": 123.45,
#   "memory": {...}
# }
```

---

## 🔄 STEP 3: CONFIGURE LOG ROTATION

**Prevent logs from filling up disk:**

```bash
# Install logrotate (usually pre-installed)
sudo apt install -y logrotate

# Create rotation config
sudo nano /etc/logrotate.d/jastipin

# Paste this configuration:
```

```
/var/log/pm2/jastipin-api.*.log {
  daily
  rotate 14
  compress
  delaycompress
  notifempty
  create 0640 deploy deploy
  sharedscripts
  postrotate
    pm2 reload jastipin-api
  endscript
}

/var/log/nginx/jastipin.me.*.log {
  daily
  rotate 30
  compress
  delaycompress
  notifempty
  create 0640 www-data www-data
  sharedscripts
  postrotate
    systemctl reload nginx
  endscript
}
```

**Save: Ctrl+X → Y → Enter**

**Test log rotation:**

```bash
# Test logrotate config
sudo logrotate -d /etc/logrotate.d/jastipin

# Should show: considering /var/log/pm2/jastipin-api...

# Force rotation (for testing)
sudo logrotate -f /etc/logrotate.d/jastipin

# Check rotated logs
ls -la /var/log/pm2/
# Should show: jastipin-api.out.log.1.gz, jastipin-api.out.log.2.gz, etc.
```

---

## 💾 STEP 4: DATABASE BACKUP AUTOMATION

**Create backup script:**

```bash
# Create backup script
nano ~/backup-database.sh

# Paste this script:
```

```bash
#!/bin/bash

# Database Backup Script
# Backs up Supabase database and stores locally

BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DAYS_TO_KEEP=30

# Load environment
export $(cat /var/www/jastipin-api/.env | grep DATABASE_URL)

# Create backup directory
mkdir -p $BACKUP_DIR

# Extract database details
DB_URL=$DATABASE_URL

# Backup database (assuming Supabase connection)
echo "Starting backup at $(date)"

# Extract connection parameters from DATABASE_URL
HOST=$(echo $DB_URL | sed -E 's|.*@([^:]+):.*|\1|')
USER=$(echo $DB_URL | sed -E 's|.*//([^:]+):.*|\1|')

# Backup using pg_dump (requires psql client)
PGPASSWORD=${DB_URL#*//} PGPASSWORD=${PGPASSWORD%%@*} \
PGPASSWORD=${PGPASSWORD#*:} \
pg_dump -h $HOST -U postgres postgres > "$BACKUP_DIR/jastipin-db-$DATE.sql" 2>/dev/null

if [ $? -eq 0 ]; then
    # Compress backup
    gzip "$BACKUP_DIR/jastipin-db-$DATE.sql"
    
    # Remove old backups
    find $BACKUP_DIR -name "jastipin-db-*.sql.gz" -mtime +$DAYS_TO_KEEP -delete
    
    echo "✅ Backup completed: jastipin-db-$DATE.sql.gz"
    echo "Backup size: $(du -h $BACKUP_DIR/jastipin-db-$DATE.sql.gz | cut -f1)"
else
    echo "❌ Backup failed"
    exit 1
fi
```

**Make executable:**

```bash
# Make script executable
chmod +x ~/backup-database.sh

# Test it
~/backup-database.sh

# Check if backup was created
ls -lh ~/backups/
```

**Schedule automatic daily backup:**

```bash
# Add to crontab
crontab -e

# Add this line (backup at 2 AM daily):
# 0 2 * * * /home/deploy/backup-database.sh >> /var/log/backup.log 2>&1

# List cron jobs to verify
crontab -l
# Should show your backup job
```

---

## 📦 STEP 5: APPLICATION CODE BACKUP

**Backup your application directory:**

```bash
# Create backup of application code
nano ~/backup-application.sh

# Paste this script:
```

```bash
#!/bin/bash

BACKUP_DIR="/home/deploy/backups"
APP_DIR="/var/www/jastipin-api"
DATE=$(date +%Y%m%d)

# Create backup
tar -czf "$BACKUP_DIR/jastipin-code-$DATE.tar.gz" \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='logs' \
  $APP_DIR

# Keep only last 30 days
find $BACKUP_DIR -name "jastipin-code-*.tar.gz" -mtime +30 -delete

echo "✅ Code backup completed: jastipin-code-$DATE.tar.gz"
```

**Add to crontab:**

```bash
# Add to crontab
crontab -e

# Add line (backup at 3 AM daily):
# 0 3 * * * /home/deploy/backup-application.sh >> /var/log/backup.log 2>&1
```

---

## 🌐 STEP 6: SETUP UPTIME MONITORING

**Using free service: Uptime Robot**

1. Go to: https://uptimerobot.com
2. Create account or login
3. Click: **Add Monitor**
4. Select: **HTTPS** (or HTTP)
5. Enter your domain: `https://jastipin.me/health`
6. Interval: **5 minutes** (free tier)
7. Click: **Create Monitor**

**For local monitoring:**

```bash
# Create simple uptime check script
nano ~/check-uptime.sh

# Paste:
```

```bash
#!/bin/bash

URL="https://jastipin.me/health"
TIMEOUT=10
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT $URL)

if [ "$RESPONSE" = "200" ]; then
    echo "✅ $(date): Application is UP"
    exit 0
else
    echo "❌ $(date): Application is DOWN (HTTP $RESPONSE)"
    # Optional: Send alert
    # echo "Alert: Application down" | mail -s "Jastipin Alert" admin@example.com
    exit 1
fi
```

**Schedule health checks:**

```bash
# Add to crontab (check every 5 minutes)
crontab -e

# 0,5,10,15,20,25,30,35,40,45,50,55 * * * * /home/deploy/check-uptime.sh >> /var/log/uptime.log 2>&1

# View results
tail -f /var/log/uptime.log
```

---

## 📧 STEP 7: SETUP EMAIL ALERTS

**Configure system email (optional):**

```bash
# Install mail utility
sudo apt install -y mailutils

# Configure basic mail settings
sudo dpkg-reconfigure exim4-config
# Select: internet site
# System mail name: jastipin.me
```

**Create alert script:**

```bash
# Create alert script
nano ~/send-alert.sh

# Paste:
```

```bash
#!/bin/bash

ALERT_EMAIL="admin@jastipin.me"
SUBJECT="⚠️ Jastipin Server Alert"
MESSAGE="$1"

echo "$MESSAGE" | mail -s "$SUBJECT" "$ALERT_EMAIL"

# Log alert
echo "[$(date)] Alert sent: $MESSAGE" >> /var/log/alerts.log
```

**Test alert:**

```bash
# Send test alert
~/send-alert.sh "Test alert message"

# Check if email was sent
tail /var/log/alerts.log
```

---

## 📊 STEP 8: MONITOR DISK SPACE

**Check disk usage:**

```bash
# View disk usage
df -h

# Should show:
# /dev/sda1  50G  20G  30G  40% /

# View directory sizes
du -sh /var/www/*
du -sh /var/log/*
du -sh ~/backups/*
```

**Setup disk usage alert:**

```bash
# Create disk check script
nano ~/check-disk.sh

# Paste:
```

```bash
#!/bin/bash

THRESHOLD=80  # Alert if >80% used
USAGE=$(df / | awk 'NR==2 {print $5}' | cut -d'%' -f1)

if [ $USAGE -gt $THRESHOLD ]; then
    echo "⚠️ Disk usage: $USAGE%"
    ~/send-alert.sh "Disk usage critical: $USAGE%"
else
    echo "✅ Disk usage: $USAGE%"
fi
```

**Add to crontab:**

```bash
# Check disk daily
crontab -e

# 0 8 * * * /home/deploy/check-disk.sh >> /var/log/disk-check.log 2>&1
```

---

## 🔍 STEP 9: NGINX MONITORING

**Check Nginx status:**

```bash
# View Nginx processes
ps aux | grep nginx

# Check access logs
tail -20 /var/log/nginx/jastipin.me.access.log

# View error logs
tail -20 /var/log/nginx/jastipin.me.error.log

# Count requests per minute (last hour)
awk '{print $4}' /var/log/nginx/jastipin.me.access.log | cut -d: -f1-2 | sort | uniq -c | tail -60
```

**Monitor response times:**

```bash
# View average response times
awk '{print $10}' /var/log/nginx/jastipin.me.access.log | awk '{sum+=$1; count++} END {print "Avg time: " sum/count " ms"}'
```

---

## 📈 STEP 10: CREATE MONITORING DASHBOARD

**Simple dashboard script:**

```bash
# Create dashboard
nano ~/dashboard.sh

# Paste:
```

```bash
#!/bin/bash

echo "=========================================="
echo "  JASTIPIN SERVER MONITORING DASHBOARD"
echo "=========================================="
echo ""

# System info
echo "📊 SYSTEM STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
uname -a
echo ""

# CPU and Memory
echo "💻 CPU & MEMORY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
free -h
echo ""

# Disk
echo "💾 DISK USAGE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
df -h | grep -E "^/dev|Mounted"
echo ""

# Processes
echo "🚀 APPLICATION STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 list
echo ""

# Network
echo "🌐 NETWORK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
netstat -tupln | grep -E "LISTEN|Proto"
echo ""

# Services
echo "🔧 SERVICES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
systemctl status nginx --no-pager | grep Active
systemctl status pm2-deploy --no-pager | grep Active
echo ""

# Recent errors
echo "❌ RECENT ERRORS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tail -5 /var/log/pm2/jastipin-api.error.log
echo ""

echo "=========================================="
```

**Run dashboard:**

```bash
# Make executable
chmod +x ~/dashboard.sh

# Run it
~/dashboard.sh

# Or display continuously
watch -n 5 ~/dashboard.sh  # Updates every 5 seconds
```

---

## 🔐 STEP 11: SECURITY MONITORING

**Check for suspicious activity:**

```bash
# Failed login attempts
sudo grep "Failed password" /var/log/auth.log | wc -l

# View failed logins
sudo tail -20 /var/log/auth.log | grep -i failed

# Check who's logged in
w

# View SSH connections
sudo grep "sshd" /var/log/auth.log | grep -i "connection" | tail -10
```

**Monitor open ports:**

```bash
# List listening ports
sudo netstat -tupln | grep LISTEN

# Monitor new connections
sudo watch -n 1 'netstat -tupln | grep LISTEN'
```

---

## ✅ COMPLETION CHECKLIST

Before moving to troubleshooting, verify:

- [ ] PM2 monitoring configured
- [ ] Health check endpoint working
- [ ] Log rotation configured
- [ ] Database backup script created and tested
- [ ] Application code backup configured
- [ ] Uptime monitoring enabled
- [ ] Email alerts configured (optional)
- [ ] Disk space monitoring setup
- [ ] Dashboard script working

---

## 🚀 NEXT STEP

Your server is now actively monitored and backed up!

Next: [09-troubleshooting.md](09-troubleshooting.md) - Common issues and solutions

---

**Previous:** [07-ci-cd-integration.md](07-ci-cd-integration.md)  
**Next:** [09-troubleshooting.md](09-troubleshooting.md)  
**Duration:** 30-40 minutes  
**Difficulty:** ⭐⭐⭐☆☆

✅ **MONITORING & BACKUP SETUP COMPLETE!**

