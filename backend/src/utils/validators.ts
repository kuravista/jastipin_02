/**
 * Input Validation Schemas using Zod
 * Provides schema validation for all API endpoints
 */

import { z } from 'zod'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
})

// Profile schemas
export const updateProfileSchema = z.object({
  profileName: z
    .string()
    .min(2)
    .max(100)
    .optional(),
  profileBio: z.string().max(500).optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  coverImage: z.string().url('Invalid cover image URL').optional(),
})

// Trip schemas
export const createTripSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  slug: z
    .string()
    .regex(
      /^[a-z0-9_-]{3,10}$/,
      'Slug must be 3-10 chars, lowercase letters, numbers, hyphens, underscores'
    )
    .optional(),
  description: z.string().max(500).optional(),
  startDate: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
})

export const updateTripSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().max(500).optional(),
  startDate: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
})

// Product schemas
export const createProductSchema = z.object({
  trip_id: z.string().min(1, 'Trip ID is required'),
  title: z.string().min(3).max(255),
  price: z.number().positive('Price must be positive'),
  stock: z.number().nonnegative('Stock cannot be negative'),
  description: z.string().max(500).optional(),
  image: z.string().optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9_-]{3,10}$/, 'Invalid product slug format')
    .optional(),
})

export const updateProductSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  price: z.number().positive().optional(),
  stock: z.number().nonnegative().optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

// Participant schemas
export const joinTripSchema = z.object({
  phone: z
    .string()
    .regex(/^628\d{9,}$/, 'Invalid WhatsApp number format'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100),
  email: z.string().email('Invalid email format').optional(),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address must be at most 500 characters')
    .optional(),
})

// Order schemas
export const createOrderSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  participantPhone: z
    .string()
    .regex(/^628\d{9,}$/, 'Invalid WhatsApp number format'),
  participantName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .optional(),
  participantEmail: z.string().email('Invalid email format').optional(),
  participantAddress: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address must be at most 500 characters')
    .optional(),
  notes: z.string().max(500).optional(),
})

export const updateOrderSchema = z.object({
  quantity: z.number().positive().optional(),
  status: z.enum(['pending', 'confirmed', 'rejected']).optional(),
  notes: z.string().max(500).optional(),
})

export const confirmOrderSchema = z.object({
  proofUrl: z.string().url('Invalid proof URL').optional(),
})

export const checkoutSchema = z.object({
  participantName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .optional(),
  participantEmail: z.string().email('Invalid email format').optional(),
  participantPhone: z
    .string()
    .regex(/^628\d{9,}$/, 'Invalid WhatsApp number format'),
  participantAddress: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address must be at most 500 characters')
    .optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product ID is required'),
        quantity: z.number().positive('Quantity must be positive'),
        notes: z.string().max(500).optional(),
      })
    )
    .min(1, 'At least one item is required'),
})

// Social Media schemas
export const createSocialMediaSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  handle: z.string().min(1, 'Handle is required').max(100),
  url: z.string().url('Invalid URL').optional(),
})

export const updateSocialMediaSchema = z.object({
  handle: z.string().min(1, 'Handle is required').max(100).optional(),
  url: z.string().url('Invalid URL').optional(),
})

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateTripInput = z.infer<typeof createTripSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type JoinTripInput = z.infer<typeof joinTripSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type CreateSocialMediaInput = z.infer<typeof createSocialMediaSchema>
export type UpdateSocialMediaInput = z.infer<typeof updateSocialMediaSchema>
