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
        where: { id: req.body.trip_id },
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
          tripId: req.body.trip_id,
          title: req.body.title,
          slug: slug || 'product',
          price: req.body.price,
          stock: req.body.stock,
          description: req.body.description,
          image: req.body.image,
        },
        include: { trip: true },
      })

      res.status(201).json(product)
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create product' })
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
          trip: {
            jastiperId: req.user!.id,
          },
        },
        include: { trip: true },
      })

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
        include: { trip: true },
      })

      if (!product) {
        res.status(404).json({ error: 'Product not found' })
        return
      }

      if (product.trip.jastiperId !== req.user!.id) {
        res.status(403).json({ error: 'Not authorized' })
        return
      }

      const updated = await db.product.update({
        where: { id: req.params.productId },
        data: req.body,
        include: { trip: true },
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
        include: { trip: true },
      })

      if (!product) {
        res.status(404).json({ error: 'Product not found' })
        return
      }

      if (product.trip.jastiperId !== req.user!.id) {
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
