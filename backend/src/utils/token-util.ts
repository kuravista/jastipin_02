/**
 * Token Utility Functions
 * Shared token generation, hashing, and validation logic
 * Used by both guest upload tokens and password reset tokens
 */

import crypto from 'crypto'

export class TokenUtil {
  /**
   * Generate secure random token (32 bytes base64url)
   * @returns Raw token string (to send to user via email/link)
   */
  static generateSecureToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('base64url')
  }

  /**
   * Hash token using SHA256
   * @param token - Raw token string
   * @returns Hashed token (to store in database)
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  /**
   * Check if token is expired
   * @param expiresAt - Expiration timestamp
   * @returns true if expired, false if still valid
   */
  static isTokenExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt
  }

  /**
   * Constant-time token comparison (prevent timing attacks)
   * @param provided - Token hash provided by user
   * @param stored - Token hash from database
   * @returns true if hashes match (constant-time comparison)
   */
  static verifyTokenHashConstantTime(provided: string, stored: string): boolean {
    try {
      return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(stored))
    } catch {
      // timingSafeEqual throws if buffers have different length
      return false
    }
  }

  /**
   * Generate expiry date from minutes
   * @param minutesFromNow - Expiry duration in minutes
   * @returns Expiration timestamp
   */
  static getExpiryDate(minutesFromNow: number): Date {
    return new Date(Date.now() + minutesFromNow * 60 * 1000)
  }
}
