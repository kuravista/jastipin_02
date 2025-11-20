/**
 * Worker Routes
 * Endpoints to trigger background workers
 * Can be called manually or by external cron services (e.g., cron-job.org, AWS CloudWatch)
 */

import express, { type Router } from 'express'
import { 
  processAutoRefund, 
  processExpiredDP, 
  processFinalPaymentReminder,
  processCompletedOrderCleanup
} from '../workers/order-workers.js'
import { 
  processStockLockCleanup,
  processStockSync 
} from '../workers/stock-workers.js'

const router: Router = express.Router()

/**
 * Authentication middleware for worker endpoints
 * Use a secret token to prevent unauthorized access
 */
const workerAuth = (req: any, res: any, next: any) => {
  const token = req.headers['x-worker-token'] || req.query.token
  const workerToken = process.env.WORKER_TOKEN || 'dev-worker-secret-change-in-production'
  
  if (token !== workerToken) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized: Invalid worker token' 
    })
  }
  
  next()
}

// Apply auth to all worker routes
router.use(workerAuth)

/**
 * POST /api/workers/auto-refund
 * Trigger auto-refund worker
 * Schedule: Every 1 hour
 */
router.post('/auto-refund', async (_req, res) => {
  try {
    const result = await processAutoRefund()
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    })
  }
})

/**
 * POST /api/workers/expired-dp
 * Trigger expired DP worker
 * Schedule: Every 5 minutes
 */
router.post('/expired-dp', async (_req, res) => {
  try {
    const result = await processExpiredDP()
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    })
  }
})

/**
 * POST /api/workers/payment-reminder
 * Trigger final payment reminder worker
 * Schedule: Every 6 hours
 */
router.post('/payment-reminder', async (_req, res) => {
  try {
    const result = await processFinalPaymentReminder()
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    })
  }
})

/**
 * POST /api/workers/stock-cleanup
 * Trigger stock lock cleanup worker
 * Schedule: Every 10 minutes
 */
router.post('/stock-cleanup', async (_req, res) => {
  try {
    const result = await processStockLockCleanup()
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    })
  }
})

/**
 * POST /api/workers/stock-sync
 * Trigger stock sync worker
 * Schedule: Every 1 hour
 */
router.post('/stock-sync', async (_req, res) => {
  try {
    const result = await processStockSync()
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    })
  }
})

/**
 * POST /api/workers/order-cleanup
 * Trigger completed order cleanup worker
 * Schedule: Daily
 */
router.post('/order-cleanup', async (_req, res) => {
  try {
    const result = await processCompletedOrderCleanup()
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    })
  }
})

/**
 * POST /api/workers/run-all
 * Trigger all workers (useful for testing)
 * Use with caution in production
 */
router.post('/run-all', async (_req, res) => {
  try {
    const results = {
      autoRefund: await processAutoRefund(),
      expiredDP: await processExpiredDP(),
      stockCleanup: await processStockLockCleanup(),
      stockSync: await processStockSync(),
      paymentReminder: await processFinalPaymentReminder(),
      orderCleanup: await processCompletedOrderCleanup()
    }
    
    res.json({
      success: true,
      message: 'All workers executed',
      results
    })
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    })
  }
})

/**
 * GET /api/workers/status
 * Get worker status and schedule info
 */
router.get('/status', (_req, res) => {
  res.json({
    success: true,
    workers: [
      {
        name: 'auto-refund',
        endpoint: 'POST /api/workers/auto-refund',
        schedule: 'Every 1 hour',
        description: 'Auto-reject orders awaiting validation > 24h'
      },
      {
        name: 'expired-dp',
        endpoint: 'POST /api/workers/expired-dp',
        schedule: 'Every 5 minutes',
        description: 'Cancel pending_dp orders > 30 minutes'
      },
      {
        name: 'payment-reminder',
        endpoint: 'POST /api/workers/payment-reminder',
        schedule: 'Every 6 hours',
        description: 'Send reminders for awaiting_payment orders'
      },
      {
        name: 'stock-cleanup',
        endpoint: 'POST /api/workers/stock-cleanup',
        schedule: 'Every 10 minutes',
        description: 'Cleanup expired stock locks'
      },
      {
        name: 'stock-sync',
        endpoint: 'POST /api/workers/stock-sync',
        schedule: 'Every 1 hour',
        description: 'Sync stock locks with database'
      },
      {
        name: 'order-cleanup',
        endpoint: 'POST /api/workers/order-cleanup',
        schedule: 'Daily',
        description: 'Archive old completed orders'
      }
    ],
    authentication: {
      method: 'Bearer token',
      header: 'x-worker-token',
      query: '?token=YOUR_TOKEN'
    },
    exampleCurl: 'curl -X POST http://localhost:4000/api/workers/expired-dp -H "x-worker-token: YOUR_TOKEN"'
  })
})

export default router
