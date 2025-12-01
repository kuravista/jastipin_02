import db from '../lib/prisma.js'
/**
 * Order Validation Service
 * Jastiper validates order and sets final price
 */

import { calculatePriceBreakdown, OrderItemInput } from './price-calculator.service'
import { releaseStock, lockStock, StockLockItem } from './stock-lock.service'
import { EmailTriggerService } from './email/email-trigger.service.js'


export interface ValidateOrderInput {
  orderId: string
  jastiperId: string
  action: 'accept' | 'reject'
  shippingFee?: number      // required if order has goods
  serviceFee?: number       // optional extra fee
  rejectionReason?: string  // required if reject
}

export interface ValidateOrderResponse {
  success: boolean
  order?: any
  paymentLink?: string
  error?: string
}

/**
 * Jastiper validates order (accept or reject)
 */
export async function validateOrder(
  input: ValidateOrderInput
): Promise<ValidateOrderResponse> {
  
  try {
    // 1. Get order with items and relations
    const order = await db.order.findUnique({
      where: { id: input.orderId },
      include: {
        OrderItem: {
          include: {
            Product: true
          }
        },
        Participant: true,
        Trip: true
      }
    })
    
    if (!order) {
      return { success: false, error: 'Order not found' }
    }
    
    // 2. Verify jastiper ownership
    if (order.Trip?.jastiperId !== input.jastiperId) {
      return { success: false, error: 'Unauthorized: You are not the owner of this trip' }
    }
    
    // 3. Check order status
    if (order.status !== 'awaiting_validation') {
      return { 
        success: false, 
        error: `Order cannot be validated in status: ${order.status}` 
      }
    }
    
    // 4. Handle rejection
    if (input.action === 'reject') {
      
      if (!input.rejectionReason) {
        return { success: false, error: 'Rejection reason required' }
      }
      
      // Update order status
      const updatedOrder = await db.order.update({
        where: { id: input.orderId },
        data: {
          status: 'rejected',
          validatedAt: new Date(),
          validatedBy: input.jastiperId,
          rejectionReason: input.rejectionReason
        }
      })
      
      // Release stock with restoration
      await releaseStock(input.orderId, true)
      
      // TODO: Trigger auto-refund worker
      // await refundQueue.add({ orderId: input.orderId, amount: order.dpAmount })
      
      // TODO: Send WhatsApp notification to participant
      console.log(`[Notification] Order ${order.id} rejected. Reason: ${input.rejectionReason}`)
      
      return {
        success: true,
        order: updatedOrder
      }
    }
    
    // 5. Handle acceptance
    
    // Check if goods present and shipping fee provided
    const hasGoods = order.OrderItem.some((item: any) => item.productType === 'goods')
    if (hasGoods && input.shippingFee === undefined) {
      return { 
        success: false, 
        error: 'Shipping fee required for orders with goods' 
      }
    }
    
    // 6. Calculate final breakdown
    const itemsForCalculation: OrderItemInput[] = order.OrderItem.map((item: any) => ({
      productId: item.productId,
      productType: item.productType as 'goods' | 'tasks',
      priceAtOrder: item.priceAtOrder,
      quantity: item.quantity,
      markupType: item.Product.markupType as 'percent' | 'flat',
      markupValue: item.Product.markupValue
    }))

    const breakdown = await calculatePriceBreakdown({
      items: itemsForCalculation,
      shippingFee: input.shippingFee || 0,
      serviceFee: input.serviceFee || 0,
      dpPercentage: order.Trip?.dpPercentage || 20  // Use trip's DP percentage
    })
    
    // 7. Lock stock (deduct from inventory)
    const stockLockItems: StockLockItem[] = order.OrderItem.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity
    }))

    const stockLockResult = await lockStock(input.orderId, stockLockItems)
    if (!stockLockResult.success) {
      return {
        success: false,
        error: `Stock lock failed: ${stockLockResult.error}`
      }
    }

    // 8. Update order with breakdown
    const updatedOrder = await db.order.update({
      where: { id: input.orderId },
      data: {
        status: 'awaiting_final_payment',
        validatedAt: new Date(),
        validatedBy: input.jastiperId,
        finalBreakdown: breakdown as any,
        shippingFee: breakdown.shippingFee,
        serviceFee: breakdown.serviceFee,
        platformCommission: breakdown.platformCommission,
        totalPrice: breakdown.totalFinal,
        finalAmount: breakdown.remainingAmount
      },
      include: {
        Participant: true,
        OrderItem: {
          include: {
            Product: true
          }
        }
      }
    })

    // 9. TODO: Create payment link for remaining amount
    const paymentLink = `https://payment.jastipin.me/final/${updatedOrder.id}`

    // 10. Send email notification to customer (async, non-blocking)
    EmailTriggerService.sendOrderValidatedEmail(updatedOrder.id).catch(error => {
      console.error('[Validation] Failed to send email notification:', error)
      // Don't fail the validation if email fails
    })

    console.log(`[Notification] Order ${updatedOrder.id} validated. Final amount: Rp${breakdown.remainingAmount}`)

    return {
      success: true,
      order: updatedOrder,
      paymentLink
    }
    
  } catch (error: any) {
    console.error('Validation error:', error)
    return {
      success: false,
      error: error.message || 'Validation failed'
    }
  }
}

/**
 * Get orders awaiting validation for jastiper
 */
export async function getOrdersAwaitingValidation(jastiperId: string) {
  try {
    const orders = await db.order.findMany({
      where: {
        status: 'awaiting_validation',
        Trip: {
          jastiperId
        }
      },
      include: {
        OrderItem: {
          include: {
            Product: true
          }
        },
        Participant: true,
        Address: true,
        Trip: true
      },
      orderBy: {
        dpPaidAt: 'asc' // oldest first
      }
    })
    
    return orders
  } catch (error) {
    console.error('Error fetching awaiting validation orders:', error)
    return []
  }
}

/**
 * Check if order validation is overdue (>24 hours)
 */
export function isValidationOverdue(order: { dpPaidAt: Date | null }): boolean {
  if (!order.dpPaidAt) return false
  
  const VALIDATION_DEADLINE_HOURS = 24
  const now = new Date()
  const deadline = new Date(order.dpPaidAt.getTime() + (VALIDATION_DEADLINE_HOURS * 60 * 60 * 1000))
  
  return now > deadline
}
