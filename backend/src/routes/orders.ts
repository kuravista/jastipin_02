/**
 * Order Management Routes
 * POST /trips/:tripId/orders - Create order
 * POST /trips/:tripId/checkout - Checkout with multiple items
 * GET /trips/:tripId/orders - List orders
 * GET /trips/:tripId/orders/:orderId - Get order details
 * PATCH /trips/:tripId/orders/:orderId - Update order status
 * DELETE /trips/:tripId/orders/:orderId - Cancel order
 */

import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  createOrderSchema,
  updateOrderSchema,
  checkoutSchema,
} from '../utils/validators.js'
import { AuthRequest } from '../types/index.js'
import {
  processCheckout,
  getCheckoutSummary,
  validateParticipantCheckout,
} from '../services/checkout.service.js'

const router = Router()
const db = new PrismaClient()

/**
 * POST /trips/:tripId/orders
 * Create order for a product (guest or participant)
 * Public endpoint - no auth required
 */
router.post(
  '/trips/:tripId/orders',
  validate(createOrderSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const trip = await db.trip.findUnique({
        where: { id: req.params.tripId },
      })

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' })
        return
      }

      // Verify product exists and is in trip
      const product = await db.product.findUnique({
        where: { id: req.body.productId },
      })

      if (!product || product.tripId !== req.params.tripId) {
        res.status(404).json({ error: 'Product not found' })
        return
      }

      // Verify stock availability
      if (product.stock < req.body.quantity) {
        res
          .status(400)
          .json({ error: 'Insufficient stock available' })
        return
      }

      // Normalize phone number - add 62 prefix if not present
      const phoneNumber = (req.body.participantPhone || '').startsWith('62')
        ? req.body.participantPhone
        : `62${req.body.participantPhone}`

      // Get or create participant record
      let participant = await db.participant.findFirst({
        where: {
          tripId: req.params.tripId,
          phone: phoneNumber,
        },
      })

      if (!participant) {
        participant = await db.participant.create({
          data: {
            tripId: req.params.tripId,
            phone: phoneNumber,
            name: req.body.participantName || 'Participant',
            email: req.body.participantEmail,
            address: req.body.participantAddress,
          },
        })
      } else {
        // Update existing participant with new info if provided
        participant = await db.participant.update({
          where: { id: participant.id },
          data: {
            name: req.body.participantName || participant.name,
            email: req.body.participantEmail || participant.email,
            address: req.body.participantAddress || participant.address,
          },
        })
      }

      const totalPrice = product.price * req.body.quantity

      const order = await db.order.create({
        data: {
          participantId: participant.id,
          productId: req.body.productId,
          quantity: req.body.quantity,
          totalPrice,
          notes: req.body.notes,
        },
        include: {
          participant: true,
          product: true,
        },
      })

      res.status(201).json(order)
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create order' })
    }
  }
)

/**
 * POST /trips/:tripId/checkout
 * Process checkout with multiple items (guest or participant)
 * Public endpoint - no auth required
 */
router.post(
  '/trips/:tripId/checkout',
  validate(checkoutSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate participant has required checkout info
      const validation = await validateParticipantCheckout(
        req.params.tripId,
        req.body.participantName,
        req.body.participantEmail,
        req.body.participantPhone,
        req.body.participantAddress
      )

      if (!validation.valid) {
        res.status(400).json({ error: validation.error })
        return
      }

      // Process checkout
      const result = await processCheckout({
        tripId: req.params.tripId,
        participantName: req.body.participantName,
        participantEmail: req.body.participantEmail,
        participantPhone: req.body.participantPhone,
        participantAddress: req.body.participantAddress,
        items: req.body.items,
      })

      if (!result.success) {
        res.status(400).json({ error: result.error })
        return
      }

      res.status(201).json({
        success: true,
        message: 'Checkout completed successfully',
        participant: validation.participant,
        orders: result.orders,
        summary: result.details,
      })
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to process checkout' })
    }
  }
)

/**
 * GET /trips/:tripId/checkout/summary/:phone
 * Get checkout summary for a participant (guest or user)
 * Public endpoint - no auth required
 */
router.get(
  '/trips/:tripId/checkout/summary/:phone',
  async (req: AuthRequest, res: Response) => {
    try {
      const summary = await getCheckoutSummary(
        req.params.tripId,
        req.params.phone
      )

      if (!summary) {
        res.status(404).json({ error: 'Participant not found' })
        return
      }

      res.json(summary)
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch checkout summary' })
    }
  }
)

/**
 * GET /trips/:tripId/orders
 * List all orders in trip (trip owner only)
 */
router.get(
  '/trips/:tripId/orders',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const trip = await db.trip.findUnique({
        where: { id: req.params.tripId },
      })

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' })
        return
      }

      if (trip.jastiperId !== req.user!.id) {
        res.status(403).json({ error: 'Not authorized' })
        return
      }

      const orders = await db.order.findMany({
        where: {
          product: {
            tripId: req.params.tripId,
          },
        },
        include: {
          participant: true,
          product: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      res.json(orders)
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch orders' })
    }
  }
)

/**
 * GET /trips/:tripId/orders/:orderId
 * Get order details
 */
router.get(
  '/trips/:tripId/orders/:orderId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const order = await db.order.findUnique({
        where: { id: req.params.orderId },
        include: {
          participant: true,
          product: true,
        },
      })

      if (!order || order.product.tripId !== req.params.tripId) {
        res.status(404).json({ error: 'Order not found' })
        return
      }

      res.json(order)
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch order' })
    }
  }
)

/**
 * PATCH /trips/:tripId/orders/:orderId
 * Update order status (confirm/reject) - trip owner only
 */
router.patch(
  '/trips/:tripId/orders/:orderId',
  authMiddleware,
  validate(updateOrderSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const trip = await db.trip.findUnique({
        where: { id: req.params.tripId },
      })

      if (!trip || trip.jastiperId !== req.user!.id) {
        res.status(403).json({ error: 'Not authorized' })
        return
      }

      const order = await db.order.update({
        where: { id: req.params.orderId },
        data: req.body,
        include: {
          participant: true,
          product: true,
        },
      })

      res.json(order)
    } catch (error: any) {
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Order not found' })
        return
      }
      res.status(500).json({ error: 'Failed to update order' })
    }
  }
)

/**
 * DELETE /trips/:tripId/orders/:orderId
 * Cancel order (trip owner only)
 */
router.delete(
  '/trips/:tripId/orders/:orderId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const trip = await db.trip.findUnique({
        where: { id: req.params.tripId },
      })

      if (!trip || trip.jastiperId !== req.user!.id) {
        res.status(403).json({ error: 'Not authorized' })
        return
      }

      await db.order.delete({
        where: { id: req.params.orderId },
      })

      res.json({ message: 'Order cancelled successfully' })
    } catch (error: any) {
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Order not found' })
        return
      }
      res.status(500).json({ error: 'Failed to cancel order' })
    }
  }
)

export default router
