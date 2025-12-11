# 🔧 TROUBLESHOOTING GUIDE

**Purpose:** Common issues and solutions for production server  
**Reference:** Quick lookup for debugging problems  
**Difficulty:** Variable (Easy to Expert)

---

## 🚨 QUICK DIAGNOSTIC CHECKLIST

When something isn't working, run this checklist first:

```bash
# SSH into server
ssh -i ~/.ssh/server-deploy deploy@YOUR_SERVER_IP

# 1. Check if application is running
pm2 list

# 2. Check if Nginx is running
sudo systemctl status nginx

# 3. Check if ports are open
sudo netstat -tupln | grep -E "80|443|3000"

# 4. Check disk space
df -h / | tail -1

# 5. Check memory
free -h | grep Mem

# 6. Check recent errors
pm2 logs jastipin-api --lines 20

# 7. Check Nginx errors
sudo tail -10 /var/log/nginx/jastipin.me.error.log

# 8. Test health endpoint
curl -v http://localhost:3000/health
```

---

## 🔴 CRITICAL ISSUES

### Issue: Application Not Responding (502 Bad Gateway)

**Symptoms:**
- Browser shows: "502 Bad Gateway"
- Cannot access https://jastipin.me
- Nginx is running but returns error

**Diagnosis:**
```bash
# Check if Node.js is running
pm2 list
# Should show jastipin-api online

# Check if listening on port 3000
sudo netstat -tupln | grep 3000
# Should show node listening

# Check PM2 logs for errors
pm2 logs jastipin-api --lines 50
```

**Solutions:**

```bash
# Solution 1: Check if application crashed
pm2 status

# If status is "stopped" or "exited":
pm2 restart jastipin-api

# Solution 2: Check for database connection issue
cat /var/www/jastipin-api/.env | grep DATABASE_URL

# Test database connection
psql $(cat /var/www/jastipin-api/.env | grep DATABASE_URL | cut -d= -f2)

# Solution 3: Check if dependencies are installed
cd /var/www/jastipin-api
ls -la node_modules/ | wc -l
# Should have many packages (>1000)

# If missing, reinstall:
pnpm install

# Solution 4: Check PM2 error logs
tail -50 /var/log/pm2/jastipin-api.error.log

# Solution 5: Check Nginx configuration
sudo nginx -t

# If syntax error, reload manually:
sudo systemctl reload nginx
```

**Prevention:**
- Monitor application health: `pm2 monit`
- Enable log rotation to prevent disk full
- Monitor database connections
- Set up email alerts for crashes

---

### Issue: High CPU Usage (Application Slow)

**Symptoms:**
- Server feels slow
- High CPU usage
- Memory usage increasing over time

**Diagnosis:**
```bash
# Check CPU usage
top -b -n 1 | head -20

# Check Node.js process specifically
ps aux | grep node | grep -v grep

# Monitor in real-time
pm2 monit

# Check for memory leaks
pm2 info jastipin-api
# Look for "increasing memory"
```

**Solutions:**

```bash
# Solution 1: Restart application (temporary fix)
pm2 restart jastipin-api

# Solution 2: Check for infinite loops in logs
pm2 logs jastipin-api | grep -i "error\|warning\|loop"

# Solution 3: Check if database queries are slow
cd /var/www/jastipin-api
tail -100 /var/log/pm2/jastipin-api.out.log | grep -i "query\|slow"

# Solution 4: Check if specific endpoint is problematic
curl -v http://localhost:3000/api/your-endpoint
# Monitor response time

# Solution 5: Increase Node memory limit (if needed)
# Edit ecosystem.config.js:
# max_memory_restart: '1G'
# Then: pm2 restart jastipin-api
```

---

### Issue: Out of Disk Space

**Symptoms:**
- "No space left on device" error
- Application won't write to logs
- Deployments fail

**Diagnosis:**
```bash
# Check disk usage
df -h /

# Find large directories
du -sh /* | sort -h

# Check log sizes
du -sh /var/log/*

# Check backup size
du -sh ~/backups/*
```

**Solutions:**

```bash
# Solution 1: Clear old logs
sudo logrotate -f /etc/logrotate.d/jastipin

# Solution 2: Delete old backups
rm ~/backups/jastipin-db-*.sql.gz -v
# Keep: find ~/backups -name "*.gz" -mtime +7 -delete

# Solution 3: Clear npm cache
pnpm store prune

# Solution 4: Check for large files
find ~ -type f -size +100M

# Solution 5: Clean /tmp
sudo rm -rf /tmp/*

# Solution 6: Check if database backups are filling up
du -sh ~/backups/
# Consider moving to external storage
```

---

## 🟠 COMMON ISSUES

### Issue: Database Connection Failing

**Symptoms:**
- Error: "ECONNREFUSED"
- Error: "password authentication failed"
- Error: "database does not exist"

**Diagnosis:**
```bash
# Test database connection directly
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Check DATABASE_URL in .env
cat /var/www/jastipin-api/.env | grep DATABASE_URL

# Check if Prisma can connect
cd /var/www/jastipin-api
pnpm exec prisma db execute --stdin < /dev/null
```

**Solutions:**

```bash
# Solution 1: Verify DATABASE_URL format
# Should be: postgresql://user:password@host:port/database

# Solution 2: Test host connectivity
ping supabase-host.supabase.co

# Solution 3: Check password is correct
# In Supabase dashboard: Settings → Database
# Verify password matches .env

# Solution 4: Reset Supabase password (if forgotten)
# In Supabase: Settings → Database → Reset database password
# Update .env with new password
# Restart application: pm2 restart jastipin-api

# Solution 5: Check if migrations are pending
pnpm exec prisma migrate status

# If pending, apply them:
pnpm exec prisma migrate deploy

# Solution 6: Test with direct psql
psql "postgresql://postgres:PASSWORD@HOST:5432/postgres"
# If this works, problem is in Prisma config
```

---

### Issue: HTTPS Certificate Issues

**Symptoms:**
- Browser shows: "Your connection is not private"
- Certificate error in browser
- "too many redirects" error

**Diagnosis:**
```bash
# Check certificate status
echo | openssl s_client -servername jastipin.me -connect jastipin.me:443 2>/dev/null | openssl x509 -noout -dates

# Check certificate path
sudo ls -la /etc/letsencrypt/live/jastipin.me/

# Check Nginx configuration
sudo grep -i "ssl_certificate" /etc/nginx/sites-available/jastipin.me
```

**Solutions:**

```bash
# Solution 1: Check certificate is valid
sudo certbot certificates

# Solution 2: Renew certificate manually
sudo certbot renew --force-renewal

# Solution 3: Check Nginx SSL configuration
sudo nginx -t

# If error, check configuration:
sudo nano /etc/nginx/sites-available/jastipin.me

# Solution 4: Fix "too many redirects"
# Usually caused by:
# - HTTP → HTTPS → HTTP loop
# - Check if backend is also redirecting

# Verify HTTP->HTTPS redirect is set up:
curl -I http://jastipin.me
# Should show: 301 Moved Permanently to https://

# Solution 5: Clear browser cache and try again
# Sometimes browser caches old redirect

# Solution 6: Check HSTS headers
curl -I https://jastipin.me | grep -i "strict-transport"
```

---

### Issue: Nginx Reverse Proxy Not Working

**Symptoms:**
- Access https://jastipin.me works in some cases
- Some endpoints return 502 or 504
- Random timeout errors

**Diagnosis:**
```bash
# Check Nginx configuration
sudo nginx -t

# Test through Nginx locally
curl -H "Host: jastipin.me" http://127.0.0.1/

# Test backend directly
curl http://127.0.0.1:3000/

# Check Nginx error logs
sudo tail -20 /var/log/nginx/jastipin.me.error.log

# Monitor live requests
sudo tail -f /var/log/nginx/jastipin.me.access.log
```

**Solutions:**

```bash
# Solution 1: Check backend is running
pm2 status

# Solution 2: Verify Nginx configuration
sudo cat /etc/nginx/sites-available/jastipin.me | grep -A5 "proxy_pass"

# Should show: proxy_pass http://127.0.0.1:3000;

# Solution 3: Increase Nginx timeouts (for slow requests)
sudo nano /etc/nginx/sites-available/jastipin.me

# Add to server block:
# proxy_connect_timeout 60s;
# proxy_send_timeout 60s;
# proxy_read_timeout 60s;

# Save and test:
sudo nginx -t
sudo systemctl reload nginx

# Solution 4: Check if 127.0.0.1:3000 is listening
sudo netstat -tupln | grep 3000

# Solution 5: Disable gzip if causing issues
# In Nginx config, comment out gzip settings:
# # gzip on;
# # gzip_types ...

# Reload:
sudo systemctl reload nginx
```

---

### Issue: PM2 Process Keeps Restarting

**Symptoms:**
- Application restarts every few seconds
- Cannot stay online
- PM2 shows high restart count

**Diagnosis:**
```bash
# Check restart count
pm2 list

# View PM2 logs
pm2 logs jastipin-api --lines 100

# Check if crashing immediately
pm2 info jastipin-api | grep -i "restart"
```

**Solutions:**

```bash
# Solution 1: Check for startup errors
pm2 logs jastipin-api --err --lines 50

# Common errors:
# - Missing .env variables
# - Port already in use
# - Syntax error in code
# - Database not accessible

# Solution 2: Check if port is in use
sudo lsof -i :3000

# If another process is using port:
sudo kill -9 <PID>

# Solution 3: Verify environment variables
cat /var/www/jastipin-api/.env | head -10

# Check if DATABASE_URL is set:
grep DATABASE_URL /var/www/jastipin-api/.env

# Solution 4: Check if dependencies are installed
cd /var/www/jastipin-api
pnpm install

# Solution 5: Increase PM2 restart delay
# Edit ecosystem.config.js:
# {
#   restart_delay: 1000,
#   max_restarts: 10,
#   min_uptime: 10s
# }

# Solution 6: Delete and restart
pm2 delete jastipin-api
cd /var/www/jastipin-api
pm2 start ecosystem.config.js
pm2 save
```

---

### Issue: GitHub Actions Deployment Failing

**Symptoms:**
- Workflow shows ❌ in GitHub Actions
- Deployment doesn't reach server
- "Permission denied" errors

**Diagnosis:**
```bash
# View GitHub Actions logs
# Go to: GitHub → Actions → Workflow runs

# Check deployment SSH key is correct
# In GitHub: Settings → Secrets → DEPLOY_SSH_KEY

# Test SSH connection manually
ssh -i ~/.ssh/github-deploy deploy@YOUR_SERVER_IP "pwd"
```

**Solutions:**

```bash
# Solution 1: Check SSH key format in GitHub secret
# Key must include: -----BEGIN OPENSSH PRIVATE KEY-----
# And end with: -----END OPENSSH PRIVATE KEY-----

# Solution 2: Verify all GitHub secrets are set
# GitHub → Settings → Secrets → Actions
# Check: DEPLOY_SSH_KEY, DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH

# Solution 3: Test SSH key on server
ssh-keyscan -H github.com >> ~/.ssh/known_hosts

# Solution 4: Check server firewall allows SSH from GitHub IPs
# GitHub Actions uses various IPs
# Make sure your firewall allows port 22

# Solution 5: Check application directory permissions
ls -la /var/www/jastipin-api | head

# Should be owned by deploy:deploy

# Solution 6: Increase deployment timeout in workflow
# In .github/workflows/deploy.yml:
# jobs:
#   deploy:
#     timeout-minutes: 60
```

---

## 🟢 TIPS & OPTIMIZATION

### Improve Application Performance

```bash
# Enable Node.js clustering
# In ecosystem.config.js:
# {
#   instances: 'max',
#   exec_mode: 'cluster'
# }

# Enable HTTP/2 in Nginx
sudo nano /etc/nginx/sites-available/jastipin.me
# Find: listen 443 ssl;
# Change to: listen 443 ssl http2;

# Enable caching headers
# Add to responses: Cache-Control: max-age=3600

# Compress responses
# Gzip already configured in Nginx
```

### Reduce Database Load

```bash
# Add database indexes
# In Prisma schema:
# model User {
#   @@index([email])
#   @@index([createdAt])
# }

# Batch queries instead of individual calls
# Instead of: for (let user of users) { await db.query(...) }
# Use: await db.query(...) with IN clause

# Cache frequently accessed data
# Use Redis or in-memory cache
```

### Monitor and Debug

```bash
# View real-time requests
pm2 logs jastipin-api --lines 1 --raw

# Monitor memory leak
pm2 monitor

# Profile with Node inspector
node --inspect /var/www/jastipin-api/dist/index.js
# Then visit: chrome://inspect

# Check slow queries
# In Supabase: Analytics → Slow Queries
```

---

## 📞 SUPPORT & ESCALATION

When to escalate issues:

```
Server issues (Nginx, SSL, ports):
  → Ask server hosting provider
  
Database issues (Supabase connection, migrations):
  → Check Supabase status page
  → Check GitHub for Prisma issues
  
Application code issues (crashes, errors):
  → Check application logs
  → Check recent git changes
  → Review error stack trace
```

---

## 🆘 EMERGENCY PROCEDURES

### If Server is Completely Down

```bash
# 1. Check if server is reachable
ping YOUR_SERVER_IP

# 2. Try to SSH
ssh -i ~/.ssh/server-deploy deploy@YOUR_SERVER_IP

# 3. If SSH fails, use provider's console:
#    - Digital Ocean: Droplets → Console
#    - AWS: EC2 → Connect → Session Manager
#    - Vultr: Instances → View Console

# 4. Check from provider console:
sudo reboot  # Restart server

# 5. Check system logs
dmesg | tail -50

# 6. Check if disk is full
df -h

# 7. Check if services crashed
systemctl status nginx
systemctl status ssh
```

### If Database is Down

```bash
# Check Supabase status page:
# https://status.supabase.com

# If Supabase is down:
# 1. Application will receive connection errors
# 2. Return 503 Service Unavailable to users
# 3. Wait for Supabase to recover
# 4. No manual action needed

# If it's a connection issue:
# 1. Verify DATABASE_URL is correct
# 2. Check firewall allows outbound port 5432
# 3. Restart application: pm2 restart jastipin-api
```

### If Website is Defaced/Compromised

```bash
# 1. Take application offline temporarily:
sudo systemctl stop nginx

# 2. Check for unauthorized changes:
cd /var/www/jastipin-api
git status
git log --oneline -10

# 3. Restore from backup if needed:
git reset --hard [GOOD_COMMIT_HASH]
pm2 restart jastipin-api

# 4. Check SSH logs for unauthorized access:
sudo grep "sshd" /var/log/auth.log | grep "Failed\|Accepted"

# 5. Change SSH key if compromised:
ssh-keygen -t ed25519 -f ~/.ssh/server-deploy
```

---

## 📝 COMMON ERROR MESSAGES & SOLUTIONS

| Error | Cause | Solution |
|-------|-------|----------|
| ECONNREFUSED | Backend not running | `pm2 restart jastipin-api` |
| 502 Bad Gateway | Nginx can't reach backend | Check if Node.js is listening on 3000 |
| FATAL: password auth failed | Wrong database password | Update DATABASE_URL in .env |
| ENOSPC: no space left | Disk full | Delete old logs, backups |
| ENOMEM | Out of memory | Restart PM2: `pm2 kill && pm2 start` |
| permission denied | File permissions | `chmod` appropriate permissions |
| Address already in use | Port conflict | `sudo lsof -i :3000` and kill process |
| timeout | Slow response | Increase Nginx timeout settings |
| too many redirects | HTTP/HTTPS loop | Check Nginx redirect configuration |
| certificate expired | SSL cert expired | `sudo certbot renew` |

---

## ✅ VERIFICATION CHECKLIST

After fixing an issue, verify:

- [ ] Application is responding (curl http://localhost:3000/health)
- [ ] HTTPS is working (curl https://jastipin.me/health)
- [ ] Database is connected (check PM2 logs)
- [ ] No errors in logs (pm2 logs --)
- [ ] No disk space issues (df -h)
- [ ] PM2 process is stable (pm2 monit)
- [ ] Recent requests are being served (tail access.log)

---

**Previous:** [08-monitoring-backup.md](08-monitoring-backup.md)  
**Parent:** [README.md](README.md)  
**Difficulty:** ⭐⭐⭐⭐⭐

✅ **TROUBLESHOOTING GUIDE COMPLETE - REFERENCE READY!**

