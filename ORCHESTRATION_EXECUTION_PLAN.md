# 🎭 Jastipin.me MVP - Parallel Droid Execution Plan

**Orchestrator ID**: `jastipin-mvp-001`  
**Status**: 🟢 Ready for Parallel Execution  
**Total Tasks**: 10 phases (4 immediate + 6 sequential)  
**Timeline**: 12 weeks to MVP

---

## 📊 Execution Overview

```
PHASE 1 (PARALLEL - 4-6 hours)
├─ Task 1: @backend-architect     → Architecture & Prisma schema
└─ Task 2: @security-auditor      → Security design & compliance

PHASE 2 (PARALLEL - 12-16 hours)
├─ Task 3: @backend-typescript-architect  → Implement API + auth
└─ Task 4: @frontend-developer            → API integration + color update

PHASE 3 (SEQUENTIAL)
├─ Task 5: WhatsApp Webhook Integration   → Message parser, JOIN flow
├─ Task 6: BullMQ Queue Setup             → Notifications, broadcast
├─ Task 7: @test-automator                → Testing suite
├─ Task 8: @code-reviewer                 → Security & quality review
└─ Task 9: Deployment                     → Railway + Cloudflare

PHASE 4 (POST-MVP)
└─ Task 10: Optimization & scaling         → Phase 2 features
```

---

## 🎯 PHASE 1: Architecture & Security Design (IMMEDIATE - PARALLEL)

### Task 1: Backend Architecture Design
**Droid**: `@backend-architect`  
**Duration**: 4-6 hours  
**Status**: 🟡 Ready to invoke  
**Location**: `tasks/backend/12-11-2025/backend-architecture/TASK_BRIEF.md`

**Outputs Expected**:
- `architecture-plan.md` - System design, layers, middleware
- `prisma-schema.prisma` - Complete data model with relations
- `api-routes.md` - 25+ endpoints with request/response examples
- `middleware-layers.md` - Request pipeline documentation
- `database-setup.md` - Migrations, indexes, seed strategy
- `error-handling-strategy.md` - HTTP status codes, Sentry integration

**Invocation**:
```bash
# Droid gets this prompt:
"Read tasks/backend/12-11-2025/backend-architecture/TASK_BRIEF.md
 Complete all deliverables.
 Output files to tasks/backend/12-11-2025/backend-architecture/"
```

---

### Task 2: Security Design & Compliance
**Droid**: `@security-auditor`  
**Duration**: 4-6 hours  
**Status**: 🟡 Ready to invoke (PARALLEL with Task 1)  
**Location**: `tasks/backend/12-11-2025/security-design/TASK_BRIEF.md`

**Outputs Expected**:
- `authentication-strategy.md` - JWT lifecycle, token rotation, code examples
- `whatsapp-verification.md` - X-Hub-Signature verification with code
- `authorization-matrix.md` - RBAC, ownership checks
- `input-validation.md` - Zod schemas for all endpoints
- `rate-limiting-strategy.md` - Redis implementation, limits per endpoint
- `security-checklist.md` - OWASP Top 10 mitigations
- `secret-management.md` - Environment variables, rotation
- `compliance-checklist.md` - Indonesia GDPR, data privacy

**Invocation**:
```bash
# Droid gets this prompt:
"Read tasks/backend/12-11-2025/security-design/TASK_BRIEF.md
 Complete all deliverables.
 Output files to tasks/backend/12-11-2025/security-design/"
```

---

## 🔄 PHASE 2: Implementation (PARALLEL - After Phase 1)

### Task 3: Backend Implementation
**Droid**: `@backend-typescript-architect`  
**Duration**: 12-16 hours (can split across 2 days)  
**Status**: 🟡 Ready to invoke (after Task 1)  
**Depends On**: Task 1 (architecture-plan.md)  
**Location**: `tasks/backend/12-11-2025/backend-implementation/TASK_BRIEF.md`

**Outputs Expected**:
```
backend/
├── src/
│   ├── routes/          # Express routes
│   ├── services/        # Business logic
│   ├── middleware/      # Auth, validation, errors
│   ├── utils/           # JWT, password, validators
│   ├── types/           # TypeScript interfaces
│   ├── prisma/
│   │   └── schema.prisma
│   └── app.ts
├── package.json
├── .env.example
└── __tests__/           # Unit tests
```

**Key Files to Implement** (from TASK_BRIEF):
- `src/utils/jwt.ts` - Token generation/verification
- `src/utils/password.ts` - Bcrypt hashing
- `src/utils/validators.ts` - Zod schemas
- `src/middleware/auth.ts` - JWT verification
- `src/middleware/validate.ts` - Schema validation
- `src/middleware/errorHandler.ts` - Error handling
- `src/services/auth.service.ts` - Registration/login logic
- `src/services/trip.service.ts` - Trip CRUD
- `src/routes/auth.ts` - Register/login endpoints
- `src/routes/trips.ts` - Trip endpoints
- `src/app.ts` - Express setup
- Unit tests for auth

**Invocation**:
```bash
# Droid gets this prompt:
"Read tasks/backend/12-11-2025/backend-implementation/TASK_BRIEF.md
 Use outputs from tasks/backend/12-11-2025/backend-architecture/
 for architecture guidance.
 Implement all files listed.
 Create backend/ folder structure and run locally to test.
 Output all code to backend/ folder."
```

---

### Task 4: Frontend API Integration & Design Update
**Droid**: `@frontend-developer`  
**Duration**: 10-14 hours (can split across 2 days)  
**Status**: 🟡 Ready to invoke (after Task 3 starts or in parallel)  
**Depends On**: Task 3 (backend endpoints) + Task 2 (auth strategy)  
**Location**: `tasks/frontend/12-11-2025/api-integration/TASK_BRIEF.md`

**Outputs Expected**:
```
frontend/
├── lib/
│   ├── api-client.ts         # Fetch wrapper with token
│   └── auth-context.tsx      # Auth state management
├── app/
│   ├── globals.css           # Updated colors (Orange/Violet)
│   ├── layout.tsx            # Wrap with AuthProvider
│   ├── auth/
│   │   └── login/page.tsx    # Connected to API
│   ├── dashboard/
│   │   └── page.tsx          # Dynamic trips from API
│   └── profile/
│       └── [slug]/page.tsx   # Public profile
├── components/
│   └── AuthGuard.tsx         # Protected route wrapper
```

**Key Updates**:
- Colors: Primary Orange #FB923C, Accent Violet #7C3AED
- API Layer: `apiGet`, `apiPost`, `apiPatch` wrappers
- Auth: `AuthProvider` + `useAuth()` hook
- Pages: Login, Dashboard, Profile all connected
- Token management: localStorage + refresh logic

**Invocation**:
```bash
# Droid gets this prompt:
"Read tasks/frontend/12-11-2025/api-integration/TASK_BRIEF.md
 Read backend API endpoint specs from
 tasks/backend/12-11-2025/backend-architecture/api-routes.md
 Implement all deliverables in the frontend/ folder.
 Update colors to Orange (#FB923C) and Violet (#7C3AED).
 Test locally with running backend API."
```

---

## 🧭 PHASE 3: Integration & Testing (SEQUENTIAL)

### Task 5: WhatsApp Webhook Integration
**Status**: 🧭 Planned (after Task 3)  
**Duration**: 4-6 hours  
**Droid Assignment**: TBD (backend-engineer or specialized webhook handler)

**Scope**:
- Webhook receiver at POST /api/webhooks/whatsapp
- X-Hub-Signature verification (from Task 2)
- Message parser: JOIN, INFO, STOP commands
- Create participant when user joins
- Auto-reply via WhatsApp API
- Foundation for BullMQ notification jobs

**Implementation Location**: `backend/src/routes/webhooks.ts`

---

### Task 6: BullMQ Queue Setup
**Status**: 🧭 Planned (after Task 3)  
**Duration**: 3-4 hours  
**Droid Assignment**: TBD (devops-specialist or backend-engineer)

**Scope**:
- Redis queue initialization
- Job types: `sendNotification`, `broadcastMessage`, `proofNotify`
- Rate limiting: 10 messages/sec
- Retry logic: 3x with exponential backoff
- Bull Board for monitoring
- Integration with auth/trip/order endpoints

**Implementation Location**: `backend/src/queue/` and worker process

---

### Task 7: Testing Suite
**Droid**: `@test-automator`  
**Duration**: 6-8 hours  
**Status**: 🧭 Planned (after Task 3-4)

**Scope**:
- Unit tests for auth (register, login, token refresh)
- Unit tests for CRUD services (trips, products, orders)
- Integration tests for full flows
- E2E tests: Join flow, order flow, broadcast
- Coverage target: 70%+
- Tools: Jest, Supertest, Playwright

**Implementation Location**: `backend/__tests__/` and `frontend/__tests__/`

---

### Task 8: Code Review & Security Audit
**Droid**: `@code-reviewer`  
**Duration**: 4-6 hours  
**Status**: 🧭 Planned (after Task 3-4)

**Scope**:
- Security audit against OWASP Top 10
- SOLID principles validation
- 600-line file limit enforcement
- JSDoc completeness check
- Type safety (no 'any' types)
- Vulnerability scan (npm audit)
- Code quality metrics

**Review Checklist**:
- [ ] No SQL injection vectors
- [ ] JWT handling correct
- [ ] Authorization checks on all endpoints
- [ ] Input validation complete
- [ ] Error messages don't leak info
- [ ] Secrets not in code
- [ ] Dependencies up-to-date

---

### Task 9: Deployment Setup
**Status**: 🧭 Planned (Week 11-12)  
**Duration**: 3-4 hours  
**Droid Assignment**: TBD (devops-specialist)

**Scope**:
- Railway: PostgreSQL database setup
- Railway: Express API deployment (auto-scale)
- Railway: Redis instance setup
- Railway: Worker deployment (BullMQ)
- Cloudflare: DNS configuration
- Cloudflare: Pages (frontend)
- Cloudflare: Workers (shortlink resolver)
- Environment variables setup
- SSL/HTTPS validation
- Monitoring: Sentry, Cloudflare Analytics

---

## 📋 How to Invoke Droids via Factory CLI

Once each droid is ready, use Factory CLI to delegate:

### Immediate Invocation (Phase 1 - Both tasks in parallel)

```bash
# Terminal 1 - Backend Architecture
factory invoke-droid backend-architect \
  --task-id backend-architecture-001 \
  --brief "Read tasks/backend/12-11-2025/backend-architecture/TASK_BRIEF.md and complete all deliverables" \
  --output-dir tasks/backend/12-11-2025/backend-architecture/

# Terminal 2 - Security Design (PARALLEL)
factory invoke-droid security-auditor \
  --task-id security-design-001 \
  --brief "Read tasks/backend/12-11-2025/security-design/TASK_BRIEF.md and complete all deliverables" \
  --output-dir tasks/backend/12-11-2025/security-design/
```

### Phase 2 Invocation (After Phase 1 completes)

```bash
# Terminal 3 - Backend Implementation
factory invoke-droid backend-typescript-architect \
  --task-id backend-implementation-001 \
  --brief "Read tasks/backend/12-11-2025/backend-implementation/TASK_BRIEF.md. Reference architecture from tasks/backend/12-11-2025/backend-architecture/" \
  --output-dir backend/

# Terminal 4 - Frontend Integration (PARALLEL)
factory invoke-droid frontend-developer \
  --task-id api-integration-frontend-001 \
  --brief "Read tasks/frontend/12-11-2025/api-integration/TASK_BRIEF.md. Use API specs from backend-architecture." \
  --output-dir frontend/
```

### Phase 3 Invocation (Sequential, as dependencies complete)

```bash
# Terminal 5 - Testing
factory invoke-droid test-automator \
  --task-id testing-001 \
  --brief "Create comprehensive test suites for backend auth, CRUD, and frontend flows" \
  --output-dir tests/

# Terminal 6 - Code Review
factory invoke-droid code-reviewer \
  --task-id code-review-001 \
  --brief "Audit backend and frontend code against SOLID, security, quality standards" \
  --output-dir code-review-report/
```

---

## 📊 Success Metrics

### Phase 1 (4-6 hours)
- ✅ Prisma schema complete with all relations
- ✅ 25+ endpoints documented with examples
- ✅ Security strategy documented with code
- ✅ No blocker issues identified

### Phase 2 (12-16 hours)
- ✅ Backend API running locally (npm run dev)
- ✅ All auth endpoints working (register, login, refresh)
- ✅ Trip CRUD working
- ✅ Frontend connected to API
- ✅ Color scheme updated (Orange/Violet)
- ✅ Auth flow works end-to-end

### Phase 3+ (Remaining weeks)
- ✅ WhatsApp integration working (JOIN command → participant)
- ✅ Queue jobs processing (10 msg/sec)
- ✅ 70%+ test coverage
- ✅ No critical security issues
- ✅ Deployed to staging

---

## 🔄 Parallel Execution Benefits

**Time Saved**:
- Phase 1: 2 tasks × 5 hours = 5 hours → 5 hours (no saving, they're independent)
- Phase 2: 2 tasks × 14 hours = 28 hours → 14 hours (50% savings!)
- **Total**: ~40% faster than sequential

**Quality Improvements**:
- Architecture independently validated
- Security reviewed in isolation
- Frontend and backend developed in parallel → fewer integration surprises
- Multiple eyes on code earlier (code review can happen during testing)

---

## 🚀 Critical Path

**Must Complete Before Moving Forward**:
1. ✅ **Task 1** (architecture) → Blocks Task 3
2. ✅ **Task 2** (security) → Informs Task 3 & Task 4
3. ✅ **Task 3** (backend) → Blocks Task 5, Task 7
4. ✅ **Task 4** (frontend) → Ready immediately after Task 3
5. ✅ **Task 5** (webhook) → Blocks pilot testing
6. ✅ **Task 6** (queue) → Blocks broadcast feature
7. ✅ **Task 7** (tests) → Blocks code review
8. ✅ **Task 8** (review) → Blocks deployment
9. ✅ **Task 9** (deploy) → MVP goes live

**Longest Path**: Task 1 → Task 3 → Task 5 → Task 7 → Task 8 → Task 9 (~8 weeks)

---

## 📁 Directory Structure (After Execution)

```
jastipin/
├── droids/                           # Available specialist droids
├── orchestrator/                     # Orchestrator config
├── tasks/
│   ├── backend/12-11-2025/
│   │   ├── backend-architecture/     # Task 1 outputs
│   │   ├── security-design/          # Task 2 outputs
│   │   └── backend-implementation/   # Task 3 outputs
│   └── frontend/12-11-2025/
│       └── api-integration/          # Task 4 outputs
├── backend/                          # Task 3 implementation
├── frontend/                         # Task 4 implementation
├── docs/
│   ├── core/PRD_MVP_v4.2.md
│   ├── core/TSD_CORE_v1.1.md
│   └── ...
└── ORCHESTRATION_EXECUTION_PLAN.md   # This file
```

---

## 🎓 Learning & Memory

After each task completes:
1. Document lessons learned in `files-edited.md`
2. Update cross-project memory:
   - Success patterns → `orchestrator/memory/success_patterns.json`
   - Failure patterns → `orchestrator/memory/failure_patterns.json`
   - Templates → `orchestrator/memory/project_templates.json`

**Example Memory Entry** (after Task 3 completes):
```json
{
  "id": "express-prisma-auth-setup-2025-11",
  "pattern_name": "Express + Prisma JWT Authentication Setup",
  "use_case": "When building Node.js APIs with database",
  "implementation": [
    "Create JWT utils (generate, verify tokens)",
    "Create auth middleware (verify header token)",
    "Create auth service (register, login logic)",
    "Hash passwords with bcrypt (10 rounds)",
    "Use Zod for input validation",
    "Store refresh token in httpOnly cookie",
    "Use Prisma for type-safe queries"
  ],
  "technologies": ["Express.js", "Prisma", "JWT", "bcrypt", "Zod"],
  "benefits": ["Type-safe", "Quick setup", "Battle-tested", "Easy to extend"],
  "success_rate": 0.95
}
```

---

## ⚡ Next Steps

1. **Confirm Readiness**: Review Phase 1 task briefs
2. **Invoke Droids**: Use Factory CLI commands above
3. **Monitor Progress**: Check output directories for completeness
4. **Validate Outputs**: Ensure each phase meets success criteria
5. **Proceed to Next Phase**: Start Phase 2 after Phase 1 complete

---

## 📞 Support & Debugging

**If Task Fails**:
1. Check error message in droid output
2. Review task brief for missing context
3. Check reference files (PRD, TSD) for alignment
4. Consult code examples in task brief
5. Consider invoking error-detective droid for diagnosis

**Common Issues**:
- **Missing context**: Add reference files to task brief
- **Unclear requirements**: Provide concrete examples
- **Integration confusion**: Ensure depends-on tasks completed first
- **Type errors**: Review TypeScript strict mode settings

---

## 🎯 Summary

This document outlines how to execute Jastipin.me MVP using **parallel specialist droids** for maximum efficiency:

- **Phase 1** (4-6h): Architecture + Security design
- **Phase 2** (12-16h parallel): Backend implementation + Frontend integration
- **Phase 3+**: Testing, review, deployment

**Timeline**: 12 weeks to MVP  
**Parallel Benefit**: ~40% time savings vs sequential  
**Quality**: Multiple expert eyes, peer review built-in

Ready to invoke! 🚀
