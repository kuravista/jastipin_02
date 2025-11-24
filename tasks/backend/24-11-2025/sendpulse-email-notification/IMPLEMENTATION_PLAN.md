# SendPulse Email Notification - Implementation Plan

**Project:** Email Notification untuk Guest Checkout
**Provider:** SendPulse.com
**Date Created:** 24 November 2025
**Status:** Planning Phase

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [SendPulse API Capabilities](#sendpulse-api-capabilities)
3. [Architecture Design](#architecture-design)
4. [Implementation Steps](#implementation-steps)
5. [Email Templates](#email-templates)
6. [Testing Plan](#testing-plan)
7. [Security & Best Practices](#security--best-practices)

---

## 🎯 Overview

### Goal
Implement automated email notifications menggunakan SendPulse untuk:
1. **ORDER_CREATED_DP** - Konfirmasi order setelah checkout
2. **PAYMENT_LINK_SENT** - Magic link untuk upload bukti pembayaran
3. **PAYMENT_RECEIVED** - Konfirmasi pembayaran diterima

### Current Credentials
```
API ID: b3f8aa3be78c7cc355dbe7a7c924cc88
API SECRET: 3bde515bc9a01af7d00ef56137b19bd3
```

### Success Criteria
- ✅ Email terkirim dalam <5 detik setelah checkout
- ✅ Delivery rate >95%
- ✅ Email masuk ke inbox (bukan spam)
- ✅ Template responsive untuk mobile & desktop
- ✅ Error handling & logging lengkap

---

## 🔌 SendPulse API Capabilities

### Authentication Method
**OAuth 2.0 Client Credentials Flow**

```typescript
POST https://api.sendpulse.com/oauth/access_token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "b3f8aa3be78c7cc355dbe7a7c924cc88",
  "client_secret": "3bde515bc9a01af7d00ef56137b19bd3"
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1...",
  "token_type": "Bearer",
  "expires_in": 3600  // 1 hour
}
```

**Token Management:**
- Token valid selama 1 jam
- Auto-refresh sebelum expired
- Simpan token di memory atau cache (Redis recommended)

### Email Sending Methods

#### Method 1: Custom HTML/Text (Flexible)
```javascript
POST https://api.sendpulse.com/smtp/emails
Authorization: Bearer {access_token}

{
  "subject": "Order Confirmation #12345",
  "from": {
    "name": "Jastipin Team",
    "email": "noreply@jastipin.me"
  },
  "to": [
    {
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "html": "<base64_encoded_html>",  // Must be Base64
  "text": "Plain text version",      // Fallback
  "bcc": [],  // Optional
  "attachments": []  // Optional
}
```

#### Method 2: Pre-Built Templates (Recommended)
```javascript
POST https://api.sendpulse.com/smtp/emails
Authorization: Bearer {access_token}

{
  "subject": "Order Confirmation",
  "from": { "name": "Jastipin", "email": "noreply@jastipin.me" },
  "to": [{ "name": "{{name}}", "email": "{{email}}" }],
  "template": {
    "id": "template_uuid_here",
    "variables": {
      "customerName": "John Doe",
      "orderId": "ORD-001",
      "dpAmount": "Rp 200.000",
      "jastiperName": "Tina"
    }
  },
  "auto_plain_text": true  // Auto-generate text version
}
```

### Available Node.js SDK

**Package:** `sendpulse-api`

```bash
npm install sendpulse-api
```

**Basic Usage:**
```javascript
const sendpulse = require("sendpulse-api");

const API_USER_ID = "b3f8aa3be78c7cc355dbe7a7c924cc88";
const API_SECRET = "3bde515bc9a01af7d00ef56137b19bd3";
const TOKEN_STORAGE = "/tmp/";  // Token cache location

sendpulse.init(API_USER_ID, API_SECRET, TOKEN_STORAGE, function() {
  // Ready to send emails
  const email = {
    "subject": "Test Email",
    "from": { "name": "Jastipin", "email": "noreply@jastipin.me" },
    "to": [{ "name": "User", "email": "user@example.com" }],
    "html": "<h1>Hello World</h1>",
    "text": "Hello World"
  };

  sendpulse.smtpSendMail(function(data) {
    console.log(data);
  }, email);
});
```

### Rate Limits & Requirements

**IMPORTANT:** SMTP service harus diaktifkan terlebih dahulu melalui aplikasi di SendPulse dashboard.

**Activation Steps:**
1. Login ke https://login.sendpulse.com
2. Navigate to SMTP settings
3. Fill out application form
4. Wait for approval (biasanya 1-2 hari)

**Limits:**
- Per SendPulse documentation, limits depend on your account plan
- Free tier: Typically 12,000 emails/month
- Paid plans: Higher limits

---

## 🏗️ Architecture Design

### File Structure

```
/app/backend/src/
├── services/
│   ├── email/
│   │   ├── sendpulse.service.ts      # Core SendPulse integration
│   │   ├── email-template.service.ts # Template rendering
│   │   └── email-queue.service.ts    # Queue management (future)
│   └── notification.service.ts       # Orchestrator (existing)
├── types/
│   └── email.types.ts                # TypeScript interfaces
├── templates/
│   └── email/
│       ├── order-confirmation.html   # Template files
│       ├── payment-link.html
│       └── payment-received.html
└── utils/
    └── email-validator.ts            # Email validation utilities
```

### Service Architecture

```
┌─────────────────┐
│  Checkout Flow  │
└────────┬────────┘
         │
         v
┌─────────────────────────────┐
│  checkout-dp.service.ts     │
│  - Create order             │
│  - Create guest             │
│  - Emit event ───────┐      │
└─────────────────────────────┘
                        │
                        v
         ┌──────────────────────────┐
         │ notification.service.ts  │
         │ - Event orchestrator     │
         │ - Route to channels      │
         └──────────┬───────────────┘
                    │
                    v
         ┌──────────────────────────┐
         │ sendpulse.service.ts     │
         │ - OAuth authentication   │
         │ - Token management       │
         │ - Send email             │
         │ - Error handling         │
         │ - Retry logic            │
         └──────────┬───────────────┘
                    │
                    v
         ┌──────────────────────────┐
         │   SendPulse API          │
         │   api.sendpulse.com      │
         └──────────────────────────┘
```

---

## 📝 Implementation Steps

### Phase 1: Setup & Configuration (30 mins)

#### Step 1.1: Install Dependencies
```bash
cd /app/backend
npm install sendpulse-api
npm install --save-dev @types/node
```

#### Step 1.2: Environment Variables
**File:** `/app/backend/.env`

```bash
# SendPulse Configuration
SENDPULSE_API_ID=b3f8aa3be78c7cc355dbe7a7c924cc88
SENDPULSE_API_SECRET=3bde515bc9a01af7d00ef56137b19bd3
SENDPULSE_TOKEN_STORAGE=/tmp/sendpulse-tokens
SENDPULSE_FROM_EMAIL=noreply@jastipin.me
SENDPULSE_FROM_NAME=Jastipin Team
SENDPULSE_ENABLED=true  # Feature flag

# Email Settings
EMAIL_RETRY_ATTEMPTS=3
EMAIL_RETRY_DELAY=2000  # milliseconds
EMAIL_TIMEOUT=10000     # 10 seconds
```

#### Step 1.3: Activate SendPulse SMTP
**Action Required:**
1. Login ke https://login.sendpulse.com/settings/#api
2. Verify API credentials visible
3. Navigate to SMTP section
4. Fill out activation form
5. Verify sender domain (optional tapi recommended untuk deliverability)

**Domain Verification (Recommended):**
- Add SPF record: `v=spf1 include:sendpulse.com ~all`
- Add DKIM record (provided by SendPulse)
- Improves email deliverability & reduces spam score

---

### Phase 2: Core Service Implementation (2 hours)

#### Step 2.1: Create TypeScript Types
**File:** `/app/backend/src/types/email.types.ts`

```typescript
export interface SendPulseConfig {
  apiId: string
  apiSecret: string
  tokenStorage: string
  fromEmail: string
  fromName: string
  enabled: boolean
}

export interface EmailRecipient {
  name: string
  email: string
}

export interface EmailAttachment {
  name: string
  content: string  // Base64 encoded
  type: string     // MIME type
}

export interface SendEmailRequest {
  to: EmailRecipient[]
  subject: string
  html?: string
  text?: string
  template?: {
    id: string
    variables: Record<string, any>
  }
  cc?: EmailRecipient[]
  bcc?: EmailRecipient[]
  attachments?: EmailAttachment[]
}

export interface SendEmailResponse {
  success: boolean
  messageId?: string
  error?: string
  deliveryStatus?: 'sent' | 'queued' | 'failed'
}

export enum EmailTemplate {
  ORDER_CONFIRMATION = 'order_confirmation',
  PAYMENT_LINK = 'payment_link',
  PAYMENT_RECEIVED = 'payment_received',
  ORDER_VALIDATED = 'order_validated',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered'
}

export interface OrderConfirmationData {
  customerName: string
  orderId: string
  orderDate: string
  dpAmount: string
  remainingAmount: string
  jastiperName: string
  productList: string
  dashboardUrl: string
}
```

#### Step 2.2: SendPulse Service
**File:** `/app/backend/src/services/email/sendpulse.service.ts`

```typescript
import sendpulse from 'sendpulse-api'
import {
  SendPulseConfig,
  SendEmailRequest,
  SendEmailResponse,
  EmailRecipient
} from '../../types/email.types'

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
        // SendPulse requires Base64 encoding for HTML
        emailPayload.html = Buffer.from(request.html).toString('base64')
        if (request.text) {
          emailPayload.text = request.text
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

      // Send email with retry logic
      const result = await this.sendWithRetry(emailPayload)

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
   * Send email with retry logic
   */
  private async sendWithRetry(
    emailPayload: any,
    attempts: number = 3
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let currentAttempt = 0

      const attemptSend = () => {
        currentAttempt++

        sendpulse.smtpSendMail((response: any) => {
          // Check for errors
          if (response && response.is_error) {
            console.error(
              `[SendPulse] Attempt ${currentAttempt}/${attempts} failed:`,
              response
            )

            // Retry if attempts remaining
            if (currentAttempt < attempts) {
              const delay = 2000 * currentAttempt // Exponential backoff
              console.log(`[SendPulse] Retrying in ${delay}ms...`)
              setTimeout(attemptSend, delay)
            } else {
              reject(new Error(response.message || 'Failed to send email'))
            }
          } else {
            // Success
            console.log('[SendPulse] Email sent successfully:', response)
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
  async sendTestEmail(toEmail: string): Promise<SendEmailResponse> {
    return this.sendEmail({
      to: [{ name: 'Test User', email: toEmail }],
      subject: 'Jastipin Test Email',
      html: '<h1>Test Email</h1><p>This is a test email from Jastipin.</p>',
      text: 'Test Email - This is a test email from Jastipin.'
    })
  }
}

// Singleton instance
let sendpulseServiceInstance: SendPulseService | null = null

export function getSendPulseService(): SendPulseService {
  if (!sendpulseServiceInstance) {
    const config: SendPulseConfig = {
      apiId: process.env.SENDPULSE_API_ID || '',
      apiSecret: process.env.SENDPULSE_API_SECRET || '',
      tokenStorage: process.env.SENDPULSE_TOKEN_STORAGE || '/tmp/sendpulse-tokens',
      fromEmail: process.env.SENDPULSE_FROM_EMAIL || 'noreply@jastipin.me',
      fromName: process.env.SENDPULSE_FROM_NAME || 'Jastipin Team',
      enabled: process.env.SENDPULSE_ENABLED === 'true'
    }

    sendpulseServiceInstance = new SendPulseService(config)
  }

  return sendpulseServiceInstance
}
```

#### Step 2.3: Email Template Service
**File:** `/app/backend/src/services/email/email-template.service.ts`

```typescript
import { OrderConfirmationData } from '../../types/email.types'

export class EmailTemplateService {
  /**
   * Render Order Confirmation Email
   */
  static renderOrderConfirmation(data: OrderConfirmationData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .order-details { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #4F46E5; }
    .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${data.customerName}</strong>,</p>
      <p>Thank you for your order! Your Jastiper <strong>${data.jastiperName}</strong> has received your request.</p>

      <div class="order-details">
        <h3>Order Details</h3>
        <p><strong>Order ID:</strong> ${data.orderId}</p>
        <p><strong>Date:</strong> ${data.orderDate}</p>
        <p><strong>Products:</strong><br>${data.productList}</p>
        <hr>
        <p><strong>DP Paid:</strong> <span class="amount">${data.dpAmount}</span></p>
        <p><strong>Remaining:</strong> ${data.remainingAmount}</p>
      </div>

      <h3>What's Next?</h3>
      <ol>
        <li>Your Jastiper will validate your order within 1-2 days</li>
        <li>You'll receive a payment link for the remaining amount</li>
        <li>Upload your payment proof using the magic link we'll send you</li>
        <li>Track your order status in the dashboard</li>
      </ol>

      <div style="text-align: center;">
        <a href="${data.dashboardUrl}" class="button">View Order Status</a>
      </div>

      <p>If you have any questions, please contact your Jastiper directly.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Jastipin. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Render plain text version (fallback)
   */
  static renderOrderConfirmationText(data: OrderConfirmationData): string {
    return `
Order Confirmed!

Hi ${data.customerName},

Thank you for your order! Your Jastiper ${data.jastiperName} has received your request.

Order Details:
- Order ID: ${data.orderId}
- Date: ${data.orderDate}
- Products: ${data.productList}
- DP Paid: ${data.dpAmount}
- Remaining: ${data.remainingAmount}

What's Next?
1. Your Jastiper will validate your order within 1-2 days
2. You'll receive a payment link for the remaining amount
3. Upload your payment proof using the magic link we'll send you
4. Track your order status: ${data.dashboardUrl}

© 2025 Jastipin. All rights reserved.
This is an automated email. Please do not reply.
    `.trim()
  }

  /**
   * Render Payment Link Email (with Magic Link)
   */
  static renderPaymentLinkEmail(data: {
    customerName: string
    orderId: string
    remainingAmount: string
    deadline: string
    magicLink: string
    jastiperName: string
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Link</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .amount { font-size: 32px; font-weight: bold; color: #10B981; text-align: center; margin: 20px 0; }
    .button { display: inline-block; padding: 15px 30px; background: #10B981; color: white; text-decoration: none; border-radius: 6px; font-size: 18px; }
    .warning { background: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Required</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${data.customerName}</strong>,</p>
      <p>Your order <strong>${data.orderId}</strong> has been validated by ${data.jastiperName}!</p>

      <div class="amount">${data.remainingAmount}</div>
      <p style="text-align: center;">Amount Due</p>

      <div class="warning">
        <strong>⏰ Payment Deadline:</strong> ${data.deadline}
      </div>

      <h3>How to Upload Payment Proof:</h3>
      <ol>
        <li>Transfer ${data.remainingAmount} to the account provided</li>
        <li>Click the button below to upload your payment proof</li>
        <li>Enter the last 4 digits of your WhatsApp number for verification</li>
        <li>Upload a photo of your payment receipt</li>
      </ol>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.magicLink}" class="button">Upload Payment Proof</a>
      </div>

      <p><small>This link is valid for 7 days. Keep it safe and do not share with others.</small></p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Jastipin. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Render Payment Received Confirmation
   */
  static renderPaymentReceivedEmail(data: {
    customerName: string
    orderId: string
    amountPaid: string
    receiptNumber: string
    jastiperName: string
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 20px; text-align: center; }
    .checkmark { font-size: 48px; text-align: center; margin: 20px 0; }
    .content { padding: 20px; background: #f9fafb; }
    .receipt-box { background: white; padding: 20px; border: 2px dashed #10B981; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Received!</h1>
    </div>
    <div class="content">
      <div class="checkmark">✅</div>
      <p style="text-align: center; font-size: 18px;">Thank you, <strong>${data.customerName}</strong>!</p>
      <p style="text-align: center;">Your payment has been successfully received and verified.</p>

      <div class="receipt-box">
        <h3 style="margin-top: 0;">Payment Receipt</h3>
        <p><strong>Order ID:</strong> ${data.orderId}</p>
        <p><strong>Receipt Number:</strong> ${data.receiptNumber}</p>
        <p><strong>Amount Paid:</strong> ${data.amountPaid}</p>
        <p><strong>Jastiper:</strong> ${data.jastiperName}</p>
      </div>

      <h3>What Happens Next?</h3>
      <ol>
        <li>Your Jastiper will start processing your order</li>
        <li>You'll receive updates as your order progresses</li>
        <li>Track your shipment once items are purchased and shipped</li>
      </ol>

      <p>Thank you for using Jastipin!</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Jastipin. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  }
}
```

---

### Phase 3: Integration with Checkout Flow (1 hour)

#### Step 3.1: Update Checkout Service
**File:** `/app/backend/src/services/checkout-dp.service.ts`

Add email notification trigger after successful order creation:

```typescript
// Add import
import { getSendPulseService } from './email/sendpulse.service'
import { EmailTemplateService } from './email/email-template.service'

// In processCheckoutDP function, after order creation:
export async function processCheckoutDP(
  request: CheckoutDPRequest
): Promise<CheckoutDPResponse> {
  try {
    // ... existing order creation logic ...

    // NEW: Send order confirmation email
    if (request.participantEmail) {
      await sendOrderConfirmationEmail({
        customerName: request.participantName,
        customerEmail: request.participantEmail,
        orderId: order.id,
        dpAmount: dpAmount,
        jastiperName: trip.user.displayName,
        items: order.items
      })
    }

    return {
      success: true,
      orderId: order.id,
      guestId: guest.id,
      dpAmount,
      paymentLink: `/payment/${order.id}`
    }
  } catch (error) {
    // ... error handling ...
  }
}

// NEW: Helper function for sending email
async function sendOrderConfirmationEmail(data: {
  customerName: string
  customerEmail: string
  orderId: string
  dpAmount: number
  jastiperName: string
  items: any[]
}): Promise<void> {
  try {
    const sendpulseService = getSendPulseService()

    // Format data
    const emailData = {
      customerName: data.customerName,
      orderId: data.orderId,
      orderDate: new Date().toLocaleDateString('id-ID'),
      dpAmount: `Rp ${data.dpAmount.toLocaleString('id-ID')}`,
      remainingAmount: 'TBD (waiting validation)',
      jastiperName: data.jastiperName,
      productList: data.items.map(item =>
        `${item.product.name} (${item.quantity}x)`
      ).join(', '),
      dashboardUrl: `https://jastipin.me/orders/${data.orderId}`
    }

    // Render HTML and text
    const html = EmailTemplateService.renderOrderConfirmation(emailData)
    const text = EmailTemplateService.renderOrderConfirmationText(emailData)

    // Send email
    const result = await sendpulseService.sendEmail({
      to: [{ name: data.customerName, email: data.customerEmail }],
      subject: `Order Confirmation - ${data.orderId}`,
      html,
      text
    })

    if (result.success) {
      console.log(`[Email] Order confirmation sent to ${data.customerEmail}`)
    } else {
      console.error(`[Email] Failed to send confirmation: ${result.error}`)
    }
  } catch (error) {
    // Don't fail checkout if email fails
    console.error('[Email] Error sending order confirmation:', error)
  }
}
```

---

### Phase 4: Testing (1 hour)

#### Test Script
**File:** `/app/backend/src/scripts/test-sendpulse.ts`

```typescript
import { getSendPulseService } from '../services/email/sendpulse.service'
import { EmailTemplateService } from '../services/email/email-template.service'
import dotenv from 'dotenv'

dotenv.config()

async function testSendPulse() {
  console.log('=== SendPulse Email Test ===\n')

  const service = getSendPulseService()

  // Test 1: Simple test email
  console.log('Test 1: Sending simple test email...')
  const testResult = await service.sendTestEmail('YOUR_EMAIL@example.com')
  console.log('Result:', testResult)
  console.log()

  // Test 2: Order confirmation email
  console.log('Test 2: Sending order confirmation email...')
  const orderData = {
    customerName: 'John Doe',
    orderId: 'ORD-TEST-001',
    orderDate: new Date().toLocaleDateString('id-ID'),
    dpAmount: 'Rp 200.000',
    remainingAmount: 'Rp 800.000',
    jastiperName: 'Tina Jastip',
    productList: 'Nike Air Max (2x), Adidas Ultraboost (1x)',
    dashboardUrl: 'https://jastipin.me/orders/test-001'
  }

  const html = EmailTemplateService.renderOrderConfirmation(orderData)
  const text = EmailTemplateService.renderOrderConfirmationText(orderData)

  const orderResult = await service.sendEmail({
    to: [{ name: 'John Doe', email: 'YOUR_EMAIL@example.com' }],
    subject: 'Order Confirmation - ORD-TEST-001',
    html,
    text
  })
  console.log('Result:', orderResult)
  console.log()

  console.log('=== Tests Complete ===')
}

testSendPulse().catch(console.error)
```

**Run test:**
```bash
cd /app/backend
tsx src/scripts/test-sendpulse.ts
```

---

## 📧 Email Templates

### Template 1: Order Confirmation
- **When:** Immediately after checkout
- **Subject:** `Order Confirmation - {orderId}`
- **Key Data:** Order ID, DP amount, product list, jastiper name
- **CTA:** View order status in dashboard

### Template 2: Payment Link (Magic Link)
- **When:** After order validation
- **Subject:** `Payment Required - {orderId}`
- **Key Data:** Remaining amount, deadline, magic link
- **CTA:** Upload payment proof

### Template 3: Payment Received
- **When:** After payment verification
- **Subject:** `Payment Received - {orderId}`
- **Key Data:** Amount paid, receipt number
- **CTA:** Track order shipment

---

## 🧪 Testing Plan

### Unit Tests
- [ ] SendPulse authentication
- [ ] Email sending with retry logic
- [ ] Template rendering
- [ ] Email validation

### Integration Tests
- [ ] Checkout flow triggers email
- [ ] Magic link generation triggers email
- [ ] Payment confirmation triggers email

### Manual Tests
- [ ] Email received in inbox (not spam)
- [ ] Email renders correctly on mobile
- [ ] Email renders correctly on desktop
- [ ] Links in email work correctly
- [ ] Unsubscribe link works (future)

### Load Tests
- [ ] Send 100 emails in 1 minute
- [ ] Verify delivery rate >95%
- [ ] Check SendPulse dashboard for stats

---

## 🔒 Security & Best Practices

### Environment Security
- ✅ Store credentials in `.env` (never commit)
- ✅ Use environment variables in production
- ✅ Rotate API keys every 90 days

### Email Security
- ✅ Validate email addresses before sending
- ✅ Use Base64 encoding for HTML content
- ✅ Implement retry logic with exponential backoff
- ✅ Log all email attempts for audit trail

### Deliverability Best Practices
- ✅ Verify sender domain (SPF, DKIM records)
- ✅ Include unsubscribe link (future)
- ✅ Use plain text fallback
- ✅ Avoid spam trigger words
- ✅ Test emails with Mail Tester (mail-tester.com)

### Error Handling
- ✅ Don't fail checkout if email fails
- ✅ Log errors for debugging
- ✅ Implement retry queue (future)
- ✅ Monitor delivery rates

### Performance
- ✅ Send emails asynchronously (don't block checkout)
- ✅ Use connection pooling for high volume
- ✅ Cache OAuth tokens (1 hour validity)
- ✅ Consider queue system for >1000 emails/day (Bull, BullMQ)

---

## 📊 Success Metrics

### Technical Metrics
- Email delivery rate: Target >95%
- Email send latency: Target <5 seconds
- Inbox placement rate: Target >80% (not spam)
- Error rate: Target <5%

### Business Metrics
- Email open rate: Target >25%
- Click-through rate: Target >10%
- Magic link usage rate: Target >70%

### Monitoring
- SendPulse dashboard: Check daily stats
- Application logs: Monitor error rates
- Database: Log all email attempts in NotificationLog table

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Activate SendPulse SMTP service
- [ ] Verify sender domain (SPF/DKIM)
- [ ] Test all 3 email templates
- [ ] Configure environment variables
- [ ] Update .env.production
- [ ] Test on staging environment

### Deployment
- [ ] Install npm package: `sendpulse-api`
- [ ] Deploy backend code
- [ ] Restart PM2 process
- [ ] Monitor logs for errors
- [ ] Send test email in production

### Post-Deployment
- [ ] Monitor SendPulse dashboard
- [ ] Check delivery rates
- [ ] Verify emails not going to spam
- [ ] Get user feedback
- [ ] Set up alerts for failed emails

---

## 📚 References

### SendPulse Documentation
- [SMTP API Documentation](https://sendpulse.com/integrations/api/smtp)
- [General API Documentation](https://sendpulse.com/integrations/api)
- [SendPulse Knowledge Base](https://sendpulse.com/knowledge-base/smtp)

### Node.js SDK
- [sendpulse-api npm package](https://www.npmjs.com/package/sendpulse-api)
- [GitHub Repository](https://github.com/sendpulse/sendpulse-rest-api-node.js/)
- [Example Code](https://github.com/sendpulse/sendpulse-rest-api-node.js/blob/master/example.js)

### Additional Resources
- [OAuth 2.0 Authentication](https://sendpulse.com/integrations/api#auth)
- [Email Templates Guide](https://sendpulse.com/knowledge-base/smtp/send-email-with-template)
- [SMTP Service Overview](https://sendpulse.com/features/smtp)

---

## 📞 Support

### Issues & Troubleshooting

**Problem:** Email not sending
- Check SendPulse dashboard for errors
- Verify SMTP service is activated
- Check API credentials in .env
- Review application logs

**Problem:** Email goes to spam
- Verify sender domain (SPF/DKIM)
- Test with Mail Tester (mail-tester.com)
- Avoid spam trigger words
- Include unsubscribe link

**Problem:** High latency
- Check token caching
- Implement email queue
- Review retry logic

---

**Status:** Ready for Implementation
**Estimated Time:** 4-5 hours total
**Dependencies:** SendPulse SMTP activation (1-2 days)
**Next Steps:** Activate SendPulse → Implement Phase 1 → Test → Deploy

---

**END OF IMPLEMENTATION PLAN**
