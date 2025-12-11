# 🔐 INITIAL SERVER SETUP

**Purpose:** Keamanan dasar dan konfigurasi awal server  
**Time Required:** 30-45 menit  
**Prerequisites:** [00-prerequisites.md](00-prerequisites.md) ✅  
**Next Step:** [02-nginx-setup.md](02-nginx-setup.md)

---

## 📋 WHAT WE'LL DO

1. ✅ Connect to server via SSH
2. ✅ Create non-root user
3. ✅ Setup sudo privileges
4. ✅ Configure firewall (UFW)
5. ✅ Setup SSH key-based auth
6. ✅ Disable password login
7. ✅ Update system packages

---

## 🚀 STEP 1: CONNECT TO SERVER

### Option A: Using SSH Key (Recommended)

```bash
# SSH with your key
ssh -i ~/.ssh/your-key root@YOUR_SERVER_IP

# Example:
ssh -i ~/.ssh/id_ed25519 root@123.45.67.89

# If prompted "Are you sure you want to continue?" → Type: yes
# Press Enter when prompted for passphrase (if key has one)
```

### Option B: Using Root Password

```bash
# SSH with password
ssh root@YOUR_SERVER_IP

# Enter root password when prompted
```

### Verify Connection

```bash
# You should see prompt like:
# root@ubuntu-server:~#

# Check system info
uname -a
# Should show: Ubuntu ...

cat /etc/os-release
# Should show: PRETTY_NAME="Ubuntu 20.04 LTS" or similar
```

---

## 🔧 STEP 2: CREATE NON-ROOT USER

**Why?** Running everything as root is insecure. Create dedicated user.

```bash
# Create new user (replace 'deploy' with your preferred username)
adduser deploy

# Enter password: (strong password with uppercase, numbers, special chars)
# Re-enter password: (same)
# Enter full name: (can skip - just press Enter)
# Other fields: (all can be skipped - press Enter)
# Is the information correct? Y

# Add user to sudo group (give admin privileges)
usermod -aG sudo deploy

# Verify user created
id deploy
# Should show: uid=1001(deploy) gid=1001(deploy) groups=1001(deploy),27(sudo)
```

---

## 🔐 STEP 3: SETUP SSH KEY-BASED AUTH FOR NEW USER

**On your local machine:**

```bash
# Create SSH key for deploy user (if you don't have one)
ssh-keygen -t ed25519 -C "deploy@your-server" -f ~/.ssh/server-deploy

# This creates:
# ~/.ssh/server-deploy (private key - KEEP SECURE)
# ~/.ssh/server-deploy.pub (public key)

# View public key (copy this)
cat ~/.ssh/server-deploy.pub

# Output looks like:
# ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIxxxxxx deploy@your-server
```

**Back on the server (as root):**

```bash
# Create .ssh directory for deploy user
mkdir -p /home/deploy/.ssh

# Create authorized_keys file
touch /home/deploy/.ssh/authorized_keys

# Set permissions (IMPORTANT for security)
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Change ownership
chown -R deploy:deploy /home/deploy/.ssh
```

**Add your public key:**

```bash
# Edit authorized_keys
nano /home/deploy/.ssh/authorized_keys

# Paste the public key from your local machine (Ctrl+Shift+V in terminal)
# Should look like: ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIxxxxxx deploy@your-server

# Save: Ctrl+X, then Y, then Enter
```

**Verify SSH key authentication:**

```bash
# Exit current session
exit

# Test login with new user and key (from your local machine)
ssh -i ~/.ssh/server-deploy deploy@YOUR_SERVER_IP

# Should show:
# deploy@ubuntu-server:~$
# If successful, great! If not, check permissions above
```

---

## 🔒 STEP 4: DISABLE ROOT SSH LOGIN (Security)

**Back on the server as deploy user:**

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Find these lines and change:

# PermitRootLogin yes  → PermitRootLogin no
# PasswordAuthentication yes → PasswordAuthentication no

# Find and verify these are set:
# PubkeyAuthentication yes
# AuthorizedKeysFile .ssh/authorized_keys
# PermitEmptyPasswords no

# Save: Ctrl+X, then Y, then Enter
```

**Reload SSH service:**

```bash
# Validate config before reloading (important!)
sudo sshd -t
# Should return silently (good)

# Restart SSH
sudo systemctl restart ssh

# Verify SSH is running
sudo systemctl status ssh
# Should show: active (running)
```

⚠️ **IMPORTANT:** Keep current SSH session open. Test new login in new terminal before closing!

---

## 🔥 STEP 5: SETUP FIREWALL (UFW)

**Enable UFW:**

```bash
# Check UFW status
sudo ufw status
# Should show: Status: inactive

# Enable UFW
sudo ufw enable
# Type: y (yes)

# Verify enabled
sudo ufw status
# Should show: Status: active
```

**Open necessary ports:**

```bash
# Allow SSH (MUST DO FIRST!)
sudo ufw allow 22/tcp
# Status: added

# Allow HTTP
sudo ufw allow 80/tcp
# Status: added

# Allow HTTPS
sudo ufw allow 443/tcp
# Status: added

# View rules
sudo ufw status
# Should show all 3 ports allowed
```

**Verify firewall:**

```bash
# Check UFW status
sudo ufw status numbered
# Example output:
#      To                         Action      From
#      --                         ------      ----
# [ 1] 22/tcp                     ALLOW IN    Anywhere
# [ 2] 80/tcp                     ALLOW IN    Anywhere
# [ 3] 443/tcp                    ALLOW IN    Anywhere
```

---

## 📦 STEP 6: UPDATE SYSTEM PACKAGES

**Update package lists:**

```bash
# Update package index
sudo apt update
# Should show: Reading package lists... Done

# List upgradable packages
sudo apt list --upgradable
```

**Upgrade packages:**

```bash
# Upgrade all packages
sudo apt upgrade -y
# This may take 5-10 minutes

# Optional: Upgrade with config handling
sudo apt upgrade -y

# Auto-remove unused packages
sudo apt autoremove -y
```

**Install essential tools:**

```bash
# Install common tools
sudo apt install -y curl wget git vim htop net-tools

# Verify installations
curl --version
git --version
htop --version
```

---

## 🔄 STEP 7: SETUP UNATTENDED UPGRADES (Security)

**Install unattended-upgrades:**

```bash
# Install package
sudo apt install -y unattended-upgrades

# Enable automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

**Configure auto-updates:**

```bash
# Edit config
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades

# Uncomment/verify these lines:
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
};

# Enable email notifications (optional)
# Uncomment: Unattended-Upgrade::Mail "root";

# Save: Ctrl+X, then Y, then Enter
```

**Verify it's running:**

```bash
sudo systemctl status unattended-upgrades
# Should show: active (running)
```

---

## 🕐 STEP 8: SETUP TIMEZONE (Recommended)

```bash
# Check current timezone
timedatectl

# Set timezone (example: Asia/Jakarta)
sudo timedatectl set-timezone Asia/Jakarta

# Other timezones:
# Asia/Manila (Philippines)
# Asia/Bangkok (Thailand)
# Asia/Singapore (Singapore)
# UTC (Coordinated Universal Time)

# Verify timezone
timedatectl
# Should show correct timezone
```

---

## 🔍 STEP 9: VERIFY SETUP

**Check everything is configured:**

```bash
# Check user exists
id deploy

# Check SSH config
sudo sshd -t
# Should show nothing (success)

# Check firewall
sudo ufw status
# Should show: Status: active

# Check system is updated
sudo apt list --upgradable
# Should show: 0 upgradable packages

# Check timezone
timedatectl
# Should show correct timezone

# Check hostname
hostname
# Optional: Change with: sudo hostnamectl set-hostname new-hostname
```

---

## 📝 SAVE IMPORTANT INFO

Create a file with your setup info:

```bash
# Create notes file
nano ~/server-setup.txt

# Add these details:
Server IP: 123.45.67.89
Domain: jastipin.me
SSH User: deploy
SSH Key: ~/.ssh/server-deploy
Timezone: Asia/Jakarta
Firewall: Enabled
Root Login: Disabled

# Save: Ctrl+X, then Y, then Enter

# Secure this file
chmod 600 ~/server-setup.txt
```

---

## ✅ COMPLETION CHECKLIST

Before moving to next step, verify:

- [ ] SSH connection established
- [ ] Non-root user 'deploy' created
- [ ] SSH key-based auth working for deploy user
- [ ] Root password login disabled
- [ ] Firewall enabled with ports 22, 80, 443 open
- [ ] System packages updated
- [ ] Unattended-upgrades configured
- [ ] Timezone set correctly
- [ ] Can SSH in from local machine as deploy user

---

## 🔧 TROUBLESHOOTING

### Can't SSH after changes?
**Solution:**
```bash
# Use provider's console/VNC to access if SSH fails
# Re-check /etc/ssh/sshd_config
# Verify firewall allows port 22
# Check SSH service is running: systemctl status ssh
```

### Firewall blocking connections?
**Solution:**
```bash
# Check firewall rules
sudo ufw status numbered

# Add missing port
sudo ufw allow 80/tcp

# Delete wrong rule
sudo ufw delete allow 8080
```

### SSH key permission denied?
**Solution:**
```bash
# Fix permissions
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
```

### Forgot sudo password?
**Solution:**
```bash
# Use provider console to access as root
# Reset password: passwd deploy
```

---

## 🚀 NEXT STEP

Server is now secured and ready for application setup!

Next: [02-nginx-setup.md](02-nginx-setup.md)

---

**Previous:** [00-prerequisites.md](00-prerequisites.md)  
**Next:** [02-nginx-setup.md](02-nginx-setup.md)  
**Duration:** 30-45 minutes  
**Difficulty:** ⭐⭐⭐☆☆

✅ **INITIAL SERVER SETUP COMPLETE - SERVER IS SECURE!**

