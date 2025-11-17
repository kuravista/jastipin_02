/**
 * Checkout Service
 * Handles order processing and checkout logic
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

export interface CheckoutItem {
  productId: string
  quantity: number
  notes?: string
}

export interface CheckoutRequest {
  tripId: string
  participantName?: string
  participantEmail?: string
  participantPhone: string
  participantAddress?: string
  items: CheckoutItem[]
}

export interface CheckoutResponse {
  success: boolean
  orders?: any[]
  error?: string
  details?: {
    totalItems: number
    totalPrice: number
    itemsProcessed: number
  }
}

/**
 * Process checkout for a participant
 * Validates items, reserves stock, and creates orders
 */
export async function processCheckout(
  request: CheckoutRequest
): Promise<CheckoutResponse> {
  try {
    // Validate trip exists
    const trip = await db.trip.findUnique({
      where: { id: request.tripId },
    })

    if (!trip) {
      return {
        success: false,
        error: 'Trip not found',
      }
    }

    // Ensure phone number has 62 prefix
    const normalizedPhone = request.participantPhone.startsWith('62') 
      ? request.participantPhone 
      : `62${request.participantPhone}`

    // Get or create participant
    let participant = await db.participant.findFirst({
      where: {
        tripId: request.tripId,
        phone: normalizedPhone,
      },
    })

    if (!participant) {
      participant = await db.participant.create({
        data: {
          tripId: request.tripId,
          phone: normalizedPhone,
          name: request.participantName || 'Participant',
          email: request.participantEmail,
          address: request.participantAddress,
        },
      })
    } else {
      // Update existing participant with new info if provided
      participant = await db.participant.update({
        where: { id: participant.id },
        data: {
          name: request.participantName || participant.name,
          email: request.participantEmail || participant.email,
          address: request.participantAddress || participant.address,
        },
      })
    }

    // Validate items array is not empty
    if (!request.items || request.items.length === 0) {
      return {
        success: false,
        error: 'No items in checkout',
      }
    }

    // Validate and collect all products
    const products = await Promise.all(
      request.items.map((item) =>
        db.product.findUnique({
          where: { id: item.productId },
        })
      )
    )

    // Check for missing or invalid products
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const item = request.items[i]

      if (!product) {
        return {
          success: false,
          error: `Product not found: ${item.productId}`,
        }
      }

      if (product.tripId !== request.tripId) {
        return {
          success: false,
          error: `Product not in this trip: ${product.id}`,
        }
      }

      if (product.stock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for product "${product.title}". Available: ${product.stock}, Requested: ${item.quantity}`,
        }
      }
    }

    // Create orders in transaction
    const orders: any[] = []
    let totalPrice = 0

    for (const item of request.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        continue
      }

      const itemTotalPrice = product.price * item.quantity
      totalPrice += itemTotalPrice

      const order = await db.order.create({
        data: {
          participantId: participant.id,
          productId: item.productId,
          quantity: item.quantity,
          totalPrice: itemTotalPrice,
          notes: item.notes,
          status: 'pending',
        },
        include: {
          participant: true,
          product: true,
        },
      })

      orders.push(order)
    }

    return {
      success: true,
      orders,
      details: {
        totalItems: request.items.length,
        totalPrice,
        itemsProcessed: orders.length,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Checkout processing failed',
    }
  }
}

/**
 * Get checkout summary for a participant
 */
export async function getCheckoutSummary(
  tripId: string,
  participantPhone: string
) {
  try {
    const participant = await db.participant.findFirst({
      where: {
        tripId,
        phone: participantPhone,
      },
      include: {
        orders: {
          include: {
            product: true,
          },
          where: {
            status: 'pending',
          },
        },
      },
    })

    if (!participant) {
      return null
    }

    const totalPrice = participant.orders.reduce((sum: number, order: any) => {
      return sum + order.totalPrice
    }, 0)

    return {
      participant: {
        id: participant.id,
        name: participant.name,
        phone: participant.phone,
        email: participant.email,
        address: participant.address,
      },
      orders: participant.orders.map((order: any) => ({
        id: order.id,
        productTitle: order.product.title,
        quantity: order.quantity,
        unitPrice: order.product.price,
        totalPrice: order.totalPrice,
        notes: order.notes,
      })),
      summary: {
        totalItems: participant.orders.reduce(
          (sum: number, order: any) => sum + order.quantity,
          0
        ),
        totalOrders: participant.orders.length,
        totalPrice,
      },
    }
  } catch (error: any) {
    return null
  }
}

/**
 * Validate participant checkout data before processing
 */
export async function validateParticipantCheckout(
  tripId: string,
  participantName: string | undefined,
  participantEmail: string | undefined,
  participantPhone: string,
  participantAddress: string | undefined
): Promise<{
  valid: boolean
  error?: string
  participant?: any
}> {
  try {
    const trip = await db.trip.findUnique({
      where: { id: tripId },
    })

    if (!trip) {
      return {
        valid: false,
        error: 'Trip not found',
      }
    }

    // Ensure phone number has 62 prefix
    const normalizedPhone = participantPhone.startsWith('62') 
      ? participantPhone 
      : `62${participantPhone}`

    let participant = await db.participant.findFirst({
      where: {
        tripId,
        phone: normalizedPhone,
      },
    })

    if (!participant) {
      participant = await db.participant.create({
        data: {
          tripId,
          phone: normalizedPhone,
          name: participantName || 'Participant',
          email: participantEmail,
          address: participantAddress,
        },
      })
    } else {
      // Update existing participant with new info if provided
      participant = await db.participant.update({
        where: { id: participant.id },
        data: {
          name: participantName || participant.name,
          email: participantEmail || participant.email,
          address: participantAddress || participant.address,
        },
      })
    }

    return {
      valid: true,
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        phone: participant.phone,
        address: participant.address,
      },
    }
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Validation failed',
    }
  }
}
