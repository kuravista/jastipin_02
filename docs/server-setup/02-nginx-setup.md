# 🌐 NGINX SETUP & CONFIGURATION

**Purpose:** Install and configure Nginx as reverse proxy  
**Time Required:** 30-40 minutes  
**Prerequisites:** [01-initial-server-setup.md](01-initial-server-setup.md) ✅  
**Next Step:** [03-ssl-certificate.md](03-ssl-certificate.md)

---

## 📋 WHAT WE'LL DO

1. ✅ Install Nginx
2. ✅ Create reverse proxy configuration
3. ✅ Setup server blocks for multiple domains
4. ✅ Configure gzip compression
5. ✅ Setup static file caching
6. ✅ Test Nginx configuration
7. ✅ Enable Nginx service

---

## 🚀 STEP 1: INSTALL NGINX

**Connect to server:**

```bash
# SSH into server
ssh -i ~/.ssh/server-deploy deploy@YOUR_SERVER_IP

# Update package lists first
sudo apt update
```

**Install Nginx:**

```bash
# Install Nginx
sudo apt install -y nginx

# Verify installation
nginx -v
# Should show: nginx version: nginx/1.18.0 (or newer)

# Check Nginx service status
sudo systemctl status nginx
# Should show: active (running)
```

**Verify Nginx is accessible:**

```bash
# Test HTTP access
curl http://localhost/
# Should show Nginx welcome page HTML

# OR open browser to: http://YOUR_SERVER_IP
# Should show: Welcome to nginx!
```

---

## 🔧 STEP 2: UNDERSTAND NGINX DIRECTORY STRUCTURE

**Key directories:**

```bash
# Main configuration
sudo ls -la /etc/nginx/
# Key files:
# - nginx.conf (main config)
# - sites-available/ (all site configs)
# - sites-enabled/ (active sites - symlinks)
# - conf.d/ (additional configs)

# Nginx files directory
sudo ls -la /var/www/
# Default: html/

# Nginx logs
sudo ls -la /var/log/nginx/
# - access.log (all requests)
# - error.log (errors)
```

---

## 🔄 STEP 3: CREATE REVERSE PROXY CONFIGURATION

**For JASTIPIN.ME application:**

```bash
# Create new server block
sudo nano /etc/nginx/sites-available/jastipin.me

# Paste this configuration:
```

**Full Nginx Configuration:**

```nginx
# IMPORTANT: Replace 'jastipin.me' with your actual domain
# Replace '127.0.0.1:3000' with your backend port if different

# Redirect www to non-www (optional)
server {
    listen 80;
    listen [::]:80;
    server_name www.jastipin.me;
    
    return 301 http://jastipin.me$request_uri;
}

# Main application server
server {
    listen 80;
    listen [::]:80;
    server_name jastipin.me;

    # Access and error logs
    access_log /var/log/nginx/jastipin.me.access.log;
    error_log /var/log/nginx/jastipin.me.error.log;

    # Maximum upload size (for file uploads)
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript 
               application/json application/javascript 
               application/xml+rss application/rss+xml 
               font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1000;

    # Reverse proxy to Node.js backend (Express.js)
    location / {
        # Backend server address and port
        proxy_pass http://127.0.0.1:3000;

        # Headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching (optional - if serving static files)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    location ~ ~$ {
        deny all;
    }
}
```

**Save the configuration:**
- `Ctrl+X` → `Y` → `Enter`

---

## 🔗 STEP 4: ENABLE SITE (CREATE SYMLINK)

```bash
# Create symlink from sites-available to sites-enabled
sudo ln -s /etc/nginx/sites-available/jastipin.me /etc/nginx/sites-enabled/jastipin.me

# Verify symlink created
ls -la /etc/nginx/sites-enabled/

# Should show:
# jastipin.me -> ../sites-available/jastipin.me
```

---

## 🗑️ STEP 5: DISABLE DEFAULT SITE (Optional)

```bash
# Remove default site symlink
sudo rm /etc/nginx/sites-enabled/default

# Verify removed
ls -la /etc/nginx/sites-enabled/
# Should NOT show 'default'
```

---

## ✅ STEP 6: TEST NGINX CONFIGURATION

**Validate config syntax:**

```bash
# Test Nginx configuration (IMPORTANT - do before reloading!)
sudo nginx -t

# Should show:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**If errors appear:**

```bash
# Check syntax carefully:
sudo nginx -t -c /etc/nginx/sites-available/jastipin.me

# View error logs:
sudo tail -20 /var/log/nginx/error.log
```

---

## 🔄 STEP 7: RELOAD NGINX

```bash
# Reload Nginx with new configuration
sudo systemctl reload nginx

# Verify it's still running
sudo systemctl status nginx
# Should show: active (running)
```

---

## 🧪 STEP 8: TEST REVERSE PROXY

**Start your backend server:**

```bash
# On your local machine (or on server in separate terminal)
# Make sure your Node.js application is running on port 3000

# Example with PM2:
pm2 start npm --name "jastipin" -- start

# Or with npx:
npm start
# Should show: Server listening on port 3000
```

**Test Nginx proxy:**

```bash
# Test through Nginx (should proxy to port 3000)
curl http://localhost/
# Should get response from your Express backend

# Test from your local machine:
curl http://YOUR_SERVER_IP/
# Should get response from backend
```

---

## 🔒 STEP 9: ENHANCED SECURITY CONFIGURATION

**Optional but recommended - edit main Nginx config:**

```bash
# Edit main Nginx config
sudo nano /etc/nginx/nginx.conf

# In the 'http' block, add/verify these settings:
```

```nginx
http {
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Hide Nginx version
    server_tokens off;

    # Include site configurations
    include /etc/nginx/sites-enabled/*;
}
```

**Save and test:**
```bash
# Test config
sudo nginx -t

# Reload if OK
sudo systemctl reload nginx
```

---

## 📊 STEP 10: VIEW LOGS

**Access logs:**

```bash
# View recent requests
sudo tail -20 /var/log/nginx/jastipin.me.access.log

# Follow live requests
sudo tail -f /var/log/nginx/jastipin.me.access.log
# Press Ctrl+C to stop
```

**Error logs:**

```bash
# View recent errors
sudo tail -20 /var/log/nginx/jastipin.me.error.log

# If something isn't working, check this!
```

---

## ⚙️ STEP 11: MONITOR NGINX

```bash
# Check Nginx is running
sudo systemctl status nginx

# View process info
ps aux | grep nginx
# Should show: master and worker processes

# Check which ports Nginx is listening on
sudo netstat -tupln | grep nginx
# Should show: 0.0.0.0:80 (all interfaces, port 80)
```

---

## 🔧 ADVANCED CONFIGURATIONS (Optional)

### Multiple Domains

```bash
# Create another server block file
sudo nano /etc/nginx/sites-available/another-domain.com

# Copy the jastipin.me config and adjust:
# - Change server_name to another-domain.com
# - Change backend port if different
# - Change log file names

# Enable it:
sudo ln -s /etc/nginx/sites-available/another-domain.com /etc/nginx/sites-enabled/

# Test and reload:
sudo nginx -t
sudo systemctl reload nginx
```

### Custom Error Pages

```bash
# In server block, add:
error_page 404 /404.html;
error_page 502 503 504 /50x.html;

location = /50x.html {
    root /var/www/jastipin.me;
}
```

### Rate Limiting

```bash
# In server block, add:
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;

location / {
    limit_req zone=general burst=20;
    proxy_pass http://127.0.0.1:3000;
}
```

---

## 📝 TROUBLESHOOTING

### Port 80 already in use?
```bash
# Find what's using port 80
sudo lsof -i :80

# Kill the process (if not needed)
sudo kill -9 <PID>

# Or stop the other service
sudo systemctl stop <service-name>
```

### Nginx won't start?
```bash
# Check configuration
sudo nginx -t

# View detailed error
sudo systemctl status nginx

# Check error log
sudo tail -50 /var/log/nginx/error.log
```

### Proxy returning 502 Bad Gateway?
```bash
# Check backend is running
ps aux | grep node
ps aux | grep npm

# Check backend is listening on correct port
sudo netstat -tupln | grep 3000

# View Nginx error log
sudo tail -20 /var/log/nginx/jastipin.me.error.log
```

### DNS not resolving?
```bash
# Make sure domain points to server IP
nslookup jastipin.me
# Should show your server IP

# Or use dig
dig jastipin.me
```

---

## ✅ COMPLETION CHECKLIST

Before moving to SSL, verify:

- [ ] Nginx installed and running
- [ ] Server block created for your domain
- [ ] Configuration syntax valid (nginx -t)
- [ ] Backend application running on port 3000
- [ ] Can access application through Nginx proxy
- [ ] Logs showing requests
- [ ] Firewall allows port 80

---

## 🚀 NEXT STEP

Nginx is now configured and proxying requests to your backend!

Next: [03-ssl-certificate.md](03-ssl-certificate.md) - Setup HTTPS/SSL

---

**Previous:** [01-initial-server-setup.md](01-initial-server-setup.md)  
**Next:** [03-ssl-certificate.md](03-ssl-certificate.md)  
**Duration:** 30-40 minutes  
**Difficulty:** ⭐⭐⭐☆☆

✅ **NGINX SETUP COMPLETE - WEB SERVER IS PROXYING!**

