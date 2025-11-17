/**
 * API Client - Fetch wrapper with token management
 * Handles HTTP requests, token attachment, and automatic refresh on 401
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

interface FetchOptions extends RequestInit {
  params?: Record<string, any>
}

/**
 * Wrapper around fetch for consistent API calls
 * Handles token attachment, error parsing, and automatic refresh
 */
export async function apiCall<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, ...fetchOptions } = options

  // Build URL with query params
  const url = new URL(`${API_URL}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value))
    })
  }

  // Attach token
  const token = getAuthToken()
  if (token) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  // Default headers
  fetchOptions.headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }

  const response = await fetch(url, fetchOptions)

  // Handle 401 - try refresh
  if (response.status === 401) {
    const refreshed = await refreshToken()
    if (refreshed) {
      // Retry request with new token
      return apiCall<T>(endpoint, options)
    }
    // Logout user
    clearAuthToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/auth'
    }
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'API error' }))
    const err: any = new Error(error.error || error.message || 'API error')
    err.status = response.status
    err.details = error.details
    err.fullError = error
    throw err
  }

  return response.json() as Promise<T>
}

/**
 * GET request
 */
export function apiGet<T>(endpoint: string, options?: FetchOptions) {
  return apiCall<T>(endpoint, { ...options, method: 'GET' })
}

/**
 * POST request
 */
export function apiPost<T>(
  endpoint: string,
  data?: any,
  options?: FetchOptions,
) {
  return apiCall<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PATCH request
 */
export function apiPatch<T>(
  endpoint: string,
  data?: any,
  options?: FetchOptions,
) {
  return apiCall<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE request
 */
export function apiDelete<T>(
  endpoint: string,
  options?: FetchOptions,
) {
  return apiCall<T>(endpoint, {
    ...options,
    method: 'DELETE',
  })
}

/**
 * Search shipping destinations
 */
export async function searchShippingDestinations(query: string) {
  return apiGet<any>('/shipping/search', {
    params: { q: query },
  })
}

/**
 * Calculate shipping cost
 */
export async function calculateShippingCost(
  origin: string,
  destination: string,
  weight?: number
) {
  return apiPost<any>('/shipping/calculate', {
    origin,
    destination,
    weight: weight || 1000,
  })
}

/**
 * GET token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem('authToken')
  } catch {
    return null
  }
}

/**
 * Store token in localStorage
 */
function setAuthToken(token: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('authToken', token)
  } catch {
    // Ignore errors
  }
}

/**
 * Remove token from localStorage
 */
export function clearAuthToken() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('authToken')
  } catch {
    // Ignore errors
  }
}

/**
 * Refresh token by calling backend
 */
async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) return false

    const data = await response.json()
    if (data.token) {
      setAuthToken(data.token)
      return true
    }
    return false
  } catch {
    return false
  }
}
