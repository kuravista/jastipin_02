# 🔐 GITHUB SSH SETUP & GIT CONFIGURATION

**Purpose:** Setup SSH keys for GitHub repository access  
**Time Required:** 15-20 minutes  
**Prerequisites:** [05-database-setup.md](05-database-setup.md) ✅  
**Next Step:** [07-ci-cd-integration.md](07-ci-cd-integration.md)

---

## 📋 WHAT WE'LL DO

1. ✅ Generate SSH key on server
2. ✅ Add public key to GitHub account
3. ✅ Configure deploy key for repository
4. ✅ Test GitHub connection
5. ✅ Clone repository
6. ✅ Setup Git configuration

---

## 🚀 STEP 1: GENERATE SSH KEY ON SERVER

**Create SSH key for deployment:**

```bash
# SSH into server
ssh -i ~/.ssh/server-deploy deploy@YOUR_SERVER_IP

# Generate SSH key for GitHub (separate from login key)
ssh-keygen -t ed25519 -C "jastipin@github" -f ~/.ssh/github-deploy

# When prompted:
# Enter passphrase: (press Enter - no passphrase for automation)
# Enter same passphrase again: (press Enter)

# This creates:
# ~/.ssh/github-deploy (private key - KEEP SECURE)
# ~/.ssh/github-deploy.pub (public key - add to GitHub)
```

**View the public key:**

```bash
# Display public key
cat ~/.ssh/github-deploy.pub

# Should look like:
# ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIxxxxx jastipin@github

# Copy this entire line (you'll paste it in GitHub)
```

---

## 🔑 STEP 2: ADD DEPLOY KEY TO GITHUB REPOSITORY

**Option A: Deploy Key (Recommended - Limited Access)**

Deploy keys are specific to ONE repository and read-only or read-write.

**Go to your GitHub repository:**

1. Navigate to: `https://github.com/YOUR-USERNAME/jastipin-api`
2. Go to: **Settings** → **Deploy keys**
3. Click: **Add deploy key**
4. Fill in:
   - **Title:** `jastipin-deployment`
   - **Key:** Paste the content of `~/.ssh/github-deploy.pub` from above
   - **Allow write access:** ✅ Check if you want to push from server
5. Click: **Add key**

**You should see:**
```
jastipin-deployment
Read/write access
Added XX seconds ago
```

---

## 🔑 ALTERNATIVE: ADD TO YOUR GITHUB USER ACCOUNT

**If you don't have repository write access:**

1. Go to: `https://github.com/settings/ssh`
2. Click: **New SSH key**
3. Fill in:
   - **Title:** `jastipin-server`
   - **Key:** Paste `~/.ssh/github-deploy.pub`
   - **Key type:** Authentication Key
4. Click: **Add SSH key**

---

## 🔧 STEP 3: CONFIGURE SSH TO USE DEPLOY KEY

**Configure SSH to use the GitHub deploy key:**

```bash
# Edit SSH config
nano ~/.ssh/config

# Add this configuration for GitHub:
```

```
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github-deploy
    IdentitiesOnly yes
```

**Save: Ctrl+X → Y → Enter**

**Set proper permissions:**

```bash
# SSH config should have restricted permissions
chmod 600 ~/.ssh/config

# Verify
ls -la ~/.ssh/config
# Should show: -rw------- (600 permissions)
```

---

## 🧪 STEP 4: TEST GITHUB SSH CONNECTION

**Test connection to GitHub:**

```bash
# Test SSH connection
ssh -T git@github.com

# First time, you'll see:
# The authenticity of host 'github.com (X.X.X.X)' can't be established.
# RSA key fingerprint is XX:XX:XX...
# Are you sure you want to continue connecting (yes/no)?

# Type: yes

# If successful, you'll see:
# Hi YOUR-USERNAME! You've successfully authenticated, but GitHub does not
# provide shell access.

# If failed, you'll see:
# Permission denied (publickey).
```

**If connection test failed:**

```bash
# Check if GitHub key is in SSH agent
ssh-add -l

# If not listed, add it:
ssh-add ~/.ssh/github-deploy

# Test again:
ssh -T git@github.com

# Verify SSH key permissions (must be 600):
chmod 600 ~/.ssh/github-deploy
chmod 600 ~/.ssh/github-deploy.pub

# Test with verbose output for debugging:
ssh -vvv git@github.com
```

---

## 📥 STEP 5: CLONE REPOSITORY

**If you haven't cloned yet:**

```bash
# Navigate to app directory
cd /var/www/jastipin-api

# Check if already a git repo
git status

# If NOT a repo, clone:
git clone git@github.com:YOUR-USERNAME/jastipin-api.git .

# If already cloned, just update:
git pull origin main
```

**Verify repository is cloned:**

```bash
# Check git remote
git remote -v

# Should show:
# origin  git@github.com:YOUR-USERNAME/jastipin-api.git (fetch)
# origin  git@github.com:YOUR-USERNAME/jastipin-api.git (push)

# Check git branch
git branch -a

# Should show your branches
```

---

## 🔧 STEP 6: CONFIGURE GIT USER

**Set git user for commits:**

```bash
# Configure git user (for your deployments/commits)
git config --global user.name "Jastipin Deployment"
git config --global user.email "deploy@jastipin.me"

# Verify configuration
git config --global --list | grep user
# Should show:
# user.name=Jastipin Deployment
# user.email=deploy@jastipin.me
```

**Per-repository configuration (optional):**

```bash
# If you want different config per repo:
cd /var/www/jastipin-api

git config user.name "Jastipin API Deploy"
git config user.email "api-deploy@jastipin.me"

# Verify
git config --list | grep user
```

---

## 📝 STEP 7: SETUP .SSH/KNOWN_HOSTS

**GitHub host key verification:**

```bash
# Verify GitHub's host key is in known_hosts
cat ~/.ssh/known_hosts | grep github.com

# If not present, add it by connecting:
ssh-keyscan -H github.com >> ~/.ssh/known_hosts

# Verify it's added
cat ~/.ssh/known_hosts | grep github.com

# Should show: github.com ssh-rsa AAAAB3Nza...
```

---

## 🔄 STEP 8: PULL LATEST CODE

**Update to latest repository version:**

```bash
# Navigate to app directory
cd /var/www/jastipin-api

# Pull latest changes
git pull origin main

# You should see:
# Already up to date.
# OR
# Fast-forward ...
# X files changed, Y insertions...

# Verify latest commit
git log --oneline -5

# Should show recent commits
```

---

## 🚀 STEP 9: REINSTALL DEPENDENCIES (OPTIONAL)

**If dependencies changed in latest pull:**

```bash
# Check if package files changed
git diff HEAD~1 package.json pnpm-lock.yaml

# Install updated dependencies
pnpm install

# Rebuild if needed
pnpm run build
```

---

## 🔐 STEP 10: SETUP PULL AUTOMATION (For CI/CD)

**Create script to pull and deploy automatically:**

```bash
# Create deploy script
nano ~/deploy.sh

# Add this content:
```

```bash
#!/bin/bash

# Script: Auto-pull and deploy latest code

APP_DIR="/var/www/jastipin-api"
LOG_FILE="/var/log/jastipin-deploy.log"

echo "[$(date)] Starting deployment..." >> $LOG_FILE

# Navigate to app directory
cd $APP_DIR

# Fetch latest changes
git fetch origin

# Pull latest code
git pull origin main >> $LOG_FILE 2>&1

if [ $? -ne 0 ]; then
    echo "[$(date)] Git pull failed!" >> $LOG_FILE
    exit 1
fi

# Install dependencies
pnpm install >> $LOG_FILE 2>&1

# Build if needed
pnpm run build >> $LOG_FILE 2>&1

# Run migrations
pnpm exec prisma migrate deploy >> $LOG_FILE 2>&1

# Restart application
pm2 restart jastipin-api >> $LOG_FILE 2>&1

echo "[$(date)] Deployment completed successfully!" >> $LOG_FILE
```

**Make script executable:**

```bash
# Make executable
chmod +x ~/deploy.sh

# Create log directory
mkdir -p /var/log
sudo touch /var/log/jastipin-deploy.log
sudo chown deploy:deploy /var/log/jastipin-deploy.log

# Test script
~/deploy.sh

# Check log
cat /var/log/jastipin-deploy.log
```

---

## 🔗 STEP 11: TEST DEPLOYMENT SCRIPT

**Simulate a deployment:**

```bash
# Test by making a change in GitHub
# (Or just run the deploy script)

# On server, run deploy script:
~/deploy.sh

# Check if it completed successfully:
tail -20 /var/log/jastipin-deploy.log

# You should see:
# [timestamp] Starting deployment...
# [timestamp] Deployment completed successfully!
```

---

## 📊 STEP 12: MONITOR GIT STATUS

**Check repository status:**

```bash
# Navigate to app directory
cd /var/www/jastipin-api

# Check status
git status

# Should show: On branch main, nothing to commit, working tree clean

# Check for uncommitted changes
git diff

# Should be empty (no local changes)

# View commit history
git log --oneline -10

# Should show recent commits from main branch
```

---

## 🛠️ GIT WORKFLOW COMMANDS

**Common git commands for deployment:**

```bash
# Update to latest code
git pull origin main

# Check which branch you're on
git branch

# Switch branches
git checkout staging

# Create a new branch
git checkout -b feature/my-feature

# View recent commits
git log --oneline -10

# View specific changes
git show COMMIT_HASH

# Revert to specific commit (careful!)
git reset --hard COMMIT_HASH

# View difference between local and remote
git diff origin/main
```

---

## 🔐 SECURITY CHECKLIST

**Verify security settings:**

```bash
# SSH key file permissions (must be 600)
ls -la ~/.ssh/github-deploy*
# Should show: -rw------- (600)

# SSH config permissions
ls -la ~/.ssh/config
# Should show: -rw------- (600)

# Verify no key is in a world-readable location
find ~ -name "*github*" -type f -exec ls -la {} \;

# Check if key has passphrase
ssh-keygen -y -f ~/.ssh/github-deploy
# If passphrase is set, it will ask for it

# Verify deploy key in GitHub
# Go to: https://github.com/YOUR-USERNAME/jastipin-api/settings/keys
# Should show your deploy key
```

---

## 📝 TROUBLESHOOTING

### "Permission denied (publickey)"?
```bash
# SSH key not working with GitHub

# Check if key is in SSH config:
cat ~/.ssh/config | grep -A3 "Host github.com"

# Check file permissions:
chmod 600 ~/.ssh/github-deploy
chmod 600 ~/.ssh/github-deploy.pub
chmod 600 ~/.ssh/config

# Test specific key:
ssh -i ~/.ssh/github-deploy -T git@github.com

# Check if GitHub has the public key:
cat ~/.ssh/github-deploy.pub
# Compare with Deploy key in GitHub settings
```

### "Could not resolve hostname"?
```bash
# GitHub host not reachable
# Check internet connection:
ping github.com

# Check DNS:
nslookup github.com

# Test SSH on different port:
ssh -i ~/.ssh/github-deploy -p 443 -T git@ssh.github.com
```

### "fatal: could not read Username"?
```bash
# SSH config issue
# Make sure config is correct:
cat ~/.ssh/config

# Should have:
# Host github.com
#     User git
#     IdentityFile ~/.ssh/github-deploy

# Reload SSH:
ssh-add -D
ssh-add ~/.ssh/github-deploy
```

### "Repository not found"?
```bash
# Likely causes:
# 1. Wrong repository name
# 2. Repository is private and key doesn't have access
# 3. Deploy key not added to repository

# Check deploy key in GitHub:
# Go to repo settings → Deploy keys → Should show your key

# Or use HTTP with token (less secure):
# git remote set-url origin https://YOUR_TOKEN@github.com/YOUR-USERNAME/jastipin-api.git
```

---

## ✅ COMPLETION CHECKLIST

Before moving to CI/CD integration, verify:

- [ ] SSH key generated on server
- [ ] Public key added to GitHub (deploy key or user account)
- [ ] SSH config file created
- [ ] GitHub connection test successful
- [ ] Repository cloned/pulled
- [ ] Git user configured
- [ ] Deploy script created and tested
- [ ] Repository status shows clean working tree

---

## 🚀 NEXT STEP

GitHub SSH access is working and automatic deployments are possible!

Next: [07-ci-cd-integration.md](07-ci-cd-integration.md) - Setup CI/CD automation with GitHub Actions

---

**Previous:** [05-database-setup.md](05-database-setup.md)  
**Next:** [07-ci-cd-integration.md](07-ci-cd-integration.md)  
**Duration:** 15-20 minutes  
**Difficulty:** ⭐⭐⭐☆☆

✅ **GITHUB SSH SETUP COMPLETE - AUTO-DEPLOYMENT READY!**

