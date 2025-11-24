/**
 * Token Service
 * Handles secure token generation and validation for guest magic links
 * Uses challenge-response verification (last 4 digits of WhatsApp number)
 */

import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { ApiError } from '../types/index.js'

interface TokenGenerationResult {
  token: string
  tokenHash: string
  expiresAt: Date
}

interface TokenValidationResult {
  valid: boolean
  challenge: 'LAST4_WA' | null
  orderId?: string
  error?: string
}

interface ChallengeVerificationResult {
  verified: boolean
  orderId?: string
  error?: string
}

export class TokenService {
  private readonly TOKEN_BYTES = 32
  private readonly EXPIRY_DAYS = 7

  constructor(private db: PrismaClient) {}

  /**
   * Generate secure upload token for an order
   * Creates a 32-byte random token and stores SHA256 hash in database
   * @param orderId - Order ID to associate with the token
   * @param guestId - Optional guest ID for linking
   * @returns Token (raw, to send to user), hash (for storage), and expiry date
   */
  async generateUploadToken(
    orderId: string,
    guestId?: string
  ): Promise<TokenGenerationResult> {
    // Verify order exists
    const order = await this.db.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      const error: ApiError = {
        status: 404,
        message: 'Order not found',
      }
      throw error
    }

    // Generate 32 bytes random token (URL-safe base64)
    const token = crypto.randomBytes(this.TOKEN_BYTES).toString('base64url')

    // Hash for storage (SHA256)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Set expiry to 7 days from now
    const expiresAt = new Date(
      Date.now() + this.EXPIRY_DAYS * 24 * 60 * 60 * 1000
    )

    // Store in database
    await this.db.guestAccessToken.create({
      data: {
        tokenHash,
        orderId,
        guestId: guestId || null,
        verifyType: 'LAST4_WA',
        maxUses: 1,
        usedCount: 0,
        expiresAt,
      },
    })

    // Return raw token (NOT the hash) to send to user
    return { token, tokenHash, expiresAt }
  }

  /**
   * Validate token without verifying challenge
   * Checks if token exists, is not expired, not revoked, and has uses remaining
   * @param token - Raw token string from user
   * @returns Validation result with challenge type if valid
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    // Hash incoming token to match stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Find token record in database
    const tokenRecord = await this.db.guestAccessToken.findUnique({
      where: { tokenHash },
    })

    // Check if token exists
    if (!tokenRecord) {
      return { valid: false, challenge: null, error: 'Invalid token' }
    }

    // Check if token is revoked
    if (tokenRecord.revokedAt) {
      return { valid: false, challenge: null, error: 'Token revoked' }
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      return { valid: false, challenge: null, error: 'Token expired' }
    }

    // Check if token has remaining uses
    if (tokenRecord.usedCount >= tokenRecord.maxUses) {
      return {
        valid: false,
        challenge: null,
        error: 'Token already used',
      }
    }

    // Token is valid, return challenge type
    return {
      valid: true,
      challenge: tokenRecord.verifyType as 'LAST4_WA',
      orderId: tokenRecord.orderId,
    }
  }

  /**
   * Verify challenge response (last 4 digits of WhatsApp number)
   * Validates token first, then checks if challenge response matches
   * Increments usedCount on successful verification
   * @param token - Raw token string from user
   * @param challengeResponse - User's challenge response (last 4 digits)
   * @returns Verification result with order ID if successful
   */
  async verifyChallenge(
    token: string,
    challengeResponse: string
  ): Promise<ChallengeVerificationResult> {
    // Validate token first
    const validation = await this.validateToken(token)
    if (!validation.valid) {
      return { verified: false, error: validation.error }
    }

    // Get order with participant to retrieve phone number
    const order = await this.db.order.findUnique({
      where: { id: validation.orderId },
      include: { Participant: true },
    })

    if (!order) {
      return { verified: false, error: 'Order not found' }
    }

    // Extract last 4 digits of phone number
    const phone = order.Participant.phone
    const last4 = phone.slice(-4)

    // Compare challenge response with last 4 digits
    if (challengeResponse !== last4) {
      return { verified: false, error: 'Invalid verification code' }
    }

    // Don't increment usedCount here - only increment after successful upload
    // This allows user to verify and then upload without token being consumed

    // Return success with order ID
    return { verified: true, orderId: validation.orderId }
  }

  /**
   * Mark token as used (increment usedCount)
   * Should be called after successful file upload
   * @param token - Raw token string
   */
  async markTokenAsUsed(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    await this.db.guestAccessToken.update({
      where: { tokenHash },
      data: { usedCount: { increment: 1 } },
    })
  }

  /**
   * Revoke token (mark as revoked in database)
   * Used after successful upload or manual revocation
   * @param token - Raw token string to revoke
   */
  async revokeToken(token: string): Promise<void> {
    // Hash token to find record
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Check if token exists
    const tokenRecord = await this.db.guestAccessToken.findUnique({
      where: { tokenHash },
    })

    if (!tokenRecord) {
      const error: ApiError = {
        status: 404,
        message: 'Token not found',
      }
      throw error
    }

    // Mark as revoked AND increment usedCount
    await this.db.guestAccessToken.update({
      where: { tokenHash },
      data: {
        revokedAt: new Date(),
        usedCount: { increment: 1 }
      },
    })
  }
}
