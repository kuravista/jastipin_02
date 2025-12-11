# 📋 PREREQUISITES - SERVER SETUP

**Purpose:** Checklist dan persiapan sebelum mulai server setup  
**Time Required:** 15 menit  
**Next Step:** [01-initial-server-setup.md](01-initial-server-setup.md)

---

## ✅ PREREQUISITES CHECKLIST

Sebelum mulai, pastikan Anda sudah memiliki:

### Essential (HARUS ADA)
- [ ] Domain name (contoh: jastipin.me)
- [ ] Server/VPS dengan Ubuntu 20.04+ LTS
- [ ] SSH access ke server (root password atau key)
- [ ] GitHub account
- [ ] Text editor (VS Code, Vim, Nano)
- [ ] Terminal/Command line access

### Good to Have
- [ ] Second device untuk testing
- [ ] Backup storage (external drive atau cloud)
- [ ] Monitoring setup (Uptime Robot, Statuspage)
- [ ] Email untuk alerts

---

## 🖥️ SERVER SPECIFICATIONS

### Minimum Requirements

```
CPU:              2 cores
RAM:              2GB (4GB recommended)
Storage:          20GB SSD
OS:               Ubuntu 20.04 LTS or 22.04 LTS
Network:          1Gbps
Bandwidth:        Unmetered or 500GB+/month
Uptime SLA:       99%+
```

### Recommended Specifications (Production)

```
CPU:              4 cores
RAM:              4GB
Storage:          50GB SSD
OS:               Ubuntu 22.04 LTS
Network:          1Gbps
Bandwidth:        Unmetered
Uptime SLA:       99.9%+
Backup:           Automated daily
```

---

## 🏢 RECOMMENDED PROVIDERS

### Budget-Friendly

**Digital Ocean ($6/month)**
```
Pros:  Easy setup, great docs, good support
Cons:  Slightly expensive
Code:  Use referral for $5/month credit
Site:  https://m.do.co/c/...
```

**Vultr ($2.50/month - Cloud Compute)**
```
Pros:  Very cheap, good performance, multiple locations
Cons:  Minimal documentation
Site:  https://www.vultr.com
```

**Hetzner (~$5/month)**
```
Pros:  Best value, excellent performance, good bandwidth
Cons:  Europe-based (latency for Asia users)
Site:  https://www.hetzner.cloud
```

### Enterprise

**AWS EC2 (t3.small ~$15/month)**
```
Pros:  Reliable, auto-scaling, good integration
Cons:  Complex setup, pricing can vary
```

**Azure (B1s ~$7/month)**
```
Pros:  Reliable, good support, predictable cost
Cons:  Slower to start
```

---

## 🌐 DOMAIN SETUP

### Step 1: Register Domain

Register your domain at:
- Namecheap.com
- GoDaddy.com
- Cloudflare.com
- Your preferred registrar

**Cost:** $10-15/year

### Step 2: Point Domain to Server

After getting server IP, update DNS:

```
A Record:
Name:  @
Value: YOUR_SERVER_IP
TTL:   3600 (1 hour)

CNAME Record (optional):
Name:  www
Value: @
TTL:   3600
```

**Example:**
```
jastipin.me    A       123.45.67.89
www.jastipin.me CNAME jastipin.me
```

### Step 3: Verify DNS Propagation

```bash
# Check DNS resolution
nslookup jastipin.me
dig jastipin.me

# Should return your server IP
# May take 15-30 minutes to propagate
```

---

## 🔑 SSH KEYS PREPARATION

### Generate SSH Key (If you don't have one)

On your local machine:

```bash
# Generate key pair (if you don't have one)
ssh-keygen -t ed25519 -C "your-email@gmail.com"

# Follow prompts:
# - Enter file: ~/.ssh/id_ed25519
# - Enter passphrase: (strong password)

# Check key created
ls -la ~/.ssh/
# Should show: id_ed25519 and id_ed25519.pub

# Copy public key (we'll use this to access server)
cat ~/.ssh/id_ed25519.pub
```

### Or use existing SSH key

If you already have SSH keys:

```bash
# List existing keys
ls -la ~/.ssh/

# Use id_rsa or id_ed25519 (preferred)
# If you don't have one, create as above
```

---

## 🔐 GITHUB SSH KEYS PREPARATION

### Generate GitHub-specific SSH Key (optional but recommended)

```bash
# Generate GitHub-specific key
ssh-keygen -t ed25519 -C "your-email@github.com" -f ~/.ssh/github

# Add to GitHub:
# 1. Copy public key: cat ~/.ssh/github.pub
# 2. Go to: https://github.com/settings/keys
# 3. Click "New SSH key"
# 4. Paste public key
# 5. Name it: "Production Server"
# 6. Save

# Test connection
ssh -i ~/.ssh/github git@github.com
# Should say: "Hi username! You've successfully authenticated"
```

---

## 📋 INFORMATION TO COLLECT

Before starting, collect and save these securely:

### Server Information
- [ ] Server IP: `___________`
- [ ] Root password: `___________` (or SSH key path)
- [ ] Server provider: `___________`
- [ ] OS version: `Ubuntu 20.04 / 22.04`

### Domain Information
- [ ] Domain name: `___________`
- [ ] Domain registrar: `___________`
- [ ] Nameservers: `___________`
- [ ] DNS provider: `___________`

### GitHub Information
- [ ] GitHub username: `___________`
- [ ] Repository URL: `___________`
- [ ] Repository branch to deploy: `main / staging`

### SSH Keys
- [ ] Local SSH key path: `~/.ssh/___________`
- [ ] GitHub Deploy key: (will create)
- [ ] Server SSH key: (will create)

### Email
- [ ] Alert email: `___________`
- [ ] SSL renewal email: `___________`

---

## 💾 BACKUP PLAN

Create a backup of important information:

```
Location: Keepass / 1Password / Password Manager

Store:
- SSH private key (encrypted)
- Server root password (if available)
- Domain registrar login
- GitHub account info
- Database credentials (later)
```

---

## 🔐 SECURITY PRE-REQUISITES

Before accessing server, ensure:

- [ ] Using secure connection (SSH, not Telnet)
- [ ] Have SSH key ready
- [ ] Know server IP address
- [ ] Have alternative access method (console, if available)
- [ ] Backup of SSH key in safe location
- [ ] Not on public WiFi (or using VPN)

---

## 📊 SETUP ENVIRONMENT

Create a setup checklist file:

```bash
# Create local setup notes
mkdir -p ~/setup-notes
cd ~/setup-notes

# Create file
nano setup-info.txt

# Add:
Server IP: [IP]
Domain: [domain]
SSH Key: [path to key]
GitHub Repo: [URL]
```

---

## 🚀 NEXT STEPS

Once everything is prepared:

1. ✅ Domain registered and pointing to server IP
2. ✅ SSH key generated and ready
3. ✅ GitHub account created
4. ✅ Information collected and saved securely
5. ✅ You have terminal access to local machine

**Then:** Proceed to [01-initial-server-setup.md](01-initial-server-setup.md)

---

## 📞 TROUBLESHOOTING PREREQUISITES

### Problem: Server not responding to ping
**Solution:** 
```bash
# Check server IP
ping YOUR_SERVER_IP

# If not responding:
# 1. Wait 5 minutes (might be starting)
# 2. Try different network
# 3. Contact provider
```

### Problem: Can't generate SSH key
**Solution:**
```bash
# Check if ssh-keygen exists
ssh-keygen --help

# If not found, install openssh-client:
# macOS: brew install openssh
# Ubuntu: sudo apt install openssh-client
# Windows: Use Git Bash or WSL
```

### Problem: Domain not resolving
**Solution:**
```bash
# Wait 15-30 minutes for DNS propagation

# Check status
nslookup jastipin.me
dig jastipin.me

# If still not working:
# 1. Verify A record in DNS settings
# 2. Check registrar/DNS provider
# 3. Try clearing DNS cache: sudo systemctl restart systemd-resolved
```

### Problem: Can't access GitHub
**Solution:**
```bash
# Check internet connection
ping github.com

# Check SSH to GitHub
ssh -i ~/.ssh/github -T git@github.com

# If fails, add to SSH config
nano ~/.ssh/config
# Add:
# Host github.com
#   HostName github.com
#   User git
#   IdentityFile ~/.ssh/github
```

---

## ✅ FINAL CHECKLIST

Before proceeding to Step 1, verify:

- [ ] Server IP address obtained
- [ ] SSH key generated or ready
- [ ] Domain registered and pointing to server
- [ ] GitHub account setup
- [ ] Can SSH to local machine (if remote setup)
- [ ] Have administrator access
- [ ] Understand basic Linux commands
- [ ] Have 4-5 hours available
- [ ] Internet connection stable

**Status:** ✅ Ready to proceed to Step 1!

---

**Previous:** N/A  
**Next:** [01-initial-server-setup.md](01-initial-server-setup.md)  
**Duration:** 15 minutes (preparation)

🚀 **PREREQUISITES COMPLETE - READY FOR INITIAL SERVER SETUP!**

