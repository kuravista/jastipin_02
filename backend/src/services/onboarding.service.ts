/**
 * Onboarding Service - User Profile Completion & Tutorial Management
 * Handles profile completion, tutorial flow, and onboarding status
 */

import { PrismaClient } from '@prisma/client'
import { ApiError } from '../types/index.js'

export class OnboardingService {
  constructor(private db: PrismaClient) {}

  /**
   * Check if user has completed profile
   * @param userId - User ID
   * @returns boolean - true if all required fields are set
   */
  async checkProfileComplete(userId: string): Promise<boolean> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        profileName: true,
        whatsappNumber: true,
        originDistrictId: true,
        originPostalCode: true,
        originAddressText: true,
      },
    })

    if (!user) {
      throw {
        status: 404,
        message: 'User not found',
      } as ApiError
    }

    return !!(
      user.profileName &&
      user.whatsappNumber &&
      user.originDistrictId &&
      user.originPostalCode &&
      user.originAddressText
    )
  }

  /**
   * Sync isProfileComplete flag with actual field values
   * Updates database flag based on whether all required fields are filled
   * @param userId - User ID
   * @returns Updated user data
   */
  async syncProfileCompleteStatus(userId: string) {
    const isComplete = await this.checkProfileComplete(userId)

    const user = await this.db.user.update({
      where: { id: userId },
      data: {
        isProfileComplete: isComplete,
        tutorialStep: isComplete ? 'profile_complete' : 'pending',
        onboardingCompletedAt: isComplete ? new Date() : null,
      },
      select: {
        id: true,
        email: true,
        isProfileComplete: true,
        tutorialStep: true,
        onboardingCompletedAt: true,
      },
    })

    return user
  }

  /**
   * Complete user profile and create/update bank account
   * @param userId - User ID
   * @param data - Profile completion data
   * @returns Updated user data
   */
  async completeProfile(
    userId: string,
    data: {
      profileName: string
      whatsappNumber: string
      originProvinceId: string
      originProvinceName: string
      originCityId: string
      originCityName: string
      originDistrictId: string
      originDistrictName: string
      originPostalCode: string
      originAddressText: string
      bankName: string
      accountNumber: string
      accountHolderName: string
    }
  ) {
    try {
      // Use transaction to ensure atomicity
      const result = await this.db.$transaction(async (tx) => {
        // Update user profile
        const user = await tx.user.update({
          where: { id: userId },
          data: {
            profileName: data.profileName,
            whatsappNumber: data.whatsappNumber,
            originProvinceId: data.originProvinceId,
            originProvinceName: data.originProvinceName,
            originCityId: data.originCityId,
            originCityName: data.originCityName,
            originDistrictId: data.originDistrictId,
            originDistrictName: data.originDistrictName,
            originPostalCode: data.originPostalCode,
            originAddressText: data.originAddressText,
            isProfileComplete: true,
            onboardingCompletedAt: new Date(),
            tutorialStep: 'profile_complete',
          },
          select: {
            id: true,
            email: true,
            profileName: true,
            isProfileComplete: true,
            tutorialStep: true,
          },
        })

        // Create bank account
        if (data.bankName && data.accountNumber && data.accountHolderName) {
          // Delete existing bank account for this user and account number to avoid conflicts
          await tx.bankAccount.deleteMany({
            where: {
              userId,
              accountNumber: data.accountNumber,
            },
          })

          // Create new bank account
          await tx.bankAccount.create({
            data: {
              userId,
              bankName: data.bankName,
              accountNumber: data.accountNumber,
              accountHolderName: data.accountHolderName,
              isDefault: true,
              isPrimary: true,
            },
          })
        }

        return user
      })

      return result
    } catch (error: any) {
      const apiError: ApiError = {
        status: error.status || 500,
        message: error.message || 'Failed to complete profile',
      }
      throw apiError
    }
  }

  /**
   * Mark tutorial as completed
   * @param userId - User ID
   * @returns Updated user data
   */
  async completeTutorial(userId: string) {
    try {
      const user = await this.db.user.update({
        where: { id: userId },
        data: {
          tutorialStep: 'completed',
        },
        select: {
          id: true,
          email: true,
          tutorialStep: true,
          onboardingCompletedAt: true,
        },
      })

      return user
    } catch (error: any) {
      const apiError: ApiError = {
        status: error.status || 500,
        message: error.message || 'Failed to complete tutorial',
      }
      throw apiError
    }
  }

  /**
   * Restart tutorial
   * @param userId - User ID
   * @returns Updated user data
   */
  async restartTutorial(userId: string) {
    try {
      const user = await this.db.user.update({
        where: { id: userId },
        data: {
          tutorialStep: 'profile_complete',
        },
        select: {
          id: true,
          email: true,
          tutorialStep: true,
        },
      })

      return user
    } catch (error: any) {
      const apiError: ApiError = {
        status: error.status || 500,
        message: error.message || 'Failed to restart tutorial',
      }
      throw apiError
    }
  }

  /**
   * Get onboarding status
   * @param userId - User ID
   * @returns Onboarding status data
   */
  async getOnboardingStatus(userId: string) {
    try {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          isProfileComplete: true,
          tutorialStep: true,
          onboardingCompletedAt: true,
        },
      })

      if (!user) {
        throw {
          status: 404,
          message: 'User not found',
        } as ApiError
      }

      return {
        success: true,
        data: {
          isProfileComplete: user.isProfileComplete,
          tutorialStep: user.tutorialStep,
          needsOnboarding: !user.isProfileComplete,
          completedAt: user.onboardingCompletedAt,
        },
      }
    } catch (error: any) {
      const apiError: ApiError = {
        status: error.status || 500,
        message: error.message || 'Failed to get onboarding status',
      }
      throw apiError
    }
  }

  /**
   * Serialize user for response
   * @param user - User object
   * @returns Safe user data
   */
  serializeUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      profileName: user.profileName,
      isProfileComplete: user.isProfileComplete,
      tutorialStep: user.tutorialStep,
      onboardingCompletedAt: user.onboardingCompletedAt,
    }
  }
}
