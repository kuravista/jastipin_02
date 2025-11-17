/**
 * Profile Management Routes
 * GET /profile - Get user's profile
 * PATCH /profile - Update user's profile
 * GET /profile/:slug - Get public profile by slug
 */

import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '../services/auth.service.js'
import { authMiddleware } from '../middleware/auth.js'
import { optionalAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { updateProfileSchema } from '../utils/validators.js'
import { AuthRequest } from '../types/index.js'

const router = Router()
const db = new PrismaClient()
const authService = new AuthService(db)

/**
 * GET /profile
 * Get authenticated user's profile
 */
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await authService.getUserProfile(req.user!.id)
    res.json(profile)
  } catch (error: any) {
    const status = error.status || 500
    const message = error.message || 'Failed to fetch profile'
    res.status(status).json({ error: message })
  }
})

/**
 * PATCH /profile
 * Update authenticated user's profile
 */
router.patch(
  '/profile',
  authMiddleware,
  validate(updateProfileSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const profile = await authService.updateUserProfile(
        req.user!.id,
        req.body
      )
      res.json(profile)
    } catch (error: any) {
      const status = error.status || 500
      const message = error.message || 'Failed to update profile'
      res.status(status).json({ error: message })
    }
  }
)

/**
 * GET /profile/:slug
 * Get public profile by user slug (no auth required)
 */
router.get('/profile/:slug', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await authService.getPublicProfile(req.params.slug)
    res.json(profile)
  } catch (error: any) {
    const status = error.status || 500
    const message = error.message || 'Failed to fetch profile'
    res.status(status).json({ error: message })
  }
})

export default router
