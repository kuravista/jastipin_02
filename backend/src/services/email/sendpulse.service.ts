/**
 * SendPulse Email Service
 * Handles transactional email sending via SendPulse API
 */

import sendpulse from 'sendpulse-api'
import {
  SendPulseConfig,
  SendEmailRequest,
  SendEmailResponse
} from '../../types/email.types.js'

export class SendPulseService {
  private config: SendPulseConfig
  private initialized: boolean = false
  private initializationPromise: Promise<void> | null = null

  constructor(config: SendPulseConfig) {
    this.config = config
  }

  /**
   * Initialize SendPulse SDK with OAuth authentication
   */
  private async initialize(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.initialized) return
    if (this.initializationPromise) return this.initializationPromise

    this.initializationPromise = new Promise((resolve, reject) => {
      sendpulse.init(
        this.config.apiId,
        this.config.apiSecret,
        this.config.tokenStorage,
        (token: any) => {
          if (token && token.is_error) {
            console.error('[SendPulse] Initialization failed:', token)
            this.initialized = false
            reject(new Error(`SendPulse auth failed: ${token.message}`))
          } else {
            console.log('[SendPulse] Initialized successfully')
            this.initialized = true
            resolve()
          }
        }
      )
    })

    return this.initializationPromise
  }

  /**
   * Send transactional email
   */
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    // Check if service is enabled
    if (!this.config.enabled) {
      console.log('[SendPulse] Service disabled, skipping email')
      return {
        success: false,
        error: 'Email service disabled'
      }
    }

    try {
      // Ensure initialized
      await this.initialize()

      // Prepare email payload
      const emailPayload: any = {
        subject: request.subject,
        from: {
          name: this.config.fromName,
          email: this.config.fromEmail
        },
        to: request.to
      }

      // Add content (HTML or Template)
      if (request.template) {
        emailPayload.template = {
          id: request.template.id,
          variables: request.template.variables
        }
        emailPayload.auto_plain_text = true
      } else if (request.html) {
        // SendPulse REST API accepts HTML directly (not Base64 encoded)
        emailPayload.html = request.html
        if (request.text) {
          emailPayload.text = request.text
        } else {
          // Auto-generate plain text from HTML if not provided
          emailPayload.text = request.html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
        }
      } else {
        throw new Error('Either html or template must be provided')
      }

      // Add optional fields
      if (request.cc && request.cc.length > 0) {
        emailPayload.cc = request.cc
      }
      if (request.bcc && request.bcc.length > 0) {
        emailPayload.bcc = request.bcc
      }
      if (request.attachments && request.attachments.length > 0) {
        emailPayload.attachments = request.attachments
      }

      // Log email details (sanitized)
      console.log('[SendPulse] Sending email:', {
        to: request.to.map(r => r.email),
        subject: request.subject,
        hasHtml: !!request.html,
        hasTemplate: !!request.template
      })

      // Send email with retry logic
      const result = await this.sendWithRetry(emailPayload)

      console.log('[SendPulse] Email sent successfully:', {
        messageId: result.id || 'unknown',
        to: request.to.map(r => r.email)
      })

      return {
        success: true,
        messageId: result.id || 'unknown',
        deliveryStatus: 'sent'
      }
    } catch (error) {
      console.error('[SendPulse] Send email failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        deliveryStatus: 'failed'
      }
    }
  }

  /**
   * Send email with retry logic and exponential backoff
   */
  private async sendWithRetry(
    emailPayload: any,
    maxAttempts: number = 3
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let currentAttempt = 0

      const attemptSend = () => {
        currentAttempt++

        sendpulse.smtpSendMail((response: any) => {
          // Check for errors
          if (response && response.is_error) {
            console.error(
              `[SendPulse] Attempt ${currentAttempt}/${maxAttempts} failed:`,
              response
            )

            // Retry if attempts remaining
            if (currentAttempt < maxAttempts) {
              const delay = 2000 * currentAttempt // Exponential backoff: 2s, 4s, 6s
              console.log(`[SendPulse] Retrying in ${delay}ms...`)
              setTimeout(attemptSend, delay)
            } else {
              reject(new Error(response.message || 'Failed to send email after retries'))
            }
          } else {
            // Success
            console.log('[SendPulse] Email sent successfully on attempt', currentAttempt)
            resolve(response)
          }
        }, emailPayload)
      }

      attemptSend()
    })
  }

  /**
   * Validate email address format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Send test email (for debugging)
   */
  async sendTestEmail(toEmail: string, toName: string = 'Test User'): Promise<SendEmailResponse> {
    return this.sendEmail({
      to: [{ name: toName, email: toEmail }],
      subject: 'Jastipin Test Email',
      html: `
        <h1>Test Email from Jastipin</h1>
        <p>This is a test email to verify SendPulse integration is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p>If you received this email, the integration is working! 🎉</p>
      `,
      text: 'Test Email - This is a test email from Jastipin. If you received this, the integration is working!'
    })
  }

  /**
   * Get service status
   */
  getStatus(): { enabled: boolean; initialized: boolean } {
    return {
      enabled: this.config.enabled,
      initialized: this.initialized
    }
  }
}

// Singleton instance
let sendpulseServiceInstance: SendPulseService | null = null

/**
 * Get SendPulse service singleton instance
 */
export function getSendPulseService(): SendPulseService {
  if (!sendpulseServiceInstance) {
    const config: SendPulseConfig = {
      apiId: process.env.SENDPULSE_API_ID || '',
      apiSecret: process.env.SENDPULSE_API_SECRET || '',
      tokenStorage: process.env.SENDPULSE_TOKEN_STORAGE || '/tmp/sendpulse-tokens',
      fromEmail: process.env.SENDPULSE_FROM_EMAIL || 'no-reply@jastipin.me',
      fromName: process.env.SENDPULSE_FROM_NAME || 'Jastipin Team',
      enabled: process.env.SENDPULSE_ENABLED === 'true'
    }

    // Validate configuration
    if (!config.apiId || !config.apiSecret) {
      console.warn('[SendPulse] API credentials not configured. Email service will be disabled.')
      config.enabled = false
    }

    sendpulseServiceInstance = new SendPulseService(config)
  }

  return sendpulseServiceInstance
}
