/**
 * Order Queue Service
 * Wrapper to enqueue order-related background jobs
 */

import * as QueueService from './queue.service.js'
import { OrderAutoRefundJob, OrderExpireDPJob, StockReleaseJob } from '../types/queue.types.js'

/**
 * Enqueue order auto-refund job
 * Called when order needs validation checking
 * @param orderId Order ID to process
 * @returns Message ID
 */
export async function enqueueAutoRefundJob(orderId: string): Promise<string> {
  const job: OrderAutoRefundJob = {
    type: 'ORDER_AUTO_REFUND',
    payload: { orderId },
    priority: 'normal',
    maxRetries: 3,
  }

  return QueueService.enqueue(job)
}

/**
 * Enqueue order expire DP job
 * Called when pending DP payment needs to be checked for expiration
 * @param orderId Order ID to process
 * @returns Message ID
 */
export async function enqueueExpireDPJob(orderId: string): Promise<string> {
  const job: OrderExpireDPJob = {
    type: 'ORDER_EXPIRE_DP',
    payload: { orderId },
    priority: 'normal',
    maxRetries: 3,
  }

  return QueueService.enqueue(job)
}

/**
 * Enqueue stock release job
 * Called when order is cancelled or rejected
 * @param orderId Order ID
 * @param shouldRefund Whether to refund (true) or just release (false)
 * @returns Message ID
 */
export async function enqueueStockReleaseJob(
  orderId: string,
  shouldRefund: boolean = false
): Promise<string> {
  const job: StockReleaseJob = {
    type: 'STOCK_RELEASE',
    payload: { orderId, shouldRefund },
    priority: 'high', // Release stock immediately
    maxRetries: 2,
  }

  return QueueService.enqueue(job)
}

/**
 * Enqueue order notification job
 * Called when order status changes
 * @param recipientPhone Phone number to send to
 * @param message Message content
 * @param metadata Additional context
 * @returns Message ID
 */
export async function enqueueNotificationJob(
  recipientPhone: string,
  message: string,
  metadata?: Record<string, any>
): Promise<string> {
  const job = {
    type: 'NOTIFICATION_SEND_WHATSAPP' as const,
    payload: {
      recipientPhone,
      message,
      metadata,
    },
    priority: 'normal' as const,
    maxRetries: 3,
  }

  return QueueService.enqueue(job)
}

/**
 * Batch enqueue auto-refund jobs
 * Called during maintenance or batch processing
 * @param orderIds Array of order IDs
 * @returns Array of message IDs
 */
export async function batchEnqueueAutoRefund(orderIds: string[]): Promise<string[]> {
  const messageIds: string[] = []

  for (const orderId of orderIds) {
    try {
      const msgId = await enqueueAutoRefundJob(orderId)
      messageIds.push(msgId)
    } catch (error: any) {
      console.error(`[ORDER_QUEUE] Failed to enqueue auto-refund for ${orderId}:`, error)
    }
  }

  return messageIds
}

/**
 * Get queue statistics
 * @returns Queue statistics
 */
export async function getQueueStatus() {
  return QueueService.getQueueStats()
}
