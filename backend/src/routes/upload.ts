/**
 * Upload Routes - Guest Magic Link Token System
 * GET /api/upload/validate - Validate token and get challenge type
 * POST /api/upload/verify - Verify challenge response
 * POST /api/upload/:orderId - Upload payment proof with verified token
 */

import { Router, Request, Response, Router as ExpressRouter } from 'express'
import { PrismaClient } from '@prisma/client'
import { TokenService } from '../services/token.service.js'
import { createRateLimiter } from '../middleware/rateLimiter.js'

const router: ExpressRouter = Router()
const db = new PrismaClient()
const tokenService = new TokenService(db)

// Rate limiter for validation endpoint (10 requests per IP per minute)
const validateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many validation attempts, please try again later',
})

// Rate limiter for verification endpoint (5 attempts per minute)
const verifyLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many verification attempts, please try again later',
})

/**
 * GET /api/upload/validate?token=xxx
 * Validate token and return challenge type if valid
 * Public endpoint with rate limiting
 */
router.get('/validate', validateLimiter, async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string

    if (!token) {
      res.status(400).json({ error: 'Token is required' })
      return
    }

    const result = await tokenService.validateToken(token)

    if (!result.valid) {
      res.status(401).json({
        valid: false,
        error: result.error,
      })
      return
    }

    res.json({
      valid: true,
      challenge: result.challenge,
    })
  } catch (error: any) {
    const status = error.status || 500
    const message = error.message || 'Token validation failed'
    res.status(status).json({ error: message })
  }
})

/**
 * POST /api/upload/verify
 * Verify challenge response (last 4 digits of WhatsApp)
 * Returns verified token status and order ID if successful
 * Public endpoint with rate limiting
 */
router.post('/verify', verifyLimiter, async (req: Request, res: Response) => {
  try {
    const { token, challengeResponse } = req.body

    if (!token || !challengeResponse) {
      res.status(400).json({
        error: 'Token and challenge response are required',
      })
      return
    }

    // Validate challenge response format (should be 4 digits)
    if (!/^\d{4}$/.test(challengeResponse)) {
      res.status(400).json({
        error: 'Challenge response must be 4 digits',
      })
      return
    }

    const result = await tokenService.verifyChallenge(token, challengeResponse)

    if (!result.verified) {
      res.status(401).json({
        verified: false,
        error: result.error,
      })
      return
    }

    res.json({
      verified: true,
      orderId: result.orderId,
    })
  } catch (error: any) {
    const status = error.status || 500
    const message = error.message || 'Challenge verification failed'
    res.status(status).json({ error: message })
  }
})

/**
 * POST /api/upload/:orderId
 * Upload payment proof with verified token
 * Expects multipart/form-data with 'file' field
 * Requires Authorization header with Bearer token
 */
router.post('/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params
    const authHeader = req.headers.authorization

    // Check for authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Authorization header with Bearer token is required',
      })
      return
    }

    // Extract token from header
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Validate token
    const validation = await tokenService.validateToken(token)
    if (!validation.valid || validation.orderId !== orderId) {
      res.status(401).json({
        error: validation.error || 'Invalid token for this order',
      })
      return
    }

    // Handle file upload to Cloudflare R2
    const { handleFileUpload } = await import('../utils/file-upload.js')

    const uploadedFile = await handleFileUpload(req, orderId)
    const proofUrl = uploadedFile.url

    // Update order with proof URL
    const order = await db.order.update({
      where: { id: orderId },
      data: {
        proofUrl,
        updatedAt: new Date(),
      },
    })

    // Revoke token after successful upload
    await tokenService.revokeToken(token)

    res.json({
      success: true,
      proofUrl: order.proofUrl,
      thumbnailUrl: uploadedFile.thumbnailUrl,
      filename: uploadedFile.filename,
      size: uploadedFile.size,
      message: 'Payment proof uploaded successfully',
    })
  } catch (error: any) {
    const status = error.status || 500
    const message = error.message || 'Upload failed'
    res.status(status).json({ error: message })
  }
})

export default router
