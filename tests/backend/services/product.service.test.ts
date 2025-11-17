/**
 * Product Service - CRUD Test Suite
 * Tests product creation, retrieval, updates, and deletion
 */

import { PrismaClient } from '@prisma/client'
import { AuthService } from '../../../backend/src/services/auth.service.js'
import { TripService } from '../../../backend/src/services/trip.service.js'

describe('Product CRUD Operations', () => {
  let db: PrismaClient
  let authService: AuthService
  let tripService: TripService
  let testJastiperId: string
  let testTripId: string
  let testUserIds: string[] = []
  let testTripIds: string[] = []
  let testProductIds: string[] = []

  beforeAll(async () => {
    db = new PrismaClient()
    authService = new AuthService(db)
    tripService = new TripService(db)

    const userResult = await authService.register(
      `product-jastipin-${Date.now()}@example.com`,
      'Password123',
      'Product Test Jastipin'
    )
    testJastiperId = userResult.user.id
    testUserIds.push(testJastiperId)

    const trip = await tripService.createTrip(testJastiperId, {
      slug: `product-trip-${Date.now()}`,
      title: 'Product Test Trip',
    })
    testTripId = trip.id
    testTripIds.push(testTripId)
  })

  afterAll(async () => {
    for (const productId of testProductIds) {
      try {
        await db.product.delete({ where: { id: productId } })
      } catch {
        // Ignore
      }
    }

    for (const tripId of testTripIds) {
      try {
        await db.trip.delete({ where: { id: tripId } })
      } catch {
        // Ignore
      }
    }

    for (const userId of testUserIds) {
      try {
        await db.user.delete({ where: { id: userId } })
      } catch {
        // Ignore
      }
    }

    await db.$disconnect()
  })

  describe('createProduct', () => {
    it('should create product with required fields', async () => {
      const product = await db.product.create({
        data: {
          tripId: testTripId,
          slug: `product-${Date.now()}`,
          name: 'Limited Edition Shoes',
          price: 150000,
          stock: 10,
        },
      })

      testProductIds.push(product.id)

      expect(product.id).toBeDefined()
      expect(product.tripId).toBe(testTripId)
      expect(product.name).toBe('Limited Edition Shoes')
      expect(product.price).toBe(150000)
      expect(product.stock).toBe(10)
      expect(product.createdAt).toBeDefined()
    })

    it('should create product with optional fields', async () => {
      const product = await db.product.create({
        data: {
          tripId: testTripId,
          slug: `product2-${Date.now()}`,
          name: 'Product with Details',
          description: 'Detailed product description',
          price: 99999,
          stock: 5,
          image: 'https://example.com/product.jpg',
          category: 'Electronics',
        },
      })

      testProductIds.push(product.id)

      expect(product.description).toBe('Detailed product description')
      expect(product.image).toBe('https://example.com/product.jpg')
      expect(product.category).toBe('Electronics')
    })

    it('should enforce unique slug per trip', async () => {
      const slug = `unique-prod-${Date.now()}`

      await db.product.create({
        data: {
          tripId: testTripId,
          slug,
          name: 'First Product',
          price: 50000,
          stock: 5,
        },
      }).then(p => testProductIds.push(p.id))

      try {
        await db.product.create({
          data: {
            tripId: testTripId,
            slug,
            name: 'Duplicate Slug Product',
            price: 60000,
            stock: 3,
          },
        })
        fail('Should have thrown constraint error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should allow same slug for products in different trips', async () => {
      const slug = `shared-prod-${Date.now()}`

      const product1 = await db.product.create({
        data: {
          tripId: testTripId,
          slug,
          name: 'Product in Trip 1',
          price: 100000,
          stock: 5,
        },
      })
      testProductIds.push(product1.id)

      const trip2 = await tripService.createTrip(testJastiperId, {
        slug: `trip2-${Date.now()}`,
        title: 'Second Trip',
      })
      testTripIds.push(trip2.id)

      const product2 = await db.product.create({
        data: {
          tripId: trip2.id,
          slug,
          name: 'Product in Trip 2',
          price: 150000,
          stock: 3,
        },
      })
      testProductIds.push(product2.id)

      expect(product1.id).not.toBe(product2.id)
    })
  })

  describe('getProduct', () => {
    let testProductId: string

    beforeAll(async () => {
      const product = await db.product.create({
        data: {
          tripId: testTripId,
          slug: `fetch-prod-${Date.now()}`,
          name: 'Product to Fetch',
          description: 'Test product for fetching',
          price: 250000,
          stock: 15,
        },
      })
      testProductId = product.id
      testProductIds.push(testProductId)
    })

    it('should retrieve product by ID', async () => {
      const product = await db.product.findUnique({
        where: { id: testProductId },
        include: { _count: { select: { orders: true } } },
      })

      expect(product).toBeDefined()
      expect(product?.id).toBe(testProductId)
      expect(product?.name).toBe('Product to Fetch')
      expect(product?.price).toBe(250000)
    })

    it('should return null for non-existent product', async () => {
      const product = await db.product.findUnique({
        where: { id: 'nonexistent-product-id' },
      })

      expect(product).toBeNull()
    })

    it('should include order count', async () => {
      const product = await db.product.findUnique({
        where: { id: testProductId },
        include: { _count: { select: { orders: true } } },
      })

      expect(product?._count).toBeDefined()
      expect(typeof product?._count.orders).toBe('number')
    })
  })

  describe('listProducts', () => {
    beforeAll(async () => {
      for (let i = 0; i < 3; i++) {
        const product = await db.product.create({
          data: {
            tripId: testTripId,
            slug: `list-prod-${i}-${Date.now()}`,
            name: `List Product ${i + 1}`,
            price: 100000 + i * 50000,
            stock: 10 - i,
          },
        })
        testProductIds.push(product.id)
      }
    })

    it('should list all products in trip', async () => {
      const products = await db.product.findMany({
        where: { tripId: testTripId },
      })

      expect(Array.isArray(products)).toBe(true)
      expect(products.length).toBeGreaterThanOrEqual(3)
    })

    it('should only list products from requested trip', async () => {
      const trip2 = await tripService.createTrip(testJastiperId, {
        slug: `trip3-${Date.now()}`,
        title: 'Third Trip',
      })
      testTripIds.push(trip2.id)

      const trip2Products = await db.product.findMany({
        where: { tripId: trip2.id },
      })

      expect(trip2Products.length).toBe(0)
    })
  })

  describe('updateProduct', () => {
    let testProductId: string

    beforeAll(async () => {
      const product = await db.product.create({
        data: {
          tripId: testTripId,
          slug: `update-prod-${Date.now()}`,
          name: 'Product to Update',
          price: 300000,
          stock: 20,
        },
      })
      testProductId = product.id
      testProductIds.push(testProductId)
    })

    it('should update product name', async () => {
      const updated = await db.product.update({
        where: { id: testProductId },
        data: { name: 'Updated Product Name' },
      })

      expect(updated.name).toBe('Updated Product Name')
    })

    it('should update product price', async () => {
      const updated = await db.product.update({
        where: { id: testProductId },
        data: { price: 350000 },
      })

      expect(updated.price).toBe(350000)
    })

    it('should update product stock', async () => {
      const updated = await db.product.update({
        where: { id: testProductId },
        data: { stock: 25 },
      })

      expect(updated.stock).toBe(25)
    })

    it('should update product description and image', async () => {
      const updated = await db.product.update({
        where: { id: testProductId },
        data: {
          description: 'Updated description',
          image: 'https://example.com/new-image.jpg',
        },
      })

      expect(updated.description).toBe('Updated description')
      expect(updated.image).toBe('https://example.com/new-image.jpg')
    })

    it('should update multiple fields at once', async () => {
      const updated = await db.product.update({
        where: { id: testProductId },
        data: {
          name: 'Multi Update',
          price: 400000,
          stock: 30,
          category: 'Fashion',
        },
      })

      expect(updated.name).toBe('Multi Update')
      expect(updated.price).toBe(400000)
      expect(updated.stock).toBe(30)
      expect(updated.category).toBe('Fashion')
    })

    it('should preserve unmapped fields during update', async () => {
      const beforeUpdate = await db.product.findUnique({
        where: { id: testProductId },
      })

      await db.product.update({
        where: { id: testProductId },
        data: { name: 'Name Change Only' },
      })

      const afterUpdate = await db.product.findUnique({
        where: { id: testProductId },
      })

      expect(afterUpdate?.tripId).toBe(beforeUpdate?.tripId)
      expect(afterUpdate?.slug).toBe(beforeUpdate?.slug)
    })
  })

  describe('deleteProduct', () => {
    it('should delete product from database', async () => {
      const product = await db.product.create({
        data: {
          tripId: testTripId,
          slug: `delete-prod-${Date.now()}`,
          name: 'Product to Delete',
          price: 100000,
          stock: 5,
        },
      })
      testProductIds.push(product.id)

      await db.product.delete({ where: { id: product.id } })

      const deleted = await db.product.findUnique({
        where: { id: product.id },
      })

      expect(deleted).toBeNull()
    })

    it('should handle deletion of non-existent product gracefully', async () => {
      try {
        await db.product.delete({ where: { id: 'nonexistent-product' } })
        fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('stockManagement', () => {
    let testProductId: string

    beforeAll(async () => {
      const product = await db.product.create({
        data: {
          tripId: testTripId,
          slug: `stock-prod-${Date.now()}`,
          name: 'Stock Management Product',
          price: 150000,
          stock: 100,
        },
      })
      testProductId = product.id
      testProductIds.push(testProductId)
    })

    it('should handle stock deduction', async () => {
      const beforeUpdate = await db.product.findUnique({
        where: { id: testProductId },
      })

      const deductedStock = beforeUpdate!.stock - 10
      const updated = await db.product.update({
        where: { id: testProductId },
        data: { stock: deductedStock },
      })

      expect(updated.stock).toBe(deductedStock)
    })

    it('should allow zero stock', async () => {
      const updated = await db.product.update({
        where: { id: testProductId },
        data: { stock: 0 },
      })

      expect(updated.stock).toBe(0)
    })

    it('should allow negative stock (oversell)', async () => {
      const updated = await db.product.update({
        where: { id: testProductId },
        data: { stock: -5 },
      })

      expect(updated.stock).toBe(-5)
    })
  })
})
