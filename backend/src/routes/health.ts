/**
 * Health Check Routes
 * Endpoints for monitoring system health and status
 */

import express, { Router, Request, Response } from 'express'
import { getHealthStatus, getQuickHealth } from '../services/health.service.js'

const router: Router = express.Router()

/**
 * GET /health/status
 * Comprehensive health check including database, memory, uptime
 *
 * @returns {HealthStatus} Full system health information
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const healthStatus = await getHealthStatus()
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503
    res.status(statusCode).json(healthStatus)
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
})

/**
 * GET /health/quick
 * Quick health check (minimal response)
 *
 * @returns {Object} Quick status with timestamp and uptime
 */
router.get('/quick', (_req: Request, res: Response) => {
  res.json(getQuickHealth())
})

export default router
