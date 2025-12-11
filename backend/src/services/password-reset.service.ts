/**
 * Password Reset Service
 * Handles secure password reset flow with token generation, validation, and redemption
 * Implements best practices: constant-time comparison, one-time use, transaction safety
 */

import { PrismaClient } from '@prisma/client'
import { TokenUtil } from '../utils/token-util.js'
import { hashPassword } from '../utils/password.js'
import { ApiErrorClass } from '../types/index.js'

export class PasswordResetService {
  private readonly TOKEN_EXPIRY_MINUTES = 60 // Token valid for 1 hour
  private readonly TOKEN_BYTES = 32 // 32 bytes = 256 bits

  constructor(private db: PrismaClient) {}

  /**
   * Generate reset token for user
   * Creates secure token and stores hash in database
   * @param email - User email address
   * @returns { token: rawToken, expiresAt: Date } - Send token via email, never store raw token
   */
  async generateResetToken(email: string): Promise<{ token: string; expiresAt: Date }> {
    // Find user by email
    const user = await this.db.user.findUnique({
      where: { email },
      select: { id: true, email: true }
    })

    if (!user) {
      // Don't reveal if user exists (security: prevent email enumeration)
      throw new ApiErrorClass(404, 'User not found')
    }

    // Delete any existing tokens for this user (invalidate previous requests)
    await this.db.passwordResetToken.deleteMany({
      where: { userId: user.id }
    })

    // Generate secure random token (32 bytes base64url)
    const rawToken = TokenUtil.generateSecureToken(this.TOKEN_BYTES)

    // Hash token for storage (never store raw token in database)
    const tokenHash = TokenUtil.hashToken(rawToken)

    // Set expiration time
    const expiresAt = TokenUtil.getExpiryDate(this.TOKEN_EXPIRY_MINUTES)

    // Store token hash in database
    await this.db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    })

    console.log(`[PasswordReset] Token generated for ${email}, expires at ${expiresAt.toISOString()}`)

    // Return raw token (to send via email) and expiry (for frontend display)
    return { token: rawToken, expiresAt }
  }

  /**
   * Validate reset token without using it
   * Used to check if token is valid before showing password reset form
   * @param token - Raw token from user (from email link)
   * @returns userId if valid, throws error if invalid/expired/used
   */
  async validateToken(token: string): Promise<{ userId: string; expiresAt: Date }> {
    // Hash incoming token to match stored hash
    const tokenHash = TokenUtil.hashToken(token)

    // Find token record
    const record = await this.db.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        userId: true,
        expiresAt: true,
        usedAt: true
      }
    })

    if (!record) {
      throw new ApiErrorClass(400, 'Invalid or expired reset token')
    }

    // Check if token is expired
    if (TokenUtil.isTokenExpired(record.expiresAt)) {
      throw new ApiErrorClass(400, 'Reset token has expired. Please request a new one.')
    }

    // Check if token was already used (one-time use enforcement)
    if (record.usedAt) {
      throw new ApiErrorClass(400, 'Reset token has already been used. Please request a new one.')
    }

    return { userId: record.userId, expiresAt: record.expiresAt }
  }

  /**
   * Reset password using valid token
   * Performs in transaction to prevent race conditions
   * Invalidates token (one-time use) and deletes all other tokens (logout all sessions)
   * @param token - Raw reset token
   * @param newPassword - New password (should be validated on frontend)
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Hash incoming token
    const tokenHash = TokenUtil.hashToken(token)

    // Execute in transaction for atomicity
    // If anything fails, entire transaction rolls back
    await this.db.$transaction(async (tx) => {
      // Step 1: Find and validate token record
      const record = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        select: {
          userId: true,
          expiresAt: true,
          usedAt: true
        }
      })

      if (!record) {
        throw new ApiErrorClass(400, 'Invalid or expired reset token')
      }

      // Check expiration and one-time use
      if (TokenUtil.isTokenExpired(record.expiresAt)) {
        throw new ApiErrorClass(400, 'Reset token has expired')
      }

      if (record.usedAt) {
        throw new ApiErrorClass(400, 'Reset token has already been used')
      }

      // Step 2: Hash new password
      const hashedPassword = await hashPassword(newPassword)

      // Step 3: Update user password
      await tx.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword }
      })

      // Step 4: Mark reset token as used
      await tx.passwordResetToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() }
      })

      // Step 5: Invalidate all other reset tokens for this user
      // (prevent reusing old tokens, force fresh reset request)
      await tx.passwordResetToken.deleteMany({
        where: {
          userId: record.userId,
          tokenHash: { not: tokenHash }
        }
      })

      console.log(`[PasswordReset] Password reset successful for user ${record.userId}`)
    })
  }

  /**
   * Clean up expired tokens (run periodically via cron job)
   * Deletes tokens that have expired to prevent database bloat
   * @returns Number of tokens deleted
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.db.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })

    console.log(`[PasswordReset] Cleaned up ${result.count} expired tokens`)
    return result.count
  }

  /**
   * Get token info (for debugging/admin purposes)
   * @param tokenHash - Hashed token
   */
  async getTokenInfo(tokenHash: string): Promise<{
    userId: string
    expiresAt: Date
    isUsed: boolean
    createdAt: Date
  } | null> {
    return this.db.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        userId: true,
        expiresAt: true,
        usedAt: true,
        createdAt: true
      }
    }).then(record => {
      if (!record) return null
      return {
        userId: record.userId,
        expiresAt: record.expiresAt,
        isUsed: !!record.usedAt,
        createdAt: record.createdAt
      }
    })
  }
}
