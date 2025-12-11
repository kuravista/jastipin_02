# 🔒 SSL CERTIFICATE & HTTPS SETUP

**Purpose:** Setup Let's Encrypt SSL certificate and enable HTTPS  
**Time Required:** 20-30 minutes  
**Prerequisites:** [02-nginx-setup.md](02-nginx-setup.md) ✅ (Nginx running)  
**Next Step:** [04-nodejs-setup.md](04-nodejs-setup.md)

---

## 📋 WHAT WE'LL DO

1. ✅ Install Certbot (Let's Encrypt client)
2. ✅ Generate SSL certificate
3. ✅ Configure Nginx with HTTPS
4. ✅ Setup auto-renewal
5. ✅ Redirect HTTP to HTTPS
6. ✅ Test SSL certificate

---

## ⚠️ PREREQUISITES

**Before starting:**

```bash
# Verify Nginx is running
sudo systemctl status nginx
# Should show: active (running)

# Verify domain is pointing to your server
nslookup jastipin.me
# Should show your server IP

# Verify port 80 and 443 are open in firewall
sudo ufw status
# Should show:
# 80/tcp   ALLOW IN  Anywhere
# 443/tcp  ALLOW IN  Anywhere
```

⚠️ **IMPORTANT:** Domain MUST be pointing to server IP!

---

## 🚀 STEP 1: INSTALL CERTBOT

**Install Certbot and Nginx plugin:**

```bash
# Update packages
sudo apt update

# Install Certbot and Nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
# Should show: certbot X.X.X
```

---

## 📜 STEP 2: GENERATE SSL CERTIFICATE

**Using Certbot with Nginx plugin:**

```bash
# Generate certificate (automatic Nginx configuration)
sudo certbot --nginx -d jastipin.me -d www.jastipin.me

# Certbot will ask:
# 1. "Enter email address" → your-email@example.com
# 2. "Agree to ACME Subscriber Agreement?" → Y
# 3. "Share email for EFF news?" → N (or Y)
# 4. "Which names would you like to activate HTTPS for?" → Press Enter (all)

# After successful generation:
# Congratulations! Your certificate has been issued.
```

**If generation is slow:**

```bash
# This is normal - Let's Encrypt validation can take 30-60 seconds
# Just wait, do not interrupt!

# After completion, you'll see:
# - Certificate path: /etc/letsencrypt/live/jastipin.me/fullchain.pem
# - Private key path: /etc/letsencrypt/live/jastipin.me/privkey.pem
# - Expiration date: (usually 90 days)
```

---

## 🔄 STEP 3: VERIFY NGINX CONFIGURATION

Certbot should have automatically updated your Nginx config. Let's verify:

```bash
# View your server block
sudo nano /etc/nginx/sites-available/jastipin.me

# You should now see SSL configuration:
# - listen 443 ssl http2;
# - ssl_certificate /etc/letsencrypt/live/jastipin.me/fullchain.pem;
# - ssl_certificate_key /etc/letsencrypt/live/jastipin.me/privkey.pem;

# Exit without saving
# Ctrl+X
```

**Check if HTTP redirect exists:**

```bash
# View full config
sudo cat /etc/nginx/sites-available/jastipin.me | grep -A5 "listen 80"

# You should see something like:
# server {
#     listen 80;
#     server_name jastipin.me www.jastipin.me;
#     return 301 https://$server_name$request_uri;
# }

# If not present, we'll add it next
```

---

## 🔀 STEP 4: CONFIGURE HTTP TO HTTPS REDIRECT

**If redirect not automatically added:**

```bash
# Edit your server block
sudo nano /etc/nginx/sites-available/jastipin.me

# Find the first 'server' block (listening on port 80)
# It should look like:
# server {
#     listen 80;
#     listen [::]:80;
#     server_name jastipin.me www.jastipin.me;
# }

# Replace the 'server_name' line and everything below it with:
#
# server {
#     listen 80;
#     listen [::]:80;
#     server_name jastipin.me www.jastipin.me;
#     
#     return 301 https://$server_name$request_uri;
# }

# Find the 'server' block with 'listen 443 ssl'
# Verify these lines exist:
# listen 443 ssl http2;
# listen [::]:443 ssl http2;
# ssl_certificate /etc/letsencrypt/live/jastipin.me/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/jastipin.me/privkey.pem;

# Save: Ctrl+X → Y → Enter
```

---

## ✅ STEP 5: VERIFY & TEST CONFIGURATION

**Test Nginx configuration:**

```bash
# Test syntax (ALWAYS do this before reloading!)
sudo nginx -t

# Should show:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Reload Nginx:**

```bash
# Reload with new SSL configuration
sudo systemctl reload nginx

# Verify still running
sudo systemctl status nginx
# Should show: active (running)
```

---

## 🧪 STEP 6: TEST HTTPS ACCESS

**Test in browser or terminal:**

```bash
# Test HTTPS connection
curl -I https://jastipin.me/

# Should show:
# HTTP/2 200
# or
# HTTP/1.1 200 OK

# Test HTTP redirect
curl -I http://jastipin.me/

# Should show:
# HTTP/1.1 301 Moved Permanently
# Location: https://jastipin.me/

# Test certificate validity
curl -v https://jastipin.me/ 2>&1 | grep "subject:"
# Should show: subject: CN = jastipin.me
```

**Test in browser:**

```
1. Open: https://jastipin.me
2. Check for green lock icon 🔒
3. Click lock → Certificate info should show:
   - Issuer: Let's Encrypt
   - Expires: ~90 days from now
```

---

## 🔐 STEP 7: SETUP AUTO-RENEWAL

Let's Encrypt certificates expire after 90 days. Certbot can auto-renew.

**Check renewal is scheduled:**

```bash
# List active certbot timer
sudo systemctl list-timers | grep certbot

# You should see:
# certbot.timer        active

# Or check if renew command is available:
sudo certbot renew --dry-run

# Should show: Cert not yet due for renewal
```

**If renewal not scheduled, enable it:**

```bash
# Enable certbot renewal timer
sudo systemctl enable certbot.timer

# Start the timer
sudo systemctl start certbot.timer

# Check status
sudo systemctl status certbot.timer
# Should show: active and enabled
```

**Manual renewal test:**

```bash
# Test renewal (doesn't actually renew, just checks)
sudo certbot renew --dry-run

# You should see:
# Congratulations, all renewals succeeded.

# Note: Actual renewal runs automatically before expiration
```

---

## 🔐 STEP 8: SECURITY HARDENING (Optional but Recommended)

**Add SSL security headers to Nginx:**

```bash
# Edit your server block
sudo nano /etc/nginx/sites-available/jastipin.me

# In the '443 ssl' server block, add these security headers:
```

```nginx
# Inside the 'server {' block with listen 443 ssl:

# HSTS - Force HTTPS for future visits
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Prevent MIME type sniffing
add_header X-Content-Type-Options "nosniff" always;

# Prevent clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# XSS protection
add_header X-XSS-Protection "1; mode=block" always;

# Referrer policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Content Security Policy (adjust as needed for your app)
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

**Save and reload:**

```bash
# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Verify headers are returned
curl -I https://jastipin.me/ | grep -i "strict-transport"
# Should show: Strict-Transport-Security
```

---

## 🛠️ STEP 9: CERTIFICATE MANAGEMENT

**View certificate info:**

```bash
# Show all certificates
sudo certbot certificates

# You should see:
# Found a certificate to jastipin.me
# Certificate Path: /etc/letsencrypt/live/jastipin.me/fullchain.pem
# Key Type: RSA
# Expiry Date: 202X-XX-XX (approximately 90 days)
```

**Check certificate expiration in browser:**

```bash
# Using OpenSSL
echo | openssl s_client -servername jastipin.me -connect jastipin.me:443 2>/dev/null | openssl x509 -noout -dates

# Output:
# notBefore: ...
# notAfter: ... (your expiration date)
```

---

## 📋 STEP 10: MONITORING & ALERTS

**Setup renewal reminder (optional):**

```bash
# Certbot sends email reminders 20 days before expiration
# Email address used during certificate generation

# But verify renewal is working:
sudo certbot renew --dry-run

# Should complete successfully
```

**Add to system monitoring (optional):**

```bash
# Create a cron job to check certificate expiration
sudo crontab -e

# Add this line:
# 0 0 1 * * /usr/local/bin/check-cert-expiry.sh

# Or just trust Certbot's auto-renewal timer
```

---

## 📊 CHECK SECURITY SCORE

**Test SSL security:**

```bash
# Use Qualys SSL Labs (online tool)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=jastipin.me

# Or using terminal:
curl https://api.ssllabs.com/api/v3/analyze?host=jastipin.me

# Rating should be: A (or A+)
```

---

## 🔍 TROUBLESHOOTING

### Certificate generation failed?
```bash
# Check domain is pointing to server
nslookup jastipin.me

# Check ports 80 and 443 are open
sudo ufw status

# Try again with more verbose output
sudo certbot --nginx -d jastipin.me -v

# Check error log
sudo tail -50 /var/log/letsencrypt/letsencrypt.log
```

### HTTPS not working?
```bash
# Verify certificate exists
sudo ls -la /etc/letsencrypt/live/jastipin.me/

# Should show: fullchain.pem and privkey.pem

# Test configuration
sudo nginx -t

# Check Nginx is listening on 443
sudo netstat -tupln | grep 443

# View Nginx error log
sudo tail -20 /var/log/nginx/error.log
```

### Mixed content warnings in browser?
```bash
# Your app is using http:// URLs instead of https://
# Fix in your code: Change http:// to https:// for all external resources

# Or add header to force HTTPS:
# add_header Strict-Transport-Security "max-age=31536000";
```

### Certificate renewal failing?
```bash
# Check renewal log
sudo tail -50 /var/log/letsencrypt/letsencrypt.log

# Try manual renewal
sudo certbot renew --force-renewal

# Check certificate dates
sudo certbot certificates
```

---

## ✅ COMPLETION CHECKLIST

Before moving to Node.js setup, verify:

- [ ] Certbot installed
- [ ] SSL certificate generated and valid
- [ ] HTTPS access working (https://your-domain)
- [ ] HTTP redirects to HTTPS
- [ ] Certificate auto-renewal configured
- [ ] No mixed content warnings
- [ ] Browser shows green lock 🔒
- [ ] Security headers added

---

## 🚀 NEXT STEP

Your application is now secured with HTTPS!

Next: [04-nodejs-setup.md](04-nodejs-setup.md) - Setup Node.js runtime

---

**Previous:** [02-nginx-setup.md](02-nginx-setup.md)  
**Next:** [04-nodejs-setup.md](04-nodejs-setup.md)  
**Duration:** 20-30 minutes  
**Difficulty:** ⭐⭐⭐☆☆

✅ **SSL/HTTPS SETUP COMPLETE - YOUR SITE IS SECURE!**

