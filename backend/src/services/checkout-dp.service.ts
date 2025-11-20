/**
 * DP Checkout Service
 * Handles minimal checkout with DP payment
 */

import { PrismaClient } from '@prisma/client'
import { calculateDPAmount } from './price-calculator.service'

const db = new PrismaClient()

export interface CheckoutDPRequest {
  tripId: string
  participantPhone: string
  participantName: string
  address?: {
    recipientName: string
    phone: string
    addressText: string
    provinceId: string
    provinceName: string
    cityId: string
    cityName: string
    districtId: string
    districtName: string
    villageId?: string
    villageName?: string
    postalCode?: string
  }
  items: Array<{
    productId: string
    quantity: number
    notes?: string
  }>
}

export interface CheckoutDPResponse {
  success: boolean
  orderId?: string
  dpAmount?: number
  paymentLink?: string
  error?: string
}

/**
 * Step 1: Create order with DP payment
 */
export async function processCheckoutDP(
  request: CheckoutDPRequest
): Promise<CheckoutDPResponse> {
  
  try {
    // 1. Validate trip
    const trip = await db.trip.findUnique({
      where: { id: request.tripId }
    })
    
    if (!trip) {
      return { success: false, error: 'Trip not found' }
    }
    
    // 2. Get or create participant
    const normalizedPhone = request.participantPhone.startsWith('62') 
      ? request.participantPhone 
      : `62${request.participantPhone}`
    
    let participant = await db.participant.findFirst({
      where: {
        tripId: request.tripId,
        phone: normalizedPhone
      }
    })
    
    if (!participant) {
      participant = await db.participant.create({
        data: {
          tripId: request.tripId,
          phone: normalizedPhone,
          name: request.participantName
        }
      })
    }
    
    if (!participant) {
      return { success: false, error: 'Failed to create participant' }
    }
    
    // 3. Validate products and check stock
    const products = await Promise.all(
      request.items.map(item => 
        db.product.findUnique({
          where: { id: item.productId },
          include: { Trip: true }
        })
      )
    )
    
    // Validate all products
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const item = request.items[i]
      
      if (!product) {
        return { success: false, error: `Product not found: ${item.productId}` }
      }
      
      if (product.tripId !== request.tripId) {
        return { success: false, error: `Product not in this trip` }
      }
      
      // Check stock for goods
      if (product.type === 'goods') {
        if (product.stock === null || product.stock < item.quantity) {
          return { 
            success: false, 
            error: `Insufficient stock for "${product.title}". Available: ${product.stock}, Requested: ${item.quantity}` 
          }
        }
      }
    }
    
    // 4. Create address if provided
    let addressId: string | null = null
    
    if (request.address) {
      const newAddress = await db.address.create({
        data: {
          participantId: participant!.id,
          recipientName: request.address.recipientName,
          phone: request.address.phone,
          addressText: request.address.addressText,
          provinceId: request.address.provinceId,
          provinceName: request.address.provinceName,
          cityId: request.address.cityId,
          cityName: request.address.cityName,
          districtId: request.address.districtId,
          districtName: request.address.districtName,
          villageId: request.address.villageId || null,
          villageName: request.address.villageName || null,
          postalCode: request.address.postalCode || null,
          isDefault: true // first address is default
        }
      })
      
      addressId = newAddress.id
    }
    
    // 5. Calculate subtotal and DP amount
    const subtotal = products.reduce((sum, product, i) => {
      return sum + (product!.price * request.items[i].quantity)
    }, 0)
    
    // Use trip's specific DP percentage, default to 20 if not set (fallback)
    const dpAmount = await calculateDPAmount(subtotal, trip.dpPercentage || 20)
    
    // 6. Create order with items (transaction)
    const order = await db.$transaction(async (tx) => {
      
      // Create order
      const newOrder = await tx.order.create({
        data: {
          tripId: request.tripId,
          participantId: participant!.id,
          addressId: addressId,
          dpAmount,
          totalPrice: subtotal,  // initial estimate
          status: 'pending_dp'
        }
      })
      
      // Create order items
      for (let i = 0; i < products.length; i++) {
        const product = products[i]!
        const item = request.items[i]
        
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: product.id,
            productType: product.type,
            priceAtOrder: product.price,
            quantity: item.quantity,
            itemSubtotal: product.price * item.quantity,
            note: item.notes || null
          }
        })
      }
      
      return newOrder
    })
    
    // 7. TODO: Create payment link with payment gateway
    // For now, return mock payment link
    const paymentLink = `https://payment.jastipin.me/dp/${order.id}`
    
    return {
      success: true,
      orderId: order.id,
      dpAmount,
      paymentLink
    }
    
  } catch (error: any) {
    console.error('Checkout DP error:', error)
    return {
      success: false,
      error: error.message || 'Checkout failed'
    }
  }
}

/**
 * Get order summary with items
 */
export async function getOrderSummary(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        OrderItem: {
          include: {
            Product: true
          }
        },
        Participant: true,
        Address: true,
        Trip: {
          include: {
            User: {
              select: {
                profileName: true,
                slug: true
              }
            }
          }
        }
      }
    })
    
    return order
  } catch (error) {
    console.error('Error fetching order summary:', error)
    return null
  }
}
