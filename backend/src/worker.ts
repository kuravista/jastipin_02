#!/usr/bin/env node

/**
 * Worker Process Entry Point
 * Run with: npm run worker:dev (development) or npm run worker:start (production)
 * 
 * This is a standalone process that continuously processes jobs from the pgmq queue.
 * It can be run separately from the API server for horizontal scaling.
 * 
 * Environment variables:
 * - DIRECT_URL: PostgreSQL direct connection (required for PGMQ)
 *   OR DATABASE_URL if it's a direct connection (no pgbouncer)
 * - LOG_LEVEL: debug, info, warn, error (default: info)
 * - POLL_INTERVAL_MS: Queue poll interval (default: 100ms)
 * 
 * IMPORTANT: 
 * Worker requires DIRECT connection to PostgreSQL (port 5432), NOT pooled connection.
 * PGMQ (PostgreSQL Message Queue) does not work through PgBouncer.
 * Use DIRECT_URL from .env or ensure DATABASE_URL points to port 5432.
 */

import 'dotenv/config'
import { initializeWorker, startWorker } from './workers/index.js'

// Determine which database URL to use
// Priority: DIRECT_URL > WORKER_DATABASE_URL > DATABASE_URL (if direct)
const getDatabaseUrl = (): string => {
  // First try DIRECT_URL (recommended for worker)
  if (process.env.DIRECT_URL) {
    return process.env.DIRECT_URL
  }
  
  // Fallback to WORKER_DATABASE_URL if set
  if (process.env.WORKER_DATABASE_URL) {
    return process.env.WORKER_DATABASE_URL
  }
  
  // Last resort: DATABASE_URL (but warn if it's pooled)
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL
    if (url.includes('pgbouncer=true') || url.includes(':6543')) {
      console.warn('⚠️  WARNING: DATABASE_URL appears to be using PgBouncer pooled connection')
      console.warn('⚠️  PGMQ requires direct connection (port 5432), not pooled (port 6543)')
      console.warn('⚠️  Please set DIRECT_URL in .env for proper worker operation')
      throw new Error('Worker requires direct database connection. Set DIRECT_URL in .env')
    }
    return url
  }
  
  throw new Error('No database URL found. Set DIRECT_URL or DATABASE_URL in .env')
}

// Override DATABASE_URL for Prisma to use direct connection
try {
  process.env.DATABASE_URL = getDatabaseUrl()
} catch (error: any) {
  console.error(`[FATAL] ${error.message}`)
  process.exit(1)
}

// Startup message
console.log('═══════════════════════════════════════════════════════════')
console.log('  Jastipin Queue Worker Starting...')
console.log('═══════════════════════════════════════════════════════════')
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`Database: ${process.env.DATABASE_URL ? '✓ Direct connection' : '✗ MISSING'}`)
console.log(`Process ID: ${process.pid}`)
console.log('═══════════════════════════════════════════════════════════')

/**
 * Main startup routine
 */
async function main() {
  try {
    // Database URL already validated and set above

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
