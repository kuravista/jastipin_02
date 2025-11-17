# Git Workflow Strategy for Jastipin.me MVP

## Overview
This document outlines the git commit strategy for Jastipin.me MVP development using parallel specialist droid execution.

## Commit Strategy

### 1. Commit Structure
Each commit follows this pattern:

```
<type>(<scope>): <subject>

<body>

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
```

### 2. Commit Types
- `feat`: New feature implementation
- `arch`: Architecture and planning documents
- `security`: Security strategy and implementation
- `refactor`: Code restructuring
- `test`: Test additions or fixes
- `docs`: Documentation updates
- `fix`: Bug fixes
- `ci`: CI/CD configuration
- `perf`: Performance optimizations

### 3. Scope (Relates to Project Areas)
- `backend`: Backend API implementation
- `frontend`: Frontend implementation
- `auth`: Authentication and authorization
- `db`: Database schema and migrations
- `whatsapp`: WhatsApp integration
- `queue`: BullMQ and Redis queue setup
- `api`: REST API endpoints
- `ui`: UI components and styling
- `security`: Security implementations
- `deploy`: Deployment configuration

### 4. Commit Timing Strategy

#### Phase 1 (Architecture & Security - 4-6 hours)
- **Commit 1**: Backend architecture design
  - Files: architecture-plan.md, prisma-schema.prisma, api-routes.md, middleware-layers.md
  - Type: `arch(backend): design system architecture and database schema`

- **Commit 2**: Backend security design
  - Files: authentication-strategy.md, whatsapp-verification.md, authorization-matrix.md
  - Type: `arch(security): define authentication, authorization, and security strategy`

- **Commit 3**: Validation and error handling
  - Files: input-validation.md, error-handling-strategy.md
  - Type: `arch(api): define validation schemas and error handling patterns`

- **Commit 4**: Rate limiting and compliance
  - Files: rate-limiting-strategy.md, secret-management.md, compliance-checklist.md
  - Type: `security(backend): implement rate limiting and compliance strategy`

#### Phase 2 (Implementation - 12-16 hours)
- **Commit 5**: Backend API initial setup
  - Files: package.json, tsconfig.json, src/app.ts
  - Type: `feat(backend): initialize Express API with TypeScript and Prisma setup`

- **Commit 6**: Authentication system
  - Files: src/utils/jwt.ts, src/middleware/auth.ts, src/services/auth.service.ts
  - Type: `feat(auth): implement JWT authentication with token rotation`

- **Commit 7**: Core CRUD endpoints
  - Files: src/routes/users.ts, src/routes/trips.ts, src/routes/products.ts
  - Type: `feat(api): implement core CRUD endpoints for users, trips, products`

- **Commit 8**: Order and validation
  - Files: src/routes/orders.ts, src/utils/validators.ts, src/middleware/validate.ts
  - Type: `feat(api): implement order endpoints with Zod validation`

- **Commit 9**: Error handling and middleware
  - Files: src/middleware/errorHandler.ts, src/utils/error.ts
  - Type: `feat(api): implement centralized error handling middleware`

- **Commit 10**: Database initialization
  - Files: prisma/schema.prisma, prisma/migrations/
  - Type: `feat(db): initialize Prisma migrations and database setup`

- **Commit 11**: Unit tests for backend
  - Files: __tests__/auth.test.ts, __tests__/services.test.ts
  - Type: `test(backend): add comprehensive unit tests for auth and services`

- **Commit 12**: Frontend API integration
  - Files: lib/api-client.ts, lib/auth-context.tsx, components/AuthGuard.tsx
  - Type: `feat(frontend): implement API client and authentication context`

- **Commit 13**: Frontend pages and styling
  - Files: app/layout.tsx, app/auth/login/page.tsx, app/dashboard/page.tsx, app/globals.css
  - Type: `feat(ui): implement frontend pages and update color scheme (Orange/Violet)`

#### Phase 3+ (Integration & Testing)
- **Commit 14**: WhatsApp webhook integration
  - Files: src/routes/webhooks.ts, src/utils/whatsapp.ts
  - Type: `feat(whatsapp): implement webhook receiver and message parser`

- **Commit 15**: BullMQ queue setup
  - Files: src/queue/, src/workers/
  - Type: `feat(queue): implement BullMQ job queue and worker processes`

- **Commit 16**: Integration tests
  - Files: __tests__/integration/
  - Type: `test(integration): add end-to-end integration tests`

- **Commit 17**: Deployment configuration
  - Files: Dockerfile, docker-compose.yml, .railway.yml, .env.example
  - Type: `ci(deploy): add Docker and Railway deployment configuration`

## Example Commit Messages

```bash
# Architecture commit
git commit -m "arch(backend): design system architecture and database schema

- Define 3-layer architecture (routes, services, middleware)
- Create Prisma schema with 7 models (User, Trip, Participant, Product, Order)
- Document API endpoint structure (25+ endpoints)
- Define middleware pipeline (auth, validation, error handling)
- Setup database indexes for performance

References: tasks/backend/12-11-2025/backend-architecture/

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"

# Feature implementation commit
git commit -m "feat(auth): implement JWT authentication with token rotation

- Create JWT utility functions (generate, verify, refresh)
- Implement auth middleware with token verification
- Add token rotation on refresh with family ID tracking
- Hash passwords with bcrypt (10 rounds)
- Add refresh token grace period (5 min) for legitimate rotation

References: tasks/backend/12-11-2025/backend-architecture/authentication-strategy.md

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"

# Test commit
git commit -m "test(backend): add comprehensive unit tests for auth and services

- Add 15 unit tests for authentication (register, login, refresh, logout)
- Add 10 tests for trip service (CRUD operations)
- Add 8 tests for validation functions
- Achieve 92% code coverage for auth module
- Setup Jest with ts-jest configuration

Coverage report: __tests__/coverage/

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"
```

## Branches (if needed)

### Main Branch Strategy
- **main**: Production-ready code
- **dev**: Integration branch for features
- Feature branches (if multiple teams):
  - `feat/backend-api`
  - `feat/frontend-integration`
  - `feat/whatsapp-integration`

For this project with single droid execution per phase, **direct commits to main** are acceptable after each phase validation.

## Commit Validation Checklist

Before each commit:
- [ ] Code passes linting (ESLint for TypeScript)
- [ ] No TypeScript errors in strict mode
- [ ] All unit tests pass
- [ ] No secrets/credentials in code
- [ ] Code follows 600-line file limit
- [ ] JSDoc comments on public functions
- [ ] Follows AGENTS.md coding standards
- [ ] Related files-edited.md exists (for task completion)
- [ ] Commit message follows template above

## Review Process

1. **Droid Completion**: Droid outputs all files to task folder
2. **Validation**: Check files-edited.md for completeness
3. **Code Review**: Verify against AGENTS.md standards
4. **Security Check**: Run security audit
5. **Commit**: Execute git commit with proper message
6. **Tag**: Create version tag for phase completion
   - Example: `git tag phase-1-complete`

## Revert Strategy

If a commit needs to be reverted:
```bash
git revert <commit-hash>
```

This creates a new commit that undoes the changes, preserving history.

## Memory Integration

Each commit should reference patterns from orchestrator/memory/:
- If using JWT pattern: Reference `jwt-refresh-rotation-mvp-2025-11`
- If using WhatsApp security: Reference `whatsapp-webhook-security-2025-11`
- If using rate limiting: Reference `rate-limiting-sliding-window-2025-11`
- If using form validation: Reference `react-form-validation-notifications-2025-11`

## Collaboration Notes

- All commits from this project use factory-droid co-author
- Each phase is a logical unit (4-6 hours of work)
- No empty commits - each commit must have meaningful changes
- Push only when explicitly requested or when phase completes

---

**Status**: 🟢 Ready for Phase 1 Execution
**Next Step**: Execute Phase 1 (backend architecture + security design)
