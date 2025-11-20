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

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
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
  slug: z.string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung')
    .optional(),
  avatar: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  coverPosition: z.number().min(0).max(100).optional(),
  // Contact Information
  whatsappNumber: z.string()
    .regex(/^\+62[0-9]{9,12}$/, 'Format nomor WhatsApp: +628xxxxx')
    .optional()
    .or(z.literal('')),
  // Jastiper Origin Address
  originProvinceId: z.string().optional(),
  originProvinceName: z.string().optional(),
  originCityId: z.string().optional(),
  originCityName: z.string().optional(),
  originDistrictId: z.string().optional(),
  originDistrictName: z.string().optional(),
  originPostalCode: z.string()
    .regex(/^[0-9]{5}$/, 'Kode pos harus 5 digit')
    .optional()
    .or(z.literal('')),
  originAddressText: z.string()
    .min(25, 'Alamat minimal 25 karakter')
    .regex(/[0-9]/, 'Alamat harus mengandung angka')
    .regex(/[a-zA-Z]/, 'Alamat harus mengandung huruf')
    .optional()
    .or(z.literal('')),
  // Bank Account Information
  bankName: z.string()
    .max(100)
    .optional()
    .or(z.literal('')),
  accountNumber: z.string()
    .regex(/^[0-9]{8,20}$/, 'Nomor rekening harus 8-20 digit')
    .optional()
    .or(z.literal('')),
  accountHolderName: z.string()
    .min(2)
    .max(100)
    .optional()
    .or(z.literal('')),
})

// Trip schemas
export const createTripSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(100, 'Slug must be at most 100 characters')
    .regex(
      /^[a-z0-9_-]+$/,
      'Slug must contain only lowercase letters, numbers, hyphens, and underscores'
    )
    .optional(),
  description: z.string().max(500).optional(),
  startDate: z.coerce.date().nullable().optional(),
  deadline: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
  paymentType: z.enum(['full', 'dp']).optional().default('full'), // NEW: DP payment support
  dpPercentage: z.number().min(1).max(100).optional().default(20), // NEW: DP percentage (1-100)
  url_img: z.string().nullable().optional(),
})

export const updateTripSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().max(500).optional(),
  startDate: z.coerce.date().nullable().optional(),
  deadline: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
  url_img: z.string().nullable().optional(),
  paymentType: z.enum(['full', 'dp']).optional(),
  dpPercentage: z.number().min(1).max(100).optional(),
})

// Product schemas
export const createProductSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'), // Fixed: camelCase
  title: z.string().min(3).max(255),
  price: z.number().positive('Price must be positive'),
  stock: z.number().nonnegative('Stock cannot be negative').optional().nullable(), // Fixed: optional for tasks
  isUnlimitedStock: z.boolean().optional().default(false),
  description: z.string().max(500).optional(),
  image: z.string().optional(),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9_-]+$/, 'Slug must contain only lowercase letters, numbers, hyphens, and underscores')
    .optional(),
  // NEW: DP flow fields
  type: z.enum(['goods', 'tasks']).optional().default('goods'),
  unit: z.string().optional(),
  weightGram: z.number().positive().optional(),
  requiresDetails: z.boolean().optional(),
  requiresProof: z.boolean().optional(),
  markupType: z.enum(['percent', 'flat']).optional().default('percent'),
  markupValue: z.number().nonnegative().optional().default(0),
})

export const updateProductSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  price: z.number().positive().optional(),
  stock: z.number().nonnegative().optional().nullable(),
  isUnlimitedStock: z.boolean().optional(),
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
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type CreateTripInput = z.infer<typeof createTripSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type JoinTripInput = z.infer<typeof joinTripSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type CreateSocialMediaInput = z.infer<typeof createSocialMediaSchema>
export type UpdateSocialMediaInput = z.infer<typeof updateSocialMediaSchema>
