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

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description)
    return NextResponse.redirect(
      new URL(
        `/auth?error=${encodeURIComponent(error_description || error)}`,
        request.url
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

      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Session exchange error:', exchangeError)
        return NextResponse.redirect(
          new URL(`/auth?error=session_exchange_failed`, request.url)
        )
      }

      // Redirect to dashboard on success
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (err) {
      console.error('Callback error:', err)
      return NextResponse.redirect(
        new URL(`/auth?error=callback_error`, request.url)
      )
    }
  }

  return NextResponse.redirect(
    new URL(`/auth?error=no_code`, request.url)
  )
}
