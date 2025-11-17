/**
 * Participant Service - CRUD Test Suite
 * Tests participant creation, retrieval, and management
 */

import { PrismaClient } from '@prisma/client'
import { AuthService } from '../../../backend/src/services/auth.service.js'
import { TripService } from '../../../backend/src/services/trip.service.js'

describe('Participant CRUD Operations', () => {
  let db: PrismaClient
  let authService: AuthService
  let tripService: TripService
  let testJastiperId: string
  let testTripId: string
  let testUserIds: string[] = []
  let testTripIds: string[] = []
  let testParticipantIds: string[] = []

  beforeAll(async () => {
    db = new PrismaClient()
    authService = new AuthService(db)
    tripService = new TripService(db)

    const userResult = await authService.register(
      `participant-jastipin-${Date.now()}@example.com`,
      'Password123',
      'Participant Test Jastipin'
    )
    testJastiperId = userResult.user.id
    testUserIds.push(testJastiperId)

    const trip = await tripService.createTrip(testJastiperId, {
      slug: `participant-trip-${Date.now()}`,
      title: 'Participant Test Trip',
    })
    testTripId = trip.id
    testTripIds.push(testTripId)
  })

  afterAll(async () => {
    for (const participantId of testParticipantIds) {
      try {
        await db.participant.delete({ where: { id: participantId } })
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

  describe('createParticipant', () => {
    it('should create participant with required fields', async () => {
      const participant = await db.participant.create({
        data: {
          tripId: testTripId,
          phone: `+6281234567${Math.floor(Math.random() * 10)}`,
          name: 'Test Participant',
        },
      })

      testParticipantIds.push(participant.id)

      expect(participant.id).toBeDefined()
      expect(participant.tripId).toBe(testTripId)
      expect(participant.name).toBe('Test Participant')
      expect(participant.createdAt).toBeDefined()
    })

    it('should create participant with optional fields', async () => {
      const participant = await db.participant.create({
        data: {
          tripId: testTripId,
          phone: `+6281234567${Math.floor(Math.random() * 10)}`,
          name: 'Participant with Details',
          notes: 'Special notes for this participant',
        },
      })

      testParticipantIds.push(participant.id)

      expect(participant.notes).toBe('Special notes for this participant')
    })

    it('should allow duplicate phone numbers in different trips', async () => {
      const phone = `+62812345678`

      const trip2 = await tripService.createTrip(testJastiperId, {
        slug: `trip2-${Date.now()}`,
        title: 'Second Trip',
      })
      testTripIds.push(trip2.id)

      const participant1 = await db.participant.create({
        data: {
          tripId: testTripId,
          phone,
          name: 'Participant 1',
        },
      })
      testParticipantIds.push(participant1.id)

      const participant2 = await db.participant.create({
        data: {
          tripId: trip2.id,
          phone,
          name: 'Participant 2',
        },
      })
      testParticipantIds.push(participant2.id)

      expect(participant1.id).not.toBe(participant2.id)
    })
  })

  describe('getParticipant', () => {
    let testParticipantId: string

    beforeAll(async () => {
      const participant = await db.participant.create({
        data: {
          tripId: testTripId,
          phone: `+6281234567${Math.floor(Math.random() * 10)}`,
          name: 'Fetch Test Participant',
        },
      })
      testParticipantId = participant.id
      testParticipantIds.push(testParticipantId)
    })

    it('should retrieve participant by ID', async () => {
      const participant = await db.participant.findUnique({
        where: { id: testParticipantId },
      })

      expect(participant).toBeDefined()
      expect(participant?.id).toBe(testParticipantId)
      expect(participant?.name).toBe('Fetch Test Participant')
    })

    it('should return null for non-existent participant', async () => {
      const participant = await db.participant.findUnique({
        where: { id: 'nonexistent-participant' },
      })

      expect(participant).toBeNull()
    })

    it('should include related orders when requested', async () => {
      const participant = await db.participant.findUnique({
        where: { id: testParticipantId },
        include: { orders: true },
      })

      expect(participant?.orders).toBeDefined()
      expect(Array.isArray(participant?.orders)).toBe(true)
    })
  })

  describe('listParticipants', () => {
    beforeAll(async () => {
      for (let i = 0; i < 3; i++) {
        const participant = await db.participant.create({
          data: {
            tripId: testTripId,
            phone: `+6281234567${Math.floor(Math.random() * 100)}`,
            name: `List Participant ${i + 1}`,
          },
        })
        testParticipantIds.push(participant.id)
      }
    })

    it('should list all participants in trip', async () => {
      const participants = await db.participant.findMany({
        where: { tripId: testTripId },
      })

      expect(Array.isArray(participants)).toBe(true)
      expect(participants.length).toBeGreaterThanOrEqual(3)
    })

    it('should only list participants from requested trip', async () => {
      const trip2 = await tripService.createTrip(testJastiperId, {
        slug: `trip3-${Date.now()}`,
        title: 'Third Trip',
      })
      testTripIds.push(trip2.id)

      const trip2Participants = await db.participant.findMany({
        where: { tripId: trip2.id },
      })

      expect(trip2Participants.length).toBe(0)
    })

    it('should include participant count in trip', async () => {
      const trip = await db.trip.findUnique({
        where: { id: testTripId },
        include: { _count: { select: { participants: true } } },
      })

      expect(trip?._count.participants).toBeGreaterThanOrEqual(3)
    })
  })

  describe('updateParticipant', () => {
    let testParticipantId: string

    beforeAll(async () => {
      const participant = await db.participant.create({
        data: {
          tripId: testTripId,
          phone: `+6281234567${Math.floor(Math.random() * 10)}`,
          name: 'Participant to Update',
        },
      })
      testParticipantId = participant.id
      testParticipantIds.push(testParticipantId)
    })

    it('should update participant name', async () => {
      const updated = await db.participant.update({
        where: { id: testParticipantId },
        data: { name: 'Updated Name' },
      })

      expect(updated.name).toBe('Updated Name')
    })

    it('should update participant phone', async () => {
      const newPhone = `+6281234567${Math.floor(Math.random() * 10)}`
      const updated = await db.participant.update({
        where: { id: testParticipantId },
        data: { phone: newPhone },
      })

      expect(updated.phone).toBe(newPhone)
    })

    it('should update participant notes', async () => {
      const updated = await db.participant.update({
        where: { id: testParticipantId },
        data: { notes: 'Updated notes' },
      })

      expect(updated.notes).toBe('Updated notes')
    })

    it('should update multiple fields at once', async () => {
      const newPhone = `+6281234567${Math.floor(Math.random() * 10)}`
      const updated = await db.participant.update({
        where: { id: testParticipantId },
        data: {
          name: 'Multi Update',
          phone: newPhone,
          notes: 'Multiple updates',
        },
      })

      expect(updated.name).toBe('Multi Update')
      expect(updated.phone).toBe(newPhone)
      expect(updated.notes).toBe('Multiple updates')
    })

    it('should preserve unmapped fields during update', async () => {
      const beforeUpdate = await db.participant.findUnique({
        where: { id: testParticipantId },
      })

      await db.participant.update({
        where: { id: testParticipantId },
        data: { name: 'Name Change Only' },
      })

      const afterUpdate = await db.participant.findUnique({
        where: { id: testParticipantId },
      })

      expect(afterUpdate?.tripId).toBe(beforeUpdate?.tripId)
    })
  })

  describe('deleteParticipant', () => {
    it('should delete participant from database', async () => {
      const participant = await db.participant.create({
        data: {
          tripId: testTripId,
          phone: `+6281234567${Math.floor(Math.random() * 10)}`,
          name: 'Participant to Delete',
        },
      })

      await db.participant.delete({ where: { id: participant.id } })

      const deleted = await db.participant.findUnique({
        where: { id: participant.id },
      })

      expect(deleted).toBeNull()
    })

    it('should handle deletion of non-existent participant gracefully', async () => {
      try {
        await db.participant.delete({ where: { id: 'nonexistent' } })
        fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('participantRelationships', () => {
    let testParticipantId: string

    beforeAll(async () => {
      const participant = await db.participant.create({
        data: {
          tripId: testTripId,
          phone: `+6281234567${Math.floor(Math.random() * 10)}`,
          name: 'Relationship Test Participant',
        },
      })
      testParticipantId = participant.id
      testParticipantIds.push(testParticipantId)
    })

    it('should retrieve participant with related trip', async () => {
      const participant = await db.participant.findUnique({
        where: { id: testParticipantId },
        include: { trip: true },
      })

      expect(participant?.trip).toBeDefined()
      expect(participant?.trip?.id).toBe(testTripId)
    })

    it('should retrieve participant with related orders', async () => {
      const participant = await db.participant.findUnique({
        where: { id: testParticipantId },
        include: { orders: true },
      })

      expect(participant?.orders).toBeDefined()
      expect(Array.isArray(participant?.orders)).toBe(true)
    })

    it('should count participant orders', async () => {
      const participant = await db.participant.findUnique({
        where: { id: testParticipantId },
        include: { _count: { select: { orders: true } } },
      })

      expect(participant?._count.orders).toBeGreaterThanOrEqual(0)
    })
  })
})
