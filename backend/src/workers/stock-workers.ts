/**
 * Stock Workers
 * Background jobs for stock management
 */

import { cleanupExpiredLocks, getMemoryStats } from '../services/stock-lock.service.js'

/**
 * Stock Lock Cleanup Worker
 * Removes expired stock locks and restores stock
 * Should run: Every 10 minutes
 */
export async function processStockLockCleanup() {
  console.log('[WORKER] Stock Lock Cleanup: Starting...')
  
  try {
    const statsBefore = getMemoryStats()
    console.log(`[WORKER] Stock Lock Cleanup: Active locks before: ${statsBefore.activeLocks}`)
    
    // Cleanup expired locks
    const cleaned = await cleanupExpiredLocks()
    
    const statsAfter = getMemoryStats()
    console.log(`[WORKER] Stock Lock Cleanup: Cleaned ${cleaned} expired locks`)
    console.log(`[WORKER] Stock Lock Cleanup: Active locks after: ${statsAfter.activeLocks}`)
    
    return {
      success: true,
      cleaned,
      activeLocks: statsAfter.activeLocks,
      memoryUsageMB: statsAfter.memoryUsageMB
    }
    
  } catch (error: any) {
    console.error('[WORKER] Stock Lock Cleanup error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Stock Sync Worker
 * Syncs in-memory stock locks with database (safety check)
 * Should run: Every 1 hour
 */
export async function processStockSync() {
  console.log('[WORKER] Stock Sync: Starting...')
  
  try {
    const stats = getMemoryStats()
    
    // Log current state for monitoring
    console.log('[WORKER] Stock Sync:', {
      activeLocks: stats.activeLocks,
      expiredLocks: stats.expiredLocks,
      memoryUsageMB: stats.memoryUsageMB,
      totalProductsLocked: stats.totalProductsLocked
    })
    
    // TODO: Cross-check with database if needed
    // For example: verify that all orders with status 'awaiting_validation' 
    // have corresponding stock locks
    
    return {
      success: true,
      stats
    }
    
  } catch (error: any) {
    console.error('[WORKER] Stock Sync error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
