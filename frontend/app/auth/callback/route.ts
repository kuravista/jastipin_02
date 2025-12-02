/**
 * OAuth Callback Route
 * Handles Supabase OAuth redirect and session exchange
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Detect production domain from request headers
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000'
  const origin = `${proto}://${host}`

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description)
    return NextResponse.redirect(
      new URL(
        `/auth?error=${encodeURIComponent(error_description || error)}`,
        origin
      )
    )
  }

  if (code) {
    try {
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

      const { error: exchangeError, data } =
        await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Session exchange error:', exchangeError)
        return NextResponse.redirect(
          new URL(`/auth?error=session_exchange_failed`, origin)
        )
      }

      // Get OAuth user info
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && user.id && user.email) {
        // Sync user to app database
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
          const accessToken = data.session?.access_token
          
          console.log('Syncing OAuth user to app database:', { userId: user.id, email: user.email })
          
          const syncResponse = await fetch(`${backendUrl}/auth/sync-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              id: user.id,
              email: user.email,
            }),
          })
          
          if (!syncResponse.ok) {
            console.warn('User sync failed:', syncResponse.status, await syncResponse.text())
          } else {
            const syncData = await syncResponse.json()
            console.log('User synced successfully:', syncData.user?.id)
            
            // Set app token as cookie for frontend to read
            if (syncData.token) {
              cookieStore.set('oauth_app_token', syncData.token, {
                path: '/',
                maxAge: 60 * 60 * 12, // 12 hours
                httpOnly: false, // Allow JS to read
                secure: true,
                sameSite: 'lax'
              })
            }
          }
        } catch (syncErr) {
          console.warn('User sync error:', syncErr)
        }
      }

      // Redirect to dashboard on success
      return NextResponse.redirect(new URL('/dashboard', origin))
    } catch (err) {
      console.error('Callback error:', err)
      return NextResponse.redirect(
        new URL(`/auth?error=callback_error`, origin)
      )
    }
  }

  return NextResponse.redirect(
    new URL(`/auth?error=no_code`, origin)
  )
}
