/**
 * Password Reset Routes
 * POST /forgot-password - Request password reset email
 * GET /reset-password/validate - Validate reset token
 * POST /reset-password - Reset password with token
 */

import { Router, Response } from 'express'
import db from '../lib/prisma.js'
import { PasswordResetService } from '../services/password-reset.service.js'
import { AuthRequest } from '../types/index.js'
import { getSendPulseService } from '../services/email/sendpulse.service.js'
import { EmailTemplateService } from '../services/email/email-template.service.js'

const router: Router = Router()
const passwordResetService = new PasswordResetService(db)

/**
 * POST /forgot-password
 * Request password reset email
 * Body: { email: string }
 * Returns: { success: true, message: "Check your email" }
 */
router.post('/forgot-password', async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        error: 'Email is required'
      })
    }

    console.log(`[Password] Forgot password request for ${email}`)

    let token: string
    let expiresAt: Date

    try {
      // Generate reset token
      const result = await passwordResetService.generateResetToken(email)
      token = result.token
      expiresAt = result.expiresAt
    } catch (err: any) {
      // User doesn't exist - return success anyway (prevent email enumeration)
      console.log(`[Password] User not found for email ${email} - returning success to prevent enumeration`)
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link shortly.'
      })
    }

    // Build reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`

    // Get user for email
    const user = await db.user.findUnique({
      where: { email },
      select: { profileName: true }
    })

    // Prepare email data
    const emailData = {
      recipientName: user?.profileName || 'User',
      email,
      resetLink,
      expiresAt: expiresAt.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Render email template
    const html = EmailTemplateService.renderPasswordResetEmail(emailData)
    const text = EmailTemplateService.renderPasswordResetText(emailData)

    // Send email
    const sendpulseService = getSendPulseService()
    const emailResult = await sendpulseService.sendEmail({
      to: [{ name: emailData.recipientName, email }],
      subject: 'Reset Your Password - Jastipin',
      html,
      text
    })

    if (emailResult.success) {
      console.log(`[Password] Reset email sent to ${email}`)
    } else {
      console.error(`[Password] Failed to send email: ${emailResult.error}`)
    }

    // Always return success (don't reveal if email exists or not)
    return res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link shortly.'
    })
  } catch (error: any) {
    console.error('[Password] Error in forgot-password:', error)

    // Return generic error (don't reveal internal details)
    return res.status(500).json({
      error: 'An error occurred. Please try again later.'
    })
  }
})

/**
 * GET /reset-password/validate
 * Validate reset token before showing password form
 * Query: { token: string }
 * Returns: { valid: true, expiresAt: Date } or error
 */
router.get('/reset-password/validate', async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        error: 'Reset token is required'
      })
    }

    // Validate token
    const { userId, expiresAt } = await passwordResetService.validateToken(token)

    return res.json({
      valid: true,
      expiresAt,
      userId // Return userId so frontend doesn't need to store it
    })
  } catch (error: any) {
    const status = error.status || 500
    const message = error.message || 'Invalid or expired reset token'

    return res.status(status).json({
      error: message,
      valid: false
    })
  }
})

/**
 * POST /reset-password
 * Reset password with valid token
 * Body: { token: string, newPassword: string }
 * Returns: { success: true, message: "Password reset successfully" }
 */
router.post('/reset-password', async (req: AuthRequest, res: Response) => {
  try {
    const { token, newPassword } = req.body

    // Validate input
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        error: 'Reset token is required'
      })
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({
        error: 'New password is required'
      })
    }

    // Basic password validation (should match frontend validation)
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters'
      })
    }

    console.log(`[Password] Resetting password with token`)

    // Reset password
    await passwordResetService.resetPassword(token, newPassword)

    // Get user email for confirmation (optional)
    // const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } })

    // Optional: Send confirmation email
    // await sendpulseService.sendEmail({...}) 

    return res.json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.'
    })
  } catch (error: any) {
    const status = error.status || 500
    const message = error.message || 'Failed to reset password'

    console.error('[Password] Error in reset-password:', error)

    return res.status(status).json({
      error: message
    })
  }
})

/**
 * POST /cleanup-expired-tokens
 * (Admin/Cron endpoint) Clean up expired password reset tokens
 * Should be called periodically to prevent database bloat
 */
router.post('/cleanup-expired-tokens', async (_req: AuthRequest, res: Response) => {
  try {
    // Optional: Add auth check here if needed
    const count = await passwordResetService.cleanupExpiredTokens()

    return res.json({
      success: true,
      message: `Cleaned up ${count} expired tokens`
    })
  } catch (error: any) {
    console.error('[Password] Error cleaning up tokens:', error)

    return res.status(500).json({
      error: 'Failed to clean up tokens'
    })
  }
})

export default router
