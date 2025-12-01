/**
 * Monitoring Routes
 * Health checks and system metrics for stock locks and queue
 */

import express, { type Router } from 'express'
import { getMemoryStats, getHealthStatus, getActiveLocks, cleanupExpiredLocks } from '../services/stock-lock.service.js'
import * as QueueService from '../services/queue.service.js'
import { getWorkerStatus } from '../workers/queue-worker.js'

const router: Router = express.Router()

/**
 * GET /api/monitoring/stock-locks
 * Get stock lock memory statistics
 */
router.get('/stock-locks', (_req, res) => {
  try {
    const stats = getMemoryStats()
    res.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/monitoring/stock-locks/health
 * Get health status with recommendations
 */
router.get('/stock-locks/health', (_req, res) => {
  try {
    const health = getHealthStatus()
    
    // Return appropriate HTTP status
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'warning' ? 200 : 503
    
    res.status(statusCode).json({
      success: true,
      data: health
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/monitoring/stock-locks/active
 * Get list of active locks
 */
router.get('/stock-locks/active', (_req, res) => {
  try {
    const activeLocks = getActiveLocks()
    
    res.json({
      success: true,
      count: activeLocks.length,
      data: activeLocks
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/monitoring/stock-locks/cleanup
 * Manually trigger cleanup of expired locks
 * (Useful for testing or manual maintenance)
 */
router.post('/stock-locks/cleanup', async (_req, res) => {
  try {
    const cleaned = await cleanupExpiredLocks()
    
    res.json({
      success: true,
      message: `Cleaned up ${cleaned} expired locks`,
      cleaned
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// ═══════════════════════════════════════════════════════════════
// QUEUE MONITORING ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/monitoring/queue/stats
 * Get queue statistics and status
 */
router.get('/queue/stats', async (_req, res) => {
  try {
    const stats = await QueueService.getQueueStats()
    
    res.json({
      success: true,
      data: {
        queue: stats,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/monitoring/queue/health
 * Get queue and worker health status
 */
router.get('/queue/health', async (_req, res) => {
  try {
    const isHealthy = await QueueService.healthCheck()
    const workerStatus = getWorkerStatus()
    const queueStats = await QueueService.getQueueStats()

    // Determine overall health
    const overallStatus = isHealthy ? 'healthy' : 'unhealthy'

    res.json({
      success: true,
      data: {
        database: {
          status: isHealthy ? 'up' : 'down',
          timestamp: new Date().toISOString()
        },
        worker: {
          status: workerStatus.isRunning ? 'running' : 'stopped',
          uptime: workerStatus.uptime,
          activeJobs: workerStatus.activeJobs,
          totalProcessed: workerStatus.totalProcessed,
          totalFailed: workerStatus.totalFailed,
          successRate: workerStatus.totalProcessed > 0 
            ? ((workerStatus.totalProcessed / (workerStatus.totalProcessed + workerStatus.totalFailed)) * 100).toFixed(2)
            : 0,
          pid: workerStatus.pid
        },
        queue: {
          totalQueued: queueStats.totalQueued,
          totalProcessing: queueStats.totalProcessing,
          oldestJobAge: queueStats.oldestJob 
            ? Math.floor((Date.now() - new Date(queueStats.oldestJob.createdAt).getTime()) / 1000)
            : null
        },
        overall: overallStatus
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/monitoring/queue/info
 * Get detailed queue information
 */
router.get('/queue/info', async (_req, res) => {
  try {
    const stats = await QueueService.getQueueStats()
    const workerStatus = getWorkerStatus()

    res.json({
      success: true,
      data: {
        queueName: 'jastipin_jobs',
        queued: stats.totalQueued,
        processing: stats.totalProcessing,
        failed: stats.totalFailed,
        completed: stats.totalCompleted,
        avgProcessingTime: `${stats.avgProcessingTime}ms`,
        worker: {
          running: workerStatus.isRunning,
          uptime: `${workerStatus.uptime}s`,
          activeJobs: workerStatus.activeJobs,
          processedTotal: workerStatus.totalProcessed,
          failedTotal: workerStatus.totalFailed
        },
        oldestJob: stats.oldestJob ? {
          id: stats.oldestJob.id,
          retries: stats.oldestJob.retryCount,
          ageSeconds: Math.floor((Date.now() - new Date(stats.oldestJob.createdAt).getTime()) / 1000)
        } : null,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
