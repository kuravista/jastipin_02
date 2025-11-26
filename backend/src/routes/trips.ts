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
        // Create base slug from title
        // Strategy: Take first few words, truncate to max 10 chars base, then add 4 random suffix
        // Max total length = 10 + 1 + 4 = 15 chars
        
        const fullSlug = req.body.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-') // Replace all non-alphanumeric with hyphen
          .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
          .replace(/^-|-$/g, '') // Trim hyphens
        
        // Truncate to 10 chars for the readable part
        const baseSlug = fullSlug.substring(0, 10).replace(/-$/, '')
        
        // Generate random suffix (4 chars)
        const randomSuffix = Math.random().toString(36).substring(2, 6)
        
        slug = `${baseSlug}-${randomSuffix}`
      }

      // Auto-set isActive based on startDate
      const startDate = new Date(req.body.startDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      startDate.setHours(0, 0, 0, 0)
      const isActive = startDate <= today

      // Get random trip image if not provided
      const url_img = req.body.url_img || getRandomTripImage()

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
 * GET /trips/:id/public
 * Get PUBLIC trip details for guest checkout (no auth required)
 * Returns minimal trip data without sensitive information
 */
router.get(
  '/trips/:id/public',
  async (req, res) => {
    try {
      const trip = await tripService.getTrip(req.params.id)

      // Return only public fields needed for checkout
      const publicTrip = {
        id: trip.id,
        title: trip.title,
        paymentType: trip.paymentType,
        jastiper: trip.User ? {
          slug: trip.User.slug,
          name: trip.User.profileName || trip.User.slug
        } : null
      }

      res.json(publicTrip)
    } catch (error: any) {
      const status = error.status || 500
      const message = error.message || 'Failed to fetch trip'
      res.status(status).json({ error: message })
    }
  }
)

/**
 * GET /trips/:id
 * Get trip details with products and participants (AUTHENTICATED)
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
 * GET /trips/:id/products
 * Get PUBLIC products for a trip (no auth required for guest checkout)
 * Supports filtering by product IDs via ?ids=id1,id2,id3
 */
router.get(
  '/trips/:id/products',
  async (req, res) => {
    try {
      const tripId = req.params.id
      const idsParam = req.query.ids as string | undefined

      // Build query filter
      const where: any = { tripId }

      // If specific product IDs requested, filter by them
      if (idsParam) {
        const ids = idsParam.split(',').map(id => id.trim())
        where.id = { in: ids }
      }

      // Fetch products (public fields only)
      const products = await db.product.findMany({
        where,
        select: {
          id: true,
          title: true,
          price: true,
          type: true,
          unit: true,
          stock: true,
          isUnlimitedStock: true,
          image: true,
          description: true
        }
      })

      res.json(products)
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch products' })
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
