# 🖥️ SERVER SETUP DOCUMENTATION

**Purpose:** Complete guide untuk setup server baru untuk JASTIPIN.ME  
**Last Updated:** December 11, 2025  
**Target:** Ubuntu 20.04 LTS or 22.04 LTS

---

## 📚 DOCUMENTATION INDEX

Dokumentasi ini terdiri dari 9 bagian yang harus diikuti secara berurutan:

### 1. **00-prerequisites.md** ⭐ START HERE
- Prerequisites & requirements
- Server spesifikasi minimum
- Tools yang dibutuhkan
- Domain & DNS setup

**Time:** 15 menit  
**Action:** Persiapkan sebelum mulai

---

### 2. **01-initial-server-setup.md**
- SSH into server
- Create new user (non-root)
- Setup sudo access
- Firewall configuration (UFW)
- SSH key-based auth
- Disable password login

**Time:** 30 menit  
**Action:** Keamanan dasar server

---

### 3. **02-nginx-setup.md**
- Install Nginx
- Configure Nginx
- Setup reverse proxy
- Create server blocks
- Test Nginx config

**Time:** 30 menit  
**Action:** Web server setup

---

### 4. **03-ssl-certificate.md** ⭐ IMPORTANT
- Install Certbot
- Create SSL certificate dengan Let's Encrypt
- Auto-renewal setup
- HTTPS redirect
- Test SSL certificate

**Time:** 20 menit  
**Action:** Keamanan HTTPS

---

### 5. **04-nodejs-setup.md**
- Install Node.js (v18+)
- Install PNPM
- Install PM2 (process manager)
- Setup PM2 startup script
- Verify installation

**Time:** 30 menit  
**Action:** Runtime setup

---

### 6. **05-database-setup.md**
- PostgreSQL local setup (optional)
- Supabase connection setup
- Database user creation
- Backup configuration
- Connection pooling

**Time:** 30 menit  
**Action:** Database config

---

### 7. **06-github-ssh-setup.md** ⭐ CRITICAL
- Generate SSH keys on server
- Add public key to GitHub
- Test GitHub connection
- Deploy keys setup
- Clone repository

**Time:** 20 menit  
**Action:** Git authentication

---

### 8. **07-ci-cd-integration.md**
- Setup deployment user
- Configure GitHub Actions
- Auto-deploy setup
- Webhook configuration
- Test CI/CD pipeline

**Time:** 40 menit  
**Action:** Automation setup

---

### 9. **08-monitoring-backup.md**
- Health check setup
- Log rotation configuration
- Backup scripts
- Monitoring tools
- Email alerts

**Time:** 30 menit  
**Action:** Production readiness

---

### 10. **09-troubleshooting.md**
- Common issues & solutions
- Debug commands
- Log locations
- Performance tuning
- Security hardening

**Time:** Reference  
**Action:** Problem solving

---

## 🎯 QUICK START

### Estimated Total Time: 4-5 hours (one-time setup)

```bash
# Day 1: Initial Setup (2 hours)
1. Read: 00-prerequisites.md
2. Run: 01-initial-server-setup.md
3. Run: 02-nginx-setup.md
4. Run: 03-ssl-certificate.md

# Day 1-2: Application Setup (2-3 hours)
5. Run: 04-nodejs-setup.md
6. Run: 05-database-setup.md
7. Run: 06-github-ssh-setup.md
8. Run: 07-ci-cd-integration.md

# Day 2+: Maintenance
9. Run: 08-monitoring-backup.md
10. Reference: 09-troubleshooting.md
```

---

## ✅ PREREQUISITE CHECKLIST

Before starting, ensure you have:

- [ ] Domain name registered
- [ ] Domain pointing to server IP (DNS A record)
- [ ] Server access (SSH credentials or root password)
- [ ] Ubuntu 20.04 or 22.04 LTS
- [ ] Minimum 2GB RAM, 2 CPU cores, 20GB disk
- [ ] GitHub account
- [ ] Basic command-line knowledge

---

## 📋 SERVER REQUIREMENTS

### Minimum Specifications

```
CPU:          2 cores
RAM:          2GB (4GB recommended for database)
Storage:      20GB (50GB for production with backups)
OS:           Ubuntu 20.04 LTS or 22.04 LTS
Bandwidth:    Unmetered or 500GB+/month
Uptime SLA:   99%+ (for production)
```

### Recommended Providers

```
Digital Ocean (Referral: $5/month droplet)
Linode (Akamai)
Vultr (High performance)
Hetzner (Best value)
AWS EC2 (t3.small)
Azure (B1s or B2s)
```

---

## 🔐 SECURITY CHECKLIST

After completing all steps, verify:

- [ ] SSH password login disabled
- [ ] Firewall (UFW) enabled
- [ ] Only ports 22 (SSH), 80 (HTTP), 443 (HTTPS) open
- [ ] SSL certificate installed and auto-renewing
- [ ] Fail2Ban or similar protection enabled
- [ ] Regular backups configured
- [ ] Health checks monitoring
- [ ] Log rotation enabled
- [ ] Unattended-upgrades for security patches

---

## 📊 ARCHITECTURE AFTER SETUP

```
Internet (Users)
    ↓
Cloudflare CDN (optional)
    ↓
Nginx (Port 80/443)
├─ HTTPS redirect
├─ Static assets cache
└─ Reverse proxy
    ↓
Node.js Backend (Port 4000)
├─ Express API
├─ PM2 process manager
└─ Health checks
    ↓
Supabase PostgreSQL
├─ Database
├─ Backups
└─ Connection pooling
```

---

## 🚀 POST-SETUP

After completing all steps:

1. **Deploy Application**
   ```bash
   cd /app
   pnpm install
   pnpm build
   pm2 start ecosystem.config.cjs --env production
   ```

2. **Verify Everything**
   ```bash
   curl https://jastipin.me/health
   # Should return 200 OK
   ```

3. **Setup Monitoring**
   - Monitor disk space
   - Monitor memory usage
   - Monitor error logs
   - Monitor uptime

4. **Regular Maintenance**
   - Monthly security updates
   - Database backups (daily)
   - Log reviews (weekly)
   - Performance tuning (as needed)

---

## 📞 NEED HELP?

### Common Issues:

- **SSH key not working?** → See 06-github-ssh-setup.md
- **SSL certificate failed?** → See 03-ssl-certificate.md
- **Nginx not starting?** → See 09-troubleshooting.md
- **Database connection error?** → See 05-database-setup.md
- **Deployment failed?** → See 07-ci-cd-integration.md

---

## 📚 READING ORDER

**First Time Setup:**
```
1. 00-prerequisites.md (read completely)
2. 01-initial-server-setup.md (execute step-by-step)
3. 02-nginx-setup.md (execute step-by-step)
4. 03-ssl-certificate.md (execute step-by-step)
5. 04-nodejs-setup.md (execute step-by-step)
6. 05-database-setup.md (execute step-by-step)
7. 06-github-ssh-setup.md (execute step-by-step)
8. 07-ci-cd-integration.md (execute step-by-step)
9. 08-monitoring-backup.md (read + execute)
```

**Reference (As Needed):**
```
09-troubleshooting.md (when issues occur)
```

---

## 💡 KEY CONCEPTS

### SSH (Secure Shell)
- Remote command execution
- Key-based authentication (better than passwords)
- Server access without exposing password

### Nginx
- Web server & reverse proxy
- Handles HTTP/HTTPS traffic
- Forwards requests to Node.js backend

### SSL Certificate
- HTTPS encryption (secure)
- Let's Encrypt (free certificates)
- Auto-renewal every 90 days

### Node.js & PM2
- Application runtime
- PM2 = process manager (keeps app running)
- Auto-restart on crash

### CI/CD
- GitHub Actions triggers deployment
- Automatic testing before deploy
- Zero-downtime deployments

---

## 🎯 SUCCESS CRITERIA

After completing all steps, you should have:

✅ Server accessible via SSH  
✅ Nginx running on port 80/443  
✅ SSL certificate installed (valid HTTPS)  
✅ Node.js & PNPM installed  
✅ GitHub SSH keys configured  
✅ Application deployed via CI/CD  
✅ Database connected and tested  
✅ Monitoring & backups enabled  
✅ All logs accessible and monitored  
✅ Health check endpoint working  

---

## 📝 NOTES

- All commands assume Ubuntu 20.04+
- Adapt paths and domains to your needs
- Keep backups of sensitive configs
- Test SSL before going live
- Monitor first 24 hours closely
- Keep security updates current

---

## 🔐 SECURITY REMINDERS

```
🔴 NEVER:
- Commit SSH keys to Git
- Share server passwords
- Use weak passwords
- Leave firewall open
- Run applications as root
- Use HTTP in production

🟢 ALWAYS:
- Use SSH keys instead of passwords
- Keep SSH key safe (chmod 600)
- Backup database regularly
- Update system regularly
- Monitor logs for errors
- Test backups regularly
- Use strong, unique passwords
- Enable HTTPS (SSL/TLS)
```

---

## 📊 TIMELINE

```
Setup:        4-5 hours (complete all steps)
Deployment:   30 minutes (push to GitHub, auto-deploy)
Verification: 30 minutes (test everything)
Monitoring:   Ongoing (first week intensive)
────────────────────────
Total:        ~6 hours one-time setup
Ongoing:      ~1 hour/week for maintenance
```

---

## 📞 SUPPORT

For specific sections:
- Nginx issues → See 02-nginx-setup.md
- SSL issues → See 03-ssl-certificate.md
- SSH issues → See 06-github-ssh-setup.md
- CI/CD issues → See 07-ci-cd-integration.md
- Database issues → See 05-database-setup.md

---

**Next Step:** Start with [00-prerequisites.md](00-prerequisites.md)

🚀 **READY TO SETUP YOUR SERVER?**
