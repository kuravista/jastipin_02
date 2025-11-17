/**
 * JWT Authentication Middleware
 * Verifies JWT tokens in Authorization header
 */

import { Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt.js'
import { AuthRequest } from '../types/index.js'

/**
 * Verify JWT token in Authorization header
 * Attaches user to req.user if valid
 * Returns 401 if token missing or invalid
 */
export function authMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (!token) {
    _res.status(401).json({ error: 'Missing authorization token' })
    return
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    _res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  req.user = {
    id: decoded.sub,
    slug: decoded.slug,
    email: decoded.email,
  }
  next()
}

/**
 * Optional auth - attach user if token provided, don't fail if missing
 * Allows endpoints to work with or without authentication
 */
export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (token) {
    const decoded = verifyToken(token)
    if (decoded) {
      req.user = {
        id: decoded.sub,
        slug: decoded.slug,
        email: decoded.email,
      }
    }
  }

  next()
}
