droi# Deployment Strategy - Jastipin.me

**Last Updated:** 2025-11-18

## Current Architecture (CORRECT ✅)

```
Internet → Cloudflare (CDN/Proxy) → Nginx (VPS) → Applications
                                           ├─→ Next.js (port 3000) - Frontend
                                           └─→ Express (port 4000) - Backend API
```

### Why This Architecture?

1. **VPS Control**: Full control over Node.js runtime, filesystem, dependencies
2. **No Edge Limitations**: Can use any Node.js library, database drivers, native modules
3. **Cost**: VPS already paid (4 vCPU, 8GB RAM, free 1 year)
4. **Simplicity**: Standard deployment stack that 99% of tutorials cover
5. **Cloudflare Benefits**: DDoS protection, CDN caching, SSL termination - WITHOUT edge runtime constraints

---

## ❌ What We STOPPED Doing (Cloudflare Pages)

### Why Cloudflare Pages Failed:

**Error:**
```
⚡️ ERROR: Failed to produce a Cloudflare Pages build from the project.
⚡️ The following routes were not configured to run with the Edge Runtime:
⚡️   - /[username]
⚡️   - /auth
⚡️   - /inv/[invoiceId]
```

**Root Cause:**
- Cloudflare Pages with `@cloudflare/next-on-pages` adapter **requires ALL dynamic routes to use Edge Runtime**
- Edge Runtime has severe limitations:
  - ❌ No native Node.js APIs (fs, path, crypto, etc.)
  - ❌ No `require()` statements (ES Modules only)
  - ❌ Many npm packages incompatible (need to check every dependency)
  - ❌ Cannot use `node_modules` that rely on Node.js APIs

**Our Frontend Stack (NOT Edge-Compatible):**
- React Context API (`useAuth`)
- Shadcn/ui components (some use Node.js APIs internally)
- Multiple API client libraries
- Database connection pooling (PostgreSQL)
- Session management with cookies

**Conclusion:** Forcing this project to Edge Runtime would require:
1. Complete refactor of frontend architecture
2. Rewrite all API clients for fetch-only
3. Replace incompatible libraries
4. Test every dependency for Edge compatibility

**This is NOT worth it at current stage.** Focus on building product, not fighting infrastructure.

---

## ✅ Correct Deployment Process (VPS)

### 1. DNS Configuration (Cloudflare)

| Record | Type | Name | Content | Proxy |
|--------|------|------|---------|-------|
| A | A | jastipin.me | `YOUR_VPS_IP` | ✅ Proxied (Orange) |
| A | A | www | `YOUR_VPS_IP` | ✅ Proxied (Orange) |
| A | A | api.jastipin.me | `YOUR_VPS_IP` | ✅ Proxied (Orange) |

**DO NOT:**
- ❌ Add CNAME to `*.pages.dev`
- ❌ Enable Cloudflare Pages deployment
- ❌ Use "Direct" DNS (grey cloud) - lose DDoS protection

### 2. Frontend Deployment (Next.js on VPS)

```bash
# Navigate to frontend directory
cd /app/frontend

# Install dependencies
pnpm install

# Build production bundle (Node.js runtime)
pnpm build

# Start production server (port 3000)
pm2 start "pnpm start" --name jastipin-frontend

# Save PM2 configuration
pm2 save

# Enable PM2 startup on boot
pm2 startup
```

**Verify:**
```bash
# Check if Next.js is running
pm2 list

# Check port 3000 is listening
ss -tlnp | grep 3000

# Test locally
curl http://localhost:3000
```

### 3. Backend Deployment (Express on VPS)

```bash
# Navigate to backend directory
cd /app/backend

# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Start production server (port 4000)
pm2 start ecosystem.config.cjs --env production

# Save PM2 configuration
pm2 save
```

**Verify:**
```bash
pm2 list
ss -tlnp | grep 4000
curl http://localhost:4000/api/health
```

### 4. Nginx Configuration

**File:** `/etc/nginx/sites-available/jastipin.conf`

```nginx
# HTTP → HTTPS Redirect
server {
    listen 80;
    server_name jastipin.me www.jastipin.me;
    return 301 https://$host$request_uri;
}

# Frontend (jastipin.me)
server {
    listen 443 ssl http2;
    server_name jastipin.me www.jastipin.me;

    ssl_certificate /etc/letsencrypt/live/jastipin.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jastipin.me/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API (api.jastipin.me)
server {
    listen 443 ssl http2;
    server_name api.jastipin.me;

    ssl_certificate /etc/letsencrypt/live/api.jastipin.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.jastipin.me/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Apply configuration:**
```bash
# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Check status
systemctl status nginx
```

### 5. SSL Certificates (Let's Encrypt)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Generate certificates for frontend
certbot --nginx -d jastipin.me -d www.jastipin.me

# Generate certificate for backend
certbot --nginx -d api.jastipin.me

# Auto-renewal is enabled by default
# Test renewal process
certbot renew --dry-run
```

### 6. Firewall Configuration

```bash
# Allow HTTP, HTTPS, SSH
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

**Note:** Ports 3000 and 4000 should NOT be exposed directly to internet. Only Nginx should access them.

---

## Maintenance Mode

### Option 1: Next.js Middleware (Soft Maintenance)

**File:** `/app/frontend/middleware.ts`

Set environment variable:
```bash
# In /app/frontend/.env.production
NEXT_PUBLIC_MAINTENANCE_MODE=true
```

Rebuild and restart:
```bash
cd /app/frontend
pnpm build
pm2 restart jastipin-frontend
```

**Pros:**
- Professional maintenance page with branding
- Shows contact information
- Easy to toggle (env variable)

**Cons:**
- Requires Next.js to be running
- If Next.js crashes, maintenance page won't show

### Option 2: Nginx Hard Kill (Emergency Maintenance)

**File:** `/etc/nginx/sites-available/jastipin-maintenance.conf`

```nginx
server {
    listen 443 ssl http2;
    server_name jastipin.me www.jastipin.me;

    ssl_certificate /etc/letsencrypt/live/jastipin.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jastipin.me/privkey.pem;

    root /var/www/maintenance;
    index maintenance.html;

    location / {
        return 503;
    }

    error_page 503 /maintenance.html;
    location = /maintenance.html {
        internal;
    }
}
```

Enable maintenance:
```bash
# Disable normal site
ln -sf /etc/nginx/sites-available/jastipin-maintenance.conf /etc/nginx/sites-enabled/

# Remove normal config
rm /etc/nginx/sites-enabled/jastipin.conf

# Reload
nginx -t && systemctl reload nginx
```

**Pros:**
- Works even if all services are down
- Ultra-fast (static HTML)
- True emergency kill switch

**Cons:**
- Less professional UI
- Manual process

---

## Monitoring & Logs

### Check Application Status
```bash
# PM2 status
pm2 list
pm2 logs jastipin-frontend
pm2 logs jastipin-backend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System resources
htop
df -h
free -h
```

### Automatic Restarts
```bash
# PM2 already configured for auto-restart on crash
# To restart manually:
pm2 restart jastipin-frontend
pm2 restart jastipin-backend

# To restart all
pm2 restart all
```

---

## Future Considerations

### When to Consider Cloudflare Pages Again?

Only if:
1. ✅ Frontend is 100% edge-compatible (no Node.js APIs)
2. ✅ All dependencies verified for Edge Runtime
3. ✅ Backend is separated (API stays on VPS)
4. ✅ Team has bandwidth to maintain two deployment strategies
5. ✅ There's actual performance benefit (unlikely for Indonesia traffic)

### Alternative Scaling Strategies (Better ROI):

1. **Database Optimization**
   - Connection pooling
   - Query optimization
   - Indexes on frequently queried fields

2. **Nginx Caching**
   - Static asset caching
   - API response caching (with proper invalidation)

3. **Cloudflare Caching Rules**
   - Already active with proxied DNS
   - Configure cache TTL per path

4. **Horizontal Scaling (When Needed)**
   - Add second VPS
   - Load balancer in front
   - Shared database (or read replicas)

**Current VPS (4 vCPU, 8GB RAM) can handle:**
- ~10,000 concurrent users
- ~100,000 requests/day
- Plenty for MVP and early traction

---

## Deployment Checklist

### Initial Deployment
- [ ] DNS records pointing to VPS IP
- [ ] Cloudflare proxy enabled (orange cloud)
- [ ] SSL certificates generated
- [ ] Nginx configuration tested and reloaded
- [ ] Frontend built and running on port 3000
- [ ] Backend built and running on port 4000
- [ ] PM2 configured for auto-restart
- [ ] Firewall rules configured
- [ ] CORS configured in backend
- [ ] Environment variables set correctly
- [ ] Database migrations applied
- [ ] Test full user flow (register → login → create trip)

### Every Deployment
- [ ] Pull latest code from GitHub
- [ ] `pnpm install` (if dependencies changed)
- [ ] `pnpm build`
- [ ] `pm2 restart <app-name>`
- [ ] Check logs for errors: `pm2 logs`
- [ ] Test critical paths (login, API calls)
- [ ] Monitor PM2 status: `pm2 list`

### Emergency Rollback
```bash
# Revert to previous commit
git log --oneline  # Find previous commit hash
git reset --hard <commit-hash>

# Rebuild and restart
pnpm install
pnpm build
pm2 restart all

# Or restore from backup
# (Make sure to backup before major deployments)
```

---

## Summary

**Current Stack:**
- ✅ VPS: Full Node.js runtime, no limitations
- ✅ Nginx: Reverse proxy, SSL termination
- ✅ Cloudflare: DDoS protection, CDN, DNS
- ✅ PM2: Process management, auto-restart
- ✅ Let's Encrypt: Free SSL certificates

**This is production-ready, proven, and scales well.**

**Focus now:**
1. Build product features
2. Acquire users
3. Optimize performance when needed
4. Don't overthink infrastructure until there's a real problem

**Cloudflare Pages = Parked for now.** Not deleted, just ignored. Revisit only if there's a compelling reason.
