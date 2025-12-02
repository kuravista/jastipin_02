#!/usr/bin/env node

/**
 * Worker Process Entry Point
 * Run with: npm run start:worker or node dist/worker.js
 * 
 * This is a standalone process that continuously processes jobs from the pgmq queue.
 * It can be run separately from the API server for horizontal scaling.
 * 
 * Environment variables:
 * - DATABASE_URL: PostgreSQL connection string (required)
 * - LOG_LEVEL: debug, info, warn, error (default: info)
 * - POLL_INTERVAL_MS: Queue poll interval (default: 100ms)
 */

import 'dotenv/config'
import { initializeWorker, startWorker } from './workers/index.js'

// Startup message
console.log('═══════════════════════════════════════════════════════════')
console.log('  Jastipin Queue Worker Starting...')
console.log('═══════════════════════════════════════════════════════════')
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`Database: ${process.env.DATABASE_URL ? 'Configured' : 'MISSING'}`)
console.log(`Process ID: ${process.pid}`)
console.log('═══════════════════════════════════════════════════════════')

/**
 * Main startup routine
 */
async function main() {
  try {
    // Validate environment
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    // Initialize and start worker
    console.log('[STARTUP] Initializing queue...')
    await initializeWorker()

    console.log('[STARTUP] Starting worker...')
    await startWorker()

    // Worker loop is now running
    console.log('[STARTUP] ✓ Worker ready and waiting for jobs')
  } catch (error: any) {
    console.error('[FATAL] Worker startup failed:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

// Start the worker
main().catch((error) => {
  console.error('[FATAL] Unexpected error:', error)
  process.exit(1)
})
