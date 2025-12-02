/**
 * OAuth Session Handler
 * Client component to sync Supabase OAuth session to app auth context
 * Runs once on mount to sync OAuth session to app auth
 */

'use client'

import { useEffect, useRef } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import { useAuth } from '@/lib/auth-context'

export function OAuthSessionHandler() {
  const { user, loading, refreshUser } = useAuth()
  const syncAttemptedRef = useRef(false)
  const syncInProgressRef = useRef(false)

  useEffect(() => {
    // Only run sync once per mount and not while already syncing
    if (syncAttemptedRef.current || syncInProgressRef.current) return
    
    // Don't sync while already loading user
    if (loading) return

    const syncOAuthSession = async () => {
      try {
        syncInProgressRef.current = true
        const supabase = createSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session && !user) {
          // OAuth session exists but app doesn't have user yet
          console.log('OAuth session detected, syncing to app auth...')
          
          // Store Supabase access token as app authToken
          localStorage.setItem('authToken', session.access_token)
          console.log('OAuth access token stored')
          
          // Refresh user profile from app database
          await refreshUser()
          console.log('OAuth user profile refreshed')
        }
      } catch (err) {
        console.error('OAuth session sync error:', err)
      } finally {
        syncAttemptedRef.current = true
        syncInProgressRef.current = false
      }
    }

    syncOAuthSession()
  }, [loading]) // Only sync when loading changes

  return null
}
