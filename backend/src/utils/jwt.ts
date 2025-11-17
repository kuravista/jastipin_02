/**
 * JWT Token Generation and Verification
 * Handles access and refresh token lifecycle
 * Uses pattern: jwt-refresh-rotation-mvp-2025-11 from memory
 */

import jwt from 'jsonwebtoken'

export interface TokenPayload {
  sub: string
  slug: string
  email: string
}

/**
 * Generate 12-hour access token
 * @param userId - User ID
 * @param slug - User slug
 * @param email - User email
 * @returns Signed JWT token
 */
export function generateAccessToken(
  userId: string,
  slug: string,
  email: string
): string {
  const payload: TokenPayload = { sub: userId, slug, email }
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '12h',
    algorithm: 'HS256',
  })
}

/**
 * Generate 7-day refresh token
 * @param userId - User ID
 * @returns Signed refresh token
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d', algorithm: 'HS256' }
  )
}

/**
 * Verify and decode token
 * @param token - JWT token
 * @param isRefresh - Is this a refresh token?
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(
  token: string,
  isRefresh: boolean = false
): TokenPayload | null {
  try {
    const secret = isRefresh
      ? process.env.JWT_REFRESH_SECRET!
      : process.env.JWT_SECRET!
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] })
    return decoded as TokenPayload
  } catch {
    return null
  }
}
