/**
 * Trip Management Routes
 * GET /trips - List user's trips
 * POST /trips - Create new trip
 * GET /trips/:id - Get trip details
 * PATCH /trips/:id - Update trip
 * DELETE /trips/:id - Delete trip
 */

import { Router, Response, Router as ExpressRouter } from 'express'
import { PrismaClient } from '@prisma/client'
import { TripService } from '../services/trip.service.js'
import { authMiddleware } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  createTripSchema,
  updateTripSchema,
} from '../utils/validators.js'
import { getRandomTripImage } from '../utils/image.utils.js'
import { AuthRequest } from '../types/index.js'

const router: ExpressRouter = Router()
const db = new PrismaClient()
const tripService = new TripService(db)

/**
 * POST /trips
 * Create new trip for authenticated user
 */
router.post(
  '/trips',
  authMiddleware,
  validate(createTripSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      // Auto-generate slug from title if not provided
      let slug = req.body.slug
      if (!slug) {
        slug = req.body.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      }

      // Auto-set isActive based on startDate
      const startDate = new Date(req.body.startDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      startDate.setHours(0, 0, 0, 0)
      const isActive = startDate <= today

      // Get random trip image
      const url_img = getRandomTripImage()

      const trip = await tripService.createTrip(req.user!.id, {
        ...req.body,
        slug: slug || 'trip',
        isActive,
        url_img,
      })
      res.status(201).json(trip)
    } catch (error: any) {
      const status = error.status || 500
      const message = error.message || 'Failed to create trip'
      res.status(status).json({ error: message })
    }
  }
)

/**
 * GET /trips
 * List all trips for authenticated user
 */
router.get('/trips', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const trips = await tripService.getUserTrips(req.user!.id)
    res.json(trips)
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch trips' })
  }
})

/**
 * GET /trips/:id
 * Get trip details with products and participants
 */
router.get(
  '/trips/:id',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const trip = await tripService.getTrip(req.params.id)

      // Check if user is trip owner or participant
      const isOwner = trip.jastiperId === req.user!.id
      if (!isOwner) {
        res.status(403).json({ error: 'Not authorized' })
        return
      }

      res.json(trip)
    } catch (error: any) {
      const status = error.status || 500
      const message = error.message || 'Failed to fetch trip'
      res.status(status).json({ error: message })
    }
  }
)

/**
 * PATCH /trips/:id
 * Update trip (owner only)
 */
router.patch(
  '/trips/:id',
  authMiddleware,
  validate(updateTripSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const isOwner = await tripService.verifyTripOwnership(
        req.params.id,
        req.user!.id
      )

      if (!isOwner) {
        res.status(403).json({ error: 'Not authorized' })
        return
      }

      // Auto-calculate isActive if startDate is provided
      if (req.body.startDate) {
        const startDate = new Date(req.body.startDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        startDate.setHours(0, 0, 0, 0)
        req.body.isActive = startDate <= today
      }

      const trip = await tripService.updateTrip(req.params.id, req.body)
      res.json(trip)
    } catch (error: any) {
      const status = error.status || 500
      const message = error.message || 'Failed to update trip'
      res.status(status).json({ error: message })
    }
  }
)

/**
 * DELETE /trips/:id
 * Delete trip (owner only)
 */
router.delete(
  '/trips/:id',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const isOwner = await tripService.verifyTripOwnership(
        req.params.id,
        req.user!.id
      )

      if (!isOwner) {
        res.status(403).json({ error: 'Not authorized' })
        return
      }

      await tripService.deleteTrip(req.params.id)
      res.json({ message: 'Trip deleted successfully' })
    } catch (error: any) {
      const status = error.status || 500
      const message = error.message || 'Failed to delete trip'
      res.status(status).json({ error: message })
    }
  }
)

export default router
