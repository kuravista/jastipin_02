# 🔐 Tutorial Setup Environment Variables (.env)

## File yang Dibutuhkan

Anda membutuhkan **2 file .env**:

1. **Backend**: `backend/.env` 
2. **Frontend**: `frontend/.env.local`

---

## 1️⃣ Backend Environment (.env)

**Lokasi**: `D:\DATA\VibeCoding\jastipin_02\backend\.env`

### Copy-Paste ini ke `backend/.env`:

```env
# ==========================================
# DATABASE CONFIGURATION
# ==========================================
# Untuk local PostgreSQL di Windows:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jastipin_db?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/jastipin_db?schema=public"

# Catatan: 
# - Ganti 'postgres:postgres' dengan username:password PostgreSQL Anda
# - Jika port berbeda, ganti 5432 dengan port Anda
# - Database 'jastipin_db' akan dibuat otomatis saat migration


# ==========================================
# JWT SECRETS (GENERATED)
# ==========================================
# ⚠️ PENTING: Ini sudah secure untuk development
# Untuk production, generate ulang dengan random string berbeda!

JWT_SECRET="a8f3c2b9e1d6f4a7c8b2e5d9f1a3c6b8e2d5f7a9c1b4e6d8f2a5c7b9e1d3f6a8c2b5e7d9f1a4c6b8e2d5f7a9"
JWT_REFRESH_SECRET="b9e2d5f8a1c4b7e9d2f5a8c1b4e7d9f2a5c8b1e4d7f9a2c5b8e1d4f7a9c2b5e8d1f4a7c9b2e5d8f1a4c7b9e2"


# ==========================================
# SERVER CONFIGURATION
# ==========================================
API_PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"


# ==========================================
# OPTIONAL: CLOUDFLARE R2 / AWS S3 (Image Upload)
# ==========================================
# Uncomment jika sudah punya Cloudflare R2 account
# Untuk development awal, bisa dikosongin dulu (pakai local storage)

# AWS_ACCESS_KEY_ID="your-r2-access-key-id"
# AWS_SECRET_ACCESS_KEY="your-r2-secret-access-key"
# AWS_REGION="auto"
# AWS_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
# AWS_BUCKET_NAME="jastipin-images"


# ==========================================
# OPTIONAL: SENDPULSE (Email Notifications)
# ==========================================
# Uncomment jika sudah punya SendPulse account
# Untuk development awal, bisa dikosongin dulu

# SENDPULSE_API_USER_ID="your-sendpulse-user-id"
# SENDPULSE_API_SECRET="your-sendpulse-secret"
# SENDPULSE_FROM_EMAIL="noreply@jastipin.me"
```

### Yang Perlu Anda Ubah:

**A. Database URL** (PENTING!)
```env
# Default (jika password PostgreSQL Anda adalah 'postgres'):
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jastipin_db?schema=public"

# Jika password berbeda, ubah menjadi:
DATABASE_URL="postgresql://postgres:PASSWORD_ANDA@localhost:5432/jastipin_db?schema=public"
```

**B. JWT Secrets** 
- Sudah dibuatkan random string yang aman
- Bisa langsung dipakai untuk development
- ⚠️ Untuk production, generate ulang!

**C. Optional Services**
- R2/S3 dan SendPulse bisa diaktifkan nanti
- Tidak wajib untuk test run awal

---

## 2️⃣ Frontend Environment (.env.local)

**Lokasi**: `D:\DATA\VibeCoding\jastipin_02\frontend\.env.local`

### Copy-Paste ini ke `frontend/.env.local`:

```env
# ==========================================
# BACKEND API URL
# ==========================================
NEXT_PUBLIC_API_URL="http://localhost:4000"


# ==========================================
# OPTIONAL: SUPABASE (jika pakai Supabase Auth)
# ==========================================
# Untuk development awal dengan JWT auth biasa, ini tidak perlu
# Uncomment jika mau pakai Supabase authentication

# NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
# NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### Yang Perlu Anda Ubah:

**Tidak ada!** File ini sudah siap pakai untuk development lokal.

---

## 📋 Checklist Setup

### Backend (.env)
- [ ] File dibuat di: `backend\.env`
- [ ] DATABASE_URL sudah diisi dengan password PostgreSQL yang benar
- [ ] JWT_SECRET dan JWT_REFRESH_SECRET ada (sudah di-generate)
- [ ] API_PORT = 4000
- [ ] FRONTEND_URL = http://localhost:3000

### Frontend (.env.local)
- [ ] File dibuat di: `frontend\.env.local`
- [ ] NEXT_PUBLIC_API_URL = http://localhost:4000

---

## 🚀 Quick Setup Commands

### Cara Tercepat (PowerShell):

#### 1. Create Backend .env
```powershell
cd D:\DATA\VibeCoding\jastipin_02\backend

# Copy dari example (jika ada)
# Atau buat manual dengan notepad:
notepad .env
```

**Paste konten dari section "Backend Environment" di atas**, lalu:
- Ganti password PostgreSQL jika bukan `postgres`
- Save file (Ctrl+S)
- Close notepad

#### 2. Create Frontend .env.local
```powershell
cd D:\DATA\VibeCoding\jastipin_02\frontend

# Buat file
notepad .env.local
```

**Paste konten dari section "Frontend Environment" di atas**, lalu:
- Save file (Ctrl+S)
- Close notepad

---

## 🔍 Verify Files Created

### Check Backend .env:
```powershell
cd D:\DATA\VibeCoding\jastipin_02\backend
Get-Content .env
```

Harus muncul:
```
DATABASE_URL="postgresql://..."
JWT_SECRET="a8f3c2b9e1d6f4a7c8b2e5d9f1a3c6b8..."
...
```

### Check Frontend .env.local:
```powershell
cd D:\DATA\VibeCoding\jastipin_02\frontend
Get-Content .env.local
```

Harus muncul:
```
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

---

## ⚠️ Security Notes

### Development (Sekarang)
✅ Bisa pakai JWT secrets yang sudah di-generate  
✅ Database password 'postgres' OK untuk local  
✅ localhost URLs aman

### Production (Nanti)
❌ **WAJIB** ganti semua secrets!  
❌ **WAJIB** ganti database password yang kuat  
❌ **WAJIB** update URLs ke domain production  
❌ **JANGAN** commit file .env ke Git!

---

## 🎯 Next Steps After Creating .env

1. ✅ Backend .env created
2. ✅ Frontend .env.local created
3. ➡️ Install backend dependencies: `cd backend && pnpm install`
4. ➡️ Setup database: `npx prisma migrate dev`
5. ➡️ Start backend: `pnpm run dev`
6. ➡️ Start frontend: `cd ../frontend && pnpm run dev`

---

## 🆘 Troubleshooting

### "Database does not exist"
```powershell
# Login ke PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE jastipin_db;

# Exit
\q
```

### "Password authentication failed"
- Check password PostgreSQL Anda
- Update DATABASE_URL dengan password yang benar

### "Port 4000 already in use"
- Ganti API_PORT di backend/.env: `API_PORT=4001`
- Update NEXT_PUBLIC_API_URL di frontend/.env.local: `http://localhost:4001`

### ".env file not loading"
- Pastikan nama file EXACT: `.env` (backend) dan `.env.local` (frontend)
- Tidak boleh `.env.txt` atau nama lain
- Hidden file extensions di Windows bisa menyesatkan

---

**Ready to proceed!** 🚀 Setelah .env files dibuat, lanjut ke install dependencies dan migration.
