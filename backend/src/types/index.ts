/**
 * Shared TypeScript Types and Interfaces
 */

import { Request } from 'express'

/**
 * Extended Express Request with user data attached by auth middleware
 */
export interface AuthRequest extends Request {
  user?: {
    id: string
    slug: string
    email: string
  }
}

/**
 * Standard API Error Response
 */
export interface ApiError {
  status: number
  message: string
  details?: Record<string, unknown>
}

/**
 * Standard API Success Response
 */
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}
