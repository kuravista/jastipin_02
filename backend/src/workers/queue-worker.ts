/**
 * Queue Worker
 * Main worker process that consumes jobs from pgmq and processes them
 * Run with: npm run start:worker
 */

import {
  dequeue,
  complete,
  fail,
  initializeQueue,
  getQueueStats,
  healthCheck,
} from '../services/queue.service.js'
import { executeJob } from './job-handlers.js'
import { AnyJob } from '../types/queue.types.js'

// Worker configuration
const POLL_INTERVAL_MS = 100 // Poll queue every 100ms
const HEALTH_CHECK_INTERVAL_MS = 30000 // Log health every 30s
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 30000 // Wait 30s for active jobs

// Worker state
let isRunning = false
let activeJobs = 0
let totalProcessed = 0
let totalFailed = 0
const startTime = Date.now()

/**
 * Initialize worker
 */
export async function initializeWorker(): Promise<void> {
  console.log('[WORKER] Initializing...')
  try {
    await initializeQueue()
    console.log('[WORKER] Queue initialized')
  } catch (error: any) {
    console.error('[WORKER] Failed to initialize queue:', error)
    throw error
  }
}

/**
 * Main worker loop - continuously process jobs
 */
export async function startWorker(): Promise<void> {
  if (isRunning) {
    console.warn('[WORKER] Worker is already running')
    return
  }

  isRunning = true
  console.log('[WORKER] Started ✓')
  console.log(`[WORKER] Process ID: ${process.pid}`)
  console.log(`[WORKER] Poll interval: ${POLL_INTERVAL_MS}ms`)

  // Setup graceful shutdown handlers
  setupGracefulShutdown()

  // Start the worker loop
  workerLoop()

  // Start health check logger
  startHealthCheckLogger()
}

/**
 * Main worker loop
 */
async function workerLoop(): Promise<void> {
  while (isRunning) {
    try {
      // Get next job from queue
      const job = await dequeue()

      if (!job) {
        // No jobs available, wait a bit before polling again
        await sleep(POLL_INTERVAL_MS)
        continue
      }

      // Process the job
      await processJob(job)
    } catch (error: any) {
      console.error('[WORKER] Unexpected error in worker loop:', error)
      // Continue the loop even on error
      await sleep(POLL_INTERVAL_MS)
    }
  }

  console.log('[WORKER] Worker loop ended')
}

/**
 * Process a single job
 */
async function processJob(
  job: AnyJob & { msg_id: number; vt: number }
): Promise<void> {
  activeJobs++
  const startTime = Date.now()

  try {
    console.log(
      `[WORKER] Processing job: ${job.type} (msg_id=${job.msg_id}, retry=${job.retryCount ?? 0})`
    )

    // Execute the job handler
    await executeJob(job)

    // Mark job as complete
    await complete(job.msg_id)

    const duration = Date.now() - startTime
    console.log(`[WORKER] Job completed: ${job.type} (msg_id=${job.msg_id}, duration=${duration}ms)`)

    totalProcessed++
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(
      `[WORKER] Job failed: ${job.type} (msg_id=${job.msg_id}, duration=${duration}ms, error=${error.message})`
    )

    // Mark job as failed (will handle retry logic in queue service)
    await fail(job.msg_id, job, error)

    totalFailed++
  } finally {
    activeJobs--
  }
}

/**
 * Start periodic health check logging
 */
function startHealthCheckLogger(): void {
  const healthCheckInterval = setInterval(async () => {
    if (!isRunning) {
      clearInterval(healthCheckInterval)
      return
    }

    try {
      const isHealthy = await healthCheck()
      const stats = await getQueueStats()
      const uptime = Math.floor((Date.now() - startTime) / 1000)

      console.log('[HEALTH]', {
        status: isHealthy ? 'UP' : 'DOWN',
        uptime: `${uptime}s`,
        activeJobs,
        totalProcessed,
        totalFailed,
        queueStats: {
          queued: stats.totalQueued,
          processing: stats.totalProcessing,
        },
      })
    } catch (error: any) {
      console.error('[HEALTH] Health check failed:', error.message)
    }
  }, HEALTH_CHECK_INTERVAL_MS)
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(): void {
  const signals = ['SIGTERM', 'SIGINT']

  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`\n[WORKER] Received ${signal}, shutting down gracefully...`)
      await gracefulShutdown()
    })
  })

  // Unhandled rejection handler
  process.on('unhandledRejection', (reason: any) => {
    console.error('[WORKER] Unhandled rejection:', reason)
    gracefulShutdown().then(() => process.exit(1))
  })

  // Uncaught exception handler
  process.on('uncaughtException', (error: Error) => {
    console.error('[WORKER] Uncaught exception:', error)
    gracefulShutdown().then(() => process.exit(1))
  })
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown(): Promise<void> {
  isRunning = false

  console.log('[WORKER] Waiting for active jobs to complete...')
  console.log(`[WORKER] Active jobs: ${activeJobs}`)

  // Wait for active jobs to complete or timeout
  const shutdownStart = Date.now()
  while (activeJobs > 0 && Date.now() - shutdownStart < GRACEFUL_SHUTDOWN_TIMEOUT_MS) {
    await sleep(100)
  }

  if (activeJobs > 0) {
    console.warn(
      `[WORKER] Timeout waiting for ${activeJobs} active jobs, forcing shutdown`
    )
  }

  // Print final stats
  const uptime = Math.floor((Date.now() - startTime) / 1000)
  console.log('[WORKER] Final Stats:')
  console.log(`  Uptime: ${uptime}s`)
  console.log(`  Total Processed: ${totalProcessed}`)
  console.log(`  Total Failed: ${totalFailed}`)
  console.log(`  Success Rate: ${totalProcessed > 0 ? ((totalProcessed / (totalProcessed + totalFailed)) * 100).toFixed(2) : 0}%`)

  console.log('[WORKER] Shutdown complete ✓')
  process.exit(0)
}

/**
 * Utility: sleep for milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Get worker status
 */
export function getWorkerStatus() {
  const uptime = Math.floor((Date.now() - startTime) / 1000)
  return {
    isRunning,
    uptime,
    activeJobs,
    totalProcessed,
    totalFailed,
    pid: process.pid,
  }
}

// If this file is run directly, start the worker
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeWorker()
    .then(() => startWorker())
    .catch((error) => {
      console.error('[WORKER] Fatal error:', error)
      process.exit(1)
    })
}
