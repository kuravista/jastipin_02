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
import db from '../lib/prisma.js'
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

// Import TokenService for magic link generation
import { TokenService } from '../services/token.service.js'
const tokenService = new TokenService(db)

// Import EmailTriggerService for notifications
import { EmailTriggerService } from '../services/email/email-trigger.service.js'

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
 * POST /orders/:orderId/approve-final
 * Jastiper approves final payment proof
 * Auth: Jastiper only
 */
router.post(
  '/orders/:orderId/approve-final',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { orderId } = req.params
      const { action } = req.body
      const jastiperId = req.user?.id

      if (!jastiperId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      if (!action || !['accept', 'reject'].includes(action)) {
        res.status(400).json({ error: 'Action must be "accept" or "reject"' })
        return
      }

      // Get order with trip info
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          Trip: {
            select: {
              jastiperId: true
            }
          }
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

      // Check order status
      if (order.status !== 'awaiting_final_validation') {
        res.status(400).json({
          error: `Order cannot be approved in status: ${order.status}`
        })
        return
      }

      // Update order based on action
      let updateData: any = {
        validatedAt: new Date(),
        validatedBy: jastiperId
      }

      if (action === 'accept') {
        updateData.status = 'paid'
      } else {
        updateData.status = 'awaiting_final_payment'
        updateData.finalProofUrl = null
        updateData.finalPaidAt = null
        updateData.rejectionReason = req.body.rejectionReason || 'Bukti pembayaran final ditolak'
      }

      const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          Participant: true,
          OrderItem: {
            include: {
              Product: true
            }
          }
        }
      })

      // Send notification to customer
      if (action === 'reject') {
        // Send rejection email with new magic link for re-upload
        EmailTriggerService.sendFinalPaymentRejectedEmail(
          orderId,
          updateData.rejectionReason
        ).catch(error => {
          console.error('[FinalApproval] Failed to send rejection email:', error)
          // Don't fail the request if email fails
        })
      }

      console.log(`[FinalApproval] Order ${orderId} final payment ${action === 'accept' ? 'approved' : 'rejected'}`)

      res.json({
        success: true,
        order: updatedOrder,
        message: action === 'accept'
          ? 'Final payment approved successfully'
          : 'Final payment rejected'
      })

    } catch (error: any) {
      console.error('Final approval error:', error)
      res.status(500).json({ error: error.message || 'Final approval failed' })
    }
  }
)

/**
 * GET /orders/:orderId/invoice
 * Get invoice data for an order
 * Public endpoint
 */
router.get(
  '/orders/:orderId/invoice',
  async (req: AuthRequest, res: Response) => {
    try {
      const { orderId } = req.params

      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          Participant: {
            select: {
              name: true,
              phone: true,
              email: true,
              address: true
            }
          },
          Address: {
            select: {
              recipientName: true,
              phone: true,
              addressText: true,
              districtName: true,
              cityName: true,
              provinceName: true,
              postalCode: true
            }
          },
          Trip: {
            include: {
              User: {
                select: {
                  profileName: true,
                  slug: true,
                  whatsappNumber: true,
                  email: true
                }
              }
            }
          },
          OrderItem: {
            include: {
              Product: {
                select: {
                  title: true
                }
              }
            }
          }
        }
      })

      if (!order) {
        res.status(404).json({ error: 'Order not found' })
        return
      }

      // Fetch guest if exists
      let guest = null
      if (order.guestId) {
        guest = await db.guest.findUnique({
          where: { id: order.guestId },
          select: {
            name: true,
            email: true,
            phone: true
          }
        })
      }

      // Calculate subtotal from order items
      const subtotal = order.OrderItem.reduce((sum, item) => {
        return sum + (item.priceAtOrder * item.quantity)
      }, 0)

      // Prepare shipping address
      let shippingAddress = '-'
      if (order.Address) {
        const parts = [
          order.Address.addressText,
          order.Address.districtName,
          order.Address.cityName,
          order.Address.provinceName,
          order.Address.postalCode
        ].filter(Boolean)
        shippingAddress = parts.join(', ')
      } else if (order.Participant?.address) {
        shippingAddress = order.Participant.address
      }

      // Prepare invoice data
      const invoiceData = {
        invoiceId: order.id,
        invoiceNumber: order.orderCode || `INV/${new Date(order.createdAt).getFullYear()}/${String(new Date(order.createdAt).getMonth() + 1).padStart(2, '0')}/${order.id.slice(0, 8).toUpperCase()}`,
        orderCode: order.orderCode,
        date: new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        validatedDate: order.validatedAt ? new Date(order.validatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null,
        status: order.status === 'paid' ? 'Lunas' : order.status === 'awaiting_final_payment' ? 'Menunggu Pelunasan' : 'Proses',

        // Customer info
        customer: {
          name: order.Participant?.name || guest?.name || 'Customer',
          whatsapp: order.Participant?.phone || guest?.phone || '-',
          address: order.Participant?.address || '-',
          email: order.Participant?.email || guest?.email || '-'
        },

        // Shipping address
        shippingAddress: shippingAddress,
        recipientName: order.Address?.recipientName || order.Participant?.name || guest?.name || 'Customer',
        recipientPhone: order.Address?.phone || order.Participant?.phone || guest?.phone || '-',

        // Jastiper info
        jastiper: {
          name: order.Trip?.User?.profileName || order.Trip?.User?.slug || 'Jastiper',
          username: order.Trip?.User?.slug || '',
          whatsapp: order.Trip?.User?.whatsappNumber || '-',
          email: order.Trip?.User?.email || '-',
          businessAddress: order.Trip?.title || 'International'
        },

        // Products
        items: order.OrderItem.map(item => ({
          id: item.id,
          name: item.Product?.title || 'Product',
          quantity: item.quantity,
          price: item.priceAtOrder,
          subtotal: item.priceAtOrder * item.quantity
        })),

        // Payment summary
        subtotal: subtotal,
        shippingFee: order.shippingFee || 0,
        serviceFee: order.serviceFee || 0,
        platformCommission: order.platformCommission || 0,
        total: order.totalPrice || 0,
        dpAmount: order.dpAmount || 0,
        finalAmount: order.finalAmount || 0,

        // Payment info
        paymentMethod: 'Transfer Bank',
        dpPaidAt: order.dpPaidAt ? new Date(order.dpPaidAt).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null,
        finalPaidAt: order.finalPaidAt ? new Date(order.finalPaidAt).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null
      }

      res.json({
        success: true,
        invoice: invoiceData
      })

    } catch (error: any) {
      console.error('Get invoice error:', error)
      res.status(500).json({ error: error.message || 'Failed to get invoice' })
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
      
      console.log(`[Shipping] Calculate request for order: ${orderId}, jastiperId: ${jastiperId}`)
      
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
      
      console.log(`[Shipping] Order found: ${!!order}, has Address: ${!!order?.Address}, addressId: ${order?.addressId}`)
      
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
        console.log(`[Shipping] ERROR: Order ${orderId} has no address. addressId=${order.addressId}`)
        res.status(400).json({ 
          error: 'Order has no address',
          orderId,
          addressId: order.addressId,
          hint: 'Order must have a delivery address. Please update the order address in the system.'
        })
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

      // Get jastiper user profile for origin
      let jastiper = await db.user.findUnique({
        where: { id: jastiperId },
        select: {
          originDistrictId: true,
          originDistrictName: true,
          originCityName: true,
          originProvinceName: true,
          originRajaOngkirDistrictId: true
        }
      })

      console.log(`[Shipping] Jastiper origin: rajaOngkirDistrictId=${jastiper?.originRajaOngkirDistrictId}, city=${jastiper?.originCityName}`)

      // Check if jastiper has origin address set
      if (!jastiper?.originCityName || !jastiper?.originDistrictName) {
        console.log(`[Shipping] ERROR: Jastiper ${jastiperId} has no origin address`)
        res.status(400).json({
          error: 'Origin address not configured',
          message: 'Please set your origin address (city & district) in profile settings first.',
          hint: 'Go to profile settings > Origin Address and update your city and district'
        })
        return
      }

      // Auto-map to RajaOngkir if not already mapped
      if (!jastiper.originRajaOngkirDistrictId) {
        console.log(`[Shipping] Auto-mapping RajaOngkir for jastiper...`)
        const { autoMapToRajaOngkir } = await import('../services/rajaongkir.service.js')
        const mappedDistrictId = await autoMapToRajaOngkir(
          jastiper.originCityName!,
          jastiper.originDistrictName!
        )

        if (mappedDistrictId) {
          // Update user profile with mapped RajaOngkir district ID
          jastiper = await db.user.update({
            where: { id: jastiperId },
            data: {
              originRajaOngkirDistrictId: mappedDistrictId
            },
            select: {
              originDistrictId: true,
              originDistrictName: true,
              originCityName: true,
              originProvinceName: true,
              originRajaOngkirDistrictId: true
            }
          })
          console.log(`[Shipping] ✅ Auto-mapped to RajaOngkir ID: ${mappedDistrictId}`)
        } else {
          console.log(`[Shipping] ⚠️ Failed to auto-map RajaOngkir district`)
          res.status(400).json({
            error: 'Cannot map your origin to RajaOngkir',
            message: `Failed to find RajaOngkir mapping for city "${jastiper.originCityName}"`,
            hint: 'Please verify your origin city and district are correctly set'
          })
          return
        }
      }

      // Get destination from address (must use rajaOngkirDistrictId if available)
      const destination = order.Address.rajaOngkirDistrictId || order.Address.districtId

      console.log(`[Shipping] Destination: rajaOngkirDistrictId=${order.Address.rajaOngkirDistrictId}, districtId=${order.Address.districtId}, resolved=${destination}`)

      if (!destination) {
        console.log(`[Shipping] ERROR: Order ${orderId} address has no rajaOngkir mapping. districtName=${order.Address.districtName}`)
        res.status(400).json({
          error: 'Destination address incomplete',
          message: 'Order address does not have RajaOngkir district ID',
          districtName: order.Address.districtName,
          hint: 'Address needs RajaOngkir mapping. Please update the address.'
        })
        return
      }

      // Calculate shipping using RajaOngkir district IDs
      const { calculateShippingCost, getBestShippingOption } = await import('../services/rajaongkir.service.js')
      const shippingOptions = await calculateShippingCost(
        jastiper.originRajaOngkirDistrictId as string,
        destination as string,
        totalWeight,
        courier || 'jne:tiki:pos:jnt'
      )

      const recommendedOption = getBestShippingOption(shippingOptions)

      console.log(`[Shipping] SUCCESS: Got ${shippingOptions?.length || 0} options for order ${orderId}`)

      res.json({
        success: true,
        data: {
          origin: {
            districtId: jastiper.originDistrictId,
            rajaOngkirDistrictId: jastiper.originRajaOngkirDistrictId,
            districtName: jastiper.originDistrictName,
            cityName: jastiper.originCityName,
            provinceName: jastiper.originProvinceName
          },
          destination: {
            districtId: order.Address.districtId,
            rajaOngkirDistrictId: order.Address.rajaOngkirDistrictId,
            districtName: order.Address.districtName,
            cityName: order.Address.cityName,
            provinceName: order.Address.provinceName
          },
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
 * GET /orders/pending-count
 * Get count of orders pending validation (awaiting_validation + awaiting_final_validation)
 * Auth: Jastiper only
 */
router.get(
  '/orders/pending-count',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const jastiperId = req.user?.id

      if (!jastiperId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      // Count orders awaiting DP validation
      const awaitingDPValidation = await db.order.count({
        where: {
          status: 'awaiting_validation',
          Trip: {
            jastiperId
          }
        }
      })

      // Count orders awaiting final payment validation
      const awaitingFinalValidation = await db.order.count({
        where: {
          status: 'awaiting_final_validation',
          Trip: {
            jastiperId
          }
        }
      })

      const totalPending = awaitingDPValidation + awaitingFinalValidation

      res.json({
        success: true,
        data: {
          awaitingDPValidation,
          awaitingFinalValidation,
          total: totalPending
        }
      })
    } catch (error: any) {
      console.error('[Orders] Error getting pending count:', error)
      res.status(500).json({ error: 'Failed to get pending count' })
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
        select: {
          id: true,
          orderCode: true,
          status: true,
          dpAmount: true,
          totalPrice: true,
          finalAmount: true, // ADDED: Final payment amount
          dpPaidAt: true,
          proofUrl: true, // Legacy field
          dpProofUrl: true, // DP payment proof
          finalProofUrl: true, // Final payment proof
          createdAt: true,
          shippingFee: true,
          serviceFee: true,
          platformCommission: true, // ADDED: Platform commission
          finalBreakdown: true, // ADDED: Complete breakdown from validation
          validatedAt: true,
          rejectionReason: true,
          Participant: {
            select: {
              name: true,
              phone: true
            }
          },
          OrderItem: {
            select: {
              quantity: true,
              priceAtOrder: true,
              Product: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  type: true,
                  weightGram: true,
                  // Exclude image and description to reduce response size
                }
              }
            }
          },
          Address: {
            select: {
              recipientName: true,
              phone: true,
              addressText: true,
              districtId: true,
              districtName: true,
              cityName: true,
              provinceName: true,
              postalCode: true
            }
          },
          Trip: {
            select: {
              id: true,
              title: true,
              paymentType: true,
              dpPercentage: true
            }
          }
        },
        orderBy: [
          { dpPaidAt: 'asc' },
          { createdAt: 'desc' },
          { id: 'asc' }
        ],
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

/**
 * PATCH /api/orders/:orderId/map-rajaongkir
 * Map address to RajaOngkir district ID (for accurate shipping calculation)
 * Auth: Jastiper only
 * Body: { rajaOngkirDistrictId }
 */
router.patch(
  '/orders/:orderId/map-rajaongkir',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { orderId } = req.params
      const { rajaOngkirDistrictId } = req.body
      const jastiperId = req.user?.id

      if (!jastiperId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      if (!rajaOngkirDistrictId) {
        res.status(400).json({ error: 'rajaOngkirDistrictId is required' })
        return
      }

      // Get order with address
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          Address: true,
          Trip: {
            select: {
              jastiperId: true
            }
          }
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

      // Update address with RajaOngkir district ID
      const updatedAddress = await db.address.update({
        where: { id: order.Address.id },
        data: {
          rajaOngkirDistrictId
        }
      })

      res.json({
        success: true,
        message: 'RajaOngkir district ID mapped successfully',
        data: {
          addressId: updatedAddress.id,
          rajaOngkirDistrictId: updatedAddress.rajaOngkirDistrictId,
          districtName: updatedAddress.districtName,
          cityName: updatedAddress.cityName
        }
      })
    } catch (error: any) {
      console.error('Map RajaOngkir error:', error)
      res.status(500).json({
        error: error.message || 'Failed to map RajaOngkir district ID'
      })
    }
  }
)

export default router
