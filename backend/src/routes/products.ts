/**
 * Product Management Routes
 * POST /products - Create product
 * GET /products - List all user products
 * PATCH /products/:productId - Update product
 * DELETE /products/:productId - Delete product
 */

import { Router, Response, Router as ExpressRouter } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  createProductSchema,
} from '../utils/validators.js'
import { AuthRequest } from '../types/index.js'

const router: ExpressRouter = Router()
const db = new PrismaClient()

/**
 * POST /products
 * Create new product (requires trip_id in body)
 */
router.post(
  '/products',
  authMiddleware,
  validate(createProductSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const trip = await db.trip.findUnique({
        where: { id: req.body.tripId }, // Fixed: use camelCase
      })

      if (!trip) {
        res.status(404).json({ error: 'Trip not found' })
        return
      }

      if (trip.jastiperId !== req.user!.id) {
        res.status(403).json({ error: 'Not authorized' })
        return
      }

      // Generate slug from title
      const slug = req.body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      
      const product = await db.product.create({
        data: {
          tripId: req.body.tripId, // Fixed: camelCase
          title: req.body.title,
          slug: slug || 'product',
          price: req.body.price,
          stock: req.body.isUnlimitedStock ? null : req.body.stock,
          isUnlimitedStock: req.body.isUnlimitedStock || false,
          description: req.body.description,
          image: req.body.image,
          // NEW: DP flow fields
          type: req.body.type || 'goods',
          unit: req.body.unit,
          weightGram: req.body.weightGram,
          requiresDetails: req.body.requiresDetails || false,
          requiresProof: req.body.requiresProof || false,
          markupType: req.body.markupType || 'percent',
          markupValue: req.body.markupValue || 0,
        },
        include: { Trip: true },
      })

      res.status(201).json(product)
    } catch (error: any) {
      console.error('Product creation error:', error)
      res.status(500).json({ 
        error: 'Failed to create product',
        details: error.message,
        code: error.code,
        meta: error.meta
      })
    }
  }
)

/**
 * GET /products
 * List all user's products
 */
router.get(
  '/products',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const products = await db.product.findMany({
        where: {
          Trip: {
            jastiperId: req.user!.id,
          },
        },
        include: { Trip: true },
      })

      // Add debug log
      // console.log('Products fetched:', JSON.stringify(products, null, 2))

      res.json(products)
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch products' })
    }
  }
)

/**
 * PATCH /products/:productId
 * Update product (trip owner only)
 */
router.patch(
  '/products/:productId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const product = await db.product.findUnique({
        where: { id: req.params.productId },
        include: { Trip: true },
      })

      if (!product) {
        res.status(404).json({ error: 'Product not found' })
        return
      }

      if (product.Trip.jastiperId !== req.user!.id) {
        res.status(403).json({ error: 'Not authorized' })
        return
      }

      const updateData: any = { ...req.body }
      // If isUnlimitedStock is true, set stock to null; otherwise keep stock value
      if (updateData.isUnlimitedStock === true) {
        updateData.stock = null
      }

      const updated = await db.product.update({
        where: { id: req.params.productId },
        data: updateData,
        include: { Trip: true },
      })

      res.json(updated)
    } catch (error: any) {
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Product not found' })
        return
      }
      res.status(500).json({ error: 'Failed to update product' })
    }
  }
)

/**
 * DELETE /products/:productId
 * Delete product (trip owner only)
 */
router.delete(
  '/products/:productId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const product = await db.product.findUnique({
        where: { id: req.params.productId },
        include: { Trip: true },
      })

      if (!product) {
        res.status(404).json({ error: 'Product not found' })
        return
      }

      if (product.Trip.jastiperId !== req.user!.id) {
        res.status(403).json({ error: 'Not authorized' })
        return
      }

      await db.product.delete({
        where: { id: req.params.productId },
      })

      res.json({ message: 'Product deleted successfully' })
    } catch (error: any) {
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Product not found' })
        return
      }
      res.status(500).json({ error: 'Failed to delete product' })
    }
  }
)

export default router
