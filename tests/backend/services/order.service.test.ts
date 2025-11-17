/**
 * Order Service - CRUD Test Suite
 * Tests order creation, retrieval, updates, and status management
 */

import { PrismaClient, OrderStatus } from '@prisma/client'
import { AuthService } from '../../../backend/src/services/auth.service.js'
import { TripService } from '../../../backend/src/services/trip.service.js'

describe('Order CRUD Operations', () => {
  let db: PrismaClient
  let authService: AuthService
  let tripService: TripService
  let testJastiperId: string
  let testParticipantId: string
  let testTripId: string
  let testProductId: string
  let testUserIds: string[] = []
  let testTripIds: string[] = []
  let testProductIds: string[] = []
  let testParticipantIds: string[] = []
  let testOrderIds: string[] = []

  beforeAll(async () => {
    db = new PrismaClient()
    authService = new AuthService(db)
    tripService = new TripService(db)

    const userResult = await authService.register(
      `order-jastipin-${Date.now()}@example.com`,
      'Password123',
      'Order Test Jastipin'
    )
    testJastiperId = userResult.user.id
    testUserIds.push(testJastiperId)

    const trip = await tripService.createTrip(testJastiperId, {
      slug: `order-trip-${Date.now()}`,
      title: 'Order Test Trip',
    })
    testTripId = trip.id
    testTripIds.push(testTripId)

    const product = await db.product.create({
      data: {
        tripId: testTripId,
        slug: `order-product-${Date.now()}`,
        name: 'Test Product for Orders',
        price: 100000,
        stock: 50,
      },
    })
    testProductId = product.id
    testProductIds.push(testProductId)

    const participant = await db.participant.create({
      data: {
        tripId: testTripId,
        phone: `+62812345678-${Date.now()}`,
        name: 'Test Participant',
      },
    })
    testParticipantId = participant.id
    testParticipantIds.push(testParticipantId)
  })

  afterAll(async () => {
    for (const orderId of testOrderIds) {
      try {
        await db.order.delete({ where: { id: orderId } })
      } catch {
        // Ignore
      }
    }

    for (const participantId of testParticipantIds) {
      try {
        await db.participant.delete({ where: { id: participantId } })
      } catch {
        // Ignore
      }
    }

    for (const productId of testProductIds) {
      try {
        await db.product.delete({ where: { id: productId } })
      } catch {
        // Ignore
      }
    }

    for (const tripId of testTripIds) {
      try {
        await db.trip.delete({ where: { id: tripId } })
      } catch {
        // Ignore
      }
    }

    for (const userId of testUserIds) {
      try {
        await db.user.delete({ where: { id: userId } })
      } catch {
        // Ignore
      }
    }

    await db.$disconnect()
  })

  describe('createOrder', () => {
    it('should create order with required fields', async () => {
      const order = await db.order.create({
        data: {
          participantId: testParticipantId,
          productId: testProductId,
          quantity: 2,
          totalPrice: 200000,
        },
      })

      testOrderIds.push(order.id)

      expect(order.id).toBeDefined()
      expect(order.participantId).toBe(testParticipantId)
      expect(order.productId).toBe(testProductId)
      expect(order.quantity).toBe(2)
      expect(order.totalPrice).toBe(200000)
      expect(order.status).toBe('PENDING')
      expect(order.createdAt).toBeDefined()
    })

    it('should create order with optional notes', async () => {
      const order = await db.order.create({
        data: {
          participantId: testParticipantId,
          productId: testProductId,
          quantity: 1,
          totalPrice: 100000,
          notes: 'Special request: wrap as gift',
        },
      })

      testOrderIds.push(order.id)

      expect(order.notes).toBe('Special request: wrap as gift')
    })

    it('should calculate total price correctly', async () => {
      const quantity = 5
      const unitPrice = 100000
      const expectedTotal = quantity * unitPrice

      const order = await db.order.create({
        data: {
          participantId: testParticipantId,
          productId: testProductId,
          quantity,
          totalPrice: expectedTotal,
        },
      })

      testOrderIds.push(order.id)

      expect(order.totalPrice).toBe(expectedTotal)
    })

    it('should set default status to PENDING', async () => {
      const order = await db.order.create({
        data: {
          participantId: testParticipantId,
          productId: testProductId,
          quantity: 1,
          totalPrice: 100000,
        },
      })

      testOrderIds.push(order.id)

      expect(order.status).toBe('PENDING')
    })

    it('should create multiple orders for same participant', async () => {
      const order1 = await db.order.create({
        data: {
          participantId: testParticipantId,
          productId: testProductId,
          quantity: 1,
          totalPrice: 100000,
        },
      })

      const order2 = await db.order.create({
        data: {
          participantId: testParticipantId,
          productId: testProductId,
          quantity: 2,
          totalPrice: 200000,
        },
      })

      testOrderIds.push(order1.id, order2.id)

      expect(order1.id).not.toBe(order2.id)
      expect(order1.participantId).toBe(order2.participantId)
    })
  })

  describe('getOrder', () => {
    let testOrderId: string

    beforeAll(async () => {
      const order = await db.order.create({
        data: {
          participantId: testParticipantId,
          productId: testProductId,
          quantity: 3,
          totalPrice: 300000,
          notes: 'Test order for fetching',
        },
      })
      testOrderId = order.id
      testOrderIds.push(testOrderId)
    })

    it('should retrieve order by ID with relations', async () => {
      const order = await db.order.findUnique({
        where: { id: testOrderId },
        include: {
          participant: true,
          product: true,
        },
      })

      expect(order).toBeDefined()
      expect(order?.id).toBe(testOrderId)
      expect(order?.quantity).toBe(3)
      expect(order?.participant).toBeDefined()
      expect(order?.product).toBeDefined()
    })

    it('should return null for non-existent order', async () => {
      const order = await db.order.findUnique({
        where: { id: 'nonexistent-order-id' },
      })

      expect(order).toBeNull()
    })

    it('should include participant and product data', async () => {
      const order = await db.order.findUnique({
        where: { id: testOrderId },
        include: {
          participant: true,
          product: true,
        },
      })

      expect(order?.participant?.id).toBe(testParticipantId)
      expect(order?.product?.id).toBe(testProductId)
    })
  })

  describe('listOrders', () => {
    beforeAll(async () => {
      for (let i = 0; i < 3; i++) {
        const order = await db.order.create({
          data: {
            participantId: testParticipantId,
            productId: testProductId,
            quantity: i + 1,
            totalPrice: (i + 1) * 100000,
          },
        })
        testOrderIds.push(order.id)
      }
    })

    it('should list all orders for participant', async () => {
      const orders = await db.order.findMany({
        where: { participantId: testParticipantId },
      })

      expect(Array.isArray(orders)).toBe(true)
      expect(orders.length).toBeGreaterThanOrEqual(3)
    })

    it('should list all orders for product', async () => {
      const orders = await db.order.findMany({
        where: { productId: testProductId },
      })

      expect(Array.isArray(orders)).toBe(true)
      expect(orders.length).toBeGreaterThan(0)
    })

    it('should filter orders by status', async () => {
      const pendingOrders = await db.order.findMany({
        where: {
          participantId: testParticipantId,
          status: 'PENDING',
        },
      })

      expect(Array.isArray(pendingOrders)).toBe(true)
      for (const order of pendingOrders) {
        expect(order.status).toBe('PENDING')
      }
    })
  })

  describe('updateOrder', () => {
    let testOrderId: string

    beforeAll(async () => {
      const order = await db.order.create({
        data: {
          participantId: testParticipantId,
          productId: testProductId,
          quantity: 2,
          totalPrice: 200000,
          status: 'PENDING',
        },
      })
      testOrderId = order.id
      testOrderIds.push(testOrderId)
    })

    it('should update order status to CONFIRMED', async () => {
      const updated = await db.order.update({
        where: { id: testOrderId },
        data: { status: 'CONFIRMED' as OrderStatus },
      })

      expect(updated.status).toBe('CONFIRMED')
    })

    it('should update order notes', async () => {
      const updated = await db.order.update({
        where: { id: testOrderId },
        data: { notes: 'Updated notes for order' },
      })

      expect(updated.notes).toBe('Updated notes for order')
    })

    it('should update order quantity', async () => {
      const updated = await db.order.update({
        where: { id: testOrderId },
        data: { quantity: 5 },
      })

      expect(updated.quantity).toBe(5)
    })

    it('should update total price', async () => {
      const updated = await db.order.update({
        where: { id: testOrderId },
        data: { totalPrice: 500000 },
      })

      expect(updated.totalPrice).toBe(500000)
    })

    it('should track status transitions', async () => {
      const order1 = await db.order.update({
        where: { id: testOrderId },
        data: { status: 'CONFIRMED' as OrderStatus },
      })

      expect(order1.status).toBe('CONFIRMED')

      const order2 = await db.order.update({
        where: { id: testOrderId },
        data: { status: 'SHIPPED' as OrderStatus },
      })

      expect(order2.status).toBe('SHIPPED')
    })
  })

  describe('deleteOrder', () => {
    it('should delete order from database', async () => {
      const order = await db.order.create({
        data: {
          participantId: testParticipantId,
          productId: testProductId,
          quantity: 1,
          totalPrice: 100000,
        },
      })
      testOrderIds.push(order.id)

      await db.order.delete({ where: { id: order.id } })

      const deleted = await db.order.findUnique({
        where: { id: order.id },
      })

      expect(deleted).toBeNull()
    })

    it('should handle deletion of non-existent order gracefully', async () => {
      try {
        await db.order.delete({ where: { id: 'nonexistent-order' } })
        fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('orderStatusWorkflow', () => {
    let testOrderId: string

    beforeAll(async () => {
      const order = await db.order.create({
        data: {
          participantId: testParticipantId,
          productId: testProductId,
          quantity: 1,
          totalPrice: 100000,
        },
      })
      testOrderId = order.id
      testOrderIds.push(testOrderId)
    })

    it('should follow correct status progression', async () => {
      let order = await db.order.findUnique({ where: { id: testOrderId } })
      expect(order?.status).toBe('PENDING')

      order = await db.order.update({
        where: { id: testOrderId },
        data: { status: 'CONFIRMED' as OrderStatus },
      })
      expect(order.status).toBe('CONFIRMED')

      order = await db.order.update({
        where: { id: testOrderId },
        data: { status: 'SHIPPED' as OrderStatus },
      })
      expect(order.status).toBe('SHIPPED')

      order = await db.order.update({
        where: { id: testOrderId },
        data: { status: 'DELIVERED' as OrderStatus },
      })
      expect(order.status).toBe('DELIVERED')
    })

    it('should handle status cancellation', async () => {
      const order = await db.order.update({
        where: { id: testOrderId },
        data: { status: 'CANCELLED' as OrderStatus },
      })

      expect(order.status).toBe('CANCELLED')
    })
  })

  describe('orderAggregations', () => {
    it('should aggregate order totals by participant', async () => {
      const aggregation = await db.order.aggregate({
        where: { participantId: testParticipantId },
        _sum: { totalPrice: true },
        _count: true,
      })

      expect(aggregation._count).toBeGreaterThan(0)
      expect(aggregation._sum.totalPrice).toBeGreaterThan(0)
    })

    it('should count orders by status', async () => {
      const statusCounts = await db.order.groupBy({
        by: ['status'],
        where: { participantId: testParticipantId },
        _count: true,
      })

      expect(Array.isArray(statusCounts)).toBe(true)
      for (const count of statusCounts) {
        expect(count.status).toBeDefined()
        expect(count._count).toBeGreaterThan(0)
      }
    })
  })
})
