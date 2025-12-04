/**
 * Profile Management Routes
 * GET /profile - Get user's profile
 * PATCH /profile - Update user's profile
 * GET /profile/:slug - Get public profile by slug
 */

import { Router, Response, Router as ExpressRouter } from 'express'
import db from '../lib/prisma.js'
import { AuthService } from '../services/auth.service.js'
import { OnboardingService } from '../services/onboarding.service.js'
import { authMiddleware } from '../middleware/auth.js'
import { optionalAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { updateProfileSchema, changePasswordSchema } from '../utils/validators.js'
import { AuthRequest } from '../types/index.js'

const router: ExpressRouter = Router()
const authService = new AuthService(db)
const onboardingService = new OnboardingService(db)

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
      
      // Auto-sync profile completion status based on actual field values
      try {
        await onboardingService.syncProfileCompleteStatus(req.user!.id)
      } catch (syncError) {
        // Log but don't fail the request
        console.error('[Profile Update] Failed to sync profile status:', syncError)
      }
      
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
 * GET /profile/:slug/products/:productSlug
 * Get product detail for public profile
 * Query params:
 *   - tripId: Optional. If provided, filter by this trip to get correct product when same slug exists in multiple trips
 */
router.get('/profile/:slug/products/:productSlug', async (req: AuthRequest, res: Response) => {
  try {
    const { slug, productSlug } = req.params
    const { tripId } = req.query

    // Find user by slug
    const user = await db.user.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        profileName: true,
        avatar: true,
      },
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Find product by slug where trip belongs to user
    // If tripId is provided, filter by that specific trip to avoid ambiguity
    // when same slug exists in multiple trips
    const productWhere: { slug: string; tripId?: string; Trip: { jastiperId: string } } = {
      slug: productSlug,
      Trip: { jastiperId: user.id },
    }
    
    // Add tripId filter if provided to get the correct product
    if (tripId) {
      productWhere.tripId = tripId as string
    }
    
    const product = await db.product.findFirst({
      where: productWhere,
      include: {
        Trip: {
          select: {
            id: true,
            title: true,
            isActive: true,
            paymentType: true,
          },
        },
      },
    })

    if (!product) {
      res.status(404).json({ error: 'Product not found' })
      return
    }

    // Calculate availability
    const available = product.isUnlimitedStock || (product.stock !== null && product.stock > 0)

    res.json({
      product: {
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: product.price,
        description: product.description,
        image: product.image,
        stock: product.stock,
        isUnlimitedStock: product.isUnlimitedStock,
        unit: product.unit,
        weightGram: product.weightGram,
        type: product.type,
        available,
        tripId: product.tripId,
      },
      trip: {
        id: product.Trip.id,
        title: product.Trip.title,
        status: product.Trip.isActive ? 'Buka' : 'Tutup',
        paymentType: product.Trip.paymentType,
      },
      jastiper: {
        slug: user.slug,
        profileName: user.profileName,
        avatar: user.avatar,
      },
    })
  } catch (error: unknown) {
    console.error('Product detail error:', error)
    res.status(500).json({ error: 'Failed to fetch product detail' })
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

      // Auto-sync profile completion status based on actual field values
      try {
        await onboardingService.syncProfileCompleteStatus(req.user!.id)
      } catch (syncError) {
        // Log but don't fail the request
        console.error('[Profile Origin Update] Failed to sync profile status:', syncError)
      }

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
