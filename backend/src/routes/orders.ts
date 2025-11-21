/**
 * Order Management Routes
 * POST /trips/:tripId/orders - Create order
 * POST /trips/:tripId/checkout - Checkout with multiple items
 * GET /trips/:tripId/orders - List orders
 * GET /trips/:tripId/orders/:orderId - Get order details
 * PATCH /trips/:tripId/orders/:orderId - Update order status
 * DELETE /trips/:tripId/orders/:orderId - Cancel order
 */

import { Router, Response, Router as ExpressRouter } from 'express'
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

const router: ExpressRouter = Router()
const db = new PrismaClient()

// Import TokenService for magic link generation
import { TokenService } from '../services/token.service.js'
const tokenService = new TokenService(db)

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

      // Verify stock availability (only for goods with stock tracking)
      if (product.stock !== null && product.stock < req.body.quantity) {
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
          Participant: true,
          Product: true,
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
          Product: {
            tripId: req.params.tripId,
          },
        },
        include: {
          Participant: true,
          Product: true,
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
          Participant: true,
          Product: true,
        },
      })

      if (!order || !order.Product || order.Product.tripId !== req.params.tripId) {
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
          Participant: true,
          Product: true,
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

/**
 * POST /orders/:orderId/validate
 * Jastiper validates order and sets final price
 * Auth: Jastiper only
 */
router.post(
  '/orders/:orderId/validate',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { orderId } = req.params
      const { action, shippingFee, serviceFee, rejectionReason } = req.body
      const jastiperId = req.user?.id
      
      if (!jastiperId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      
      if (!action || !['accept', 'reject'].includes(action)) {
        res.status(400).json({ error: 'Action must be "accept" or "reject"' })
        return
      }
      
      // Dynamic import validation service
      const { validateOrder } = await import('../services/validation.service.js')
      
      const result = await validateOrder({
        orderId,
        jastiperId,
        action,
        shippingFee,
        serviceFee,
        rejectionReason
      })
      
      if (!result.success) {
        res.status(400).json(result)
        return
      }
      
      res.json(result)
    } catch (error: any) {
      console.error('Validation error:', error)
      res.status(500).json({ error: error.message || 'Validation failed' })
    }
  }
)

/**
 * GET /orders/:orderId/breakdown
 * Get price breakdown for an order
 * Public endpoint (for participant to see breakdown)
 */
router.get(
  '/orders/:orderId/breakdown',
  async (req: AuthRequest, res: Response) => {
    try {
      const { orderId } = req.params
      
      const order = await db.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          dpAmount: true,
          finalAmount: true,
          totalPrice: true,
          shippingFee: true,
          serviceFee: true,
          platformCommission: true,
          finalBreakdown: true
        }
      })
      
      if (!order) {
        res.status(404).json({ error: 'Order not found' })
        return
      }
      
      res.json({
        success: true,
        data: {
          orderId: order.id,
          status: order.status,
          dpAmount: order.dpAmount,
          finalAmount: order.finalAmount,
          totalPrice: order.totalPrice,
          fees: {
            shippingFee: order.shippingFee,
            serviceFee: order.serviceFee,
            platformCommission: order.platformCommission
          },
          breakdown: order.finalBreakdown
        }
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch breakdown' })
    }
  }
)

/**
 * POST /orders/:orderId/calculate-shipping
 * Calculate shipping cost using RajaOngkir (optional helper)
 * Auth: Jastiper only
 */
router.post(
  '/orders/:orderId/calculate-shipping',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { orderId } = req.params
      const { courier } = req.body
      const jastiperId = req.user?.id
      
      if (!jastiperId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      
      // Get order with items and address
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          OrderItem: {
            include: {
              Product: true
            }
          },
          Address: true,
          Trip: true
        }
      })
      
      if (!order) {
        res.status(404).json({ error: 'Order not found' })
        return
      }
      
      // Verify ownership
      if (order.Trip?.jastiperId !== jastiperId) {
        res.status(403).json({ error: 'Unauthorized: Not the trip owner' })
        return
      }
      
      if (!order.Address) {
        res.status(400).json({ error: 'Order has no address' })
        return
      }
      
      // Calculate total weight
      const { calculateTotalWeight } = await import('../services/price-calculator.service.js')
      const totalWeight = calculateTotalWeight(
        order.OrderItem.map((item: any) => ({
          weightGram: item.Product.weightGram,
          quantity: item.quantity
        }))
      )
      
      // Get jastiper origin (TODO: add to user profile)
      // For now, use a default or from request
      const origin = req.body.origin || order.Address.districtId
      const destination = order.Address.districtId
      
      // Calculate shipping
      const { calculateShippingCost, getBestShippingOption } = await import('../services/rajaongkir.service.js')
      const shippingOptions = await calculateShippingCost(
        origin,
        destination,
        totalWeight,
        courier || 'jne:tiki:pos'
      )
      
      const recommendedOption = getBestShippingOption(shippingOptions)
      
      res.json({
        success: true,
        data: {
          origin,
          destination,
          weight: totalWeight,
          options: shippingOptions,
          recommendedOption
        }
      })
    } catch (error: any) {
      console.error('Calculate shipping error:', error)
      res.status(500).json({ error: error.message || 'Failed to calculate shipping' })
    }
  }
)

/**
 * GET /orders
 * Get orders for authenticated jastiper with optional filtering
 * Auth: Jastiper only
 * Query params:
 *   - status: string (optional) - Filter by order status (awaiting_validation, validated, etc.)
 *   - limit: number (optional) - Max results (default: 100)
 *   - offset: number (optional) - Pagination offset (default: 0)
 */
router.get(
  '/orders',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const jastiperId = req.user?.id
      
      if (!jastiperId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      
      // Parse query parameters
      const status = req.query.status as string
      const search = req.query.search as string
      const limit = parseInt(req.query.limit as string) || 100
      const offset = parseInt(req.query.offset as string) || 0
      
      // Validate limit and offset
      if (limit < 1 || limit > 500) {
        res.status(400).json({ error: 'Limit must be between 1 and 500' })
        return
      }
      
      if (offset < 0) {
        res.status(400).json({ error: 'Offset must be non-negative' })
        return
      }
      
      // Build where clause
      const whereClause: any = {
        Trip: {
          jastiperId
        }
      }
      
      // Add status filter only if provided (allows fetching all orders)
      if (status) {
        whereClause.status = status
      }
      
      // Add search filter (search in participant name, phone, or order id)
      if (search) {
        whereClause.OR = [
          {
            Participant: {
              name: {
                contains: search,
                mode: 'insensitive' // case-insensitive
              }
            }
          },
          {
            Participant: {
              phone: {
                contains: search
              }
            }
          },
          {
            id: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ]
      }
      
      // Get total count for pagination
      const totalCount = await db.order.count({
        where: whereClause
      })
      
      // Query orders for this jastiper
      const orders = await db.order.findMany({
        where: whereClause,
        include: {
          Participant: true,
          OrderItem: {
            include: {
              Product: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  type: true,
                  weightGram: true,
                  markupType: true,
                  markupValue: true,
                  slug: true,
                  // Exclude image and description to reduce response size
                }
              }
            }
          },
          Address: true,
          Trip: {
            select: {
              id: true,
              jastiperId: true,
              title: true,
              slug: true,
              paymentType: true,
              dpPercentage: true,
              // Exclude unnecessary fields
            }
          }
        },
        orderBy: {
          dpPaidAt: 'asc' // oldest first (FIFO)
        },
        take: limit,
        skip: offset
      })
      
      res.json({
        success: true,
        data: orders,
        pagination: {
          total: totalCount,
          limit: limit,
          offset: offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(totalCount / limit)
        }
      })
    } catch (error: any) {
      console.error('Fetch orders error:', error)
      res.status(500).json({ error: error.message || 'Failed to fetch orders' })
    }
  }
)

/**
 * POST /api/orders/:orderId/generate-upload-token
 * Generate magic link token for guest to upload payment proof
 * Auth: Only jastiper who owns the order's trip can generate token
 */
router.post(
  '/orders/:orderId/generate-upload-token',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { orderId } = req.params
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      // Get order with trip info
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          Trip: {
            select: {
              jastiperId: true,
              User: {
                select: {
                  profileName: true,
                  slug: true
                }
              }
            }
          },
          Participant: {
            select: {
              name: true,
              phone: true
            }
          }
        }
      })

      if (!order) {
        res.status(404).json({ error: 'Order not found' })
        return
      }

      // Verify user owns this trip
      if (order.Trip?.jastiperId !== userId) {
        res.status(403).json({ 
          error: 'Only the jastiper who owns this order can generate upload token' 
        })
        return
      }

      // Check if order already has proof uploaded
      if (order.proofUrl) {
        res.status(400).json({ 
          error: 'Order already has payment proof uploaded',
          proofUrl: order.proofUrl
        })
        return
      }

      // Generate token
      const { token, expiresAt } = await tokenService.generateUploadToken(
        orderId,
        order.guestId || undefined
      )

      // Construct magic link
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      const magicLink = `${frontendUrl}/order/upload/${token}`

      res.json({
        success: true,
        token,
        magicLink,
        expiresAt,
        order: {
          id: order.id,
          participantName: order.Participant?.name,
          participantPhone: order.Participant?.phone,
          status: order.status
        }
      })
    } catch (error: any) {
      console.error('Generate token error:', error)
      res.status(500).json({ 
        error: error.message || 'Failed to generate upload token' 
      })
    }
  }
)

export default router
