/**
 * Queue Service
 * Wrapper around pgmq (PostgreSQL message queue)
 * Manages job enqueueing, dequeuing, and processing
 */

import db from '../lib/prisma.js'
import { AnyJob, QueueStats } from '../types/queue.types.js'

const QUEUE_NAME = 'jastipin_jobs'
const VISIBILITY_TIMEOUT = 30 // seconds
const MAX_RETRIES = 3
const BACKOFF_MS = [5000, 30000, 300000] // 5s, 30s, 5min

/**
 * Initialize queue on startup
 * Creates the pgmq queue if it doesn't exist
 */
export async function initializeQueue(): Promise<void> {
  try {
    // Create queue (idempotent - won't error if exists)
    await db.$executeRaw`
      SELECT pgmq.create(${QUEUE_NAME}::text)
    `
    console.log(`[QUEUE] Initialized: ${QUEUE_NAME}`)
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log(`[QUEUE] Already initialized: ${QUEUE_NAME}`)
    } else {
      throw error
    }
  }
}

/**
 * Enqueue a job to be processed
 * @param job Job to enqueue
 * @returns Message ID
 */
export async function enqueue(job: AnyJob): Promise<string> {
  try {
    const messageData = {
      type: job.type,
      payload: job.payload,
      retryCount: job.retryCount ?? 0,
      maxRetries: job.maxRetries ?? MAX_RETRIES,
      createdAt: new Date().toISOString(),
    }

    // pgmq.send(queue_name => text, msg => jsonb, delay => integer DEFAULT 0)
    const delayMs = job.priority === 'low' ? 60 : 0 // 60 second delay for low priority
    const result = await db.$queryRaw<[{ send: number }]>`
      SELECT pgmq.send(
        queue_name => ${QUEUE_NAME}, 
        msg => ${JSON.stringify(messageData)}::jsonb, 
        delay => ${delayMs}
      ) as send
    `

    const msgId = result[0].send.toString()
    console.log(`[QUEUE] Enqueued job ${job.type}:${msgId}`)
    return msgId
  } catch (error: any) {
    console.error(`[QUEUE] Failed to enqueue job ${job.type}:`, error)
    throw new Error(`Failed to enqueue job: ${error.message}`)
  }
}

/**
 * Dequeue the next available job
 * @returns Job with metadata, or null if queue is empty
 */
export async function dequeue(): Promise<(AnyJob & { msg_id: number; vt: number }) | null> {
  try {
    // pgmq.read(queue_name => text, vt => integer, qty => integer)
    const result = await db.$queryRaw<
      Array<{
        msg_id: number
        vt: number
        read_ct: number
        enqueued_at: Date
        left_at: Date | null
        message: string
      }>
    >`
      SELECT * FROM pgmq.read(
        queue_name => ${QUEUE_NAME},
        vt => ${VISIBILITY_TIMEOUT}::integer,
        qty => 1::integer
      )
    `

    if (!result || result.length === 0) {
      return null
    }

    const record = result[0]
    const message = typeof record.message === 'string' ? JSON.parse(record.message) : record.message

    return {
      msg_id: record.msg_id,
      vt: record.vt,
      type: message.type,
      payload: message.payload,
      retryCount: message.retryCount,
      maxRetries: message.maxRetries,
    } as AnyJob & { msg_id: number; vt: number }
  } catch (error: any) {
    console.error(`[QUEUE] Failed to dequeue job:`, error)
    return null
  }
}

/**
 * Mark a job as complete and archive it
 * @param msgId Message ID to complete
 */
export async function complete(msgId: number): Promise<void> {
  try {
    // pgmq.delete(queue_name => text, msg_id => bigint)
    await db.$executeRaw`
      SELECT pgmq.delete(
        queue_name => ${QUEUE_NAME},
        msg_id => ${msgId}::bigint
      )
    `
    console.log(`[QUEUE] Completed job msg_id=${msgId}`)
  } catch (error: any) {
    console.error(`[QUEUE] Failed to complete job msg_id=${msgId}:`, error)
    throw error
  }
}

/**
 * Mark a job as failed with retry logic
 * If retries remain, re-enqueue with exponential backoff
 * Otherwise, move to dead letter queue
 * @param msgId Message ID that failed
 * @param job Job that failed
 * @param error Error that occurred
 */
export async function fail(msgId: number, job: AnyJob, error: Error): Promise<void> {
  try {
    const retryCount = job.retryCount ?? 0
    const maxRetries = job.maxRetries ?? MAX_RETRIES

    // Delete the failed message from queue
    await db.$executeRaw`
      SELECT pgmq.delete(
        queue_name => ${QUEUE_NAME},
        msg_id => ${msgId}::bigint
      )
    `

    // If retries remain, re-enqueue with backoff
    if (retryCount < maxRetries) {
      const newRetryCount = retryCount + 1
      const backoffSeconds = Math.round(BACKOFF_MS[retryCount] / 1000) || 30

      const messageData = {
        type: job.type,
        payload: job.payload,
        retryCount: newRetryCount,
        maxRetries,
        createdAt: job.createdAt,
        lastError: error.message,
      }

      // Re-enqueue with exponential backoff delay
      await db.$queryRaw`
        SELECT pgmq.send(
          queue_name => ${QUEUE_NAME},
          msg => ${JSON.stringify(messageData)}::jsonb,
          delay => ${backoffSeconds}
        )
      `

      console.log(
        `[QUEUE] Retry scheduled for job msg_id=${msgId} (attempt ${newRetryCount}/${maxRetries}, backoff: ${backoffSeconds}s)`
      )
    } else {
      // Max retries exceeded, log to dead letter queue
      console.error(
        `[QUEUE] Max retries exceeded for job msg_id=${msgId}, error: ${error.message}`
      )

      // TODO: Implement dead letter queue if needed
      // For now, just log and discard
    }
  } catch (error: any) {
    console.error(`[QUEUE] Failed to handle job failure msg_id=${msgId}:`, error)
    throw error
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<QueueStats> {
  try {
    // Use pgmq.metrics() function to get queue stats
    const result = await db.$queryRaw<
      Array<{
        queue_name: string
        queue_length: number
        newest_msg_id: number | null
        oldest_msg_id: number | null
        total_pop: number
        total_read: number
        queue_visible_length: number
      }>
    >`
      SELECT * FROM pgmq.metrics(${QUEUE_NAME}::text)
    `

    const metrics = result[0] || {
      queue_length: 0,
      newest_msg_id: null,
      oldest_msg_id: null,
      total_pop: 0,
      total_read: 0,
      queue_visible_length: 0,
    }

    return {
      totalQueued: metrics.queue_visible_length || 0,
      totalProcessing: (metrics.queue_length || 0) - (metrics.queue_visible_length || 0),
      totalFailed: 0, // Would need custom DLQ table to track
      totalCompleted: metrics.total_pop || 0,
      avgProcessingTime: 0, // Would need to track processing times
      oldestJob: metrics.oldest_msg_id ? { 
        id: metrics.oldest_msg_id.toString(),
        createdAt: new Date(),
        retryCount: 0 
      } : undefined,
    }
  } catch (error: any) {
    console.error(`[QUEUE] Failed to get stats:`, error)
    throw error
  }
}

/**
 * Purge all jobs from queue (use with caution)
 */
export async function purgeQueue(): Promise<number> {
  try {
    // This will drop and recreate the queue
    await db.$executeRaw`
      SELECT pgmq.drop_queue(${QUEUE_NAME}::text)
    `
    await initializeQueue()
    console.log(`[QUEUE] Queue purged: ${QUEUE_NAME}`)
    return 0
  } catch (error: any) {
    console.error(`[QUEUE] Failed to purge queue:`, error)
    throw error
  }
}

/**
 * Health check for queue
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error(`[QUEUE] Health check failed:`, error)
    return false
  }
}
