/**
 * Stock Lock Service
 * Manages stock reservation during DP flow using in-memory storage
 * TODO: Replace with Redis for production scalability
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const STOCK_LOCK_TTL = 30 * 60 * 1000  // 30 minutes in milliseconds
const STOCK_LOCK_PREFIX = 'stock_lock:'

// In-memory storage for stock locks (replace with Redis in production)
const locks = new Map<string, { items: StockLockItem[]; expires: number }>()

export interface StockLockItem {
  productId: string
  quantity: number
}

/**
 * Reserve stock when DP is paid
 * Uses in-memory storage with TTL management
 */
export async function lockStock(
  orderId: string,
  items: StockLockItem[]
): Promise<{ success: boolean; error?: string }> {
  
  try {
    // Check if sufficient stock available
    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, type: true, title: true }
      })
      
      if (!product) {
        return { success: false, error: `Product not found: ${item.productId}` }
      }
      
      // Skip stock check for tasks (stock can be null)
      if (product.type === 'tasks') continue
      
      if (product.stock === null || product.stock < item.quantity) {
        return { 
          success: false, 
          error: `Insufficient stock for "${product.title}". Available: ${product.stock}, Requested: ${item.quantity}` 
        }
      }
    }
    
    // Lock stock in memory with TTL
    const lockKey = `${STOCK_LOCK_PREFIX}${orderId}`
    locks.set(lockKey, {
      items,
      expires: Date.now() + STOCK_LOCK_TTL
    })
    
    // Decrement stock in database (for goods only)
    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { type: true }
      })
      
      if (product?.type === 'goods') {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity }
          }
        })
      }
    }
    
    return { success: true }
    
  } catch (error: any) {
    console.error('Error locking stock:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Release stock lock (when order confirmed or cancelled)
 */
export async function releaseStock(
  orderId: string,
  shouldRestoreStock: boolean = false
): Promise<void> {
  
  try {
    const lockKey = `${STOCK_LOCK_PREFIX}${orderId}`
    const lockData = locks.get(lockKey)
    
    if (!lockData) return
    
    const items = lockData.items
    
    // Restore stock if order was cancelled before confirmation
    if (shouldRestoreStock) {
      for (const item of items) {
        const product = await db.product.findUnique({
          where: { id: item.productId },
          select: { type: true }
        })
        
        if (product?.type === 'goods') {
          await db.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity }
            }
          })
        }
      }
    }
    
    // Remove lock from memory
    locks.delete(lockKey)
    
  } catch (error) {
    console.error('Error releasing stock:', error)
  }
}

/**
 * Extend stock lock TTL (when payment is being processed)
 */
export async function extendStockLock(
  orderId: string,
  additionalSeconds: number = 600  // 10 minutes
): Promise<void> {
  const lockKey = `${STOCK_LOCK_PREFIX}${orderId}`
  const lockData = locks.get(lockKey)
  
  if (lockData) {
    lockData.expires = lockData.expires + (additionalSeconds * 1000)
    locks.set(lockKey, lockData)
  }
}

/**
 * Cleanup expired locks
 * Should be called periodically (e.g., via cron job)
 */
export async function cleanupExpiredLocks(): Promise<number> {
  const now = Date.now()
  let cleaned = 0
  
  const entries = Array.from(locks.entries())
  for (const [key, lockData] of entries) {
    if (lockData.expires < now) {
      const orderId = key.replace(STOCK_LOCK_PREFIX, '')
      await releaseStock(orderId, true) // restore stock for expired locks
      cleaned++
    }
  }
  
  return cleaned
}

/**
 * Get all active locks (for monitoring/debugging)
 */
export function getActiveLocks() {
  const now = Date.now()
  const active = []
  
  const entries = Array.from(locks.entries())
  for (const [key, lockData] of entries) {
    if (lockData.expires > now) {
      active.push({
        orderId: key.replace(STOCK_LOCK_PREFIX, ''),
        items: lockData.items,
        expiresIn: Math.floor((lockData.expires - now) / 1000) // seconds
      })
    }
  }
  
  return active
}

/**
 * Check if order has active stock lock
 */
export function hasActiveLock(orderId: string): boolean {
  const lockKey = `${STOCK_LOCK_PREFIX}${orderId}`
  const lockData = locks.get(lockKey)
  
  if (!lockData) return false
  
  return lockData.expires > Date.now()
}

/**
 * Get memory statistics for monitoring
 */
export function getMemoryStats() {
  const now = Date.now()
  const entries = Array.from(locks.entries())
  
  let activeLocks = 0
  let expiredLocks = 0
  let totalProductsLocked = 0
  let oldestLockAge = 0
  let newestLockAge = 0
  
  for (const [_key, lockData] of entries) {
    if (lockData.expires > now) {
      activeLocks++
      totalProductsLocked += lockData.items.length
      
      const lockAge = now - (lockData.expires - STOCK_LOCK_TTL)
      if (oldestLockAge === 0 || lockAge > oldestLockAge) {
        oldestLockAge = lockAge
      }
      if (newestLockAge === 0 || lockAge < newestLockAge) {
        newestLockAge = lockAge
      }
    } else {
      expiredLocks++
    }
  }
  
  // Memory usage estimation (rough)
  const memoryUsageBytes = entries.reduce((total, [key, lockData]) => {
    const keySize = key.length * 2 // UTF-16
    const dataSize = JSON.stringify(lockData).length * 2
    return total + keySize + dataSize
  }, 0)
  
  return {
    activeLocks,
    expiredLocks,
    totalLocks: locks.size,
    totalProductsLocked,
    memoryUsageMB: (memoryUsageBytes / 1024 / 1024).toFixed(2),
    oldestLockAgeMinutes: Math.floor(oldestLockAge / 60000),
    newestLockAgeMinutes: Math.floor(newestLockAge / 60000),
    averageLockAgeMinutes: activeLocks > 0 ? Math.floor(oldestLockAge / activeLocks / 60000) : 0,
    timestamp: new Date().toISOString()
  }
}

/**
 * Get health status based on thresholds
 */
export function getHealthStatus() {
  const stats = getMemoryStats()
  
  // Thresholds for warning
  const WARN_ACTIVE_LOCKS = 100      // > 100 active locks
  const WARN_MEMORY_MB = 10          // > 10MB memory
  const WARN_EXPIRED_RATIO = 0.2     // > 20% expired (needs cleanup)
  
  const warnings = []
  let status: 'healthy' | 'warning' | 'critical' = 'healthy'
  
  // Check active locks threshold
  if (stats.activeLocks > WARN_ACTIVE_LOCKS) {
    warnings.push(`High active locks: ${stats.activeLocks} (threshold: ${WARN_ACTIVE_LOCKS})`)
    status = 'warning'
  }
  
  // Check memory usage
  const memMB = parseFloat(stats.memoryUsageMB)
  if (memMB > WARN_MEMORY_MB) {
    warnings.push(`High memory usage: ${stats.memoryUsageMB}MB (threshold: ${WARN_MEMORY_MB}MB)`)
    status = 'warning'
  }
  
  // Check expired ratio
  if (stats.totalLocks > 0) {
    const expiredRatio = stats.expiredLocks / stats.totalLocks
    if (expiredRatio > WARN_EXPIRED_RATIO) {
      warnings.push(`High expired ratio: ${(expiredRatio * 100).toFixed(1)}% (threshold: ${WARN_EXPIRED_RATIO * 100}%)`)
      if (status === 'warning') status = 'critical'
    }
  }
  
  // Recommendation
  let recommendation = 'System healthy'
  if (stats.activeLocks > 500 || memMB > 50) {
    recommendation = '⚠️ CONSIDER UPGRADING TO REDIS - High load detected'
    status = 'critical'
  } else if (status === 'warning') {
    recommendation = 'Monitor closely, cleanup expired locks regularly'
  }
  
  return {
    status,
    warnings,
    recommendation,
    stats,
    thresholds: {
      maxActiveLocks: WARN_ACTIVE_LOCKS,
      maxMemoryMB: WARN_MEMORY_MB,
      maxExpiredRatio: WARN_EXPIRED_RATIO,
      redisUpgradeThreshold: {
        activeLocks: 500,
        memoryMB: 50
      }
    }
  }
}
