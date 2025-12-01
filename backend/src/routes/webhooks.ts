/**
 * Webhook Routes
 * Payment gateway callbacks and external integrations
 */

import express, { type Router } from 'express'
import db from '../lib/prisma.js'
import { releaseStock, extendStockLock } from '../services/stock-lock.service.js'

const router: Router = express.Router()

/**
 * POST /api/webhooks/payment/dp
 * Payment gateway callback for DP payment
 * Updates order status and locks stock
 */
router.post('/payment/dp', async (req, res) => {
  try {
    const { orderId, status, paymentId } = req.body
    
    // TODO: Verify signature/secret from payment gateway
    // const signature = req.headers['x-signature']
    // if (!verifySignature(signature, req.body)) {
    //   return res.status(401).json({ error: 'Invalid signature' })
    // }
    
    if (!orderId || !status) {
      res.status(400).json({ 
        success: false,
        error: 'Missing required fields: orderId, status' 
      })
      return
    }
    
    console.log('[WEBHOOK] DP Payment:', { orderId, status, paymentId })
    
    // Get order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { 
        OrderItem: true,
        Trip: {
          include: {
            User: true
          }
        }
      }
    })
    
    if (!order) {
      res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      })
      return
    }
    
    // Check current status
    if (order.status !== 'pending_dp') {
      res.status(400).json({
        success: false,
        error: `Order status is ${order.status}, expected pending_dp`
      })
      return
    }
    
    if (status === 'paid' || status === 'success') {
      // Update order status
      const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: {
          status: 'awaiting_validation',
          dpPaidAt: new Date(),
          dpPaymentId: paymentId || null
        }
      })
      
      // Extend stock lock (from 30min to 24h for validation window)
      await extendStockLock(orderId, 24 * 60 * 60 * 1000) // 24 hours
      
      // TODO: Notify jastiper via WhatsApp
      console.log(`[NOTIFICATION] Notify jastiper ${order.Trip?.User?.email}: New order awaiting validation`)
      
      res.json({
        success: true,
        message: 'DP payment received',
        data: updatedOrder
      })
      return
      
    } else if (status === 'failed' || status === 'expired') {
      // Cancel order and release stock
      await db.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          rejectionReason: `DP payment ${status}`
        }
      })
      
      // Release stock (restore)
      await releaseStock(orderId, true)
      
      res.json({
        success: true,
        message: 'Order cancelled due to payment failure'
      })
      return
      
    } else {
      res.status(400).json({
        success: false,
        error: `Unknown payment status: ${status}`
      })
      return
    }
    
  } catch (error: any) {
    console.error('[WEBHOOK] DP Payment error:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || 'Webhook processing failed' 
    })
  }
})

/**
 * POST /api/webhooks/payment/final
 * Payment gateway callback for final payment
 * Confirms order and releases stock lock
 */
router.post('/payment/final', async (req, res) => {
  try {
    const { orderId, status, paymentId } = req.body
    
    // TODO: Verify signature
    
    if (!orderId || !status) {
      res.status(400).json({ 
        success: false,
        error: 'Missing required fields: orderId, status' 
      })
      return
    }
    
    console.log('[WEBHOOK] Final Payment:', { orderId, status, paymentId })
    
    // Get order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { 
        Participant: true,
        Trip: true
      }
    })
    
    if (!order) {
      res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      })
      return
    }
    
    // Check current status
    if (order.status !== 'awaiting_payment') {
      res.status(400).json({
        success: false,
        error: `Order status is ${order.status}, expected awaiting_payment`
      })
      return
    }
    
    if (status === 'paid' || status === 'success') {
      // Update order status
      const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: {
          status: 'confirmed',
          finalPaidAt: new Date(),
          finalPaymentId: paymentId || null
        }
      })
      
      // Release stock lock (no restore - order confirmed)
      await releaseStock(orderId, false)
      
      // TODO: Notify participant via WhatsApp
      console.log(`[NOTIFICATION] Notify participant ${order.Participant?.phone}: Order confirmed!`)
      
      res.json({
        success: true,
        message: 'Final payment received, order confirmed',
        data: updatedOrder
      })
      return
      
    } else if (status === 'failed' || status === 'expired') {
      // Revert to awaiting_validation (allow jastiper to resend payment link)
      await db.order.update({
        where: { id: orderId },
        data: {
          status: 'awaiting_validation'
        }
      })
      
      res.json({
        success: true,
        message: 'Final payment failed, order reverted to awaiting_validation'
      })
      return
      
    } else {
      res.status(400).json({
        success: false,
        error: `Unknown payment status: ${status}`
      })
      return
    }
    
  } catch (error: any) {
    console.error('[WEBHOOK] Final Payment error:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || 'Webhook processing failed' 
    })
  }
})

export default router
