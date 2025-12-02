/**
 * Queue Job Types
 * Type-safe definitions for all async jobs in the system
 */

/**
 * All job types supported by the queue system
 */
export type JobType =
  | 'ORDER_AUTO_REFUND'
  | 'ORDER_EXPIRE_DP'
  | 'NOTIFICATION_SEND_WHATSAPP'
  | 'STOCK_RELEASE'

/**
 * Priority levels for job processing
 */
export type JobPriority = 'low' | 'normal' | 'high'

/**
 * Job status in the queue
 */
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter'

/**
 * Base job interface with common fields
 * @template T Payload type
 */
export interface BaseJob<T = any> {
  id?: string
  type: JobType
  payload: T
  priority?: JobPriority
  retryCount?: number
  maxRetries?: number
  createdAt?: Date
  processingStartedAt?: Date
  error?: string
}

/**
 * Order Auto-Refund Job
 * Automatically rejects orders awaiting validation > 24 hours and refunds DP
 */
export interface OrderAutoRefundJob extends BaseJob {
  type: 'ORDER_AUTO_REFUND'
  payload: {
    orderId: string
  }
}

/**
 * Order Expire DP Job
 * Cancels pending_dp orders > 30 minutes and releases stock
 */
export interface OrderExpireDPJob extends BaseJob {
  type: 'ORDER_EXPIRE_DP'
  payload: {
    orderId: string
  }
}

/**
 * Notification Send WhatsApp Job
 * Sends WhatsApp notifications to customers
 */
export interface NotificationSendJob extends BaseJob {
  type: 'NOTIFICATION_SEND_WHATSAPP'
  payload: {
    recipientPhone: string
    message: string
    metadata?: Record<string, any>
  }
}

/**
 * Stock Release Job
 * Releases locked stock for an order
 */
export interface StockReleaseJob extends BaseJob {
  type: 'STOCK_RELEASE'
  payload: {
    orderId: string
    shouldRefund?: boolean
  }
}

/**
 * Union type for all job types
 */
export type AnyJob =
  | OrderAutoRefundJob
  | OrderExpireDPJob
  | NotificationSendJob
  | StockReleaseJob

/**
 * Queue statistics
 */
export interface QueueStats {
  totalQueued: number
  totalProcessing: number
  totalFailed: number
  totalCompleted: number
  avgProcessingTime: number
  oldestJob?: {
    id: string
    createdAt: Date
    retryCount: number
  }
}

/**
 * Job handler function type
 * @param payload Job payload
 * @returns Promise resolving when job is complete
 */
export type JobHandler<T extends AnyJob = AnyJob> = (payload: T['payload']) => Promise<void>

/**
 * Job handler map for all job types
 */
export type JobHandlerMap = {
  [K in JobType]: JobHandler<Extract<AnyJob, { type: K }>>
}
