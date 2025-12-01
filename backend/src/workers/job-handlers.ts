import db from '../lib/prisma.js'
/**
 * Job Handlers
 * Implements business logic for each job type
 */

import { JobHandlerMap, AnyJob } from '../types/queue.types.js'
import { releaseStock } from '../services/stock-lock.service.js'


/**
 * Handle ORDER_AUTO_REFUND job
 * Finds orders awaiting_validation > 24 hours and auto-rejects them
 */
async function handleAutoRefund(payload: { orderId: string }): Promise<void> {
  console.log(`[HANDLER] Auto-refund: Processing order ${payload.orderId}`)

  try {
    const order = await db.order.findUnique({
      where: { id: payload.orderId },
      include: {
        Participant: true,
      },
    })

    if (!order) {
      console.warn(`[HANDLER] Auto-refund: Order not found ${payload.orderId}`)
      return
    }

    // Verify order is still awaiting_validation and past threshold
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h ago
    if (order.status !== 'awaiting_validation' || !order.dpPaidAt || order.dpPaidAt > threshold) {
      console.log(
        `[HANDLER] Auto-refund: Order ${payload.orderId} no longer eligible (status: ${order.status})`
      )
      return
    }

    // Update order status to rejected
    await db.order.update({
      where: { id: payload.orderId },
      data: {
        status: 'rejected',
        rejectionReason: 'Auto-rejected: Jastiper did not validate within 24 hours',
      },
    })

    // Release stock
    await releaseStock(payload.orderId, true)

    // TODO: Trigger refund via payment gateway
    console.log(`[REFUND] Order ${payload.orderId}: DP Rp ${order.dpAmount} to ${order.Participant?.phone}`)

    // TODO: Trigger WhatsApp notification
    console.log(
      `[NOTIFICATION] Participant ${order.Participant?.phone}: Order auto-cancelled, DP refunded`
    )
  } catch (error: any) {
    console.error(`[HANDLER] Auto-refund failed for order ${payload.orderId}:`, error)
    throw error
  }
}

/**
 * Handle ORDER_EXPIRE_DP job
 * Cancels pending_dp orders > 30 minutes and releases stock
 */
async function handleExpireDP(payload: { orderId: string }): Promise<void> {
  console.log(`[HANDLER] Expire DP: Processing order ${payload.orderId}`)

  try {
    const order = await db.order.findUnique({
      where: { id: payload.orderId },
      include: {
        Participant: true,
      },
    })

    if (!order) {
      console.warn(`[HANDLER] Expire DP: Order not found ${payload.orderId}`)
      return
    }

    // Verify order is still pending_dp and past threshold
    const threshold = new Date(Date.now() - 30 * 60 * 1000) // 30 min ago
    if (order.status !== 'pending_dp' || order.createdAt > threshold) {
      console.log(
        `[HANDLER] Expire DP: Order ${payload.orderId} no longer eligible (status: ${order.status})`
      )
      return
    }

    // Update order status to cancelled
    await db.order.update({
      where: { id: payload.orderId },
      data: {
        status: 'cancelled',
        rejectionReason: 'Auto-cancelled: DP not paid within 30 minutes',
      },
    })

    // Release stock
    await releaseStock(payload.orderId, false)

    // TODO: Trigger WhatsApp notification
    console.log(`[NOTIFICATION] Participant ${order.Participant?.phone}: Order auto-cancelled due to expired DP payment`)
  } catch (error: any) {
    console.error(`[HANDLER] Expire DP failed for order ${payload.orderId}:`, error)
    throw error
  }
}

/**
 * Handle NOTIFICATION_SEND_WHATSAPP job
 * Sends WhatsApp message to customer
 */
async function handleSendWhatsApp(payload: {
  recipientPhone: string
  message: string
  metadata?: Record<string, any>
}): Promise<void> {
  console.log(`[HANDLER] Send WhatsApp: To ${payload.recipientPhone}`)

  try {
    // TODO: Integrate with actual WhatsApp service (e.g., Twilio, MessageBird)
    console.log(`[WHATSAPP] Sending to ${payload.recipientPhone}: ${payload.message}`)

    // For now, just log the action
    // In production, this would call your WhatsApp service
    const result = {
      success: true,
      messageId: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipient: payload.recipientPhone,
    }

    console.log(`[WHATSAPP] Message sent:`, result)

    // TODO: Store notification log in database
    // await db.notificationLog.create({
    //   data: {
    //     recipientType: 'PHONE',
    //     recipientId: payload.recipientPhone,
    //     channel: 'WHATSAPP',
    //     eventType: payload.metadata?.eventType || 'GENERAL',
    //     status: 'delivered',
    //     sentAt: new Date(),
    //     metadata: payload.metadata,
    //   }
    // })
  } catch (error: any) {
    console.error(`[HANDLER] Send WhatsApp failed for ${payload.recipientPhone}:`, error)
    throw error
  }
}

/**
 * Handle STOCK_RELEASE job
 * Releases locked stock for an order
 */
async function handleStockRelease(payload: { orderId: string; shouldRefund?: boolean }): Promise<void> {
  console.log(`[HANDLER] Stock release: Order ${payload.orderId}`)

  try {
    await releaseStock(payload.orderId, payload.shouldRefund ?? false)
    console.log(`[HANDLER] Stock released for order ${payload.orderId}`)
  } catch (error: any) {
    console.error(`[HANDLER] Stock release failed for order ${payload.orderId}:`, error)
    throw error
  }
}

/**
 * Job handler registry - maps job types to handler functions
 */
export const jobHandlers: JobHandlerMap = {
  ORDER_AUTO_REFUND: handleAutoRefund,
  ORDER_EXPIRE_DP: handleExpireDP,
  NOTIFICATION_SEND_WHATSAPP: handleSendWhatsApp,
  STOCK_RELEASE: handleStockRelease,
}

/**
 * Execute a job based on its type
 * @param job Job to execute
 * @throws Error if handler fails
 */
export async function executeJob(job: AnyJob): Promise<void> {
  const handler = jobHandlers[job.type]

  if (!handler) {
    throw new Error(`No handler found for job type: ${job.type}`)
  }

  console.log(`[HANDLER] Executing job type: ${job.type}`)
  await handler(job.payload as any)
}
