/**
 * SendPulse Email Test Script
 *
 * Usage:
 *   1. Set SENDPULSE_ENABLED=true in .env
 *   2. Set TEST_EMAIL environment variable
 *   3. Run: tsx src/scripts/test-sendpulse.ts
 *
 * Example:
 *   TEST_EMAIL=your-email@example.com tsx src/scripts/test-sendpulse.ts
 */

import dotenv from 'dotenv'
import { getSendPulseService } from '../services/email/sendpulse.service.js'
import { EmailTemplateService } from '../services/email/email-template.service.js'

// Load environment variables
dotenv.config()

const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com'

async function runTests() {
  console.log('========================================')
  console.log('SendPulse Email Test Script')
  console.log('========================================\n')

  const service = getSendPulseService()
  const status = service.getStatus()

  console.log('📊 Service Status:')
  console.log(`   - Enabled: ${status.enabled}`)
  console.log(`   - Initialized: ${status.initialized}`)
  console.log(`   - Test Email: ${TEST_EMAIL}\n`)

  if (!status.enabled) {
    console.log('⚠️  WARNING: SendPulse is disabled!')
    console.log('   Set SENDPULSE_ENABLED=true in .env to enable\n')
    return
  }

  // Test 1: Simple test email
  await test1_SimpleEmail()

  // Test 2: Order confirmation email
  await test2_OrderConfirmation()

  // Test 3: Payment link email
  await test3_PaymentLink()

  // Test 4: Payment received email
  await test4_PaymentReceived()

  console.log('\n========================================')
  console.log('✅ All tests completed!')
  console.log('========================================')
  console.log('\n📧 Check your inbox:', TEST_EMAIL)
  console.log('💡 If emails not received, check:')
  console.log('   1. SendPulse SMTP is activated')
  console.log('   2. Sender domain is verified')
  console.log('   3. Check spam folder')
  console.log('   4. Check SendPulse dashboard for errors\n')
}

async function test1_SimpleEmail() {
  console.log('=== Test 1: Simple Test Email ===\n')

  try {
    const service = getSendPulseService()
    const result = await service.sendTestEmail(TEST_EMAIL, 'Test User')

    if (result.success) {
      console.log('✅ Test email sent successfully!')
      console.log(`   Message ID: ${result.messageId}`)
    } else {
      console.log('❌ Failed to send test email')
      console.log(`   Error: ${result.error}`)
    }
  } catch (error) {
    console.error('❌ Exception:', error)
  }

  console.log()
}

async function test2_OrderConfirmation() {
  console.log('=== Test 2: Order Confirmation Email ===\n')

  try {
    const service = getSendPulseService()

    const orderData = {
      customerName: 'John Doe',
      orderId: 'ORD-TEST-001',
      orderCode: 'JST-ABC123-XY',
      orderDate: new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      dpAmount: 'Rp 200.000',
      remainingAmount: 'Rp 800.000',
      jastiperName: 'Tina Jastip',
      productList: 'Nike Air Max (2x), Adidas Ultraboost (1x), iPhone Case (1x)',
      dashboardUrl: 'https://jastipin.me/orders/test-001'
    }

    const html = EmailTemplateService.renderOrderConfirmation(orderData)
    const text = EmailTemplateService.renderOrderConfirmationText(orderData)

    const result = await service.sendEmail({
      to: [{ name: 'John Doe', email: TEST_EMAIL }],
      subject: 'Test - Order Confirmation - ORD-TEST-001',
      html,
      text
    })

    if (result.success) {
      console.log('✅ Order confirmation email sent!')
      console.log(`   Message ID: ${result.messageId}`)
    } else {
      console.log('❌ Failed to send order confirmation')
      console.log(`   Error: ${result.error}`)
    }
  } catch (error) {
    console.error('❌ Exception:', error)
  }

  console.log()
}

async function test3_PaymentLink() {
  console.log('=== Test 3: Payment Link Email ===\n')

  try {
    const service = getSendPulseService()

    const paymentData = {
      customerName: 'John Doe',
      orderId: 'ORD-TEST-001',
      orderCode: 'JST-ABC123-XY',
      remainingAmount: 'Rp 800.000',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      magicLink: 'https://jastipin.me/order/upload/test-token-12345',
      jastiperName: 'Tina Jastip'
    }

    const html = EmailTemplateService.renderPaymentLinkEmail(paymentData)
    const text = EmailTemplateService.renderPaymentLinkText(paymentData)

    const result = await service.sendEmail({
      to: [{ name: 'John Doe', email: TEST_EMAIL }],
      subject: 'Test - Payment Required - ORD-TEST-001',
      html,
      text
    })

    if (result.success) {
      console.log('✅ Payment link email sent!')
      console.log(`   Message ID: ${result.messageId}`)
    } else {
      console.log('❌ Failed to send payment link email')
      console.log(`   Error: ${result.error}`)
    }
  } catch (error) {
    console.error('❌ Exception:', error)
  }

  console.log()
}

async function test4_PaymentReceived() {
  console.log('=== Test 4: Payment Received Email ===\n')

  try {
    const service = getSendPulseService()

    const paymentReceivedData = {
      customerName: 'John Doe',
      orderId: 'ORD-TEST-001',
      orderCode: 'JST-ABC123-XY',
      amountPaid: 'Rp 800.000',
      receiptNumber: 'RCPT-2025-11-24-001',
      jastiperName: 'Tina Jastip'
    }

    const html = EmailTemplateService.renderPaymentReceivedEmail(paymentReceivedData)
    const text = EmailTemplateService.renderPaymentReceivedText(paymentReceivedData)

    const result = await service.sendEmail({
      to: [{ name: 'John Doe', email: TEST_EMAIL }],
      subject: 'Test - Payment Received - ORD-TEST-001',
      html,
      text
    })

    if (result.success) {
      console.log('✅ Payment received email sent!')
      console.log(`   Message ID: ${result.messageId}`)
    } else {
      console.log('❌ Failed to send payment received email')
      console.log(`   Error: ${result.error}`)
    }
  } catch (error) {
    console.error('❌ Exception:', error)
  }

  console.log()
}

// Run tests
runTests()
  .then(() => {
    console.log('Script completed.')
    process.exit(0)
  })
  .catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })
