import db from '../lib/prisma.js'
/**
 * Health Check Service
 * Monitors system health: database, services, memory, uptime
 */


const startTime = Date.now()

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  services: {
    database: {
      status: 'up' | 'down'
      responseTime?: number
      error?: string
    }
    server: {
      status: 'up' | 'down'
      memory: {
        heapUsed: number
        heapTotal: number
        rss: number
        external: number
      }
    }
  }
  environment: {
    nodeVersion: string
    nodeEnv: string
    platform: string
  }
}

/**
 * Check database connection
 */
async function checkDatabase(): Promise<{
  status: 'up' | 'down'
  responseTime?: number
  error?: string
}> {
  try {
    const startCheck = Date.now()
    await db.$queryRaw`SELECT 1`
    const responseTime = Date.now() - startCheck

    return {
      status: 'up',
      responseTime,
    }
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get server memory usage
 */
function getMemoryUsage() {
  const memUsage = process.memoryUsage()
  return {
    heapUsed: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
    heapTotal: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
    rss: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100,
    external: Math.round((memUsage.external / 1024 / 1024) * 100) / 100,
  }
}

/**
 * Get system uptime in seconds
 */
function getUptime(): number {
  return Math.floor((Date.now() - startTime) / 1000)
}

/**
 * Perform comprehensive health check
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const databaseStatus = await checkDatabase()
  const memoryUsage = getMemoryUsage()
  const uptime = getUptime()

  const overallStatus: 'healthy' | 'degraded' | 'unhealthy' =
    databaseStatus.status === 'up' ? 'healthy' : 'unhealthy'

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime,
    services: {
      database: databaseStatus,
      server: {
        status: 'up',
        memory: memoryUsage,
      },
    },
    environment: {
      nodeVersion: process.version,
      nodeEnv: process.env.NODE_ENV || 'development',
      platform: process.platform,
    },
  }
}

/**
 * Quick health check (minimal info)
 */
export function getQuickHealth() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: getUptime(),
  }
}
