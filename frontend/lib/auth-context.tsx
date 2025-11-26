/**
 * Authentication Context
 * Provides global auth state and methods using React Context API
 */

'use client'

import React, { createContext, useState, useContext, useEffect } from 'react'
import { apiPost, apiGet } from './api-client'
import { clearAuthToken } from './api-client'

export interface User {
  id: string
  email: string
  slug: string
  profileName?: string
  profileBio?: string
  avatar?: string
  coverImage?: string
  whatsappNumber?: string
  originProvinceId?: string
  originProvinceName?: string
  originCityId?: string
  originCityName?: string
  originDistrictId?: string
  originDistrictName?: string
  originPostalCode?: string
  originAddressText?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  register: (email: string, password: string, fullName: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Provider component - wrap your app with this
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchUserProfile() {
    try {
      setLoading(true)
      const response = await apiGet<User>('/profile')
      setUser(response)
      setError(null)
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err)
      setUser(null)
      setError(null)
      clearAuthToken()
    } finally {
      setLoading(false)
    }
  }

  // Check if user is logged in on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const token = localStorage.getItem('authToken')
      if (token) {
        fetchUserProfile()
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }, [])

  async function register(
    email: string,
    password: string,
    fullName: string,
  ) {
    setLoading(true)
    setError(null)
    try {
      const response = await apiPost<{ user: User; token: string }>(
        '/auth/register',
        {
          email,
          password,
          fullName,
        },
      )
      setUser(response.user)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('authToken', response.token)
        } catch {
          // Ignore errors
        }
      }
    } catch (err: any) {
      const message = err.message || 'Registration failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function login(email: string, password: string) {
    setLoading(true)
    setError(null)
    try {
      const response = await apiPost<{ user: User; token: string }>(
        '/auth/login',
        {
          email,
          password,
        },
      )
      setUser(response.user)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('authToken', response.token)
        } catch {
          // Ignore errors
        }
      }
    } catch (err: any) {
      const message = err.message || 'Login failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    setUser(null)
    clearAuthToken()
  }

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem('authToken')
    } catch {
      return null
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!user || !!getAuthToken(),
  }

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

/**
 * Hook to use auth context
 * @returns Auth context value with user, methods, and state
 * @throws Error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
