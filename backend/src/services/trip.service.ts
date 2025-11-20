/**
 * Trip Service - Trip CRUD Operations
 * Manages trip creation, retrieval, updates, and deletion
 */

import { PrismaClient } from '@prisma/client'
import { ApiError } from '../types/index.js'

export class TripService {
  constructor(private db: PrismaClient) {}

  /**
   * Create new trip for user
   * @param jastiperId - User ID creating the trip
   * @param data - Trip creation data
   * @returns Created trip
   */
  async createTrip(
    jastiperId: string,
    data: {
      slug: string
      title: string
      description?: string
      url_img?: string
      startDate?: Date
      deadline?: Date
      isActive?: boolean
      paymentType?: 'full' | 'dp'
      dpPercentage?: number
    }
  ) {
    // Check unique slug per user
    const existing = await this.db.trip.findUnique({
      where: {
        jastiperId_slug: { jastiperId, slug: data.slug },
      },
    })

    if (existing) {
      const error: ApiError = {
        status: 409,
        message: 'Trip slug already exists for this user',
      }
      throw error
    }

    return this.db.trip.create({
      data: {
        jastiperId,
        slug: data.slug,
        title: data.title,
        description: data.description,
        url_img: data.url_img,
        startDate: data.startDate,
        deadline: data.deadline,
        isActive: data.isActive,
        paymentType: data.paymentType || 'full', // NEW: Support DP payment type
        dpPercentage: data.dpPercentage || 20, // NEW: DP percentage (default 20%)
      },
    })
  }

  /**
   * Get trip details with related data
   * @param tripId - Trip ID
   * @returns Trip with products and participants
   */
  async getTrip(tripId: string) {
    const trip = await this.db.trip.findUnique({
      where: { id: tripId },
      include: {
        User: {
          select: {
            id: true,
            slug: true,
            profileName: true,
            avatar: true,
          },
        },
        Product: true,
        Participant: true,
        _count: {
          select: { Participant: true, Product: true },
        },
      },
    })

    if (!trip) {
      const error: ApiError = {
        status: 404,
        message: 'Trip not found',
      }
      throw error
    }

    return trip
  }

  /**
   * Get all trips for a user
   * @param jastiperId - User ID
   * @returns List of user's trips
   */
  async getUserTrips(jastiperId: string) {
    // First, update status of trips that have passed deadline
    // We do this lazily when fetching to keep data consistent without cron jobs
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Compare dates without time for simplicity, or keep time if precise

    // Update isActive = false where deadline < now and currently active
    // Note: Prisma doesn't support updateMany with join or complex conditions easily in one go 
    // if we wanted to be very precise, but for simple deadline check it works.
    // However, deadline usually means "last order date".
    // If deadline < now, trip is closed for orders.
    
    await this.db.trip.updateMany({
      where: {
        jastiperId,
        isActive: true,
        deadline: {
          lt: now,
          not: null // Only expire if deadline is set (not null)
        }
      },
      data: {
        isActive: false
      }
    })

    return this.db.trip.findMany({
      where: { jastiperId },
      include: {
        _count: {
          select: {
            Participant: true,
            Product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Update trip (ownership check required in route)
   * @param tripId - Trip ID
   * @param data - Trip update data
   * @returns Updated trip
   */
  async updateTrip(
    tripId: string,
    data: {
      title?: string
      description?: string
      startDate?: Date
      deadline?: Date
      isActive?: boolean
      url_img?: string
      paymentType?: 'full' | 'dp'
      dpPercentage?: number
    }
  ) {
    return this.db.trip.update({
      where: { id: tripId },
      data,
      include: {
        _count: {
          select: {
            Participant: true,
            Product: true,
          },
        },
      },
    })
  }

  /**
   * Delete trip (ownership check required in route)
   * @param tripId - Trip ID
   * @returns Deleted trip
   */
  async deleteTrip(tripId: string) {
    return this.db.trip.delete({
      where: { id: tripId },
    })
  }

  /**
   * Verify user owns trip
   * @param tripId - Trip ID
   * @param userId - User ID
   * @returns True if user owns trip
   */
  async verifyTripOwnership(tripId: string, userId: string): Promise<boolean> {
    const trip = await this.db.trip.findUnique({
      where: { id: tripId },
      select: { jastiperId: true },
    })

    return trip?.jastiperId === userId
  }
}
