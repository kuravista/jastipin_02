/**
 * Shipping Routes
 * GET /shipping/search - Search locations
 * POST /shipping/calculate - Calculate shipping cost
 */

import { Router, Response, Request, Router as ExpressRouter } from 'express'
import { searchDestinations, calculateShippingCost } from '../services/rajaongkir.service.js'

const router: ExpressRouter = Router()

/**
 * GET /shipping/search
 * Search domestic destinations (cities/subdistricts)
 */
router.get('/shipping/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query

    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Search query required' })
      return
    }

    if (q.length < 2) {
      res.status(400).json({ error: 'Search query must be at least 2 characters' })
      return
    }

    const results = await searchDestinations(q)

    res.json({
      success: true,
      data: results,
    })
  } catch (error: any) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
})

/**
 * POST /shipping/calculate
 * Calculate shipping cost between two locations
 * Body: { origin, destination, weight?, courier? }
 */
router.post('/shipping/calculate', async (req: Request, res: Response) => {
  try {
    const { origin, destination, weight = 1000, courier = 'jne:tiki:pos' } = req.body

    if (!origin || !destination) {
      res.status(400).json({ error: 'Origin and destination required' })
      return
    }

    const results = await calculateShippingCost(
      origin,
      destination,
      weight,
      courier
    )

    if (results.length === 0) {
      res.status(400).json({ error: 'Unable to calculate shipping cost' })
      return
    }

    res.json({
      success: true,
      data: results,
    })
  } catch (error: any) {
    console.error('Calculate error:', error)
    res.status(500).json({ error: 'Calculation failed' })
  }
})

export default router
