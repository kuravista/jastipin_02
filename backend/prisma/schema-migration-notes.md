# Migration Strategy for DP Flow

## Option 1: Direct Migration (Risky)
```bash
npx prisma migrate dev --name add_dp_flow_support
```
⚠️ **Risk**: Might fail if existing data conflicts with new constraints

---

## Option 2: Safe Migration (Recommended)

### Step 1: Generate Migration SQL (No Apply)
```bash
# If shadow DB error, use this:
npx prisma migrate dev --create-only --name add_dp_flow_support

# Alternative: Generate diff
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma.backup \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migrations/manual_migration.sql
```

### Step 2: Review Generated SQL
Check for:
- [ ] ALTER TABLE statements
- [ ] New columns with defaults
- [ ] Foreign key constraints
- [ ] Indexes
- [ ] Data that might break constraints

### Step 3: Add Data Migration
Before applying, add SQL for existing data:

```sql
-- Example: Migrate existing order status
UPDATE "Order" 
SET status = 'confirmed' 
WHERE status = 'pending' AND "proofUrl" IS NOT NULL;

UPDATE "Order" 
SET status = 'pending_dp' 
WHERE status = 'pending';
```

### Step 4: Backup & Apply
```bash
# Backup database first!
pg_dump jastipin > backup_before_migration.sql

# Apply migration
npx prisma migrate deploy
```

---

## Option 3: Gradual Migration (Safest for Production)

### Phase A: Add New Tables Only
1. Create Address, OrderItem, FeesConfig (no breaking changes)
2. Deploy & test

### Phase B: Add Optional Fields to Existing Tables
1. Add nullable fields to Order (dpAmount, finalAmount, etc)
2. Keep old fields working
3. Deploy & test

### Phase C: Data Migration
1. Run script to populate new fields from old data
2. Validate data integrity

### Phase D: Make Fields Required
1. Add @default() or constraints
2. Deprecate old fields
3. Deploy

---

## Common Issues & Fixes

### Issue 1: Shadow Database Permission
**Error**: `permission denied to create database`

**Fix**: Disable shadow database
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["shadowDatabaseUrl"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL") // Optional
}
```

Or use direct URL:
```bash
npx prisma migrate dev --skip-generate
```

### Issue 2: Foreign Key Constraint Fails
**Error**: `foreign key constraint fails`

**Fix**: Ensure referenced records exist or make FK nullable

### Issue 3: NOT NULL Constraint Fails
**Error**: `column cannot be null`

**Fix**: Add @default() or migrate existing data first

---

## Rollback Plan

If migration fails:

```bash
# Restore from backup
psql jastipin < backup_before_migration.sql

# Or revert schema
cp prisma/schema.prisma.backup prisma/schema.prisma
npx prisma generate
```

---

**Created**: 2025-11-18
**Status**: Reference document for safe migration
