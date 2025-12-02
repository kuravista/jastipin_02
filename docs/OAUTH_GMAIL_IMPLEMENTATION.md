# Google OAuth Implementation - Complete Guide

**Status:** ✅ WORKING  
**Date:** 2025-12-02  
**Commit:** b37cf53

---

## Overview

Supabase Google OAuth integration for Jastipin.me with hybrid authentication (email/password + OAuth).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        OAuth Flow                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User clicks "Login with Google"                             │
│     └─→ Frontend calls supabase.auth.signInWithOAuth()          │
│         └─→ Redirects to Google consent screen                  │
│                                                                  │
│  2. User consents on Google                                     │
│     └─→ Google redirects to Supabase callback                   │
│         └─→ Supabase redirects to /auth/callback?code=XXX       │
│                                                                  │
│  3. Callback route (server-side)                                │
│     └─→ Exchange code for Supabase session (sets cookies)       │
│     └─→ Get user info (id, email)                               │
│     └─→ Call /auth/sync-user to create user in app DB           │
│     └─→ Backend returns app JWT token                           │
│     └─→ Set token as 'oauth_app_token' cookie                   │
│     └─→ Redirect to /dashboard                                  │
│                                                                  │
│  4. Dashboard loads                                             │
│     └─→ AuthProvider reads 'oauth_app_token' cookie             │
│     └─→ Stores token in localStorage                            │
│     └─→ Deletes cookie                                          │
│     └─→ Fetches user profile                                    │
│     └─→ User authenticated ✅                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

### Backend

**`/backend/src/routes/auth.ts`**
- `POST /auth/sync-user` - Sync OAuth user to app database
- Returns app JWT token for OAuth users

**`/backend/src/services/auth.service.ts`**
- `syncOAuthUser(userId, email)` - Create/get user in app DB
- `generateUniqueSlug(email)` - Generate unique slug from email

### Frontend

**`/frontend/app/auth/callback/route.ts`**
- Server-side OAuth callback handler
- Exchanges code for Supabase session
- Syncs user to app DB
- Sets app token cookie
- Redirects to dashboard with proper production domain

**`/frontend/lib/auth-context.tsx`**
- Checks for `oauth_app_token` cookie on mount
- Transfers token to localStorage
- Fetches user profile

**`/frontend/components/auth/google-login-button.tsx`**
- Google OAuth sign-in button
- Calls `supabase.auth.signInWithOAuth()`

## Configuration

### Environment Variables

**Frontend (.env.production)**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://ascucdkibziqamaaovqw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_REDIRECT_URL=https://jastipin.me/auth/callback
NEXT_PUBLIC_API_URL=https://api.jastipin.me/api
```

### Supabase Dashboard
1. Authentication → Providers → Google → Enabled
2. Client ID and Secret from Google Cloud Console
3. Redirect URL: `https://ascucdkibziqamaaovqw.supabase.co/auth/v1/callback`

### Google Cloud Console
1. OAuth 2.0 Client (Web application)
2. Authorized JavaScript origins: `https://jastipin.me`
3. Authorized redirect URIs: `https://ascucdkibziqamaaovqw.supabase.co/auth/v1/callback`

## Common Issues & Solutions

### Issue: Redirect to localhost instead of production
**Cause:** `request.url` returns localhost in some environments  
**Solution:** Use `x-forwarded-host` and `x-forwarded-proto` headers

```typescript
const proto = request.headers.get('x-forwarded-proto') || 'https'
const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
const origin = `${proto}://${host}`
```

### Issue: User redirected back to /auth after OAuth
**Cause:** OAuth users have Supabase session but no app JWT token in localStorage  
**Solution:** 
1. Backend generates app JWT token on sync
2. Callback sets token as cookie
3. AuthProvider reads cookie and stores in localStorage

### Issue: User not created in app database
**Cause:** sync-user endpoint not called or failing  
**Solution:** Check callback logs for "User sync failed" errors

## Token Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Token Management                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Supabase Token (OAuth)                                         │
│  └─→ Stored in cookies by Supabase                              │
│  └─→ Used for Supabase API calls                                │
│  └─→ Auto-refreshed by Supabase                                 │
│                                                                  │
│  App Token (JWT)                                                │
│  └─→ Generated by backend on sync                               │
│  └─→ Stored in localStorage                                     │
│  └─→ Used for app API calls (/profile, /orders, etc)            │
│  └─→ Valid for 12 hours                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

OAuth users are created in `users` table:
- `id`: Supabase user UUID
- `email`: User's Gmail address
- `slug`: Generated from email (e.g., "john.doe" from "john.doe@gmail.com")
- `profileName`: Email username
- `password`: Empty string (OAuth users don't have password)

## Testing

1. Clear localStorage in browser
2. Go to https://jastipin.me/auth
3. Click "Sign in with Google"
4. Complete Google consent
5. Verify redirect to /dashboard
6. Check localStorage for `authToken`
7. Check database for new user record

## Debugging

```bash
# Frontend logs
pm2 logs jastipin-frontend --lines 50

# Backend logs
pm2 logs jastipin-api --lines 50

# Look for:
# - "Syncing OAuth user to app database"
# - "User synced successfully"
# - "OAuth user synced"
# - "OAuth token transferred to localStorage"
```

