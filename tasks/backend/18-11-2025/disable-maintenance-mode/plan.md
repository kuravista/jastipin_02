# Plan: Disable Maintenance Mode in Production

## Objective
Disable maintenance mode on production VPS server to make API endpoint `/api/trips` accessible.

## Prerequisites
- SSH access to production VPS server
- VPS IP address or hostname
- PM2 is installed and running backend service

## Implementation Steps

### Step 1: Create Deployment Script
Create a shell script that can be run on the production server to disable maintenance mode.

**File:** `/app/scripts/disable-maintenance-production.sh`

This script will:
1. Backup current `.env` file
2. Update `MAINTENANCE_MODE=false` in backend `.env`
3. Restart PM2 backend process
4. Verify API is responding
5. Show logs

### Step 2: Create Verification Script
Create a script to test API endpoints after changes.

**File:** `/app/scripts/verify-api-production.sh`

This script will:
1. Test `/health` endpoint (should always work)
2. Test `/api/trips` endpoint (should return 200 or 404, not 503)
3. Show current maintenance status

### Step 3: Create Documentation
Create comprehensive documentation for manual deployment.

**File:** `/app/docs/DISABLE_MAINTENANCE_PRODUCTION.md`

This will include:
1. Manual SSH instructions
2. Environment variable configuration
3. PM2 restart commands
4. Troubleshooting guide
5. Rollback procedure

## Manual Execution Instructions (For User)

Since we cannot SSH from this environment, the user must execute on VPS:

### Quick Fix (SSH to VPS)
```bash
# 1. SSH into production server
ssh user@your-vps-ip

# 2. Navigate to backend directory
cd /path/to/backend

# 3. Edit .env file
nano .env
# Change: MAINTENANCE_MODE=true
# To: MAINTENANCE_MODE=false
# Save and exit (Ctrl+X, Y, Enter)

# 4. Restart backend with PM2
pm2 restart jastipin-backend
# Or if different name:
pm2 list  # Find the backend process name
pm2 restart <process-name>

# 5. Verify
pm2 logs jastipin-backend --lines 50
curl http://localhost:4000/health
curl http://localhost:4000/api/trips
```

### Alternative: Environment Variable via PM2
```bash
# Set environment variable directly in PM2
pm2 restart jastipin-backend --update-env
pm2 env jastipin-backend MAINTENANCE_MODE false

# Or update ecosystem config
nano ecosystem.config.cjs
# Update env_production section
pm2 restart ecosystem.config.cjs --env production
```

## Verification Checklist

After deployment:
- [ ] Backend PM2 process restarted successfully
- [ ] No errors in PM2 logs
- [ ] `curl http://localhost:4000/health` returns 200 OK
- [ ] `curl http://localhost:4000/api/trips` returns 200 or valid response (not 503)
- [ ] `curl https://jastipin.me/api/trips` from external network returns valid response
- [ ] Environment variable `MAINTENANCE_MODE=false` confirmed

## Rollback Plan

If issues occur after disabling maintenance:
```bash
# 1. Re-enable maintenance mode
nano .env
# Change to: MAINTENANCE_MODE=true

# 2. Restart backend
pm2 restart jastipin-backend

# 3. Check logs
pm2 logs jastipin-backend
```

## Notes

- **DO NOT commit `.env` files to git** - They contain secrets
- **Always backup `.env` before editing**
- **PM2 restart is required** - Environment variables are cached by Node.js
- **Check PM2 logs** after restart to ensure no errors
- **Frontend maintenance mode** is separate (Cloudflare environment variables)
