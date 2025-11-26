/**
 * Profile Management Routes
 * GET /profile - Get user's profile
 * PATCH /profile - Update user's profile
 * GET /profile/:slug - Get public profile by slug
 */

import { Router, Response, Router as ExpressRouter } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '../services/auth.service.js'
import { authMiddleware } from '../middleware/auth.js'
import { optionalAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { updateProfileSchema, changePasswordSchema } from '../utils/validators.js'
import { AuthRequest } from '../types/index.js'

const router: ExpressRouter = Router()
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

/**
 * POST /profile/change-password
 * Change authenticated user's password
 */
router.post(
  '/profile/change-password',
  authMiddleware,
  validate(changePasswordSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body
      const result = await authService.changePassword(
        req.user!.id,
        currentPassword,
        newPassword
      )
      res.json(result)
    } catch (error: any) {
      const status = error.status || 500
      const message = error.message || 'Failed to change password'
      res.status(status).json({ error: message })
    }
  }
)

/**
 * PATCH /profile/origin
 * Update jastiper's origin address with automatic RajaOngkir mapping
 * Body: { originProvinceId, originProvinceName, originCityId, originCityName, originDistrictId, originDistrictName }
 */
router.patch(
  '/profile/origin',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        originProvinceId,
        originProvinceName,
        originCityId,
        originCityName,
        originDistrictId,
        originDistrictName
      } = req.body

      if (!originDistrictId || !originDistrictName || !originCityName) {
        res.status(400).json({
          error: 'originDistrictId, originDistrictName, and originCityName are required'
        })
        return
      }

      // Auto-map to RajaOngkir district ID for shipping calculation
      const { autoMapToRajaOngkir } = await import('../services/rajaongkir.service.js')
      const rajaOngkirDistrictId = await autoMapToRajaOngkir(
        originCityName,
        originDistrictName
      )

      const updatedUser = await db.user.update({
        where: { id: req.user!.id },
        data: {
          originProvinceId: originProvinceId || null,
          originProvinceName: originProvinceName || null,
          originCityId: originCityId || null,
          originCityName: originCityName || null,
          originDistrictId: originDistrictId || null,
          originDistrictName: originDistrictName || null,
          originRajaOngkirDistrictId: rajaOngkirDistrictId || null
        },
        select: {
          id: true,
          email: true,
          slug: true,
          profileName: true,
          originProvinceId: true,
          originProvinceName: true,
          originCityId: true,
          originCityName: true,
          originDistrictId: true,
          originDistrictName: true,
          originRajaOngkirDistrictId: true
        }
      })

      res.json({
        success: true,
        message: 'Origin address updated successfully',
        data: updatedUser,
        rajaOngkirMapped: !!rajaOngkirDistrictId
      })
    } catch (error: any) {
      const status = error.status || 500
      const message = error.message || 'Failed to update origin address'
      res.status(status).json({ error: message })
    }
  }
)

export default router
