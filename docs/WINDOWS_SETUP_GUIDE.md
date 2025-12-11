# 🪟 Panduan Setup Jastipin.me di Windows

**Status**: ✅ Ready to Execute  
**Platform**: Windows 10/11  
**Estimated Time**: 30-45 menit  

---

## ✅ Prerequisites yang Harus Diinstall

### 1. Node.js (v20+ recommended)
```bash
# Download dari: https://nodejs.org/
# Pilih LTS version (Long Term Support)
# Verify installation:
node --version  # Should show v20.x.x or higher
npm --version   # Should show v10.x.x or higher
```

### 2. pnpm (Package Manager)
```bash
# Install via npm:
npm install -g pnpm

# Verify:
pnpm --version  # Should show v9.x.x
```

### 3. Git
```bash
# Download dari: https://git-scm.com/download/win
# Verify:
git --version
```

### 4. PostgreSQL Database
**Option A: Install Local PostgreSQL**
```bash
# Download dari: https://www.postgresql.org/download/windows/
# Pilih version 16.x
# Default port: 5432
# Set password untuk user 'postgres'
```

**Option B: Use Online PostgreSQL (Recommended untuk Testing)**
- Railway: https://railway.app (Free tier available)
- Supabase: https://supabase.com (Free tier available)
- Neon: https://neon.tech (Free tier available)

### 5. Code Editor
- **VS Code** (Recommended): https://code.visualstudio.com/
- Install extensions:
  - Prisma
  - ESLint
  - Tailwind CSS IntelliSense

---

## 🔧 Project Setup

### Step 1: Clone Repository (jika belum)
```bash
# Jika dari Git:
git clone <repository-url>
cd jastipin_02

# Atau jika sudah di folder:
cd D:\DATA\VibeCoding\jastipin_02
```

### Step 2: Backend Setup

#### A. Install Dependencies
```bash
cd backend
pnpm install
```

#### B. Setup Environment Variables
Buat file `.env` di folder `backend/`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/jastipin_db?schema=public"

# Example for Railway:
# DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"

# JWT Secrets (generate random strings min 64 chars)
JWT_SECRET="your-super-secret-jwt-key-min-64-characters-long-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-64-characters-long-change-this-in-production"

# Server Configuration
API_PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"

# AWS S3/R2 (Optional - untuk image upload)
# AWS_ACCESS_KEY_ID="your-access-key"
# AWS_SECRET_ACCESS_KEY="your-secret-key"
# AWS_REGION="auto"
# AWS_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
# AWS_BUCKET_NAME="jastipin-images"

# Email (Optional - SendPulse)
# SENDPULSE_API_USER_ID="your-user-id"
# SENDPULSE_API_SECRET="your-secret"
# SENDPULSE_FROM_EMAIL="noreply@jastipin.me"
```

**Generate JWT Secrets:**
```bash
# Windows PowerShell:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})

# Atau gunakan online generator:
# https://www.grc.com/passwords.htm
```

#### C. Setup Database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed data
pnpm run db:seed

# View database
npx prisma studio
# Opens at http://localhost:5555
```

#### D. Start Backend Server
```bash
pnpm run dev
```

Server akan berjalan di `http://localhost:4000`

**Test Backend:**
- Buka browser: `http://localhost:4000`
- Atau gunakan Postman/Thunder Client
- Endpoint health check: `http://localhost:4000/health`

---

### Step 3: Frontend Setup

#### A. Install Dependencies
Buka terminal baru (jangan tutup backend):
```bash
cd D:\DATA\VibeCoding\jastipin_02\frontend

# Install dependencies (termasuk react-joyride yang baru ditambahkan)
pnpm install
```

#### B. Setup Environment Variables
Buat file `.env.local` di folder `frontend/`:

```env
# API Backend
NEXT_PUBLIC_API_URL="http://localhost:4000"

# Supabase (jika menggunakan Supabase Auth - Optional)
# NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
# NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

#### C. Start Frontend Server
```bash
pnpm run dev
```

Frontend akan berjalan di `http://localhost:3000`

**Test Frontend:**
- Buka browser: `http://localhost:3000`
- Landing page harus muncul dengan design pink-orange
- Test demo profiles: 
  - `http://localhost:3000/tina`
  - `http://localhost:3000/ana`

---

## 🧪 Test Run Checklist

### Backend Tests:
```bash
cd backend

# Health check
curl http://localhost:4000/health

# Register user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123456\",\"fullName\":\"Test User\"}"

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123456\"}"
```

### Frontend Tests:
1. Landing page loads (`http://localhost:3000`)
2. Auth page accessible (`http://localhost:3000/auth`)
3. Dashboard requires login (`http://localhost:3000/dashboard`)
4. Public profiles work (`http://localhost:3000/ana`)
5. Invoice pages work (`http://localhost:3000/inv/250403ABCD`)

---

## 🐛 Common Issues & Solutions

### Issue 1: `command not found: pnpm`
**Solution:**
```bash
npm install -g pnpm
# Close and reopen terminal
```

### Issue 2: `Database connection error`
**Solutions:**
- ✅ PostgreSQL service running? Check Task Manager → Services
- ✅ Database credentials benar di `.env`?
- ✅ Database `jastipin_db` sudah dibuat?
```bash
# Create database manually:
psql -U postgres
CREATE DATABASE jastipin_db;
\q
```

### Issue 3: `Port 4000 already in use`
**Solution:**
```bash
# Find process using port 4000:
netstat -ano | findstr :4000

# Kill process:
taskkill /PID <PID_NUMBER> /F

# Or change port in backend/.env:
API_PORT=4001
```

### Issue 4: `prisma command not found`
**Solution:**
```bash
# Use npx:
npx prisma generate
npx prisma migrate dev

# Or install globally:
npm install -g prisma
```

### Issue 5: `react-joyride error` (FIXED)
**Solution:** Already fixed! Package added to package.json. Just run:
```bash
cd frontend
pnpm install
```

### Issue 6: `CORS error` saat frontend call backend
**Solution:**
- ✅ Pastikan `FRONTEND_URL` di backend/.env benar: `http://localhost:3000`
- ✅ Pastikan `NEXT_PUBLIC_API_URL` di frontend/.env.local benar: `http://localhost:4000`

---

## 📂 File Structure Overview

```
jastipin_02/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Entry point
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth, validation
│   │   └── utils/            # Helpers
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── .env                  # ← CREATE THIS (backend config)
│   └── package.json
│
├── frontend/
│   ├── app/                  # Next.js App Router
│   │   ├── page.tsx         # Landing page
│   │   ├── auth/            # Login/Register
│   │   ├── dashboard/       # Dashboard pages
│   │   └── [username]/      # Public profiles
│   ├── components/          # React components
│   ├── .env.local          # ← CREATE THIS (frontend config)
│   └── package.json        # ← FIXED (added react-joyride)
│
└── docs/
    └── WINDOWS_SETUP_GUIDE.md  # This file
```

---

## 🚀 Quick Start Commands (Copy-Paste)

### Terminal 1 - Backend:
```bash
cd D:\DATA\VibeCoding\jastipin_02\backend
pnpm install
npx prisma generate
npx prisma migrate dev --name init
pnpm run dev
```

### Terminal 2 - Frontend:
```bash
cd D:\DATA\VibeCoding\jastipin_02\frontend
pnpm install
pnpm run dev
```

### Open in Browser:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Prisma Studio: http://localhost:5555 (run `npx prisma studio`)

---

## 📊 Development Workflow

### Daily Development:
1. Start backend: `cd backend && pnpm run dev`
2. Start frontend: `cd frontend && pnpm run dev`
3. Open Prisma Studio (optional): `npx prisma studio`
4. Start coding!

### After Pulling Updates:
```bash
# Backend
cd backend
pnpm install              # Install new dependencies
npx prisma generate       # Regenerate Prisma Client
npx prisma migrate dev    # Apply new migrations

# Frontend
cd frontend
pnpm install              # Install new dependencies
```

### Running Tests:
```bash
# Backend tests
cd backend
pnpm test

# Frontend tests
cd frontend
pnpm test
```

### Database Management:
```bash
# View database GUI
npx prisma studio

# Create new migration
npx prisma migrate dev --name description-of-change

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Seed database
pnpm run db:seed
```

---

## 🔐 Security Notes

**⚠️ IMPORTANT for Production:**

1. **Never commit `.env` files**
   - Already in `.gitignore`
   - Share via secure channels only

2. **Change default JWT secrets**
   - Generate unique 64+ character strings
   - Different for each environment

3. **Use strong database passwords**
   - Mix uppercase, lowercase, numbers, symbols
   - Min 16 characters

4. **CORS Configuration**
   - Update `FRONTEND_URL` in production
   - Never use `*` (allow all origins)

5. **Environment Variables**
   - Use different values for dev/staging/production
   - Never hardcode secrets in code

---

## 🎉 Success Indicators

Your setup is successful when:

✅ Backend starts without errors at `http://localhost:4000`  
✅ Frontend starts without errors at `http://localhost:3000`  
✅ Landing page displays properly with styling  
✅ Health check endpoint returns 200: `http://localhost:4000/health`  
✅ Prisma Studio opens and shows tables  
✅ Can register/login via frontend auth page  
✅ Dashboard loads after login  
✅ Public profiles accessible (e.g., `/ana`)  
✅ No console errors in browser DevTools  

---

## 📞 Need Help?

### Check Logs:
- **Backend**: Terminal where you ran `pnpm run dev`
- **Frontend**: Browser DevTools Console (F12)
- **Database**: Prisma Studio errors

### Common Commands:
```bash
# Check running processes
netstat -ano | findstr :3000
netstat -ano | findstr :4000

# Kill process
taskkill /PID <PID> /F

# Check Node version
node --version

# Check pnpm version
pnpm --version

# Clear pnpm cache
pnpm store prune
```

---

**Last Updated**: 2025-12-11  
**Status**: 🟢 READY FOR TESTING  
**Next Action**: Follow Step 1 - Prerequisites Installation!

Good luck! 🚀
