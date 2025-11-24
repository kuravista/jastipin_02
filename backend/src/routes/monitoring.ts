/**
 * Monitoring Routes
 * Health checks and system metrics
 */

import express, { type Router } from 'express'
import { getMemoryStats, getHealthStatus, getActiveLocks, cleanupExpiredLocks } from '../services/stock-lock.service.js'

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

export default router
