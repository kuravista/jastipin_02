/**
 * Social Media Routes
 * POST /social-media - Create social media account
 * GET /social-media - Get user's social media accounts
 * PATCH /social-media/:id - Update social media account
 * DELETE /social-media/:id - Delete social media account
 */

import { Router, Response, Router as ExpressRouter } from 'express'
import { PrismaClient } from '@prisma/client'
import { SocialMediaService } from '../services/social-media.service.js'
import { authMiddleware } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createSocialMediaSchema, updateSocialMediaSchema } from '../utils/validators.js'
import { AuthRequest } from '../types/index.js'

const router: ExpressRouter = Router()
const db = new PrismaClient()
const socialMediaService = new SocialMediaService(db)

/**
 * POST /social-media
 * Create new social media account
 */
router.post(
  '/social-media',
  authMiddleware,
  validate(createSocialMediaSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const socialMedia = await socialMediaService.createSocialMedia(req.user!.id, req.body)
      res.status(201).json(socialMedia)
    } catch (error: any) {
      const status = error.status || 500
      const message = error.message || 'Failed to create social media account'
      res.status(status).json({ error: message })
    }
  }
)

/**
 * GET /social-media
 * Get all social media accounts for authenticated user
 */
router.get('/social-media', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const socialMedias = await socialMediaService.getSocialMediaByUserId(req.user!.id)
    res.json(socialMedias)
  } catch (error: any) {
    const status = error.status || 500
    const message = error.message || 'Failed to fetch social media accounts'
    res.status(status).json({ error: message })
  }
})

/**
 * PATCH /social-media/:id
 * Update social media account
 */
router.patch(
  '/social-media/:id',
  authMiddleware,
  validate(updateSocialMediaSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const socialMedia = await socialMediaService.updateSocialMedia(
        req.params.id,
        req.user!.id,
        req.body
      )
      res.json(socialMedia)
    } catch (error: any) {
      const status = error.status || 500
      const message = error.message || 'Failed to update social media account'
      res.status(status).json({ error: message })
    }
  }
)

/**
 * DELETE /social-media/:id
 * Delete social media account
 */
router.delete('/social-media/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const socialMedia = await socialMediaService.deleteSocialMedia(req.params.id, req.user!.id)
    res.json({ message: 'Social media account deleted successfully', data: socialMedia })
  } catch (error: any) {
    const status = error.status || 500
    const message = error.message || 'Failed to delete social media account'
    res.status(status).json({ error: message })
  }
})

export default router
