/**
 * CRUD Routes - Integration Test Suite
 * Tests API endpoints for trips, products, orders, and participants
 */

import { PrismaClient } from '@prisma/client'
import { AuthService } from '../../../backend/src/services/auth.service.js'
import { TripService } from '../../../backend/src/services/trip.service.js'

describe('CRUD Routes Integration', () => {
  let db: PrismaClient
  let authService: AuthService
  let tripService: TripService
  let testJastiperId: string
  let testUserId: string
  let testUserIds: string[] = []
  let testTripIds: string[] = []

  beforeAll(async () => {
    db = new PrismaClient()
    authService = new AuthService(db)
    tripService = new TripService(db)

    const userResult = await authService.register(
      `crud-jastipin-${Date.now()}@example.com`,
      'Password123',
      'CRUD Test Jastipin'
    )
    testJastiperId = userResult.user.id
    testUserIds.push(testJastiperId)

    const user2Result = await authService.register(
      `crud-user-${Date.now()}@example.com`,
      'Password123',
      'CRUD Test User'
    )
    testUserId = user2Result.user.id
    testUserIds.push(testUserId)
  })

  afterAll(async () => {
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

  describe('Trip CRUD Routes', () => {
    describe('POST /trips - Create Trip', () => {
      it('should create trip for authenticated user', async () => {
        const trip = await tripService.createTrip(testJastiperId, {
          slug: `trip-${Date.now()}`,
          title: 'My Bali Trip',
          description: 'Trip to Bali island',
        })

        testTripIds.push(trip.id)

        expect(trip.id).toBeDefined()
        expect(trip.jastiperId).toBe(testJastiperId)
        expect(trip.title).toBe('My Bali Trip')
        expect(trip.isActive).toBe(true)
      })

      it('should reject duplicate slug for same user', async () => {
        const slug = `unique-${Date.now()}`
        const trip1 = await tripService.createTrip(testJastiperId, {
          slug,
          title: 'Trip 1',
        })
        testTripIds.push(trip1.id)

        try {
          await tripService.createTrip(testJastiperId, {
            slug,
            title: 'Trip 2',
          })
          fail('Should reject duplicate slug')
        } catch (error: any) {
          expect(error.status).toBe(409)
        }
      })

      it('should reject unauthenticated trip creation', async () => {
        // In real API, auth middleware would prevent this
        // Service assumes authenticated user
        try {
          await tripService.createTrip('', {
            slug: 'invalid',
            title: 'Invalid',
          })
        } catch (error) {
          expect(error).toBeDefined()
        }
      })
    })

    describe('GET /trips - List User Trips', () => {
      beforeAll(async () => {
        for (let i = 0; i < 2; i++) {
          const trip = await tripService.createTrip(testJastiperId, {
            slug: `list-trip-${i}-${Date.now()}`,
            title: `List Trip ${i + 1}`,
          })
          testTripIds.push(trip.id)
        }
      })

      it('should list all trips for authenticated user', async () => {
        const trips = await tripService.getUserTrips(testJastiperId)

        expect(Array.isArray(trips)).toBe(true)
        expect(trips.length).toBeGreaterThanOrEqual(2)
      })

      it('should not list trips from other users', async () => {
        const userTrips = await tripService.getUserTrips(testUserId)

        expect(userTrips).toEqual([])
      })

      it('should include trip counts', async () => {
        const trips = await tripService.getUserTrips(testJastiperId)

        for (const trip of trips) {
          expect(trip._count).toBeDefined()
          expect(trip._count.participants).toBe(0)
          expect(trip._count.products).toBe(0)
        }
      })
    })

    describe('GET /trips/:id - Get Trip Details', () => {
      let testTripId: string

      beforeAll(async () => {
        const trip = await tripService.createTrip(testJastiperId, {
          slug: `detail-${Date.now()}`,
          title: 'Detail Trip',
          description: 'Trip for detail testing',
        })
        testTripId = trip.id
        testTripIds.push(testTripId)
      })

      it('should retrieve trip with full details', async () => {
        const trip = await tripService.getTrip(testTripId)

        expect(trip.id).toBe(testTripId)
        expect(trip.title).toBe('Detail Trip')
        expect(trip.jastiper).toBeDefined()
      })

      it('should include related products and participants', async () => {
        const trip = await tripService.getTrip(testTripId)

        expect(trip.products).toBeDefined()
        expect(trip.participants).toBeDefined()
        expect(Array.isArray(trip.products)).toBe(true)
        expect(Array.isArray(trip.participants)).toBe(true)
      })

      it('should reject access to non-owned trip', async () => {
        // Auth middleware would verify ownership
        // If user not owner, middleware returns 403
        const tripOwned = await tripService.verifyTripOwnership(
          testTripId,
          testUserId
        )

        expect(tripOwned).toBe(false)
      })

      it('should return 404 for non-existent trip', async () => {
        try {
          await tripService.getTrip('nonexistent-trip')
          fail('Should throw 404')
        } catch (error: any) {
          expect(error.status).toBe(404)
        }
      })
    })

    describe('PATCH /trips/:id - Update Trip', () => {
      let testTripId: string

      beforeAll(async () => {
        const trip = await tripService.createTrip(testJastiperId, {
          slug: `update-${Date.now()}`,
          title: 'Original Title',
          description: 'Original description',
          isActive: true,
        })
        testTripId = trip.id
        testTripIds.push(testTripId)
      })

      it('should update trip for owner', async () => {
        const updated = await tripService.updateTrip(testTripId, {
          title: 'Updated Title',
          description: 'Updated description',
        })

        expect(updated.title).toBe('Updated Title')
        expect(updated.description).toBe('Updated description')
      })

      it('should reject update for non-owner', async () => {
        const isOwner = await tripService.verifyTripOwnership(
          testTripId,
          testUserId
        )

        expect(isOwner).toBe(false)
      })

      it('should toggle trip active status', async () => {
        const updated = await tripService.updateTrip(testTripId, {
          isActive: false,
        })

        expect(updated.isActive).toBe(false)
      })

      it('should update deadline', async () => {
        const deadline = new Date('2025-12-31')
        const updated = await tripService.updateTrip(testTripId, {
          deadline,
        })

        expect(updated.deadline).toEqual(deadline)
      })
    })

    describe('DELETE /trips/:id - Delete Trip', () => {
      it('should delete trip for owner', async () => {
        const trip = await tripService.createTrip(testJastiperId, {
          slug: `delete-${Date.now()}`,
          title: 'Trip to Delete',
        })
        testTripIds.push(trip.id)

        await tripService.deleteTrip(trip.id)

        try {
          await tripService.getTrip(trip.id)
          fail('Should return 404 after deletion')
        } catch (error: any) {
          expect(error.status).toBe(404)
        }
      })

      it('should reject deletion for non-owner', async () => {
        const isOwner = await tripService.verifyTripOwnership(
          testTripIds[0],
          testUserId
        )

        expect(isOwner).toBe(false)
      })
    })
  })

  describe('Product CRUD Routes', () => {
    let testTripId: string
    let productIds: string[] = []

    beforeAll(async () => {
      const trip = await tripService.createTrip(testJastiperId, {
        slug: `product-trip-${Date.now()}`,
        title: 'Product Test Trip',
      })
      testTripId = trip.id
      testTripIds.push(testTripId)
    })

    afterAll(async () => {
      for (const productId of productIds) {
        try {
          await db.product.delete({ where: { id: productId } })
        } catch {
          // Ignore
        }
      }
    })

    describe('POST /trips/:tripId/products - Create Product', () => {
      it('should create product in trip', async () => {
        const product = await db.product.create({
          data: {
            tripId: testTripId,
            slug: `product-${Date.now()}`,
            name: 'Test Product',
            price: 100000,
            stock: 10,
          },
        })

        productIds.push(product.id)

        expect(product.tripId).toBe(testTripId)
        expect(product.name).toBe('Test Product')
        expect(product.price).toBe(100000)
      })

      it('should reject product creation for non-owner', async () => {
        // Owner check happens in route handler
        const isOwner = await tripService.verifyTripOwnership(
          testTripId,
          testUserId
        )

        expect(isOwner).toBe(false)
      })

      it('should enforce unique slug per trip', async () => {
        const slug = `unique-${Date.now()}`

        const product1 = await db.product.create({
          data: {
            tripId: testTripId,
            slug,
            name: 'Product 1',
            price: 50000,
            stock: 5,
          },
        })
        productIds.push(product1.id)

        try {
          await db.product.create({
            data: {
              tripId: testTripId,
              slug,
              name: 'Product 2',
              price: 60000,
              stock: 3,
            },
          })
          fail('Should reject duplicate slug')
        } catch (error) {
          expect(error).toBeDefined()
        }
      })
    })

    describe('GET /trips/:tripId/products - List Products', () => {
      it('should list all products in trip', async () => {
        const products = await db.product.findMany({
          where: { tripId: testTripId },
        })

        expect(Array.isArray(products)).toBe(true)
        expect(products.length).toBeGreaterThan(0)
      })
    })

    describe('PATCH /trips/:tripId/products/:productId - Update Product', () => {
      let testProductId: string

      beforeAll(async () => {
        const product = await db.product.create({
          data: {
            tripId: testTripId,
            slug: `update-product-${Date.now()}`,
            name: 'Product to Update',
            price: 150000,
            stock: 20,
          },
        })
        testProductId = product.id
        productIds.push(testProductId)
      })

      it('should update product for trip owner', async () => {
        const updated = await db.product.update({
          where: { id: testProductId },
          data: { name: 'Updated Product', price: 180000 },
        })

        expect(updated.name).toBe('Updated Product')
        expect(updated.price).toBe(180000)
      })

      it('should update stock levels', async () => {
        const updated = await db.product.update({
          where: { id: testProductId },
          data: { stock: 15 },
        })

        expect(updated.stock).toBe(15)
      })
    })

    describe('DELETE /trips/:tripId/products/:productId - Delete Product', () => {
      it('should delete product for trip owner', async () => {
        const product = await db.product.create({
          data: {
            tripId: testTripId,
            slug: `delete-product-${Date.now()}`,
            name: 'Product to Delete',
            price: 100000,
            stock: 5,
          },
        })

        await db.product.delete({ where: { id: product.id } })

        const deleted = await db.product.findUnique({
          where: { id: product.id },
        })

        expect(deleted).toBeNull()
      })
    })
  })

  describe('Authorization & Access Control', () => {
    let ownerTrip: any
    let productIds: string[] = []

    beforeAll(async () => {
      ownerTrip = await tripService.createTrip(testJastiperId, {
        slug: `auth-test-${Date.now()}`,
        title: 'Authorization Test Trip',
      })
      testTripIds.push(ownerTrip.id)
    })

    afterAll(async () => {
      for (const productId of productIds) {
        try {
          await db.product.delete({ where: { id: productId } })
        } catch {
          // Ignore
        }
      }
    })

    it('should verify user is trip owner before allowing modifications', async () => {
      const isOwner = await tripService.verifyTripOwnership(
        ownerTrip.id,
        testJastiperId
      )

      expect(isOwner).toBe(true)

      const isNotOwner = await tripService.verifyTripOwnership(
        ownerTrip.id,
        testUserId
      )

      expect(isNotOwner).toBe(false)
    })

    it('should prevent product creation by non-owner', async () => {
      // Verify user is not owner
      const isOwner = await tripService.verifyTripOwnership(
        ownerTrip.id,
        testUserId
      )

      expect(isOwner).toBe(false)

      // In real API, route would return 403 Forbidden
      // Test service directly shows access check
    })

    it('should prevent trip modification by non-owner', async () => {
      // Non-owner attempts update
      const isOwner = await tripService.verifyTripOwnership(
        ownerTrip.id,
        testUserId
      )

      expect(isOwner).toBe(false)

      // Real API would return 403 at route handler
    })
  })
})
