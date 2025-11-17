/**
 * Trip Service - Comprehensive CRUD Test Suite
 * Tests trip creation, retrieval, updates, and deletion
 */

import { PrismaClient } from '@prisma/client'
import { TripService } from '../../../backend/src/services/trip.service.js'
import { AuthService } from '../../../backend/src/services/auth.service.js'
import { ApiError } from '../../../backend/src/types/index.js'

describe('TripService', () => {
  let tripService: TripService
  let authService: AuthService
  let db: PrismaClient
  let testJastiperId: string
  let testTripIds: string[] = []
  let testUserIds: string[] = []

  beforeAll(async () => {
    db = new PrismaClient()
    tripService = new TripService(db)
    authService = new AuthService(db)

    const userResult = await authService.register(
      `jastipin-${Date.now()}@example.com`,
      'Password123',
      'Test Jastipin'
    )
    testJastiperId = userResult.user.id
    testUserIds.push(testJastiperId)
  })

  afterAll(async () => {
    for (const tripId of testTripIds) {
      try {
        await db.trip.delete({ where: { id: tripId } })
      } catch {
        // Ignore if already deleted
      }
    }

    for (const userId of testUserIds) {
      try {
        await db.user.delete({ where: { id: userId } })
      } catch {
        // Ignore if already deleted
      }
    }

    await db.$disconnect()
  })

  describe('createTrip', () => {
    it('should create new trip with required fields', async () => {
      const trip = await tripService.createTrip(testJastiperId, {
        slug: `trip-${Date.now()}`,
        title: 'My Trip to Japan',
      })

      testTripIds.push(trip.id)

      expect(trip.id).toBeDefined()
      expect(trip.jastiperId).toBe(testJastiperId)
      expect(trip.title).toBe('My Trip to Japan')
      expect(trip.slug).toBe(`trip-${Date.now()}`)
      expect(trip.isActive).toBe(true)
      expect(trip.createdAt).toBeDefined()
    })

    it('should create trip with optional fields', async () => {
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const trip = await tripService.createTrip(testJastiperId, {
        slug: `trip2-${Date.now()}`,
        title: 'Trip with Description',
        description: 'This is a detailed trip description',
        deadline,
        isActive: false,
      })

      testTripIds.push(trip.id)

      expect(trip.description).toBe('This is a detailed trip description')
      expect(trip.deadline).toEqual(deadline)
      expect(trip.isActive).toBe(false)
    })

    it('should reject duplicate slug for same user', async () => {
      const slug = `unique-${Date.now()}`
      await tripService.createTrip(testJastiperId, {
        slug,
        title: 'First Trip',
      })

      try {
        await tripService.createTrip(testJastiperId, {
          slug,
          title: 'Duplicate Slug Trip',
        })
        fail('Should have thrown error')
      } catch (error) {
        const apiError = error as ApiError
        expect(apiError.status).toBe(409)
        expect(apiError.message).toContain('already exists')
      }
    })

    it('should allow same slug for different users', async () => {
      const slug = `shared-slug-${Date.now()}`

      const trip1 = await tripService.createTrip(testJastiperId, {
        slug,
        title: 'User 1 Trip',
      })
      testTripIds.push(trip1.id)

      const user2Result = await authService.register(
        `user2-${Date.now()}@example.com`,
        'Password123',
        'User 2'
      )
      testUserIds.push(user2Result.user.id)

      const trip2 = await tripService.createTrip(user2Result.user.id, {
        slug,
        title: 'User 2 Trip',
      })
      testTripIds.push(trip2.id)

      expect(trip1.id).not.toBe(trip2.id)
    })

    it('should set default values for optional fields', async () => {
      const trip = await tripService.createTrip(testJastiperId, {
        slug: `default-${Date.now()}`,
        title: 'Default Values Trip',
      })

      testTripIds.push(trip.id)

      expect(trip.description).toBeNull()
      expect(trip.deadline).toBeNull()
      expect(trip.isActive).toBe(true)
    })
  })

  describe('getTrip', () => {
    let testTripId: string

    beforeAll(async () => {
      const trip = await tripService.createTrip(testJastiperId, {
        slug: `fetch-${Date.now()}`,
        title: 'Trip to Fetch',
        description: 'Test trip for fetching',
      })
      testTripId = trip.id
      testTripIds.push(testTripId)
    })

    it('should retrieve trip with all related data', async () => {
      const trip = await tripService.getTrip(testTripId)

      expect(trip.id).toBe(testTripId)
      expect(trip.title).toBe('Trip to Fetch')
      expect(trip.jastiper).toBeDefined()
      expect(trip.jastiper.id).toBe(testJastiperId)
      expect(trip.products).toBeDefined()
      expect(trip.participants).toBeDefined()
      expect(trip._count).toBeDefined()
    })

    it('should include count of related entities', async () => {
      const trip = await tripService.getTrip(testTripId)

      expect(trip._count).toHaveProperty('participants')
      expect(trip._count).toHaveProperty('products')
      expect(trip._count).toHaveProperty('orders')
      expect(typeof trip._count.participants).toBe('number')
    })

    it('should reject non-existent trip ID', async () => {
      try {
        await tripService.getTrip('nonexistent-trip-id')
        fail('Should have thrown error')
      } catch (error) {
        const apiError = error as ApiError
        expect(apiError.status).toBe(404)
        expect(apiError.message).toContain('Trip not found')
      }
    })
  })

  describe('getUserTrips', () => {
    beforeAll(async () => {
      for (let i = 0; i < 3; i++) {
        const trip = await tripService.createTrip(testJastiperId, {
          slug: `user-trip-${i}-${Date.now()}`,
          title: `User Trip ${i + 1}`,
        })
        testTripIds.push(trip.id)
      }
    })

    it('should retrieve all trips for user', async () => {
      const trips = await tripService.getUserTrips(testJastiperId)

      expect(Array.isArray(trips)).toBe(true)
      expect(trips.length).toBeGreaterThanOrEqual(3)
    })

    it('should only retrieve trips for requested user', async () => {
      const user2Result = await authService.register(
        `other-${Date.now()}@example.com`,
        'Password123',
        'Other User'
      )
      testUserIds.push(user2Result.user.id)

      const user2Trips = await tripService.getUserTrips(user2Result.user.id)

      expect(user2Trips.length).toBe(0)
    })

    it('should return trips sorted by creation date descending', async () => {
      const trips = await tripService.getUserTrips(testJastiperId)

      for (let i = 0; i < trips.length - 1; i++) {
        expect(trips[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          trips[i + 1].createdAt.getTime()
        )
      }
    })

    it('should include entity counts for each trip', async () => {
      const trips = await tripService.getUserTrips(testJastiperId)

      for (const trip of trips) {
        expect(trip._count).toBeDefined()
        expect(trip._count).toHaveProperty('participants')
        expect(trip._count).toHaveProperty('products')
        expect(trip._count).toHaveProperty('orders')
      }
    })

    it('should return empty array for user with no trips', async () => {
      const user3Result = await authService.register(
        `notrips-${Date.now()}@example.com`,
        'Password123',
        'No Trips User'
      )
      testUserIds.push(user3Result.user.id)

      const trips = await tripService.getUserTrips(user3Result.user.id)

      expect(trips).toEqual([])
    })
  })

  describe('updateTrip', () => {
    let testTripId: string

    beforeAll(async () => {
      const trip = await tripService.createTrip(testJastiperId, {
        slug: `update-${Date.now()}`,
        title: 'Trip to Update',
        isActive: true,
      })
      testTripId = trip.id
      testTripIds.push(testTripId)
    })

    it('should update trip title', async () => {
      const updated = await tripService.updateTrip(testTripId, {
        title: 'Updated Title',
      })

      expect(updated.title).toBe('Updated Title')
    })

    it('should update trip description', async () => {
      const updated = await tripService.updateTrip(testTripId, {
        description: 'Updated description text',
      })

      expect(updated.description).toBe('Updated description text')
    })

    it('should update trip deadline', async () => {
      const newDeadline = new Date('2025-12-31')
      const updated = await tripService.updateTrip(testTripId, {
        deadline: newDeadline,
      })

      expect(updated.deadline).toEqual(newDeadline)
    })

    it('should update trip active status', async () => {
      const updated = await tripService.updateTrip(testTripId, {
        isActive: false,
      })

      expect(updated.isActive).toBe(false)
    })

    it('should update multiple fields', async () => {
      const newDeadline = new Date('2025-06-30')
      const updated = await tripService.updateTrip(testTripId, {
        title: 'Multi Update',
        description: 'Multiple fields updated',
        deadline: newDeadline,
        isActive: true,
      })

      expect(updated.title).toBe('Multi Update')
      expect(updated.description).toBe('Multiple fields updated')
      expect(updated.deadline).toEqual(newDeadline)
      expect(updated.isActive).toBe(true)
    })

    it('should preserve other fields when updating', async () => {
      const trip = await tripService.getTrip(testTripId)
      const originalSlug = trip.slug
      const originalJastiperId = trip.jastiperId

      await tripService.updateTrip(testTripId, { title: 'Preserved Test' })

      const updated = await tripService.getTrip(testTripId)
      expect(updated.slug).toBe(originalSlug)
      expect(updated.jastiperId).toBe(originalJastiperId)
    })
  })

  describe('deleteTrip', () => {
    it('should delete trip and remove from database', async () => {
      const trip = await tripService.createTrip(testJastiperId, {
        slug: `delete-${Date.now()}`,
        title: 'Trip to Delete',
      })
      testTripIds.push(trip.id)

      await tripService.deleteTrip(trip.id)

      try {
        await tripService.getTrip(trip.id)
        fail('Should have thrown error after deletion')
      } catch (error) {
        const apiError = error as ApiError
        expect(apiError.status).toBe(404)
      }
    })

    it('should reject deletion of non-existent trip', async () => {
      try {
        await tripService.deleteTrip('nonexistent-trip')
        fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('verifyTripOwnership', () => {
    let testTripId: string

    beforeAll(async () => {
      const trip = await tripService.createTrip(testJastiperId, {
        slug: `ownership-${Date.now()}`,
        title: 'Ownership Test Trip',
      })
      testTripId = trip.id
      testTripIds.push(testTripId)
    })

    it('should verify ownership for trip owner', async () => {
      const isOwner = await tripService.verifyTripOwnership(
        testTripId,
        testJastiperId
      )

      expect(isOwner).toBe(true)
    })

    it('should reject ownership for non-owner', async () => {
      const user2Result = await authService.register(
        `other-user-${Date.now()}@example.com`,
        'Password123',
        'Other User'
      )
      testUserIds.push(user2Result.user.id)

      const isOwner = await tripService.verifyTripOwnership(
        testTripId,
        user2Result.user.id
      )

      expect(isOwner).toBe(false)
    })

    it('should return false for non-existent trip', async () => {
      const isOwner = await tripService.verifyTripOwnership(
        'nonexistent-trip',
        testJastiperId
      )

      expect(isOwner).toBe(false)
    })
  })
})
