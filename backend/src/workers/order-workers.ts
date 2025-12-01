import db from '../lib/prisma.js'
/**
 * Order Workers
 * Background jobs for order management
 */

import { releaseStock } from '../services/stock-lock.service.js'


/**
 * Auto-Refund Worker
 * Finds orders awaiting_validation > 24 hours and auto-rejects them
 * Should run: Every 1 hour
 */
export async function processAutoRefund() {
  console.log('[WORKER] Auto-refund: Starting...')
  
  try {
    const now = new Date()
    const threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24h ago
    
    // Find orders awaiting validation > 24h
    const expiredOrders = await db.order.findMany({
      where: {
        status: 'awaiting_validation',
        dpPaidAt: {
          lt: threshold
        }
      },
      include: {
        Participant: true,
        OrderItem: true
      }
    })
    
    console.log(`[WORKER] Auto-refund: Found ${expiredOrders.length} expired orders`)
    
    let processed = 0
    let failed = 0
    
    for (const order of expiredOrders) {
      try {
        // Update order status
        await db.order.update({
          where: { id: order.id },
          data: {
            status: 'rejected',
            rejectionReason: 'Auto-rejected: Jastiper did not validate within 24 hours'
          }
        })
        
        // Release stock (restore)
        await releaseStock(order.id, true)
        
        // TODO: Trigger refund via payment gateway
        console.log(`[REFUND] Order ${order.id}: DP Rp ${order.dpAmount} to ${order.Participant?.phone}`)
        
        // TODO: Notify participant via WhatsApp
        console.log(`[NOTIFICATION] Participant ${order.Participant?.phone}: Order auto-cancelled, DP refunded`)
        
        processed++
      } catch (error) {
        console.error(`[WORKER] Auto-refund failed for order ${order.id}:`, error)
        failed++
      }
    }
    
    console.log(`[WORKER] Auto-refund: Completed. Processed: ${processed}, Failed: ${failed}`)
    
    return {
      success: true,
      processed,
      failed,
      total: expiredOrders.length
    }
    
  } catch (error: any) {
    console.error('[WORKER] Auto-refund error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Expired DP Worker
 * Cancels pending_dp orders > 30 minutes and releases stock
 * Should run: Every 5 minutes
 */
export async function processExpiredDP() {
  console.log('[WORKER] Expired DP: Starting...')
  
  try {
    const now = new Date()
    const threshold = new Date(now.getTime() - 30 * 60 * 1000) // 30 min ago
    
    // Find pending_dp orders created > 30 min ago
    const expiredOrders = await db.order.findMany({
      where: {
        status: 'pending_dp',
        createdAt: {
          lt: threshold
        }
      },
      include: {
        OrderItem: true
      }
    })
    
    console.log(`[WORKER] Expired DP: Found ${expiredOrders.length} expired orders`)
    
    let processed = 0
    let failed = 0
    
    for (const order of expiredOrders) {
      try {
        // Cancel order
        await db.order.update({
          where: { id: order.id },
          data: {
            status: 'cancelled',
            rejectionReason: 'DP payment expired (30 minutes timeout)'
          }
        })
        
        // Release stock (restore)
        await releaseStock(order.id, true)
        
        console.log(`[WORKER] Expired DP: Cancelled order ${order.id}`)
        processed++
      } catch (error) {
        console.error(`[WORKER] Expired DP failed for order ${order.id}:`, error)
        failed++
      }
    }
    
    console.log(`[WORKER] Expired DP: Completed. Processed: ${processed}, Failed: ${failed}`)
    
    return {
      success: true,
      processed,
      failed,
      total: expiredOrders.length
    }
    
  } catch (error: any) {
    console.error('[WORKER] Expired DP error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Final Payment Reminder Worker
 * Sends reminder for awaiting_payment orders
 * Should run: Every 6 hours
 */
export async function processFinalPaymentReminder() {
  console.log('[WORKER] Final Payment Reminder: Starting...')
  
  try {
    // Find orders awaiting payment
    const awaitingOrders = await db.order.findMany({
      where: {
        status: 'awaiting_payment'
      },
      include: {
        Participant: true
      }
    })
    
    console.log(`[WORKER] Final Payment Reminder: Found ${awaitingOrders.length} orders`)
    
    let sent = 0
    
    for (const order of awaitingOrders) {
      try {
        // TODO: Send WhatsApp reminder
        console.log(`[NOTIFICATION] Reminder to ${order.Participant?.phone}: Please complete final payment for order ${order.id}`)
        sent++
      } catch (error) {
        console.error(`[WORKER] Reminder failed for order ${order.id}:`, error)
      }
    }
    
    console.log(`[WORKER] Final Payment Reminder: Sent ${sent} reminders`)
    
    return {
      success: true,
      sent,
      total: awaitingOrders.length
    }
    
  } catch (error: any) {
    console.error('[WORKER] Final Payment Reminder error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Completed Order Cleanup
 * Archives or cleans up old completed/cancelled orders
 * Should run: Daily
 */
export async function processCompletedOrderCleanup() {
  console.log('[WORKER] Completed Order Cleanup: Starting...')
  
  try {
    const now = new Date()
    const threshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
    
    // Count old completed orders
    const oldOrders = await db.order.count({
      where: {
        OR: [
          { status: 'completed' },
          { status: 'cancelled' },
          { status: 'rejected' }
        ],
        updatedAt: {
          lt: threshold
        }
      }
    })
    
    console.log(`[WORKER] Completed Order Cleanup: Found ${oldOrders} old orders (>90 days)`)
    
    // For MVP: Just log, don't delete
    // In production: Consider archiving to separate table or cold storage
    
    return {
      success: true,
      found: oldOrders,
      archived: 0,
      message: 'Cleanup disabled in MVP (log only)'
    }
    
  } catch (error: any) {
    console.error('[WORKER] Completed Order Cleanup error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
