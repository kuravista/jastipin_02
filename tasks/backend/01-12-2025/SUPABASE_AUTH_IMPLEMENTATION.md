# Supabase Google OAuth Implementation Plan
**Date:** December 1, 2025
**Status:** Planning Phase
**Scope:** Add Supabase authentication with Gmail/Google OAuth to replace custom JWT auth

---

## Current State

### Existing Auth System
- **Backend:** Custom JWT implementation with email/password
- **Database:** Supabase PostgreSQL (already configured)
- **Frontend:** React 19 + Next.js 16
- **Issue:** No social login, only email/password

### Supabase Integration Status
```
✅ Database: Connected via Supabase PostgreSQL
✅ Credentials: Already in .env files
❌ Auth Module: Not integrated yet
❌ Google OAuth: Not configured
```

---

## Implementation Plan

### Phase 1: Supabase Setup (Manual - Dashboard)
1. Go to Supabase Dashboard → Project Settings
2. Navigate to Authentication → Providers
3. Enable Google OAuth provider
4. Get Client ID & Secret from Google Cloud Console
5. Configure redirect URLs in Supabase:
   - `http://localhost:3000/**`
   - `https://jastipin.me/**`
   - `https://www.jastipin.me/**`
   - `https://*.vercel.app/**` (for preview deployments)

### Phase 2: Frontend Dependencies
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

**New Dependencies:**
- `@supabase/supabase-js` - Supabase client
- `@supabase/auth-helpers-nextjs` - Next.js auth utilities

### Phase 3: Environment Setup
```env
# .env.local and .env.production
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Phase 4: Supabase Client Setup
**File:** `/app/frontend/lib/supabase-client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

### Phase 5: Auth Provider Context
**File:** `/app/frontend/lib/supabase-auth-context.tsx`

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { createClient } from './supabase-client'

type AuthContext = {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContext | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [supabase.auth])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider')
  }
  return context
}
```

### Phase 6: Google Login Button Component
**File:** `/app/frontend/components/auth/google-login-button.tsx`

```typescript
'use client'

import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Chrome } from 'lucide-react'

export function GoogleLoginButton() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('Error signing in with Google:', error)
    }
    setLoading(false)
  }

  return (
    <Button
      onClick={handleGoogleLogin}
      disabled={loading}
      variant="outline"
      className="w-full"
    >
      <Chrome className="mr-2 h-4 w-4" />
      {loading ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  )
}
```

### Phase 7: OAuth Callback Handler
**File:** `/app/frontend/app/auth/callback/route.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL('/auth?error=invalid_code', request.url))
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.redirect(new URL('/auth?error=no_code', request.url))
}
```

### Phase 8: Update Auth Page
**File:** `/app/frontend/app/auth/page.tsx`

Add Google login button to existing auth form:

```typescript
import { GoogleLoginButton } from '@/components/auth/google-login-button'

export default function AuthPage() {
  return (
    <>
      {/* Existing email/password form */}
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <GoogleLoginButton />
    </>
  )
}
```

### Phase 9: Update Root Layout
**File:** `/app/frontend/app/layout.tsx`

```typescript
import { SupabaseAuthProvider } from '@/lib/supabase-auth-context'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <SupabaseAuthProvider>
          {children}
        </SupabaseAuthProvider>
      </body>
    </html>
  )
}
```

---

## Implementation Steps

### Step 1: Google Cloud Console Setup (Manual)
- Create OAuth 2.0 Client ID in Google Cloud Console
- Add authorized redirect URIs
- Copy Client ID & Secret

### Step 2: Supabase Dashboard Setup (Manual)
- Enable Google provider
- Add Client ID & Secret
- Configure redirect URLs

### Step 3: Frontend Code
1. Install Supabase packages
2. Create Supabase client
3. Create auth context provider
4. Create Google login button
5. Create OAuth callback handler
6. Update auth page
7. Update root layout

### Step 4: Testing
- Test Google login locally
- Verify session management
- Check token refresh
- Test logout
- Verify user data sync to database

---

## Files to Create/Modify

**New Files:**
- `/app/frontend/lib/supabase-client.ts`
- `/app/frontend/lib/supabase-auth-context.tsx`
- `/app/frontend/components/auth/google-login-button.tsx`
- `/app/frontend/app/auth/callback/route.ts`

**Modified Files:**
- `/app/frontend/app/auth/page.tsx` - Add Google button
- `/app/frontend/app/layout.tsx` - Add auth provider
- `/app/frontend/package.json` - Add dependencies
- `/app/frontend/.env.local` - Add Supabase env vars
- `/app/frontend/.env.production` - Add Supabase env vars

---

## Environment Variables

```env
# Supabase URLs and Keys
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Migration Strategy

### Option A: Hybrid (Recommended)
- Keep existing email/password auth for backward compatibility
- Add Google OAuth as additional login method
- User can link accounts later
- Existing users continue working

### Option B: Full Migration
- Deprecate email/password auth
- Require Google login for new users
- Provide account migration tool for existing users
- Phase out old auth over time

**Recommendation:** Use Option A initially for safety

---

## Benefits of Supabase Auth

✅ **Production-ready** - Battle-tested authentication
✅ **Social login** - Google, GitHub, Discord, etc.
✅ **JWT based** - Compatible with existing backend
✅ **Session management** - Automatic refresh tokens
✅ **User data** - Built-in user profiles
✅ **Security** - Row-level security (RLS) available
✅ **Maintenance-free** - No custom auth to maintain

---

## Security Considerations

- ✅ OAuth 2.0 standard implementation
- ✅ PKCE flow for web apps
- ✅ Automatic token refresh
- ✅ Secure cookie handling
- ✅ No credentials stored in local storage
- ⚠️ Must configure CORS properly
- ⚠️ Must use HTTPS in production

---

## Timeline

- **Phase 1 (Manual):** Google Cloud + Supabase setup - 10 min
- **Phase 2-3:** Dependencies + environment - 5 min
- **Phase 4-9:** Frontend implementation - 30-45 min
- **Phase 10:** Testing + debugging - 20-30 min
- **Total:** ~1-2 hours for full implementation

---

## Next Steps

1. Set up Google Cloud Console OAuth credentials
2. Configure Supabase Google provider
3. Install frontend dependencies
4. Implement Supabase client and auth context
5. Create Google login button and callback handler
6. Test the full OAuth flow
7. Deploy to production

---

**Status:** Ready for implementation
**Approval:** Awaiting confirmation to proceed
