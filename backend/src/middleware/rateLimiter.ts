/**
 * Simple in-memory rate limiter middleware
 * For production, consider using Redis-based rate limiting
 */

import { Request, Response, NextFunction } from 'express'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Max requests per window
  message: string // Error message
}

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, RateLimitRecord>()

/**
 * Create rate limiter middleware
 * @param config - Rate limit configuration
 * @returns Express middleware function
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Use IP address as identifier
    const identifier = req.ip || req.socket.remoteAddress || 'unknown'
    const key = `${identifier}:${req.path}`
    const now = Date.now()

    // Get or create rate limit record
    let record = rateLimitStore.get(key)

    // Reset if window has passed
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + config.windowMs,
      }
      rateLimitStore.set(key, record)
    }

    // Increment counter
    record.count++

    // Check if limit exceeded
    if (record.count > config.max) {
      res.status(429).json({ error: config.message })
      return
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', config.max.toString())
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - record.count).toString())
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString())

    next()
  }
}

/**
 * Clean up expired records periodically
 * Run this every 5 minutes to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000) // 5 minutes
