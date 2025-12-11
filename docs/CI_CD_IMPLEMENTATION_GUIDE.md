# 🔄 CI/CD IMPLEMENTATION GUIDE - PHASE 1

**Target:** Get CI/CD pipeline working THIS WEEK  
**Duration:** 2-3 hours  
**Tools:** GitHub Actions + Railway

---

## ✅ QUICK CHECKLIST

- [ ] Create GitHub Actions workflow files
- [ ] Push to GitHub
- [ ] Verify workflows run
- [ ] Set up Railway/Render integration
- [ ] Deploy staging environment
- [ ] Document deployment procedure

---

## 📝 STEP 1: Create GitHub Actions Workflows

### 1.1 Backend Test & Lint Workflow

Create `.github/workflows/backend-ci.yml`:

```yaml
name: Backend - CI

on:
  push:
    branches: [main, staging, develop]
    paths:
      - 'backend/**'
      - '.github/workflows/backend-ci.yml'
  pull_request:
    branches: [main, staging, develop]
    paths:
      - 'backend/**'

env:
  NODE_VERSION: '18'
  PNPM_VERSION: '8'

jobs:
  lint-and-build:
    name: Lint & Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: cd backend && pnpm install --frozen-lockfile

      - name: Run linter
        run: cd backend && pnpm lint --max-warnings=0

      - name: Build
        run: cd backend && pnpm build

  test:
    name: Run Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: cd backend && pnpm install --frozen-lockfile

      - name: Run tests
        run: cd backend && pnpm test --coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/coverage-final.json
```

### 1.2 Frontend Test & Build Workflow

Create `.github/workflows/frontend-ci.yml`:

```yaml
name: Frontend - CI

on:
  push:
    branches: [main, staging, develop]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-ci.yml'
  pull_request:
    branches: [main, staging, develop]
    paths:
      - 'frontend/**'

env:
  NODE_VERSION: '18'
  PNPM_VERSION: '8'

jobs:
  lint-and-build:
    name: Lint & Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: cd frontend && pnpm install --frozen-lockfile

      - name: Run linter
        run: cd frontend && pnpm lint --max-warnings=0

      - name: Type check
        run: cd frontend && pnpm build

      - name: Run tests
        run: cd frontend && pnpm test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/coverage-final.json
```

### 1.3 Deploy to Staging Workflow

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy Staging

on:
  push:
    branches: [staging]

jobs:
  deploy-backend:
    name: Deploy Backend to Staging
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Deploy Backend
        run: |
          echo "Deploying backend to Railway staging..."
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.RAILWAY_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "environment": "staging",
              "service": "backend",
              "branch": "staging"
            }' \
            https://api.railway.app/graphql

  deploy-frontend:
    name: Deploy Frontend to Staging
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Deploy Frontend
        run: |
          echo "Deploying frontend to Vercel staging..."
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.VERCEL_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "name": "jastipin-staging",
              "target": "staging"
            }' \
            https://api.vercel.com/v13/deployments
```

### 1.4 Deploy to Production Workflow

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy Production

on:
  push:
    branches: [main]
  workflow_dispatch:  # Allow manual trigger

jobs:
  test-and-build:
    name: Test & Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: |
          cd backend && pnpm test
          cd ../frontend && pnpm test

      - name: Build
        run: |
          cd backend && pnpm build
          cd ../frontend && pnpm build

  deploy-backend:
    name: Deploy Backend to Production
    runs-on: ubuntu-latest
    needs: test-and-build
    if: success()

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm install -g @railway/cli
          railway deploy --service backend

  deploy-frontend:
    name: Deploy Frontend to Production
    runs-on: ubuntu-latest
    needs: test-and-build
    if: success()

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}

  notify:
    name: Notify Deployment
    runs-on: ubuntu-latest
    needs: [deploy-backend, deploy-frontend]
    if: always()

    steps:
      - name: Send Slack notification
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "Jastipin Production Deployment",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Backend: ${{ job.status }}\nFrontend: ${{ job.status }}"
                  }
                }
              ]
            }
```

---

## 🔐 STEP 2: Set Up GitHub Secrets

Go to: **GitHub Repo → Settings → Secrets and variables → Actions**

### Add these secrets:

```
RAILWAY_TOKEN
├─ Get from: https://railway.app/account/tokens
└─ Scope: admin:all

VERCEL_TOKEN
├─ Get from: https://vercel.com/account/tokens
└─ Scope: Full Access

DATABASE_URL
├─ Copy from: backend/.env
└─ Format: postgresql://user:pass@host:port/db

JWT_SECRET
├─ Copy from: backend/.env
└─ Min length: 64 chars

JWT_REFRESH_SECRET
├─ Copy from: backend/.env
└─ Min length: 64 chars

API_PORT
├─ Value: 4000

FRONTEND_URL
├─ For Staging: https://staging.jastipin.me
├─ For Prod: https://jastipin.me

NEXT_PUBLIC_API_URL
├─ For Staging: https://api-staging.jastipin.me
├─ For Prod: https://api.jastipin.me

SLACK_WEBHOOK (optional)
├─ Get from: https://api.slack.com/messaging/webhooks
└─ For deployment notifications
```

---

## 🚂 STEP 3: Configure Railway Deployment

### 3.1 Create Railway Project

1. Go to https://railway.app
2. Create new project
3. Connect GitHub repo
4. Select `backend` directory
5. Set environment:

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
NODE_ENV=production
```

### 3.2 Configure Build & Deploy

```yaml
# railway.toml
[build]
builder = "nixpacks"

[build.config]
buildCommand = "cd backend && pnpm install && pnpm build"

[deploy]
startCommand = "cd backend && node dist/index.js"
```

---

## 🌐 STEP 4: Configure Vercel Deployment

### 4.1 Connect to Vercel

1. Go to https://vercel.com
2. Import from GitHub
3. Select `frontend` root directory
4. Add environment variables:

```
NEXT_PUBLIC_API_URL=https://api.jastipin.me
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 4.2 Configure Build Settings

```
Build Command:    pnpm build
Output Directory: .next
Install Command:  pnpm install --frozen-lockfile
```

---

## ✨ STEP 5: Test the CI/CD Pipeline

### 5.1 Make a test commit

```bash
# Create a test branch
git checkout -b test/ci-cd

# Make a small change
echo "# CI/CD Test" >> backend/README.md

# Push to trigger workflow
git add .
git commit -m "test: trigger CI/CD workflow"
git push origin test/ci-cd
```

### 5.2 Monitor GitHub Actions

1. Go to your repo
2. Click **Actions** tab
3. Watch workflows run in real-time
4. Check for any failures

### 5.3 Create a Pull Request

1. Go to GitHub
2. Create PR from `test/ci-cd` → `staging`
3. Verify tests pass before merging
4. Merge to `staging`
5. Verify deployment to staging environment

---

## 📋 STEP 6: Document the Workflow

Create `docs/DEPLOYMENT_WORKFLOW.md`:

```markdown
# Deployment Workflow

## Branches

- **main**: Production (auto-deploy on merge)
- **staging**: Staging environment
- **develop**: Development branch

## Merging to Production

1. Create feature branch from `develop`
2. Make changes and commit
3. Push to GitHub
4. Create Pull Request to `staging`
5. Request review
6. After approval, merge to `staging`
7. Test on staging environment
8. Create PR to `main`
9. Final review
10. Merge to `main` → Auto-deploy to production

## Manual Deployment

If automatic deployment fails:

```bash
# Backend
railway deploy --service backend

# Frontend
vercel --prod
```

## Rollback

```bash
# Backend (Railway)
railway rollback --service backend

# Frontend (Vercel)
vercel rollback
```
```

---

## 🔧 STEP 7: Set Up Environment Files

### .github/workflows/env.yml (optional)

Create reusable environment configuration:

```yaml
name: Environment Setup

env:
  STAGING_API_URL: https://api-staging.jastipin.me
  PROD_API_URL: https://api.jastipin.me
  STAGING_FRONTEND_URL: https://staging.jastipin.me
  PROD_FRONTEND_URL: https://jastipin.me
```

---

## ✅ VERIFICATION CHECKLIST

After setting up CI/CD, verify:

- [ ] GitHub Actions workflows appear in repo
- [ ] Workflows trigger on push/PR
- [ ] Tests run successfully
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Staging deployment works
- [ ] Can access staging environment
- [ ] Production deployment triggered on main push
- [ ] Can access production environment
- [ ] Notifications (Slack) work (if configured)

---

## 🎯 NEXT STEPS AFTER CI/CD IS RUNNING

1. **Improve test coverage** (target: >70%)
2. **Add performance tests** (Lighthouse)
3. **Add security scanning** (CodeQL, SAST)
4. **Add database migrations** to CI/CD
5. **Add backup job** before deployment
6. **Add smoke tests** on production

---

## 📞 TROUBLESHOOTING

### Workflow not triggering?
- Check branch name (main, staging, develop)
- Check file paths in `paths:` filter
- Verify push was to correct branch

### Build failing?
- Check Node version matches
- Check dependencies install correctly
- Review linting errors

### Deployment failing?
- Verify Railway/Vercel token is valid
- Check environment variables are set
- Review deployment logs

---

**Time to implement:** 2-3 hours  
**Value gained:** Automated testing + safe deployments  
**Next review:** After first production deployment

