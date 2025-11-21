/**
 * Guest Service
 * Handles guest checkout user management for non-registered users
 */

import { PrismaClient, Guest } from '@prisma/client'
import crypto from 'crypto'

export class GuestService {
  constructor(private db: PrismaClient) {}

  /**
   * Generate contact hash from phone and email
   * Used to identify unique guests across sessions
   * @param phone - Guest phone number
   * @param email - Guest email (optional)
   * @returns SHA256 hash of normalized contact info
   */
  private generateContactHash(phone: string, email: string = ''): string {
    // Normalize phone: strip spaces, handle 0/62/+62 prefixes consistently
    let normalizedPhone = phone.replace(/\s/g, '')
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+62' + normalizedPhone.substring(1)
    } else if (normalizedPhone.startsWith('62')) {
      normalizedPhone = '+' + normalizedPhone
    } else if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+62' + normalizedPhone
    }
    
    const normalizedEmail = email.toLowerCase().trim()
    return crypto
      .createHash('sha256')
      .update(normalizedPhone + normalizedEmail)
      .digest('hex')
  }

  /**
   * Create new guest or update existing guest profile
   * Identifies guests by contact hash to prevent duplicates
   * @param data - Guest contact and preference data
   * @returns Guest profile with ID for order linking
   */
  async createOrUpdateGuest(data: {
    name: string
    phone: string
    email?: string
    rememberMe?: boolean
  }): Promise<Guest> {
    console.log('[GuestService] Input data:', {
      email: data.email,
      emailType: typeof data.email,
      emailLength: data.email?.length,
      emailTrimmed: data.email?.trim(),
    })
    
    const contactHash = this.generateContactHash(data.phone, data.email || '')
    
    // Normalize phone same way as hash for consistency
    let normalizedPhone = data.phone.replace(/\s/g, '')
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+62' + normalizedPhone.substring(1)
    } else if (normalizedPhone.startsWith('62')) {
      normalizedPhone = '+' + normalizedPhone
    } else if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+62' + normalizedPhone
    }
    
    // Normalize email: trim and convert empty string to null
    const normalizedEmail = data.email?.trim() || null

    const existingGuest = await this.db.guest.findUnique({
      where: { contactHash },
    })

    if (existingGuest) {
      console.log('[GuestService] Updating existing guest:', existingGuest.id)
      return await this.db.guest.update({
        where: { id: existingGuest.id },
        data: {
          name: data.name,
          phone: normalizedPhone,
          email: normalizedEmail || existingGuest.email,
          rememberMe: data.rememberMe ?? existingGuest.rememberMe,
          lastActivity: new Date(),
        },
      })
    }

    console.log('[GuestService] Creating new guest with email:', normalizedEmail)
    return await this.db.guest.create({
      data: {
        contactHash,
        name: data.name,
        phone: normalizedPhone,
        email: normalizedEmail,
        rememberMe: data.rememberMe ?? false,
        lastActivity: new Date(),
        firstVisit: new Date(),
      },
    })
  }

  /**
   * Find guest by contact information
   * @param phone - Guest phone number
   * @param email - Guest email (optional)
   * @returns Guest profile or null if not found
   */
  async findGuestByContactHash(
    phone: string,
    email?: string
  ): Promise<Guest | null> {
    const contactHash = this.generateContactHash(phone, email || '')
    return await this.db.guest.findUnique({
      where: { contactHash },
    })
  }

  /**
   * Find guest by ID
   * @param guestId - Guest unique identifier
   * @returns Guest profile or null if not found
   */
  async findGuestById(guestId: string): Promise<Guest | null> {
    return await this.db.guest.findUnique({
      where: { id: guestId },
    })
  }

  /**
   * Convert guest to registered user
   * Links guest profile to user account when they sign up
   * @param guestId - Guest unique identifier
   * @param userId - User account ID to link
   */
  async convertGuestToUser(guestId: string, userId: string): Promise<void> {
    await this.db.guest.update({
      where: { id: guestId },
      data: {
        convertedToUserId: userId,
        convertedAt: new Date(),
      },
    })
  }
}
