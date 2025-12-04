/**
 * Authentication Service - Business Logic
 * Handles user registration, login, and token refresh
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword, verifyPassword } from '../utils/password.js'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from '../utils/jwt.js'
import { getRandomAvatar, generateSlugFromName } from '../utils/image.utils.js'
import { ApiError } from '../types/index.js'

export class AuthService {
  constructor(private db: PrismaClient) {}

  /**
   * Register new user
   * @param email - User email
   * @param password - User password
   * @param fullName - User full name
   * @returns User data with tokens
   */
  async register(email: string, password: string, fullName: string) {
    const existingUser = await this.db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      const error: ApiError = {
        status: 409,
        message: 'Email already registered',
      }
      throw error
    }

    const hashedPassword = await hashPassword(password)
    const slug = generateSlugFromName(fullName)
    const avatar = getRandomAvatar()

    const user = await this.db.user.create({
      data: {
        email,
        password: hashedPassword,
        slug,
        profileName: fullName,
        avatar,
      },
    })

    const token = generateAccessToken(user.id, user.slug, user.email)
    const refreshToken = generateRefreshToken(user.id)

    return {
      user: {
        id: user.id,
        email: user.email,
        slug: user.slug,
        profileName: user.profileName,
        isProfileComplete: user.isProfileComplete,
        tutorialStep: user.tutorialStep,
        onboardingCompletedAt: user.onboardingCompletedAt,
      },
      token,
      refreshToken,
    }
  }

  /**
   * Login user with email and password
   * @param email - User email
   * @param password - User password
   * @returns User data with tokens
   */
  async login(email: string, password: string) {
    const user = await this.db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        slug: true,
        profileName: true,
        isProfileComplete: true,
        tutorialStep: true,
        onboardingCompletedAt: true,
      },
    })

    if (!user) {
      const error: ApiError = {
        status: 401,
        message: 'Invalid credentials',
      }
      throw error
    }

    const isPasswordValid = await verifyPassword(password, user.password || '')
    if (!isPasswordValid) {
      const error: ApiError = {
        status: 401,
        message: 'Invalid credentials',
      }
      throw error
    }

    const token = generateAccessToken(user.id, user.slug, user.email)
    const refreshToken = generateRefreshToken(user.id)

    return {
      user: {
        id: user.id,
        email: user.email,
        slug: user.slug,
        profileName: user.profileName,
        isProfileComplete: user.isProfileComplete,
        tutorialStep: user.tutorialStep,
        onboardingCompletedAt: user.onboardingCompletedAt,
      },
      token,
      refreshToken,
    }
  }

  /**
   * Refresh access token using refresh token
   * @param refreshTokenStr - Refresh token string
   * @returns New access token
   */
  async refreshAccessToken(refreshTokenStr: string) {
    const decoded = verifyToken(refreshTokenStr, true)
    if (!decoded) {
      const error: ApiError = {
        status: 401,
        message: 'Invalid or expired refresh token',
      }
      throw error
    }

    const user = await this.db.user.findUnique({
      where: { id: decoded.sub },
    })

    if (!user) {
      const error: ApiError = {
        status: 404,
        message: 'User not found',
      }
      throw error
    }

    const token = generateAccessToken(user.id, user.slug, user.email)
    return { token }
  }

  /**
   * Get user profile by ID
   * @param userId - User ID
   * @returns User profile data
   */
  async getUserProfile(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        slug: true,
        profileName: true,
        profileBio: true,
        avatar: true,
        coverImage: true,
        coverPosition: true,
        whatsappNumber: true,
        originProvinceId: true,
        originProvinceName: true,
        originCityId: true,
        originCityName: true,
        originDistrictId: true,
        originDistrictName: true,
        originPostalCode: true,
        originAddressText: true,
        bankName: true,
        accountNumber: true,
        accountHolderName: true,
        isProfileComplete: true,
        tutorialStep: true,
        onboardingCompletedAt: true,
        createdAt: true,
        updatedAt: true,
        BankAccount: {
          where: {
            status: 'active'
          },
          orderBy: [
            { isPrimary: 'desc' },
            { isDefault: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      },
    })

    if (!user) {
      const error: ApiError = {
        status: 404,
        message: 'User not found',
      }
      throw error
    }

    // Return with bank accounts array
    return {
      ...user,
      bankAccounts: user.BankAccount || []
    }
  }

  /**
   * Update user profile
   * @param userId - User ID
   * @param profileData - Profile data to update
   * @returns Updated user profile
   */
  async updateUserProfile(
    userId: string,
    profileData: {
      profileName?: string
      profileBio?: string
      slug?: string
      avatar?: string
      coverImage?: string
      coverPosition?: number
      whatsappNumber?: string
      originProvinceId?: string
      originProvinceName?: string
      originCityId?: string
      originCityName?: string
      originDistrictId?: string
      originDistrictName?: string
      originRajaOngkirDistrictId?: string
      originPostalCode?: string
      originAddressText?: string
      bankName?: string
      accountNumber?: string
      accountHolderName?: string
    }
  ) {
    // Check if slug is being updated and if it's unique
    if (profileData.slug) {
      const existingUser = await this.db.user.findFirst({
        where: {
          slug: profileData.slug,
          NOT: {
            id: userId
          }
        }
      })

      if (existingUser) {
        const error: ApiError = {
          status: 409,
          message: 'Profile link/slug already taken',
        }
        throw error
      }
    }

    // Auto-map to RajaOngkir district ID only if not provided by frontend
    let rajaOngkirDistrictId: string | null | undefined = profileData.originRajaOngkirDistrictId

    // Only auto-map if frontend didn't provide RajaOngkir ID
    if (!rajaOngkirDistrictId && profileData.originCityName && profileData.originDistrictName) {
      try {
        const { autoMapToRajaOngkir } = await import('../services/rajaongkir.service.js')
        rajaOngkirDistrictId = await autoMapToRajaOngkir(
          profileData.originCityName,
          profileData.originDistrictName
        )
      } catch (error) {
        console.error('[Profile Update] Failed to map RajaOngkir district:', error)
        // Continue without RajaOngkir mapping - not critical for profile update
      }
    }

    const user = await this.db.user.update({
      where: { id: userId },
      data: {
        ...profileData,
        originRajaOngkirDistrictId: rajaOngkirDistrictId || null
      },
      select: {
        id: true,
        email: true,
        slug: true,
        profileName: true,
        profileBio: true,
        avatar: true,
        coverImage: true,
        coverPosition: true,
        whatsappNumber: true,
        originProvinceId: true,
        originProvinceName: true,
        originCityId: true,
        originCityName: true,
        originDistrictId: true,
        originDistrictName: true,
        originRajaOngkirDistrictId: true,
        originPostalCode: true,
        originAddressText: true,
        bankName: true,
        accountNumber: true,
        accountHolderName: true,
        updatedAt: true,
      },
    })

    return user
  }

  /**
   * Get public user profile by slug
   * @param slug - User slug
   * @returns Public user profile with trips and products
   */
  async getPublicProfile(slug: string) {
    const user = await this.db.user.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        profileName: true,
        profileBio: true,
        avatar: true,
        coverImage: true,
        coverPosition: true,
        createdAt: true,
      },
    })

    if (!user) {
      const error: ApiError = {
        status: 404,
        message: 'User not found',
      }
      throw error
    }

    // Fetch user's trips and products for profile enrichment
    const trips = await this.db.trip.findMany({
      where: { jastiperId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { 
        id: true, 
        title: true, 
        isActive: true,
        description: true,
        url_img: true,
        deadline: true,
        paymentType: true,
        dpPercentage: true,
      },
    })

    const products = await this.db.product.findMany({
      where: { Trip: { jastiperId: user.id } },
      select: { 
        id: true,
        tripId: true,
        slug: true,
        title: true, 
        price: true, 
        stock: true,
        isUnlimitedStock: true,
        image: true, 
        type: true,
        unit: true,
        weightGram: true,
      },
    })

    // Fetch social media accounts
    const socialMedias = await this.db.socialMedia.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        platform: true,
        handle: true,
        url: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Calculate profile stats
    const stats = {
      totalTrips: trips.length,
      happyCustomers: Math.max(Math.floor(Math.random() * 100) + 1, trips.length * 5),
      rating: Math.min(4.5 + Math.random() * 0.5, 5).toFixed(1),
    }

    return {
      user: {
        ...user,
        stats,
        socialMedia: socialMedias,
      },
      trips: trips.map((trip: any) => ({
        id: trip.id,
        title: trip.title,
        description: trip.description,
        image: trip.url_img,
        deadline: trip.deadline,
        status: trip.isActive ? 'Buka' : 'Tutup',
        spotsLeft: Math.floor(Math.random() * 15) + 1,
        paymentType: trip.paymentType || 'full',
        dpPercentage: trip.dpPercentage || 20,
      })),
      catalog: products.map((product: any) => ({
        id: product.id,
        tripId: product.tripId,
        slug: product.slug,
        title: product.title,
        price: product.price,
        image: product.image,
        available: product.isUnlimitedStock || (product.stock !== null && product.stock > 0),
        type: product.type || 'goods',
        unit: product.unit,
        weightGram: product.weightGram,
      })),
    }
  }

  /**
   * Change user password
   * @param userId - User ID
   * @param currentPassword - Current password for verification
   * @param newPassword - New password to set
   * @returns Success message
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      const error: ApiError = {
        status: 404,
        message: 'User not found',
      }
      throw error
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(
      currentPassword,
      user.password
    )
    if (!isPasswordValid) {
      const error: ApiError = {
        status: 401,
        message: 'Current password is incorrect',
      }
      throw error
    }

    // Check if new password is same as current
    const isSamePassword = await verifyPassword(newPassword, user.password)
    if (isSamePassword) {
      const error: ApiError = {
        status: 400,
        message: 'New password must be different from current password',
      }
      throw error
    }

    // Hash and update password
    const hashedPassword = await hashPassword(newPassword)
    await this.db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    return { message: 'Password changed successfully' }
  }

  /**
   * Generate unique slug from email
   * @param email - Email address
   * @returns Unique slug
   */
  private async generateUniqueSlug(email: string): Promise<string> {
    const baseSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '')
    
    let slug = baseSlug
    let counter = 1
    
    while (true) {
      const existing = await this.db.user.findUnique({
        where: { slug },
        select: { id: true }
      })
      
      if (!existing) break
      slug = `${baseSlug}${counter}`
      counter++
    }
    
    return slug
  }

  /**
   * Sync OAuth user to app database
   * @param userId - Supabase user ID
   * @param email - User email
   * @returns User data
   */
  async syncOAuthUser(userId: string, email: string) {
    // Check if user already exists
    const existingUser = await this.db.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (existingUser) {
      return await this.getUserProfile(userId)
    }

    // Generate unique slug
    const slug = await this.generateUniqueSlug(email)

    // Create new user
    const newUser = await this.db.user.create({
      data: {
        id: userId,
        email: email.toLowerCase(),
        slug,
        profileName: email.split('@')[0],
        password: '', // OAuth users don't have password
      },
      select: {
        id: true,
        email: true,
        slug: true,
        profileName: true,
        avatar: true,
        createdAt: true,
      }
    })

    return newUser
  }
}
