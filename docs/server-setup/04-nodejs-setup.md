# ⚙️ NODE.JS RUNTIME & PROCESS MANAGEMENT

**Purpose:** Install Node.js, PNPM, and PM2 for application runtime  
**Time Required:** 20-30 minutes  
**Prerequisites:** [03-ssl-certificate.md](03-ssl-certificate.md) ✅  
**Next Step:** [05-database-setup.md](05-database-setup.md)

---

## 📋 WHAT WE'LL DO

1. ✅ Install Node.js v18+ (LTS)
2. ✅ Install PNPM package manager
3. ✅ Install PM2 (process manager)
4. ✅ Configure PM2 auto-startup
5. ✅ Create deployment user environment
6. ✅ Test Node.js and tools

---

## 🚀 STEP 1: INSTALL NODE.JS

**Add NodeSource repository (for latest LTS):**

```bash
# SSH into server
ssh -i ~/.ssh/server-deploy deploy@YOUR_SERVER_IP

# Download and run NodeSource setup
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# This adds NodeSource repository which has Node.js v18 LTS
# Choose appropriate version:
# - setup_18.x = v18 LTS (recommended for stability)
# - setup_20.x = v20 LTS (latest)
# - setup_22.x = v22 LTS (newest)
```

**Install Node.js:**

```bash
# Install Node.js (includes npm)
sudo apt install -y nodejs

# Verify installation
node --version
# Should show: v18.x.x or v20.x.x

npm --version
# Should show: 8.x.x or higher
```

---

## 📦 STEP 2: INSTALL PNPM PACKAGE MANAGER

**Why PNPM?**
- Faster than NPM
- Disk space efficient (shared dependencies)
- Used by your project

**Install PNPM:**

```bash
# Install PNPM globally
npm install -g pnpm

# Verify installation
pnpm --version
# Should show: 8.x.x or higher

# Check PNPM setup
pnpm setup
# This configures PNPM environment
```

**Configure PNPM in shell:**

```bash
# Add PNPM to PATH
echo 'export PNPM_HOME="/home/deploy/.local/share/pnpm"' >> ~/.bashrc
echo 'export PATH="$PNPM_HOME:$PATH"' >> ~/.bashrc

# Reload shell
source ~/.bashrc

# Verify
pnpm --version
# Should work
```

---

## 🔄 STEP 3: INSTALL PM2 (PROCESS MANAGER)

**Why PM2?**
- Manages Node.js process
- Auto-restart on crash
- Logs management
- Easy deployment

**Install PM2 globally:**

```bash
# Install PM2
npm install -g pm2

# Verify installation
pm2 --version
# Should show: 5.x.x or higher

# Show PM2 help
pm2 help
```

---

## 🛠️ STEP 4: SETUP PM2 AUTO-STARTUP

**Configure PM2 to start on system boot:**

```bash
# Generate startup script
sudo pm2 startup systemd -u deploy --hp /home/deploy

# This outputs a command, copy and run it:
# Example:
# sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u deploy --hp /home/deploy

# Just copy-paste the output command and run it
```

**Verify PM2 startup is configured:**

```bash
# Check if PM2 service is enabled
sudo systemctl status pm2-deploy

# Or list PM2 startup info
sudo pm2 startup

# You should see: PM2 startup script has been successfully installed
```

---

## 🚀 STEP 5: PREPARE APPLICATION DIRECTORY

**Create deployment directory:**

```bash
# Create app directory
sudo mkdir -p /var/www/jastipin-api
sudo mkdir -p /var/www/jastipin-web

# Set permissions (for deploy user)
sudo chown -R deploy:deploy /var/www/jastipin-api
sudo chown -R deploy:deploy /var/www/jastipin-web

# Verify ownership
ls -la /var/www/
# Should show: deploy deploy for both directories
```

**Create PM2 ecosystem config (optional but recommended):**

```bash
# Create ecosystem.config.js in /var/www/jastipin-api
nano /var/www/jastipin-api/ecosystem.config.js

# Paste this configuration:
```

```javascript
module.exports = {
  apps: [
    {
      name: 'jastipin-api',
      script: 'dist/index.js', // or 'npm start' if using npm
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/pm2/jastipin-api.error.log',
      out_file: '/var/log/pm2/jastipin-api.out.log',
      log_file: '/var/log/pm2/jastipin-api.combined.log',
      time: true,
      merge_logs: true,
      max_memory_restart: '1G',
      // Restart policy
      watch: false, // Set to true if you want auto-restart on file changes
      ignore_watch: ['node_modules', 'dist', 'logs', '.git'],
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
```

Save: `Ctrl+X → Y → Enter`

---

## 🔐 STEP 6: CONFIGURE ENVIRONMENT VARIABLES

**Create .env file:**

```bash
# Navigate to app directory
cd /var/www/jastipin-api

# Create .env file
nano .env

# Paste all required environment variables:
# (Copy from your backend/.env.example)
```

Example .env:

```bash
# Database
DATABASE_URL="postgresql://user:password@supabase-host:5432/database?schema=public"

# JWT
JWT_SECRET="your-very-long-random-secret-key-64-characters-minimum"
JWT_REFRESH_SECRET="your-very-long-random-secret-key-64-characters-minimum"

# Frontend
FRONTEND_URL="https://jastipin.me"

# Supabase
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_API_KEY="your-supabase-api-key"

# Cloudflare R2
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="jastipin"
R2_PUBLIC_URL="https://cdn.jastipin.me"

# SendPulse
SENDPULSE_API_KEY="your-sendpulse-key"

# RajaOngkir
RAJAONGKIR_API_KEY="your-rajaongkir-key"

# Server
PORT=3000
NODE_ENV=production
```

Save: `Ctrl+X → Y → Enter`

**Secure the .env file:**

```bash
# Restrict permissions (only deploy user can read)
chmod 600 .env

# Verify
ls -la .env
# Should show: -rw------- 1 deploy deploy
```

---

## 📥 STEP 7: DEPLOY APPLICATION CODE

**Option A: Clone from GitHub (Recommended)**

```bash
# Clone your repository
cd /var/www/jastipin-api
git clone https://github.com/YOUR-USERNAME/jastipin-api.git .

# Or if you already have the repo:
git pull origin main
```

**Option B: Upload via SCP (If no GitHub access yet)**

```bash
# From your local machine:
scp -i ~/.ssh/server-deploy -r ./backend/* deploy@YOUR_SERVER_IP:/var/www/jastipin-api/
```

---

## 🔧 STEP 8: INSTALL DEPENDENCIES & BUILD

**Install dependencies:**

```bash
# Navigate to app directory
cd /var/www/jastipin-api

# Install dependencies with PNPM
pnpm install

# This may take 2-5 minutes depending on dependencies
# You should see: added X packages, spent Y time
```

**Build TypeScript (if applicable):**

```bash
# If your app is TypeScript:
pnpm run build

# You should see: compiled successfully
# Creates 'dist' directory with compiled JavaScript

# Verify build succeeded
ls -la dist/
# Should show: index.js and other compiled files
```

**Verify scripts in package.json:**

```bash
# View available scripts
cat package.json | grep -A5 '"scripts"'

# Should have:
# "dev": "tsx watch src/index.ts"
# "start": "node dist/index.js"
# "build": "tsc"
# "db:migrate": "prisma migrate deploy"
```

---

## 🗄️ STEP 9: SETUP DATABASE MIGRATIONS (Important!)

**Run Prisma migrations:**

```bash
# Navigate to app directory
cd /var/www/jastipin-api

# Run pending migrations
pnpm exec prisma migrate deploy

# Or if using npm:
# npx prisma migrate deploy

# You should see:
# 1 migration executed successfully
# (or "No pending migrations" if already migrated)

# View database status
pnpm exec prisma db push
```

---

## 🚀 STEP 10: START APPLICATION WITH PM2

**Start the application:**

```bash
# Navigate to app directory
cd /var/www/jastipin-api

# Option A: Start with ecosystem config (recommended)
pm2 start ecosystem.config.js

# Option B: Start directly
pm2 start 'npm start' --name jastipin-api

# Option C: Start with custom environment
pm2 start npm --name jastipin-api -- start

# You should see:
# [PM2] Process launched: jastipin-api
```

**Verify process is running:**

```bash
# List PM2 processes
pm2 list

# Should show:
# │ id  │ name       │ namespace │ version │ mode │ pid    │ status  │ restart │
# │ 0   │ jastipin-api │default  │ 1.0.0   │ fork │ 12345  │ online  │ 0       │

# View process details
pm2 info jastipin-api

# View logs
pm2 logs jastipin-api
# Press Ctrl+C to exit
```

---

## 🔄 STEP 11: SAVE PM2 PROCESS LIST

**Save current processes to startup:**

```bash
# Save process list (so it auto-starts on reboot)
pm2 save

# You should see:
# [PM2] Processes saved to /home/deploy/.pm2/dump.pm2

# Verify PM2 startup is enabled
sudo systemctl status pm2-deploy
# Should show: active (running)
```

---

## 🧪 STEP 12: TEST APPLICATION

**Check if application is responding:**

```bash
# Test local port 3000
curl http://localhost:3000/

# Should return response from your API

# Test through Nginx proxy
curl http://localhost/

# Should work (proxied through Nginx)

# Test from your local machine
curl https://jastipin.me/

# Should return API response over HTTPS
```

**Check application logs:**

```bash
# View PM2 logs (real-time)
pm2 logs jastipin-api

# View file logs
tail -50 /var/log/pm2/jastipin-api.out.log
tail -50 /var/log/pm2/jastipin-api.error.log
```

---

## 📊 STEP 13: MONITOR NODE.JS

**Check Node.js processes:**

```bash
# View all Node.js processes
ps aux | grep node

# Check memory usage
free -h

# Check CPU usage
top -b -n 1 | head -n 15
```

**Monitor with PM2:**

```bash
# Real-time monitoring
pm2 monit

# Shows CPU, memory, restart count
# Press 'q' to quit

# Check uptime
pm2 show jastipin-api
# Should show: uptime XXh
```

---

## 🛠️ COMMON PM2 COMMANDS

```bash
# Restart application
pm2 restart jastipin-api

# Stop application
pm2 stop jastipin-api

# Start again
pm2 start jastipin-api

# Delete from PM2
pm2 delete jastipin-api

# View all processes
pm2 list

# View logs
pm2 logs
pm2 logs jastipin-api --lines 100

# Save processes
pm2 save

# Resurrect saved processes
pm2 resurrect

# Shutdown PM2
pm2 kill
```

---

## 🔒 SECURITY CHECKLIST

```bash
# Verify .env is secure
ls -la .env
# Should show: -rw------- (600 permissions)

# Verify node_modules not world-readable
ls -la node_modules | head -5
# Should show: deploy deploy ownership

# Check for exposed secrets
grep -r "password\|secret\|key" .env
# Should be present only in .env (not committed)

# Verify .env is in .gitignore
cat .gitignore | grep .env
# Should show: .env
```

---

## 📝 TROUBLESHOOTING

### Application won't start?
```bash
# Check logs
pm2 logs jastipin-api

# Check environment variables
echo $DATABASE_URL

# Check if port 3000 is in use
sudo netstat -tupln | grep 3000

# Manually run to see errors
cd /var/www/jastipin-api && npm start
```

### High memory usage?
```bash
# Restart PM2
pm2 restart jastipin-api

# Check memory limit in ecosystem.config.js
# Add: max_memory_restart: '1G'
```

### Process keeps restarting?
```bash
# Check logs for errors
pm2 logs jastipin-api

# Check if dependencies are installed
pnpm list

# Rebuild if needed
pnpm install
pnpm run build
```

### Nginx 502 Bad Gateway?
```bash
# Check if Node.js is running
pm2 status

# Check if listening on 3000
sudo netstat -tupln | grep 3000

# Check Nginx configuration
sudo nginx -t

# View Nginx error log
sudo tail -20 /var/log/nginx/jastipin.me.error.log
```

---

## ✅ COMPLETION CHECKLIST

Before moving to database setup, verify:

- [ ] Node.js v18+ installed
- [ ] PNPM installed and working
- [ ] PM2 installed globally
- [ ] PM2 startup configured
- [ ] Application directory created
- [ ] .env file configured with secrets
- [ ] Dependencies installed (pnpm install)
- [ ] Build successful (pnpm run build)
- [ ] Database migrations run
- [ ] Application running with PM2
- [ ] PM2 processes saved
- [ ] Testing returns correct responses

---

## 🚀 NEXT STEP

Your Node.js application is now running on port 3000!

Next: [05-database-setup.md](05-database-setup.md) - Configure database connection

---

**Previous:** [03-ssl-certificate.md](03-ssl-certificate.md)  
**Next:** [05-database-setup.md](05-database-setup.md)  
**Duration:** 20-30 minutes  
**Difficulty:** ⭐⭐⭐⭐☆

✅ **NODE.JS SETUP COMPLETE - APPLICATION IS RUNNING!**

