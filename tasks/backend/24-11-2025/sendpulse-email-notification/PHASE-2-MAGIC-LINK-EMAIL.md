# Phase 2: Payment Link Email with Magic Link

**Status:** Ready to Implement
**Priority:** HIGH
**Estimated Time:** 2-3 hours
**Dependencies:** Phase 1 (Order Confirmation) ✅ Complete

---

## 🎯 Overview

### Goal
Implement automated email notification yang mengirim **magic link** untuk upload payment proof setelah order divalidasi oleh Jastiper.

### User Flow
```
Order Created → Jastiper Validates → ORDER_VALIDATED Event
    ↓
Generate Upload Token (Magic Link)
    ↓
Send Email: "Payment Required"
    ↓
User clicks magic link → Upload payment proof
```

### Success Criteria
- ✅ Email sent automatically when order validated
- ✅ Magic link generated and included in email
- ✅ Beautiful email template with clear CTA
- ✅ Integration with existing upload system
- ✅ Non-blocking (doesn't fail if email fails)

---

## 📋 Current System Status

### ✅ Already Implemented (from Phase 1)
1. **Magic Link System** - [guest-checkout-notification-flow](../../../frontend/21-11-2025/guest-checkout-notification-flow/)
   - Token generation: `/src/services/token.service.ts` ✅
   - Upload validation: `/src/routes/upload.ts` ✅
   - Challenge-response: Last 4 digits WhatsApp ✅
   - Upload page: `/app/order/upload/[token]/page.tsx` ✅

2. **Email System** - Phase 1
   - SendPulse integration ✅
   - Email templates ✅
   - Order confirmation email working ✅
   - HTML rendering fixed ✅

### 🔨 What Needs to be Built
1. **Email Trigger**: When order status → `validated`
2. **Email Content**: Payment Link template
3. **Magic Link Generation**: Create token when sending email
4. **Integration**: Connect validation → email → magic link

---

## 🏗️ Implementation Steps

### Step 1: Create Email Trigger Service (30 mins)

**File:** `/app/backend/src/services/email/email-trigger.service.ts`

```typescript
/**
 * Email Trigger Service
 * Handles email notifications for various order events
 */

import { PrismaClient } from '@prisma/client'
import { getSendPulseService } from './sendpulse.service.js'
import { EmailTemplateService } from './email-template.service.js'
import { generateUploadToken } from '../token.service.js'

const db = new PrismaClient()

export class EmailTriggerService {
  /**
   * Send payment link email when order is validated
   */
  static async sendPaymentLinkEmail(orderId: string): Promise<void> {
    try {
      console.log(`[EmailTrigger] Sending payment link for order ${orderId}`)

      // 1. Get order details with all relations
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          Participant: true,
          Guest: true,
          Trip: {
            include: {
              User: {
                select: {
                  profileName: true,
                  slug: true
                }
              }
            }
          },
          OrderItem: {
            include: {
              Product: true
            }
          }
        }
      })

      if (!order) {
        console.error(`[EmailTrigger] Order ${orderId} not found`)
        return
      }

      // 2. Check if guest has email
      const email = order.Guest?.email || order.Participant?.email
      if (!email) {
        console.log(`[EmailTrigger] No email found for order ${orderId}, skipping`)
        return
      }

      // 3. Generate magic link upload token
      const tokenData = await generateUploadToken(orderId)
      const magicLink = `https://jastipin.me/order/upload/${tokenData.rawToken}`

      // 4. Calculate remaining amount
      const remainingAmount = (order.totalPrice || 0) - (order.dpAmount || 0)

      // 5. Calculate deadline (e.g., 3 days from validation)
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + 3)

      // 6. Prepare email data
      const emailData = {
        customerName: order.Participant?.name || order.Guest?.name || 'Customer',
        orderId: order.id,
        remainingAmount: `Rp ${remainingAmount.toLocaleString('id-ID')}`,
        deadline: deadline.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        magicLink,
        jastiperName: order.Trip?.User?.profileName || order.Trip?.User?.slug || 'Jastiper'
      }

      // 7. Render email template
      const html = EmailTemplateService.renderPaymentLinkEmail(emailData)
      const text = EmailTemplateService.renderPaymentLinkText(emailData)

      // 8. Send email
      const sendpulseService = getSendPulseService()
      const result = await sendpulseService.sendEmail({
        to: [{
          name: emailData.customerName,
          email
        }],
        subject: `Payment Required - ${order.id}`,
        html,
        text
      })

      if (result.success) {
        console.log(`[EmailTrigger] ✅ Payment link email sent to ${email}`)
        console.log(`[EmailTrigger] Magic link: ${magicLink}`)
        console.log(`[EmailTrigger] Message ID: ${result.messageId}`)
      } else {
        console.error(`[EmailTrigger] ❌ Failed to send: ${result.error}`)
      }

    } catch (error) {
      console.error('[EmailTrigger] Error sending payment link email:', error)
      // Don't throw - email failure shouldn't break the app
    }
  }

  /**
   * Send payment received confirmation email
   */
  static async sendPaymentReceivedEmail(orderId: string): Promise<void> {
    try {
      console.log(`[EmailTrigger] Sending payment received confirmation for ${orderId}`)

      // Get order details
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          Participant: true,
          Guest: true,
          Trip: {
            include: {
              User: {
                select: {
                  profileName: true,
                  slug: true
                }
              }
            }
          }
        }
      })

      if (!order) {
        console.error(`[EmailTrigger] Order ${orderId} not found`)
        return
      }

      const email = order.Guest?.email || order.Participant?.email
      if (!email) {
        console.log(`[EmailTrigger] No email for order ${orderId}, skipping`)
        return
      }

      // Prepare email data
      const emailData = {
        customerName: order.Participant?.name || order.Guest?.name || 'Customer',
        orderId: order.id,
        amountPaid: `Rp ${(order.totalPrice || 0).toLocaleString('id-ID')}`,
        receiptNumber: `RCPT-${order.id}`,
        jastiperName: order.Trip?.User?.profileName || order.Trip?.User?.slug || 'Jastiper'
      }

      // Render template
      const html = EmailTemplateService.renderPaymentReceivedEmail(emailData)
      const text = EmailTemplateService.renderPaymentReceivedText(emailData)

      // Send email
      const sendpulseService = getSendPulseService()
      const result = await sendpulseService.sendEmail({
        to: [{ name: emailData.customerName, email }],
        subject: `Payment Received - ${order.id}`,
        html,
        text
      })

      if (result.success) {
        console.log(`[EmailTrigger] ✅ Payment received email sent to ${email}`)
      } else {
        console.error(`[EmailTrigger] ❌ Failed: ${result.error}`)
      }

    } catch (error) {
      console.error('[EmailTrigger] Error sending payment received email:', error)
    }
  }
}
```

---

### Step 2: Add Hook to Order Validation (15 mins)

**Find where order status is updated to "validated"**

Kemungkinan lokasi:
- `/src/services/order.service.ts`
- `/src/routes/orders.ts`
- Admin dashboard update endpoint

**Add email trigger after validation:**

```typescript
// Example in order update service
import { EmailTriggerService } from './email/email-trigger.service.js'

export async function updateOrderStatus(
  orderId: string,
  newStatus: string
): Promise<void> {
  // Update order status
  await db.order.update({
    where: { id: orderId },
    data: { status: newStatus }
  })

  // Trigger email notifications based on status
  if (newStatus === 'validated') {
    // Send payment link email (async, non-blocking)
    EmailTriggerService.sendPaymentLinkEmail(orderId).catch(error => {
      console.error('Failed to send payment link email:', error)
    })
  }

  if (newStatus === 'paid' || newStatus === 'payment_verified') {
    // Send payment received email (async, non-blocking)
    EmailTriggerService.sendPaymentReceivedEmail(orderId).catch(error => {
      console.error('Failed to send payment received email:', error)
    })
  }
}
```

---

### Step 3: Update Email Templates (Already Done ✅)

Templates sudah ada di Phase 1:
- `renderPaymentLinkEmail()` ✅
- `renderPaymentLinkText()` ✅
- `renderPaymentReceivedEmail()` ✅
- `renderPaymentReceivedText()` ✅

**No changes needed!**

---

### Step 4: Test Payment Link Email (30 mins)

**Create test script:**

**File:** `/app/backend/src/scripts/test-payment-link-email.ts`

```typescript
/**
 * Test Payment Link Email
 *
 * Usage:
 *   TEST_ORDER_ID=your-order-id npx tsx src/scripts/test-payment-link-email.ts
 */

import dotenv from 'dotenv'
import { EmailTriggerService } from '../services/email/email-trigger.service.js'

dotenv.config()

const TEST_ORDER_ID = process.env.TEST_ORDER_ID

async function testPaymentLinkEmail() {
  console.log('========================================')
  console.log('Payment Link Email Test')
  console.log('========================================\n')

  if (!TEST_ORDER_ID) {
    console.error('❌ Error: TEST_ORDER_ID not set')
    console.log('\nUsage:')
    console.log('  TEST_ORDER_ID=your-order-id npx tsx src/scripts/test-payment-link-email.ts\n')
    process.exit(1)
  }

  console.log(`📧 Testing payment link email for order: ${TEST_ORDER_ID}\n`)

  try {
    await EmailTriggerService.sendPaymentLinkEmail(TEST_ORDER_ID)
    console.log('\n✅ Test completed!')
    console.log('\n📬 Check the email inbox for the payment link email')
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

testPaymentLinkEmail()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Script error:', error)
    process.exit(1)
  })
```

**Run test:**
```bash
cd /app/backend

# Find a test order ID from database
# Then run:
TEST_ORDER_ID=clxxxxx-xxxx-xxxx npx tsx src/scripts/test-payment-link-email.ts
```

---

### Step 5: Integration Testing (1 hour)

#### Test Scenario 1: Complete Order Flow

1. **Make a checkout** (as guest with email)
2. **Verify order confirmation email** received ✅
3. **Jastiper validates order** (update status to "validated")
4. **Verify payment link email** received with magic link
5. **Click magic link** → Should open upload page
6. **Enter last 4 digits** WhatsApp → Challenge verification
7. **Upload payment proof** → Should succeed
8. **Verify payment received email** (optional, if implemented)

#### Test Scenario 2: Edge Cases

- [ ] Order without email → Email skipped (logged)
- [ ] Invalid order ID → Error handled gracefully
- [ ] Email service disabled → Logged, no error thrown
- [ ] SendPulse failure → Retry logic works

---

## 🔌 Integration Points

### Existing Systems to Connect

1. **Token Service** (Already exists)
   - Location: `/src/services/token.service.ts`
   - Function: `generateUploadToken(orderId)`
   - Returns: `{ rawToken, hashedToken, expiresAt }`

2. **Upload System** (Already exists)
   - Upload page: `/app/order/upload/[token]/page.tsx`
   - Validation endpoint: `GET /api/upload/validate?token=xxx`
   - Upload endpoint: `POST /api/upload/:orderId`

3. **Order Status Update** (Need to find)
   - Admin dashboard
   - Jastiper panel
   - API endpoint for status update

---

## 📧 Email Template Preview

### Payment Link Email

**Subject:** Payment Required - ORD-12345

**Content:**
```
┌────────────────────────────────────────┐
│  💳 Payment Required                   │ ← Green gradient
├────────────────────────────────────────┤
│ Hi John Doe,                           │
│                                        │
│ Great news! Your order ORD-12345       │
│ has been validated by Tina Jastip.    │
│                                        │
│        Rp 800.000                      │ ← Large, bold
│        Amount Due                      │
│                                        │
│ ⏰ Payment Deadline:                   │
│    27 November 2025, 23:59            │ ← Warning box
│                                        │
│ 📸 How to Upload Payment Proof:        │
│ 1. Transfer Rp 800.000                │
│ 2. Click button below                 │
│ 3. Enter last 4 digits WhatsApp       │
│ 4. Upload receipt photo               │
│                                        │
│   [📤 Upload Payment Proof] ← Button  │
│                                        │
│ 🔒 This link is valid for 7 days      │
└────────────────────────────────────────┘
```

---

## 🐛 Error Handling

### Email Sending Failures

```typescript
// All email triggers use try-catch
try {
  await EmailTriggerService.sendPaymentLinkEmail(orderId)
} catch (error) {
  console.error('Email failed, but order validation continues')
  // Don't throw - email failure shouldn't break validation
}
```

### Missing Data

- No email → Skip email, log warning
- Invalid order → Log error, skip email
- Token generation fails → Log error, email without link (fallback)

### SendPulse Failures

- Network error → Retry 3 times
- Auth failure → Log error, skip email
- Rate limit → Queue for later (future enhancement)

---

## 📊 Success Metrics

### Technical
- Email sent within 5 seconds of validation
- Magic link valid for 7 days
- Token generation success rate: 100%
- Email delivery rate: >95%

### Business
- Email open rate: >30% (higher than order confirmation)
- Link click rate: >70% (high urgency)
- Upload completion rate: >60%
- Time to upload: <24 hours average

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Find order status update location
- [ ] Create email trigger service
- [ ] Add hook to validation flow
- [ ] Test with real order
- [ ] Verify magic link works
- [ ] Test email template rendering

### Deployment
- [ ] Build backend: `npm run build`
- [ ] Restart PM2: `pm2 restart jastipin-api`
- [ ] Test validation flow
- [ ] Monitor logs: `pm2 logs jastipin-api`
- [ ] Verify email sent

### Post-Deployment
- [ ] Monitor SendPulse dashboard
- [ ] Check email delivery rate
- [ ] Verify magic links working
- [ ] Get user feedback
- [ ] Track upload completion rate

---

## 🔍 Where to Find Order Validation Code

**Likely locations to search:**

```bash
# Search for order status updates
cd /app/backend
grep -r "validated" src/
grep -r "status.*=" src/routes/orders.ts
grep -r "updateOrder" src/
```

**Possible files:**
- `/src/routes/orders.ts` - Order API endpoints
- `/src/services/order.service.ts` - Order business logic
- Admin dashboard API routes

**What to look for:**
```typescript
// Pattern 1: Direct update
await db.order.update({
  where: { id: orderId },
  data: { status: 'validated' }
})

// Pattern 2: Through service
await orderService.updateStatus(orderId, 'validated')

// Pattern 3: In mutation/resolver
mutation updateOrderStatus(orderId, newStatus)
```

---

## 💡 Quick Start Commands

### Find Order Status Update Code
```bash
cd /app/backend
grep -rn "status.*validated" src/
```

### Test Email Trigger
```bash
# After implementation
TEST_ORDER_ID=your-order-id npx tsx src/scripts/test-payment-link-email.ts
```

### Monitor Logs
```bash
pm2 logs jastipin-api | grep EmailTrigger
```

### Check SendPulse Dashboard
```
https://login.sendpulse.com/smtp/dashboard
```

---

## 📚 References

### Existing Documentation
- **Phase 1 Implementation:** [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)
- **Magic Link System:** [guest-checkout-notification-flow](../../../frontend/21-11-2025/guest-checkout-notification-flow/)
- **Token Service:** `/backend/src/services/token.service.ts`
- **Email Templates:** `/backend/src/services/email/email-template.service.ts`

### Related Tasks
- ✅ Phase 1: Order Confirmation Email - Complete
- 🔨 Phase 2: Payment Link Email - This document
- ⏳ Phase 3: Payment Received Email - Pending
- ⏳ Phase 4: Shipment Notifications - Future

---

## 🎯 Next Steps

### Immediate (Next 1-2 hours)
1. ✅ **Read this plan**
2. 🔨 **Find order validation code** (`grep -r "validated"`)
3. 🔨 **Create email-trigger.service.ts**
4. 🔨 **Add hook to validation flow**
5. 🔨 **Test with real order**

### After Testing Success
1. Deploy to production
2. Monitor first few emails
3. Get user feedback
4. Implement Phase 3 (Payment Received)

---

**Status:** Ready to Implement
**Prerequisites:** ✅ All met (Phase 1 complete, magic link system exists)
**Estimated Time:** 2-3 hours
**Risk:** Low (all components already exist, just connecting them)

---

**END OF PHASE 2 PLAN**
