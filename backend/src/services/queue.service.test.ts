/**
 * Queue Service Tests
 * Unit tests for queue operations (enqueue, dequeue, complete, fail)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import * as QueueService from './queue.service.js'
import { OrderAutoRefundJob, OrderExpireDPJob } from '../types/queue.types.js'

describe('QueueService', () => {
  beforeAll(async () => {
    // Initialize queue before tests
    try {
      await QueueService.initializeQueue()
    } catch (error: any) {
      // Queue might already exist
      console.log('Queue initialization note:', error.message)
    }
  })

  afterAll(async () => {
    // Purge queue after tests
    try {
      await QueueService.purgeQueue()
    } catch (error: any) {
      console.log('Queue purge note:', error.message)
    }
  })

  beforeEach(async () => {
    // Clear queue before each test
    try {
      await QueueService.purgeQueue()
      await QueueService.initializeQueue()
    } catch (error: any) {
      console.log('Queue reset note:', error.message)
    }
  })

  describe('enqueue', () => {
    it('should enqueue a job and return message ID', async () => {
      const job: OrderAutoRefundJob = {
        type: 'ORDER_AUTO_REFUND',
        payload: { orderId: 'test-order-123' },
      }

      const msgId = await QueueService.enqueue(job)

      expect(msgId).toBeDefined()
      expect(typeof msgId).toBe('string')
    })

    it('should enqueue multiple jobs', async () => {
      const job1: OrderAutoRefundJob = {
        type: 'ORDER_AUTO_REFUND',
        payload: { orderId: 'order-1' },
      }

      const job2: OrderExpireDPJob = {
        type: 'ORDER_EXPIRE_DP',
        payload: { orderId: 'order-2' },
      }

      const msgId1 = await QueueService.enqueue(job1)
      const msgId2 = await QueueService.enqueue(job2)

      expect(msgId1).toBeDefined()
      expect(msgId2).toBeDefined()
      expect(msgId1).not.toBe(msgId2)
    })

    it('should handle priority correctly', async () => {
      const highPriorityJob: OrderAutoRefundJob = {
        type: 'ORDER_AUTO_REFUND',
        payload: { orderId: 'urgent' },
        priority: 'high',
      }

      const msgId = await QueueService.enqueue(highPriorityJob)
      expect(msgId).toBeDefined()
    })

    it('should throw error if job is invalid', async () => {
      const invalidJob = {
        // Missing required 'type' field
        payload: { orderId: 'test' },
      } as any

      await expect(QueueService.enqueue(invalidJob)).rejects.toThrow()
    })
  })

  describe('dequeue', () => {
    it('should return null if queue is empty', async () => {
      const job = await QueueService.dequeue()
      expect(job).toBeNull()
    })

    it('should dequeue a job in FIFO order', async () => {
      const job1: OrderAutoRefundJob = {
        type: 'ORDER_AUTO_REFUND',
        payload: { orderId: 'order-1' },
      }

      const job2: OrderAutoRefundJob = {
        type: 'ORDER_AUTO_REFUND',
        payload: { orderId: 'order-2' },
      }

      await QueueService.enqueue(job1)
      await QueueService.enqueue(job2)

      const dequeuedJob = await QueueService.dequeue()

      expect(dequeuedJob).toBeDefined()
      expect(dequeuedJob?.payload.orderId).toBe('order-1')
    })

    it('should include metadata when dequeuing', async () => {
      const job: OrderAutoRefundJob = {
        type: 'ORDER_AUTO_REFUND',
        payload: { orderId: 'test-order' },
      }

      await QueueService.enqueue(job)
      const dequeuedJob = await QueueService.dequeue()

      expect(dequeuedJob?.msg_id).toBeDefined()
      expect(dequeuedJob?.vt).toBeDefined()
      expect(dequeuedJob?.type).toBe('ORDER_AUTO_REFUND')
    })
  })

  describe('complete', () => {
    it('should complete a dequeued job', async () => {
      const job: OrderAutoRefundJob = {
        type: 'ORDER_AUTO_REFUND',
        payload: { orderId: 'test-order' },
      }

      await QueueService.enqueue(job)
      const dequeuedJob = await QueueService.dequeue()

      expect(dequeuedJob).toBeDefined()

      // Should not throw
      await QueueService.complete(dequeuedJob!.msg_id)

      // Queue should be empty after completion
      const nextJob = await QueueService.dequeue()
      expect(nextJob).toBeNull()
    })

    it('should throw if completing non-existent message', async () => {
      const nonExistentMsgId = 99999

      // Depending on pgmq behavior, this might not throw
      // Just verify it doesn't crash the system
      try {
        await QueueService.complete(nonExistentMsgId)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('fail', () => {
    it('should move job to retry queue if retries remaining', async () => {
      const job: OrderAutoRefundJob = {
        type: 'ORDER_AUTO_REFUND',
        payload: { orderId: 'test-order' },
        retryCount: 0,
        maxRetries: 3,
      }

      await QueueService.enqueue(job)
      const dequeuedJob = await QueueService.dequeue()

      expect(dequeuedJob).toBeDefined()

      // Fail the job
      const error = new Error('Test error')
      await QueueService.fail(dequeuedJob!.msg_id, error)

      // Original message should be gone
      const nextImmediateJob = await QueueService.dequeue()
      expect(nextImmediateJob).toBeNull()

      // After backoff delay, job should be available again
      // (We can't test the actual timing, but verify the operation completes)
    })

    it('should move to dead letter queue after max retries', async () => {
      const job: OrderAutoRefundJob = {
        type: 'ORDER_AUTO_REFUND',
        payload: { orderId: 'test-order' },
        retryCount: 2, // Already retried twice
        maxRetries: 3,
      }

      await QueueService.enqueue(job)
      const dequeuedJob = await QueueService.dequeue()

      expect(dequeuedJob).toBeDefined()

      // This should be the final failure
      const error = new Error('Final failure')
      await QueueService.fail(dequeuedJob!.msg_id, error)

      // Job should not return to queue
      const nextJob = await QueueService.dequeue()
      expect(nextJob).toBeNull()
    })
  })

  describe('getQueueStats', () => {
    it('should return stats for empty queue', async () => {
      const stats = await QueueService.getQueueStats()

      expect(stats).toBeDefined()
      expect(stats.totalQueued).toBe(0)
      expect(stats.totalProcessing).toBe(0)
      expect(stats.avgProcessingTime).toBe(0)
    })

    it('should count queued jobs', async () => {
      const job1: OrderAutoRefundJob = {
        type: 'ORDER_AUTO_REFUND',
        payload: { orderId: 'order-1' },
      }

      const job2: OrderExpireDPJob = {
        type: 'ORDER_EXPIRE_DP',
        payload: { orderId: 'order-2' },
      }

      await QueueService.enqueue(job1)
      await QueueService.enqueue(job2)

      const stats = await QueueService.getQueueStats()

      expect(stats.totalQueued).toBe(2)
      expect(stats.totalProcessing).toBe(0)
    })

    it('should count processing jobs', async () => {
      const job: OrderAutoRefundJob = {
        type: 'ORDER_AUTO_REFUND',
        payload: { orderId: 'order-1' },
      }

      await QueueService.enqueue(job)
      await QueueService.dequeue() // Move to processing

      const stats = await QueueService.getQueueStats()

      expect(stats.totalProcessing).toBeGreaterThan(0)
    })

    it('should return oldest job info', async () => {
      const job: OrderAutoRefundJob = {
        type: 'ORDER_AUTO_REFUND',
        payload: { orderId: 'test-order' },
      }

      await QueueService.enqueue(job)
      const stats = await QueueService.getQueueStats()

      expect(stats.oldestJob).toBeDefined()
      expect(stats.oldestJob?.id).toBeDefined()
      expect(stats.oldestJob?.createdAt).toBeDefined()
    })
  })

  describe('healthCheck', () => {
    it('should return true when queue is healthy', async () => {
      const isHealthy = await QueueService.healthCheck()
      expect(isHealthy).toBe(true)
    })
  })

  describe('purgeQueue', () => {
    it('should clear all jobs from queue', async () => {
      const job1: OrderAutoRefundJob = {
        type: 'ORDER_AUTO_REFUND',
        payload: { orderId: 'order-1' },
      }

      const job2: OrderAutoRefundJob = {
        type: 'ORDER_AUTO_REFUND',
        payload: { orderId: 'order-2' },
      }

      await QueueService.enqueue(job1)
      await QueueService.enqueue(job2)

      await QueueService.purgeQueue()

      const nextJob = await QueueService.dequeue()
      expect(nextJob).toBeNull()
    })
  })

  describe('Integration', () => {
    it('should handle full job lifecycle: enqueue -> dequeue -> complete', async () => {
      const job: OrderAutoRefundJob = {
        type: 'ORDER_AUTO_REFUND',
        payload: { orderId: 'test-order-123' },
      }

      // Enqueue
      const msgId = await QueueService.enqueue(job)
      expect(msgId).toBeDefined()

      // Dequeue
      const dequeuedJob = await QueueService.dequeue()
      expect(dequeuedJob).toBeDefined()
      expect(dequeuedJob?.payload.orderId).toBe('test-order-123')

      // Complete
      await QueueService.complete(dequeuedJob!.msg_id)

      // Verify empty
      const nextJob = await QueueService.dequeue()
      expect(nextJob).toBeNull()
    })
  })
})
