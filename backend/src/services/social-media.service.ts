/**
 * Social Media Service
 * Handles CRUD operations for user social media accounts
 */

import { PrismaClient } from '@prisma/client'
import { generateSocialMediaUrl, SocialMediaDTO } from '../types/social-media.js'
import type { CreateSocialMediaInput, UpdateSocialMediaInput } from '../utils/validators.js'

export interface ApiError {
  status: number
  message: string
}

export class SocialMediaService {
  constructor(private db: PrismaClient) {}

  /**
   * Create a new social media account for user
   * @param userId - User ID
   * @param data - Social media data
   * @returns Created social media account
   */
  async createSocialMedia(userId: string, data: CreateSocialMediaInput): Promise<SocialMediaDTO> {
    // Check if user already has this platform
    const existing = await this.db.socialMedia.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: data.platform,
        },
      },
    })

    if (existing) {
      const error: ApiError = {
        status: 409,
        message: `User already has ${data.platform} account`,
      }
      throw error
    }

    // Generate URL if not provided
    const url = data.url || generateSocialMediaUrl(data.platform, data.handle)

    const socialMedia = await this.db.socialMedia.create({
      data: {
        userId,
        platform: data.platform,
        handle: data.handle,
        url,
      },
    })

    return this.mapToDTO(socialMedia)
  }

  /**
   * Get all social media accounts for user
   * @param userId - User ID
   * @returns Array of social media accounts
   */
  async getSocialMediaByUserId(userId: string): Promise<SocialMediaDTO[]> {
    const socialMedias = await this.db.socialMedia.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })

    return socialMedias.map((sm: any) => this.mapToDTO(sm))
  }

  /**
   * Get single social media account
   * @param id - Social media ID
   * @param userId - User ID (for authorization check)
   * @returns Social media account
   */
  async getSocialMediaById(id: string, userId: string): Promise<SocialMediaDTO> {
    const socialMedia = await this.db.socialMedia.findUnique({
      where: { id },
    })

    if (!socialMedia) {
      const error: ApiError = {
        status: 404,
        message: 'Social media account not found',
      }
      throw error
    }

    // Authorization check
    if (socialMedia.userId !== userId) {
      const error: ApiError = {
        status: 403,
        message: 'Not authorized to access this social media account',
      }
      throw error
    }

    return this.mapToDTO(socialMedia)
  }

  /**
   * Update social media account
   * @param id - Social media ID
   * @param userId - User ID (for authorization check)
   * @param data - Update data
   * @returns Updated social media account
   */
  async updateSocialMedia(
    id: string,
    userId: string,
    data: UpdateSocialMediaInput
  ): Promise<SocialMediaDTO> {
    // Check authorization
    const socialMedia = await this.db.socialMedia.findUnique({
      where: { id },
    })

    if (!socialMedia) {
      const error: ApiError = {
        status: 404,
        message: 'Social media account not found',
      }
      throw error
    }

    if (socialMedia.userId !== userId) {
      const error: ApiError = {
        status: 403,
        message: 'Not authorized to update this social media account',
      }
      throw error
    }

    // Generate URL if handle changed and url not provided
    let updateData: Partial<typeof data> = { ...data }
    if (data.handle && !data.url) {
      updateData.url = generateSocialMediaUrl(socialMedia.platform, data.handle)
    }

    const updated = await this.db.socialMedia.update({
      where: { id },
      data: updateData,
    })

    return this.mapToDTO(updated)
  }

  /**
   * Delete social media account
   * @param id - Social media ID
   * @param userId - User ID (for authorization check)
   * @returns Deleted social media account
   */
  async deleteSocialMedia(id: string, userId: string): Promise<SocialMediaDTO> {
    // Check authorization
    const socialMedia = await this.db.socialMedia.findUnique({
      where: { id },
    })

    if (!socialMedia) {
      const error: ApiError = {
        status: 404,
        message: 'Social media account not found',
      }
      throw error
    }

    if (socialMedia.userId !== userId) {
      const error: ApiError = {
        status: 403,
        message: 'Not authorized to delete this social media account',
      }
      throw error
    }

    const deleted = await this.db.socialMedia.delete({
      where: { id },
    })

    return this.mapToDTO(deleted)
  }

  /**
   * Map database record to DTO
   */
  private mapToDTO(socialMedia: any): SocialMediaDTO {
    return {
      id: socialMedia.id,
      platform: socialMedia.platform,
      handle: socialMedia.handle,
      url: socialMedia.url,
      createdAt: socialMedia.createdAt,
      updatedAt: socialMedia.updatedAt,
    }
  }
}
