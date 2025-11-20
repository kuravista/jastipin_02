/**
 * Checkout Routes
 * DP checkout flow endpoints
 */

import express, { type Router } from 'express'
import { processCheckoutDP, getOrderSummary } from '../services/checkout-dp.service.js'

const router: Router = express.Router()

/**
 * POST /api/checkout/dp
 * Create order with DP payment (minimal checkout)
 * Public endpoint (no auth required for checkout)
 */
router.post('/dp', async (req, res) => {
  try {
    const {
      tripId,
      participantPhone,
      participantName,
      address,
      items
    } = req.body
    
    // Validation
    if (!tripId || !participantPhone || !participantName) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: tripId, participantPhone, participantName'
      })
      return
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Items array required with at least one product'
      })
      return
    }
    
    // Validate items structure
    for (const item of items) {
      if (!item.productId || !item.quantity) {
        res.status(400).json({
          success: false,
          error: 'Each item must have productId and quantity'
        })
        return
      }
      
      if (item.quantity < 1) {
        res.status(400).json({
          success: false,
          error: 'Quantity must be at least 1'
        })
        return
      }
    }
    
    // Validate address structure if provided
    if (address) {
      const requiredAddressFields = [
        'recipientName',
        'phone',
        'addressText',
        'provinceId',
        'provinceName',
        'cityId',
        'cityName',
        'districtId',
        'districtName'
      ]
      
      for (const field of requiredAddressFields) {
        if (!address[field]) {
          res.status(400).json({
            success: false,
            error: `Address field '${field}' is required`
          })
          return
        }
      }
    }
    
    // Process checkout
    const result = await processCheckoutDP({
      tripId,
      participantPhone,
      participantName,
      address,
      items
    })
    
    if (!result.success) {
      res.status(400).json(result)
      return
    }
    
    res.status(201).json(result)
    
  } catch (error: any) {
    console.error('Checkout DP error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Checkout failed'
    })
  }
})

/**
 * GET /api/checkout/order/:orderId
 * Get order summary (for payment confirmation page)
 * Public endpoint
 */
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params
    
    const order = await getOrderSummary(orderId)
    
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      })
      return
    }
    
    res.json({
      success: true,
      data: order
    })
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch order'
    })
  }
})

export default router
