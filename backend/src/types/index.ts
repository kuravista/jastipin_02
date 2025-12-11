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
 * API Error Class - can be thrown at runtime
 */
export class ApiErrorClass extends Error implements ApiError {
  status: number
  message: string
  details?: Record<string, unknown>

  constructor(status: number, message: string, details?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.message = message
    this.details = details
    Object.setPrototypeOf(this, ApiErrorClass.prototype)
  }
}

/**
 * Standard API Success Response
 */
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}
