/**
 * Onboarding Routes
 * PATCH /users/complete-profile - Save profile & bank account
 * PATCH /users/complete-tutorial - Mark tutorial as completed
 * POST /users/restart-tutorial - Restart tutorial
 * GET /users/onboarding-status - Get onboarding status
 */

import { Router, Response, Router as ExpressRouter } from 'express'
import db from '../lib/prisma.js'
import { OnboardingService } from '../services/onboarding.service.js'
import { authMiddleware } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { completeProfileSchema } from '../utils/validators.js'
import { AuthRequest } from '../types/index.js'

const router: ExpressRouter = Router()
const onboardingService = new OnboardingService(db)

/**
 * PATCH /users/complete-profile
 * Save user profile completion data
 * Body: { profileName, whatsappNumber, originProvinceId, originProvinceName, originCityId, originCityName, originDistrictId, originDistrictName, originPostalCode, originAddressText, bankName, accountNumber, accountHolderName }
 */
router.patch(
  '/users/complete-profile',
  authMiddleware,
  validate(completeProfileSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await onboardingService.completeProfile(req.user!.id, req.body)

      res.json({
        success: true,
        message: 'Profile completed successfully',
        user: onboardingService.serializeUser(user),
      })
    } catch (error: any) {
      const status = error.status || 500
      const message = error.message || 'Failed to complete profile'
      res.status(status).json({ error: message })
    }
  }
)

/**
 * PATCH /users/complete-tutorial
 * Mark tutorial as completed
 */
router.patch(
  '/users/complete-tutorial',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await onboardingService.completeTutorial(req.user!.id)

      res.json({
        success: true,
        message: 'Tutorial completed successfully',
        user: onboardingService.serializeUser(user),
      })
    } catch (error: any) {
      const status = error.status || 500
      const message = error.message || 'Failed to complete tutorial'
      res.status(status).json({ error: message })
    }
  }
)

/**
 * POST /users/restart-tutorial
 * Restart tutorial from settings
 */
router.post(
  '/users/restart-tutorial',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await onboardingService.restartTutorial(req.user!.id)

      res.json({
        success: true,
        message: 'Tutorial restarted successfully',
        user: onboardingService.serializeUser(user),
      })
    } catch (error: any) {
      const status = error.status || 500
      const message = error.message || 'Failed to restart tutorial'
      res.status(status).json({ error: message })
    }
  }
)

/**
 * GET /users/onboarding-status
 * Get current user's onboarding status
 */
router.get(
  '/users/onboarding-status',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const status = await onboardingService.getOnboardingStatus(req.user!.id)
      res.json(status)
    } catch (error: any) {
      const status = error.status || 500
      const message = error.message || 'Failed to get onboarding status'
      res.status(status).json({ error: message })
    }
  }
)

/**
 * POST /users/sync-profile-status
 * Sync isProfileComplete flag with actual field values
 * Used when user may have filled profile via multiple endpoints
 */
router.post(
  '/users/sync-profile-status',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await onboardingService.syncProfileCompleteStatus(req.user!.id)

      res.json({
        success: true,
        message: 'Profile status synced successfully',
        user: onboardingService.serializeUser(user),
      })
    } catch (error: any) {
      const status = error.status || 500
      const message = error.message || 'Failed to sync profile status'
      res.status(status).json({ error: message })
    }
  }
)

export default router
