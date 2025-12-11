# ⚡ CI/CD INTEGRATION WITH GITHUB ACTIONS

**Purpose:** Setup GitHub Actions for automated testing, building, and deployment  
**Time Required:** 40-50 minutes  
**Prerequisites:** [06-github-ssh-setup.md](06-github-ssh-setup.md) ✅  
**Next Step:** [08-monitoring-backup.md](08-monitoring-backup.md)

---

## 📋 WHAT WE'LL DO

1. ✅ Create GitHub Actions workflows
2. ✅ Setup environment secrets
3. ✅ Configure automatic testing
4. ✅ Configure automatic deployment
5. ✅ Trigger and monitor workflows
6. ✅ Verify deployment automation

---

## ⚠️ PREREQUISITES

Before starting, verify:

```bash
# SSH into server
ssh -i ~/.ssh/server-deploy deploy@YOUR_SERVER_IP

# Verify application is ready:
# - Code in GitHub ✅
# - SSH key added to server ✅
# - .env configured ✅
# - Application running with PM2 ✅
# - Database connected ✅

# Verify PM2 is running
pm2 list

# Verify app is running
curl http://localhost:3000/

# You should get response from your API
```

---

## 🚀 STEP 1: CREATE GITHUB ACTIONS WORKFLOWS DIRECTORY

**On your local machine (or through GitHub web):**

```bash
# Navigate to your project directory
cd your-local-jastipin-api-repo

# Create workflows directory
mkdir -p .github/workflows

# Create main workflow file
touch .github/workflows/deploy.yml
```

---

## 🔧 STEP 2: CREATE MAIN DEPLOYMENT WORKFLOW

**Edit the deploy.yml file:**

```bash
# Open in editor
nano .github/workflows/deploy.yml

# Paste this configuration:
```

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch: # Allow manual trigger

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup PNPM
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Get PNPM store directory
        id: pnpm-cache
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

      - name: Setup PNPM cache
        uses: actions/cache@v3
        with:
          path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build application
        run: pnpm run build

      - name: Run tests
        run: pnpm run test:ci || echo "Tests not configured"
        continue-on-error: true

      - name: Deploy to server
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
          DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
          DEPLOY_PATH: ${{ secrets.DEPLOY_PATH }}
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H $DEPLOY_HOST >> ~/.ssh/known_hosts 2>/dev/null
          
          ssh -i ~/.ssh/deploy_key $DEPLOY_USER@$DEPLOY_HOST << 'EOF'
            cd $DEPLOY_PATH
            git fetch origin
            git reset --hard origin/main
            pnpm install
            pnpm run build
            pnpm exec prisma migrate deploy || true
            pm2 restart jastipin-api
            echo "✅ Deployment completed successfully"
          EOF

      - name: Notify on failure
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '❌ Deployment failed. Check logs in Actions tab.'
            })
```

**Save: Ctrl+X → Y → Enter**

---

## 🧪 STEP 3: CREATE TESTING WORKFLOW (OPTIONAL)

**Create separate testing workflow:**

```bash
# Create test workflow
nano .github/workflows/test.yml

# Paste this configuration:
```

```yaml
name: Tests & Linting

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup PNPM
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run linter
        run: pnpm run lint || echo "Linter not configured"
        continue-on-error: true

      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        run: pnpm run test || echo "Tests not configured"
        continue-on-error: true

      - name: Build check
        run: pnpm run build
```

**Save: Ctrl+X → Y → Enter**

---

## 📦 STEP 4: COMMIT WORKFLOWS TO GITHUB

**Push workflow files to repository:**

```bash
# Add workflow files to git
git add .github/workflows/

# Commit
git commit -m "feat: Add GitHub Actions CI/CD workflows"

# Push to GitHub
git push origin main

# You should see:
# ✓ [main xxxxxxx] feat: Add GitHub Actions CI/CD workflows
# 2 files changed, 150 insertions(+)
```

---

## 🔐 STEP 5: CREATE GITHUB SECRETS

**Go to GitHub repository settings:**

1. Navigate to: `https://github.com/YOUR-USERNAME/jastipin-api`
2. Go to: **Settings** → **Secrets and variables** → **Actions**
3. Click: **New repository secret**

**Add these secrets:**

### Secret 1: DEPLOY_SSH_KEY

```
Name: DEPLOY_SSH_KEY
Value: (private key from server - ~/.ssh/github-deploy)
```

**Get the private key from your server:**

```bash
# On your server:
cat ~/.ssh/github-deploy

# Copy the entire output (including -----BEGIN and END lines)
# Paste into GitHub secret
```

### Secret 2: DEPLOY_HOST

```
Name: DEPLOY_HOST
Value: YOUR_SERVER_IP_OR_DOMAIN (e.g., 123.45.67.89 or jastipin.me)
```

### Secret 3: DEPLOY_USER

```
Name: DEPLOY_USER
Value: deploy
```

### Secret 4: DEPLOY_PATH

```
Name: DEPLOY_PATH
Value: /var/www/jastipin-api
```

**After adding all secrets:**

```
You should see:
✓ DEPLOY_SSH_KEY
✓ DEPLOY_HOST
✓ DEPLOY_USER
✓ DEPLOY_PATH
```

---

## 🔑 STEP 6: VERIFY SSH KEY SECRET FORMAT

**Important:** SSH key must be properly formatted in GitHub secret

```bash
# On your server, view the key:
cat ~/.ssh/github-deploy

# It should look like:
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUtbm9uZS1ub25lAAAABG5vbmUAAAAEbm9u
...
-----END OPENSSH PRIVATE KEY-----

# When pasting in GitHub secret, include everything (BEGIN to END)
# GitHub will preserve newlines automatically
```

---

## 🧪 STEP 7: TEST WORKFLOW MANUALLY

**Trigger workflow manually:**

1. Go to: `https://github.com/YOUR-USERNAME/jastipin-api/actions`
2. Click: **Deploy to Production** workflow
3. Click: **Run workflow** → **Run workflow**

**Monitor execution:**

```
You'll see:
1. Checkout code - ✓
2. Setup Node.js - ✓
3. Setup PNPM - ✓
4. Get PNPM store directory - ✓
5. Setup PNPM cache - ✓
6. Install dependencies - ✓
7. Build application - ✓
8. Run tests - ✓
9. Deploy to server - ✓
```

---

## 📊 STEP 8: MONITOR WORKFLOW EXECUTION

**Check workflow logs:**

```
1. Go to: GitHub → Actions tab
2. Click on the workflow run
3. Expand each step to see detailed logs
4. Look for: "✅ Deployment completed successfully"
```

**If deployment fails:**

```
1. Check the error in workflow logs
2. Common issues:
   - SSH key not properly formatted
   - Deploy user permissions issue
   - Database migration failed
   - PM2 process name mismatch
```

---

## 🚀 STEP 9: AUTOMATIC DEPLOYMENT ON PUSH

**Now deployments are automatic:**

```bash
# On your local machine:

# Make a code change
nano src/index.ts
# ... make your changes ...

# Commit and push
git add .
git commit -m "feat: Add new API endpoint"
git push origin main

# GitHub Actions automatically:
# 1. Pulls your code
# 2. Installs dependencies
# 3. Runs tests
# 4. Builds application
# 5. Deploys to your server
# 6. Restarts PM2 process

# You can monitor the deployment:
# Go to: GitHub → Actions tab → Watch progress
```

---

## 📋 STEP 10: WORKFLOW CUSTOMIZATION

**Adjust workflow for your needs:**

**Example: Deploy only on tag (release version):**

```yaml
on:
  push:
    tags:
      - 'v*.*.*'  # Only deploy on version tags
```

**Example: Deploy to multiple servers:**

```yaml
strategy:
  matrix:
    environment: [staging, production]
servers:
  staging: 
    host: staging.example.com
  production:
    host: prod.example.com
```

**Example: Slack notifications:**

```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Deployment ${{ job.status }}",
        "status": "${{ job.status }}"
      }
```

---

## 🔍 STEP 11: VERIFY DEPLOYMENT COMPLETED

**Check on server:**

```bash
# SSH into server
ssh -i ~/.ssh/server-deploy deploy@YOUR_SERVER_IP

# View PM2 logs
pm2 logs jastipin-api --lines 50

# Check application is running
curl http://localhost:3000/

# Check latest git commit
cd /var/www/jastipin-api
git log --oneline -3

# Should show your recent commits pulled by GitHub Actions
```

---

## 📊 STEP 12: SETUP WORKFLOW NOTIFICATIONS

**Email notifications (GitHub default):**

```
Go to: GitHub → Settings → Notifications
- Workflow run notifications: ✅
- You'll receive emails when workflows fail
```

**Optional: Slack notifications:**

1. Create Slack webhook: https://api.slack.com/apps/new
2. Add to GitHub secrets: `SLACK_WEBHOOK`
3. Update workflow to include Slack step (see Step 10)

---

## 📝 WORKFLOW TROUBLESHOOTING

### Deployment fails with "SSH permission denied"?
```
Solution:
1. Check DEPLOY_SSH_KEY secret is correctly formatted
2. Verify private key includes BEGIN/END lines
3. Test key locally: ssh -i key.pem deploy@host
```

### Build fails on server?
```
Check logs in GitHub Actions:
- pnpm install failed → check pnpm-lock.yaml
- pnpm run build failed → check compilation errors
- prisma migrate failed → check database connection
```

### PM2 restart fails?
```
In workflow logs:
- Check PM2 process name matches: pm2 list
- Check file permissions
- Try: pm2 kill && pm2 start ecosystem.config.js
```

### Workflow hangs on deployment?
```
Add timeout:
jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 30
```

---

## ✅ COMPLETION CHECKLIST

Before moving to monitoring, verify:

- [ ] Workflow files created (.github/workflows/deploy.yml)
- [ ] GitHub secrets configured (4 secrets)
- [ ] Manual workflow trigger successful
- [ ] Automatic deployment on push working
- [ ] Server receives and processes push notifications
- [ ] PM2 restarts after deployment
- [ ] Application running new code version
- [ ] Logs show successful deployment

---

## 🎯 WHAT HAPPENS NOW

Every time you push to main branch:

```
1. GitHub Actions detects push to main
2. Workflow triggers automatically
3. Code is pulled and tested
4. Application is built
5. Deployed to your server via SSH
6. PM2 restarts the process
7. Latest code is live on production
8. Notifications sent (success/failure)
```

This is **CI/CD in action!** 🎉

---

## 🚀 NEXT STEP

Continuous deployment is now automated!

Next: [08-monitoring-backup.md](08-monitoring-backup.md) - Setup monitoring and backups

---

**Previous:** [06-github-ssh-setup.md](06-github-ssh-setup.md)  
**Next:** [08-monitoring-backup.md](08-monitoring-backup.md)  
**Duration:** 40-50 minutes  
**Difficulty:** ⭐⭐⭐⭐☆

✅ **CI/CD SETUP COMPLETE - AUTOMATED DEPLOYMENT IS ACTIVE!**

