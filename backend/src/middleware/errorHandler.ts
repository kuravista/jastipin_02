/**
 * Global Error Handler Middleware
 * Catches all errors and formats response consistently
 */

import { Response, NextFunction } from 'express'
import { ApiError } from '../types/index.js'

interface ErrorWithStatus {
  status?: number
  message: string
  details?: Record<string, unknown>
}

/**
 * Global error handler middleware - must be registered last
 * @param err - Error object
 * @param _req - Express request
 * @param res - Express response
 * @param _next - Express next function
 */
export function errorHandler(
  err: Error | ErrorWithStatus | ApiError,
  _req: any,
  res: Response,
  _next: NextFunction
): void {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err)
  }

  // Check if error has status property
  if ('status' in err && typeof err.status === 'number') {
    const statusCode = err.status
    const message = err.message || 'An error occurred'
    const details = 'details' in err ? err.details : undefined

    res.status(statusCode).json({
      error: message,
      ...(details && { details }),
    })
    return
  }

  // Default 500 error
  res.status(500).json({
    error: 'Internal server error',
  })
}
