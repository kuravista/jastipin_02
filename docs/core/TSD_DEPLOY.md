# 🚀 TSD_DEPLOY.md — Deployment & Operations (Jastipin v1.0)

**Scope:** deployment frontend (Cloudflare Pages), backend API & worker (Railway / VPS), Redis, Postgres, Cloudflare R2, WhatsApp integration, CI/CD, monitoring, backups, security, runbook.

**Target audience:** DevOps, Lead Engineer, Fullstack engineer.

---

## 1 — High-level deployment architecture

* Frontend: **Next.js** deployed to **Cloudflare Pages** (SSG for /t/:slug pages, CSR for dashboard).
* Shortlink resolver: **Cloudflare Worker** (edge redirect).
* Backend API: **Node.js (Express + Prisma)** hosted on **Railway** (or VPS).
* Worker: **Node.js worker** (BullMQ) hosted on Railway or separate dyno.
* Database: **Postgres** (managed via Railway).
* Cache/Queue: **Redis** (managed via Railway).
* Storage: **Cloudflare R2** for images & proofs.
* Messaging: **WhatsApp Cloud API (Meta)** via provider account (direct or via partner).
* Observability: **Sentry**, simple Prometheus/Grafana or integrate Railway metrics; **Bull Board** for queue UI.
* Domains & DNS: **Cloudflare DNS**; TLS managed by Cloudflare.

Diagram (simplified):

```
GitHub ──(CI)──> Cloudflare Pages (frontend)
         └─(CI)─> Railway: API, Worker
Cloudflare Worker (shortlink) -> Cloudflare Pages / API
API <-> Postgres (Railway)
Worker <-> Redis (Railway)
API/Worker <-> R2 (Cloudflare)
API/Worker <-> WhatsApp Cloud API (Meta)
Monitoring: Sentry + Prometheus/Grafana
```

---

## 2 — Environment & Secrets (ENV VARS)

Centralize secrets in Railway/Cloudflare (Pages secrets, Workers secrets), **never** commit to repo.

### Required ENV (per service)

**API / Worker**

```
NODE_ENV=production
PORT=8000
DATABASE_URL=postgresql://<user>:<pass>@<host>:<port>/<db>
REDIS_URL=redis://:<password>@<host>:<port>
JWT_SECRET=<random-strong-secret>
JWT_REFRESH_SECRET=<random-strong-secret>
WA_ACCESS_TOKEN=<meta-wa-access-token>
WA_PHONE_ID=<meta-wa-phone-id>
CF_R2_ACCOUNT_ID=<r2-account-id>
CF_R2_ACCESS_KEY=<r2-access-key>
CF_R2_SECRET_KEY=<r2-secret-key>
CF_R2_BUCKET=<bucket-name>
SENTRY_DSN=<sentry-dsn>
BULLMQ_PREFIX=jastipin:
BULLMQ_CONCURRENCY=5
BROADCAST_RATE_LIMIT=10  # messages/sec per worker
COST_ESTIMATOR_RATE=35   # per message -- fallback
```

**Cloudflare Pages**

```
NEXT_PUBLIC_API_BASE=https://api.jastipin.me
NEXT_PUBLIC_WA_PHONE=<official-wa-number>
NEXT_PUBLIC_SITE_NAME=Jastipin
```

**Cloudflare Worker** (shortlink)

```
CF_API_BASE=https://api.jastipin.me
WORKER_CACHE_TTL=3600
```

**CI/CD**

* GitHub Actions secrets or Railway connect.

---

## 3 — CI / CD Strategy

Goal: reproducible, safe, auditable deploys.

### Repos & Branching

* Repo layout: `/frontend`, `/api`, `/worker`, `/infra` (optional)
* Branches:

  * `main` → production
  * `develop` → staging
  * feature branches → PRs

### CI (GitHub Actions) — recommended pipelines

**Frontend (Cloudflare Pages)**

* Trigger: push to `main` (or merge PR)
* Steps:

  1. Install Node, cache pnpm/npm.
  2. `npm ci && npm run build` (Next build + next export if using export)
  3. Cloudflare Pages auto-deploy via GitHub integration or use `wrangler` publish for Workers.
* Secrets: CF_API_TOKEN (Pages), CF_ACCOUNT_ID.

**API & Worker (Railway)**

* Option A: Railway GitHub integration (auto-deploy `main`)
* Option B: GitHub Actions build → Docker image → push to registry → Railway deploy or VPS (SSH / Docker Compose).
* Steps:

  1. `npm ci && npm run build`
  2. Run tests: unit/integration
  3. Build Docker image (optional)
  4. Deploy to Railway

**Example GitHub Action (api)**:

```yaml
name: CI/CD API
on:
  push:
    branches: [ main ]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: node-version: 20
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - name: Deploy to Railway
        uses: railwayapp/cli-action@v1
        with:
          args: up --service api
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Staging

* Use `develop` branch → deploy to staging (Cloudflare Pages staging or separate Pages project, Railway staging project).
* Test end-to-end webhook & WhatsApp sandboxes here (use test WA phone or sandbox provider).

---

## 4 — Deployment Steps (Initial Production)

### Pre-deploy checklist

1. Domain ownership verified in Cloudflare, DNS set.
2. Railway project created with Postgres & Redis.
3. CF R2 bucket created; keys stored.
4. Sentry project & DSN created.
5. WhatsApp Business App set up with Meta account, phone number & access token.
6. GitHub repo connected to Cloudflare Pages (frontend) & Railway (api).
7. Secrets populated in respective platforms.

### Production deploy (one-off)

1. Merge `develop` → `main` after QA.
2. CI runs tests/build.
3. Cloudflare Pages deploys frontend.
4. Railway deploys API & worker.
5. Run DB migrations (Prisma migrate deploy).

   ```
   npx prisma migrate deploy --schema=prisma/schema.prisma
   ```
6. Run seed scripts if needed.
7. Smoke tests: healthcheck endpoints `/health`, sample join flow (use test phone), product upload → queue job.
8. Enable webhooks in Meta to point to production `/api/webhooks/whatsapp`.
9. Monitor logs & Sentry for errors first 30 min.

---

## 5 — Rollback Plan

**If frontend is broken:**

* Cloudflare Pages provides previous deployments; revert to previous deployment in Pages dashboard.

**If API/Worker is broken:**

* Railway: rollback to previous release via Railway UI or redeploy previous image.
* If using Docker on VPS: `docker-compose up --no-deps --force-recreate api:previous` or `docker image` tag.

**DB migration rollback:**

* Avoid destructive migrations on hot deploy. Use non-blocking approach: add columns first, backfill, then deploy code that uses them; then drop old columns in a later migration.
* If a migration fails: revert code, run `prisma migrate resolve` to mark migration as rolled back, and restore DB from backup if necessary.

**Emergency steps summary**

1. Cut traffic: change DNS or scale down worker.
2. Redeploy previous stable release.
3. If DB corrupted: restore latest backup.
4. Notify stakeholders & users (status page).

---

## 6 — Scaling & Capacity Planning

### Starting sizing assumptions (MVP)

* Postgres: single managed instance (Railway small tier).
* Redis: small instance for BullMQ (1–2 connections).
* API: 1–2 dynos (Railway), worker: 1 dyno.
* Cloudflare Pages: auto-scaling edge.

### Vertical & Horizontal scaling

* **Frontend**: Cloudflare Pages scales automatically.
* **API**: increase Railway instances or memory; for VPS, add containers behind load balancer (NGINX).
* **Worker**: scale horizontally by adding worker instances; set BullMQ `limiter` and use Redis for coordination.
* **DB**: scale to larger managed tier when CPU > 60% or memory pressure; enable read replicas later.

### Capacity triggers (metrics)

* Queue length > 500 → scale worker + alert.
* 95th percentile latency > 500ms on API → scale API.
* DB CPU > 60% for 5m → scale DB.
* WA API 5xx error rate > 1% → alert.

---

## 7 — Backups & Disaster Recovery

### Postgres backups

* Use Railway automated backups (daily) + manual snapshot before major migrations.
* Retention: 30 days.
* Restore test monthly.

### Cloudflare R2

* No built-in backups – enable lifecycle policy & replicate critical proofs/images to second bucket or backup to S3 if needed.
* For proofs (sensitive): consider private bucket & periodic backup to separate location monthly.

### Redis

* Use managed Redis snapshot (if provided) or persist RDB/AOF depending on provider.
* Redis used for transient queue; permanent data lives in Postgres. Snapshot retention: 7 days.

### Recovery RTO / RPO

* RTO target: 1 hour for API (partial degraded mode allowed)
* RPO target: 24 hours (daily backups) for MVP. Improve later.

---

## 8 — Observability & Alerts

### Logging

* API & Worker logs → centralized (Railway logs + Sentry).
* Use structured logs: `{level, service, jobId, tripId, participantId, msg}`.

### Monitoring & Metrics

* Track:

  * API latency (p50/p95/p99)
  * Error rate (4xx,5xx)
  * Queue depth (notifications, broadcast)
  * Worker success/failure rate
  * WhatsApp provider error codes & rate limits
  * Cost meter: paid messages sent per day
* Tools: Sentry, Railway metrics, Prometheus (optional), Grafana.

### Alerts (examples)

* Queue depth > 500 → P1 alert (Slack + PagerDuty)
* Worker failure rate > 5% (10m) → P1
* WA API 5xx errors > 1% → P1
* DB connection errors → P1

---

## 9 — Security & Compliance

### Network & Access

* Store secrets in Railway/Cloudflare secrets manager.
* Restrict DB access to app IPs (if VPS) or enforce VPC rules.
* Use TLS everywhere (Cloudflare terminates TLS for Pages; Railway handles TLS for services).

### Authentication & Authorization

* API JWT for session tokens; refresh tokens via secure httpOnly cookie.
* Admin endpoints (Bull Board) protected via strong auth (token + IP allowlist).

### Data protection

* Store phone numbers & personal data encrypted at rest (use DB provider encryption if available).
* PII retention policy: remove participants who unsubscribed after 90 days unless required for disputes.
* Proof-of-payment images stored private in R2 with expiring signed URLs for access.

### Secrets rotation

* Rotate WA_ACCESS_TOKEN and CLI tokens every 90 days.
* Use `secrets` pipeline for CI.

---

## 10 — Cost Management

### Major cost drivers (MVP)

* WhatsApp template (per message costs + provider fee)
* Railway dynos & managed DB/Redis tier
* Cloudflare R2 egress & storage
* Cloudflare Pages (mostly free for SSG)
* Monitoring (Sentry, Prometheus hosting)

### Tips to control costs

* Use free 24h window pattern to reduce paid messages.
* Segment recipients; avoid mass paid broadcast.
* Auto-scale worker conservatively; schedule batch jobs in off-peak if possible.
* Monitor R2 egress and image sizes (serve WebP & thumbnails).
* Consider weekly aggregated broadcasts (summary) vs per-product messages.

---

## 11 — Runbooks (common ops tasks)

### A. Deploy new backend version

1. Merge `develop` → `main`.
2. Wait for CI tests to pass.
3. Railway auto-deploy kicks in.
4. Run `npx prisma migrate deploy`.
5. Run smoke tests (`/health`, join flow).
6. Monitor Sentry & logs.

### B. Restart worker

* Railway: restart worker service (UI) or scale down/up dynos.
* VPS: `docker-compose restart worker`.

### C. Requeue failed jobs

* Use Bull Board to inspect failed jobs → retry individual jobs or requeue in batch.

### D. Restore DB from snapshot

1. Create downtime window.
2. Restore snapshot in Railway UI to new DB instance.
3. Point API to restored DB (test).
4. Switch traffic.

### E. Handling WA rate limits

1. If provider returns 429, pause worker enqueue for 2 minutes.
2. Notify team; check provider quota.
3. Resume with lower concurrency.

---

## 12 — Deployment Checklist (pre-go-live)

* [ ] Domain `jastipin.me` set in Cloudflare & Pages connected
* [ ] Shortlink Worker deployed & tested
* [ ] Railway project with Postgres & Redis provisioned
* [ ] CF R2 bucket created & access keys stored as secrets
* [ ] WA Business account configured; webhook pointing to staging/prod
* [ ] Sentry DSN & monitoring configured
* [ ] CI (GitHub Actions) configured for frontend & api
* [ ] DB migrations scripted & tested on staging
* [ ] Backup schedule verified
* [ ] Runbook created & on-call assigned for first 72 hours
* [ ] Cost estimator visible on dashboard for broadcasts

---

## 13 — Post-deploy checklist (first 72 hours)

* Monitor queue depth & memory usage every 30 minutes.
* Watch Sentry for new exceptions; triage immediately.
* Run join + product + order flow manual test every 4 hours.
* Check WA provider dashboard for delivery & rate metrics.
* Log anomalies & perform hotfix if needed.

---

## 14 — Future ops improvements (phase 2+)

* Add Infrastructure-as-Code (Terraform) for Cloudflare, R2, DNS, and Railway infra.
* Introduce blue/green deploys for API (avoid downtime during migrations).
* Auto-scaling rules for worker pool using queue depth.
* Auditing & billing export for customers (per-jastiper usage).
* SLOs & SLA documentation for enterprise customers.

---

## 15 — Useful Commands & Snippets

**Prisma migrate (deploy):**

```bash
npx prisma migrate deploy --schema=prisma/schema.prisma
```

**Run migrations locally (dev):**

```bash
npx prisma migrate dev --name init
```

**Start worker locally:**

```bash
REDIS_URL=redis://... node dist/worker.js
```

**Health check curl:**

```bash
curl -sSf https://api.jastipin.me/health || echo "unhealthy"
```

**Tail logs (Railway CLI):**

```bash
railway logs --service api
```

---

## 16 — Ownership & Contacts

* On-call rotation: `@oncall` Slack group
* Primary contacts:

  * DevOps Lead: [nama@example.com](mailto:nama@example.com)
  * Backend Lead: [nama2@example.com](mailto:nama2@example.com)
  * Product Owner: [nama3@example.com](mailto:nama3@example.com)
  * WhatsApp Provider Rep: [wa-provider@example.com](mailto:wa-provider@example.com)

---

## 17 — Closing notes

Dokumen ini adalah sumber utama untuk **deploy & ops** Jastipin v1.0.
Jaga agar selalu up-to-date: setiap perubahan infra/secret/migrations harus direkam di bagian `TSD_DEPLOY.md` (commit & PR).

