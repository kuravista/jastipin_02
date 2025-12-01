/**
 * Participant Management Routes
 * POST /trips/:tripId/participants - Join trip
 * GET /trips/:tripId/participants - List participants
 * DELETE /trips/:tripId/participants/:participantId - Remove participant
 */

import { Router, Response, Router as ExpressRouter } from 'express'
import db from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { joinTripSchema } from '../utils/validators.js'
import { AuthRequest } from '../types/index.js'

const router: ExpressRouter = Router()

/**
 * POST /trips/:tripId/participants
 * Join trip as participant with phone and name
 */
router.post(
  '/trips/:tripId/participants',
  authMiddleware,
  validate(joinTripSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const trip = await db.trip.findUnique({
        where: { id: req.params.tripId },
      })

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' })
        return
      }

      // Check if participant already exists
      const existingParticipant = await db.participant.findUnique({
        where: {
          tripId_phone: {
            tripId: req.params.tripId,
            phone: req.body.phone,
          },
        },
      })

      if (existingParticipant) {
        res.status(409).json({ error: 'Participant already joined this trip' })
        return
      }

      const participant = await db.participant.create({
        data: {
          tripId: req.params.tripId,
          ...req.body,
        },
      })

      res.status(201).json(participant)
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to join trip' })
    }
  }
)

/**
 * GET /trips/:tripId/participants
 * List all participants in trip
 */
router.get(
  '/trips/:tripId/participants',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const participants = await db.participant.findMany({
        where: { tripId: req.params.tripId },
        include: { _count: { select: { Order: true } } },
        orderBy: { createdAt: 'asc' },
      })

      res.json(participants)
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch participants' })
    }
  }
)

/**
 * GET /trips/:tripId/participants/:phone
 * Get participant by phone number
 */
router.get(
  '/trips/:tripId/participants/:phone',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const participant = await db.participant.findUnique({
        where: {
          tripId_phone: {
            tripId: req.params.tripId,
            phone: req.params.phone,
          },
        },
        include: { Order: true },
      })

      if (!participant) {
        res.status(404).json({ error: 'Participant not found' })
        return
      }

      res.json(participant)
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch participant' })
    }
  }
)

/**
 * DELETE /trips/:tripId/participants/:participantId
 * Remove participant from trip (trip owner only)
 */
router.delete(
  '/trips/:tripId/participants/:participantId',
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

      await db.participant.delete({
        where: { id: req.params.participantId },
      })

      res.json({ message: 'Participant removed successfully' })
    } catch (error: any) {
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Participant not found' })
        return
      }
      res.status(500).json({ error: 'Failed to remove participant' })
    }
  }
)

export default router
