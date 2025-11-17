# 🚀 JASTIPIN.ME MVP - MASTER GUIDE

**Status**: ✅ Ready to Execute  
**Phase**: 1 - Architecture & Security Design  
**Duration**: 4-6 hours  
**Timeline**: 12 weeks to MVP

---

## ⚡ EXECUTE NOW (Copy & Paste)

### Terminal 1:
```bash
cd D:\Data\jastipin03
factory invoke-droid backend-architect \
  --task-id backend-architecture-001 \
  --task-brief-path "tasks/backend/12-11-2025/backend-architecture/TASK_BRIEF.md" \
  --output-dir "tasks/backend/12-11-2025/backend-architecture/"
```

### Terminal 2 (New - PARALLEL):
```bash
cd D:\Data\jastipin03
factory invoke-droid security-auditor \
  --task-id security-design-001 \
  --task-brief-path "tasks/backend/12-11-2025/security-design/TASK_BRIEF.md" \
  --output-dir "tasks/backend/12-11-2025/security-design/"
```

**Done!** Both droids now executing in parallel. Keep terminals open.

---

## 📊 MONITORING (4-6 Hours)

### Every 30-60 Minutes, Check:

**Folder 1:**
```
D:\Data\jastipin03\tasks\backend\12-11-2025\backend-architecture\
```
Expected files (in order):
- architecture-plan.md
- prisma-schema.prisma
- api-routes.md
- middleware-layers.md
- database-setup.md
- error-handling-strategy.md
- **files-edited.md** ← Completion signal ✓

**Folder 2:**
```
D:\Data\jastipin03\tasks\backend\12-11-2025\security-design\
```
Expected files (in order):
- authentication-strategy.md
- whatsapp-verification.md
- authorization-matrix.md
- input-validation.md
- rate-limiting-strategy.md
- security-checklist.md
- secret-management.md
- compliance-checklist.md
- **files-edited.md** ← Completion signal ✓

### Timeline:
```
0h     → Executing (reading briefs)
+30m   → First files appear
+1-2h  → 4-5 files each folder
+3-4h  → 7-8 files each folder
+4-6h  → files-edited.md appears = DONE! 🎉
```

---

## 📁 PROJECT STRUCTURE

```
D:\Data\jastipin03\
├─ START.md                          ← You are here
├─ AGENTS.md                         ← Coding rules
├─ ORCHESTRATION_EXECUTION_PLAN.md  ← Full 12-week roadmap (reference)
│
├─ droids/                          (105 specialist droids)
├─ orchestrator/                    (Config + memory system)
├─ docs/core/                       (Product & Tech specs)
├─ tasks/                           (Task briefs)
│  ├─ backend/12-11-2025/
│  │  ├─ backend-architecture/TASK_BRIEF.md     ← Phase 1
│  │  ├─ security-design/TASK_BRIEF.md          ← Phase 1
│  │  └─ backend-implementation/TASK_BRIEF.md   ← Phase 2
│  └─ frontend/12-11-2025/
│     └─ api-integration/TASK_BRIEF.md          ← Phase 2
│
├─ backend/                         (Created in Phase 2)
└─ frontend/                        (Existing prototype)
```

---

## 🎯 PROJECT OVERVIEW

**What**: Jastipin.me - WhatsApp-integrated courier platform  
**Problem**: Indonesian couriers manage orders manually in WhatsApp groups (chaos!)  
**Solution**: Automatic order management via WhatsApp bot + web dashboard  
**MVP Goal**: 300 jastiper + 3,000+ buyers in Indonesia  

**Tech Stack**:
- Frontend: Next.js 16 + React 19 + Tailwind v4 (Cloudflare Pages)
- Backend: Express + Prisma ORM (Railway)
- Database: PostgreSQL (Railway)
- Storage: Cloudflare R2
- Integration: WhatsApp Cloud API
- Queue: BullMQ + Redis

---

## 📋 EXECUTION PHASES

### Phase 1: Architecture & Security (NOW - 4-6 hours) 🔵

**Droids**: @backend-architect + @security-auditor (PARALLEL)

**Deliverables**:
- Complete system architecture + layers
- Prisma database schema with all models
- 25+ API endpoints fully documented
- JWT authentication strategy + code examples
- WhatsApp webhook verification code
- RBAC authorization matrix
- Zod validation schemas (copy-paste ready)
- Security checklist (OWASP Top 10)
- Indonesia GDPR compliance guide

**Where**: `tasks/backend/12-11-2025/backend-architecture/` + `tasks/backend/12-11-2025/security-design/`

---

### Phase 2: Implementation (After Phase 1) 🟡

**Droids**: @backend-typescript-architect + @frontend-developer (PARALLEL)

**Deliverables**:
- Working Express API with auth + CRUD endpoints
- PostgreSQL database with Prisma migrations
- Integrated Next.js frontend
- Updated colors (Orange #FB923C, Violet #7C3AED)
- Complete authentication flow
- API client with token management
- All endpoints tested locally

**Duration**: 12-16 hours parallel execution

---

### Phase 3+: Testing, Deployment, Pilot 🧭

After Phase 2 complete:
- WhatsApp webhook integration
- BullMQ queue setup
- Comprehensive testing suite
- Security audit
- Deployment to Railway + Cloudflare
- Pilot with 10 jastiper

**Duration**: Remaining weeks

---

## 🎓 CODING STANDARDS (IMPORTANT!)

**Read**: `AGENTS.md` (in root folder)

Key rules:
- ✅ Max 600 lines per file (target 500-600)
- ✅ Single Responsibility Principle (SRP)
- ✅ JSDoc comments for all public functions
- ✅ TypeScript strict mode (no 'any' types)
- ✅ Zod validation for inputs
- ✅ Dependency injection pattern
- ✅ Unit tests for business logic
- ✅ No dynamic imports

---

## 📊 WHAT DROIDS WILL CREATE

### @backend-architect (7 files)
1. `architecture-plan.md` - System design & layers
2. `prisma-schema.prisma` - Complete database schema
3. `api-routes.md` - All 25+ endpoints with examples
4. `middleware-layers.md` - Request processing pipeline
5. `database-setup.md` - Indexes & migration strategy
6. `error-handling-strategy.md` - HTTP codes & error responses
7. `files-edited.md` - Completion summary

### @security-auditor (9 files)
1. `authentication-strategy.md` - JWT lifecycle + code
2. `whatsapp-verification.md` - X-Hub-Signature verification code
3. `authorization-matrix.md` - RBAC & permission checks
4. `input-validation.md` - Zod schemas (copy-paste ready)
5. `rate-limiting-strategy.md` - Redis rate limiter code
6. `security-checklist.md` - OWASP Top 10 compliance
7. `secret-management.md` - Environment variables
8. `compliance-checklist.md` - Indonesia GDPR requirements
9. `files-edited.md` - Completion summary

**Total**: 16 deliverables

---

## ⏱️ TIMELINE

```
NOW:            Execute Phase 1 (4-6 hours)
+6 hours:       Phase 1 complete, validate outputs
+6-22 hours:    Execute Phase 2 (12-16 hours, parallel)
+22+ hours:     Phase 2 complete (API + UI working)
+4 weeks:       Phase 3 (testing, deployment, pilot)
+12 weeks:      🚀 MVP READY FOR LAUNCH
```

---

## ✅ QUICK CHECKLIST

**Before Running**:
- [ ] Factory CLI installed (`factory --version` works)
- [ ] Terminal ready
- [ ] Task briefs exist in `tasks/` folders
- [ ] Both output directories exist

**Execute Phase 1**:
- [ ] Run Terminal 1 command (backend-architect)
- [ ] Run Terminal 2 command (security-auditor)
- [ ] Both showing "EXECUTING"

**Monitor (4-6 hours)**:
- [ ] Check folders every 30-60 min
- [ ] Track file count increasing
- [ ] Look for files-edited.md

**Completion**:
- [ ] files-edited.md in both folders
- [ ] All deliverables present (7 + 9 files)
- [ ] Ready for Phase 2

---

## 🆘 TROUBLESHOOTING

### Factory CLI not found
```bash
factory --version
# If error: pip install factory-cli
```

### Task brief path not found
Use absolute paths:
```bash
factory invoke-droid backend-architect \
  --task-brief-path "D:\Data\jastipin03\tasks\backend\12-11-2025\backend-architecture\TASK_BRIEF.md"
```

### No files appearing after 2 hours
```bash
factory logs backend-architecture-001
factory status backend-architecture-001
```

### Only 1 droid producing output
Re-invoke the silent droid with full content:
```bash
factory invoke-droid security-auditor \
  --task-brief "$(cat tasks/backend/12-11-2025/security-design/TASK_BRIEF.md)"
```

---

## 📚 REFERENCE DOCUMENTS

**In Root Folder**:
- `AGENTS.md` - Coding standards & rules
- `ORCHESTRATION_EXECUTION_PLAN.md` - Full 12-week detailed roadmap

**In Docs Folder** (`docs/core/`):
- `PRD_MVP_v4.2.md` - Product requirements (user flows, features)
- `TSD_CORE_v1.1.md` - Technical architecture (API design, database)

**In Tasks Folder** (`tasks/`):
- Task briefs for each phase with detailed requirements

---

## 🎯 NEXT STEPS

### RIGHT NOW:
1. Copy Terminal 1 command (above) → Paste & run
2. Copy Terminal 2 command (above) → Paste & run in new terminal
3. Keep both terminals open
4. Droids now working in parallel!

### MONITORING:
- Check output folders every 30-60 min
- Look for new `.md` files appearing
- When `files-edited.md` appears → Phase 1 DONE! ✓

### AFTER PHASE 1:
1. Validate all files present
2. Run Phase 2 commands (same pattern)
3. Continue for Phase 3+

---

## 🎉 YOU'RE READY!

```
✅ Setup complete
✅ Task briefs ready
✅ Droids selected
✅ Commands prepared
✅ Ready to execute NOW

Next action: Copy commands above and run them!
```

---

## 📊 PROJECT STATUS

```
🟢 PHASE 1 READY
├─ Droids: @backend-architect + @security-auditor
├─ Execution: PARALLEL
├─ Duration: 4-6 hours
├─ Commands: Ready to copy & paste above
└─ Action: Execute now!
```

---

## 💡 TIPS

- ✅ Keep both terminals open during execution
- ✅ Check folders every 1 hour (not just 30 min)
- ✅ `files-edited.md` = completion signal
- ✅ Phase 2 uses same commands pattern
- ✅ All code must follow 600-line limit (see AGENTS.md)

---

**Last Updated**: 2025-11-12  
**Status**: 🟢 READY FOR EXECUTION  
**Next Action**: Copy commands above and run!

Let's build! 🚀
