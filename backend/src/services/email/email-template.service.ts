/**
 * Email Template Service
 * Renders HTML and text email templates
 */

import {
  OrderConfirmationData,
  PaymentLinkData,
  PaymentReceivedData
} from '../../types/email.types.js'

export class EmailTemplateService {
  /**
   * Render Order Confirmation Email (HTML)
   */
  static renderOrderConfirmation(data: OrderConfirmationData): string {
    return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
    }
    .order-details {
      background: #F9FAFB;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border: 1px solid #E5E7EB;
    }
    .order-details h3 {
      margin-top: 0;
      color: #4F46E5;
      font-size: 18px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #6B7280;
    }
    .detail-value {
      color: #111827;
      text-align: right;
    }
    .amount {
      font-size: 24px;
      font-weight: bold;
      color: #4F46E5;
    }
    .next-steps {
      background: #EEF2FF;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #4F46E5;
    }
    .next-steps h3 {
      margin-top: 0;
      color: #4F46E5;
    }
    .next-steps ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .next-steps li {
      margin: 8px 0;
      color: #374151;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: #4F46E5;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      background: #4338CA;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      background: #F9FAFB;
      font-size: 13px;
      color: #6B7280;
      border-top: 1px solid #E5E7EB;
    }
    .footer p {
      margin: 5px 0;
    }
    @media only screen and (max-width: 600px) {
      .container {
        margin: 0;
        border-radius: 0;
      }
      .content {
        padding: 20px 15px;
      }
      .detail-row {
        flex-direction: column;
      }
      .detail-value {
        text-align: left;
        margin-top: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Order Confirmed!</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi <strong>${data.customerName}</strong>,</p>
      <p>Thank you for your order! Your Jastiper <strong>${data.jastiperName}</strong> has received your request and will validate it soon.</p>

      <div class="order-details">
        <h3>📦 Order Details</h3>
        <div class="detail-row">
          <span class="detail-label">Order ID:</span>
          <span class="detail-value"><strong>${data.orderId}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${data.orderDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Products:</span>
          <span class="detail-value">${data.productList}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">DP Paid:</span>
          <span class="detail-value amount">${data.dpAmount}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Remaining:</span>
          <span class="detail-value">${data.remainingAmount}</span>
        </div>
      </div>

      <div class="next-steps">
        <h3>🚀 What's Next?</h3>
        <ol>
          <li>Your Jastiper will validate your order within 1-2 days</li>
          <li>You'll receive a payment link for the remaining amount</li>
          <li>Upload your payment proof using the magic link we'll send you</li>
          <li>Track your order status in real-time</li>
        </ol>
      </div>

      <div class="button-container">
        <a href="${data.dashboardUrl}" class="button">View Order Status</a>
      </div>

      <p style="margin-top: 30px; color: #6B7280;">If you have any questions, please contact your Jastiper directly.</p>
    </div>
    <div class="footer">
      <p><strong>Jastipin</strong> - Your Trusted Jastip Platform</p>
      <p>&copy; 2025 Jastipin. All rights reserved.</p>
      <p style="margin-top: 10px;">This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Render Order Confirmation Email (Plain Text)
   */
  static renderOrderConfirmationText(data: OrderConfirmationData): string {
    return `
Order Confirmed!

Hi ${data.customerName},

Thank you for your order! Your Jastiper ${data.jastiperName} has received your request and will validate it soon.

ORDER DETAILS
=============
Order ID: ${data.orderId}
Date: ${data.orderDate}
Products: ${data.productList}
DP Paid: ${data.dpAmount}
Remaining: ${data.remainingAmount}

WHAT'S NEXT?
============
1. Your Jastiper will validate your order within 1-2 days
2. You'll receive a payment link for the remaining amount
3. Upload your payment proof using the magic link we'll send you
4. Track your order status in real-time

View your order: ${data.dashboardUrl}

If you have any questions, please contact your Jastiper directly.

---
Jastipin - Your Trusted Jastip Platform
© 2025 Jastipin. All rights reserved.
This is an automated email. Please do not reply to this message.
    `.trim()
  }

  /**
   * Render Payment Link Email (HTML) - with Magic Link
   */
  static renderPaymentLinkEmail(data: PaymentLinkData): string {
    return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Link</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .amount-box {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .amount {
      font-size: 36px;
      font-weight: bold;
      margin: 10px 0;
    }
    .amount-label {
      font-size: 14px;
      opacity: 0.9;
    }
    .warning {
      background: #FEF3C7;
      padding: 15px 20px;
      border-left: 4px solid #F59E0B;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning strong {
      color: #D97706;
    }
    .steps {
      background: #F0FDF4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10B981;
    }
    .steps h3 {
      margin-top: 0;
      color: #059669;
    }
    .steps ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .steps li {
      margin: 8px 0;
      color: #374151;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background: #10B981;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 18px;
      margin: 20px 0;
    }
    .button:hover {
      background: #059669;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .security-note {
      background: #F3F4F6;
      padding: 15px;
      border-radius: 6px;
      font-size: 13px;
      color: #6B7280;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      background: #F9FAFB;
      font-size: 13px;
      color: #6B7280;
      border-top: 1px solid #E5E7EB;
    }
    @media only screen and (max-width: 600px) {
      .container {
        margin: 0;
        border-radius: 0;
      }
      .amount {
        font-size: 28px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💳 Payment Required</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${data.customerName}</strong>,</p>
      <p>Great news! Your order <strong>${data.orderId}</strong> has been validated by ${data.jastiperName}.</p>

      <div class="amount-box">
        <div class="amount-label">Amount Due</div>
        <div class="amount">${data.remainingAmount}</div>
      </div>

      <div class="warning">
        <strong>⏰ Payment Deadline:</strong> ${data.deadline}
      </div>

      <div class="steps">
        <h3>📸 How to Upload Payment Proof:</h3>
        <ol>
          <li>Transfer <strong>${data.remainingAmount}</strong> to the account provided by your Jastiper</li>
          <li>Click the button below to open the upload page</li>
          <li>Enter the last 4 digits of your WhatsApp number for verification</li>
          <li>Upload a clear photo of your payment receipt</li>
        </ol>
      </div>

      <div class="button-container">
        <a href="${data.magicLink}" class="button">📤 Upload Payment Proof</a>
      </div>

      <div class="security-note">
        🔒 <strong>Security:</strong> This link is valid for 7 days and can only be used once. Keep it safe and do not share with others.
      </div>
    </div>
    <div class="footer">
      <p><strong>Jastipin</strong> - Your Trusted Jastip Platform</p>
      <p>&copy; 2025 Jastipin. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Render Payment Link Email (Plain Text)
   */
  static renderPaymentLinkText(data: PaymentLinkData): string {
    return `
Payment Required

Hi ${data.customerName},

Great news! Your order ${data.orderId} has been validated by ${data.jastiperName}.

AMOUNT DUE: ${data.remainingAmount}

⏰ PAYMENT DEADLINE: ${data.deadline}

HOW TO UPLOAD PAYMENT PROOF:
1. Transfer ${data.remainingAmount} to the account provided by your Jastiper
2. Open this link: ${data.magicLink}
3. Enter the last 4 digits of your WhatsApp number for verification
4. Upload a clear photo of your payment receipt

🔒 SECURITY: This link is valid for 7 days and can only be used once.

---
Jastipin - Your Trusted Jastip Platform
© 2025 Jastipin. All rights reserved.
    `.trim()
  }

  /**
   * Render Payment Received Email (HTML)
   */
  static renderPaymentReceivedEmail(data: PaymentReceivedData): string {
    return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .checkmark {
      text-align: center;
      font-size: 64px;
      margin: 20px 0;
    }
    .success-message {
      text-align: center;
      font-size: 20px;
      color: #059669;
      font-weight: 600;
      margin: 20px 0;
    }
    .receipt-box {
      background: white;
      padding: 25px;
      border: 2px dashed #10B981;
      border-radius: 8px;
      margin: 30px 0;
    }
    .receipt-box h3 {
      margin-top: 0;
      color: #059669;
      border-bottom: 2px solid #10B981;
      padding-bottom: 10px;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    .receipt-row:last-child {
      border-bottom: none;
      font-weight: bold;
      color: #059669;
      font-size: 18px;
    }
    .receipt-label {
      font-weight: 600;
      color: #6B7280;
    }
    .receipt-value {
      color: #111827;
      text-align: right;
    }
    .next-steps {
      background: #F0FDF4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10B981;
    }
    .next-steps h3 {
      margin-top: 0;
      color: #059669;
    }
    .next-steps ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .next-steps li {
      margin: 8px 0;
      color: #374151;
    }
    .footer {
      text-align: center;
      padding: 20px;
      background: #F9FAFB;
      font-size: 13px;
      color: #6B7280;
      border-top: 1px solid #E5E7EB;
    }
    @media only screen and (max-width: 600px) {
      .container {
        margin: 0;
        border-radius: 0;
      }
      .checkmark {
        font-size: 48px;
      }
      .receipt-row {
        flex-direction: column;
      }
      .receipt-value {
        text-align: left;
        margin-top: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Payment Received!</h1>
    </div>
    <div class="content">
      <div class="checkmark">✨</div>
      <p class="success-message">Thank you, ${data.customerName}!</p>
      <p style="text-align: center;">Your payment has been successfully received and verified.</p>

      <div class="receipt-box">
        <h3>🧾 Payment Receipt</h3>
        <div class="receipt-row">
          <span class="receipt-label">Order ID:</span>
          <span class="receipt-value"><strong>${data.orderId}</strong></span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Receipt Number:</span>
          <span class="receipt-value">${data.receiptNumber}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Jastiper:</span>
          <span class="receipt-value">${data.jastiperName}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Amount Paid:</span>
          <span class="receipt-value">${data.amountPaid}</span>
        </div>
      </div>

      <div class="next-steps">
        <h3>🚀 What Happens Next?</h3>
        <ol>
          <li>Your Jastiper will start processing your order</li>
          <li>You'll receive updates as your order progresses</li>
          <li>Track your shipment once items are purchased and shipped</li>
          <li>Get delivery notifications when your package arrives</li>
        </ol>
      </div>

      <p style="margin-top: 30px; text-align: center; color: #059669; font-weight: 600;">
        Thank you for using Jastipin! 🎉
      </p>
    </div>
    <div class="footer">
      <p><strong>Jastipin</strong> - Your Trusted Jastip Platform</p>
      <p>&copy; 2025 Jastipin. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Render Payment Received Email (Plain Text)
   */
  static renderPaymentReceivedText(data: PaymentReceivedData): string {
    return `
Payment Received!

Thank you, ${data.customerName}!

Your payment has been successfully received and verified.

PAYMENT RECEIPT
===============
Order ID: ${data.orderId}
Receipt Number: ${data.receiptNumber}
Jastiper: ${data.jastiperName}
Amount Paid: ${data.amountPaid}

WHAT HAPPENS NEXT?
==================
1. Your Jastiper will start processing your order
2. You'll receive updates as your order progresses
3. Track your shipment once items are purchased and shipped
4. Get delivery notifications when your package arrives

Thank you for using Jastipin!

---
Jastipin - Your Trusted Jastip Platform
© 2025 Jastipin. All rights reserved.
    `.trim()
  }

  /**
   * Render Order Confirmation WITH Magic Link (HTML)
   * Used after checkout - email serves as BACKUP (primary is frontend popup)
   */
  static renderOrderConfirmationWithMagicLink(data: OrderConfirmationData & { magicLink: string }): string {
    return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
    }
    .order-details {
      background: #F9FAFB;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border: 1px solid #E5E7EB;
    }
    .order-details h3 {
      margin-top: 0;
      color: #4F46E5;
      font-size: 18px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #6B7280;
    }
    .detail-value {
      color: #111827;
      text-align: right;
    }
    .amount {
      font-size: 24px;
      font-weight: bold;
      color: #4F46E5;
    }
    .magic-link-section {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      padding: 25px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
    }
    .magic-link-section h3 {
      margin-top: 0;
      font-size: 20px;
      margin-bottom: 10px;
    }
    .magic-link-section p {
      margin: 10px 0;
      opacity: 0.95;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: white;
      color: #059669 !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 15px 0 10px 0;
      text-align: center;
      font-size: 16px;
    }
    .button:hover {
      background: #F0FDF4;
    }
    .backup-note {
      background: #FEF3C7;
      padding: 15px 20px;
      border-left: 4px solid #F59E0B;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
    }
    .backup-note strong {
      color: #D97706;
    }
    .next-steps {
      background: #EEF2FF;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #4F46E5;
    }
    .next-steps h3 {
      margin-top: 0;
      color: #4F46E5;
    }
    .next-steps ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .next-steps li {
      margin: 8px 0;
      color: #374151;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      background: #F9FAFB;
      font-size: 13px;
      color: #6B7280;
      border-top: 1px solid #E5E7EB;
    }
    .footer p {
      margin: 5px 0;
    }
    @media only screen and (max-width: 600px) {
      .container {
        margin: 0;
        border-radius: 0;
      }
      .content {
        padding: 20px 15px;
      }
      .detail-row {
        flex-direction: column;
      }
      .detail-value {
        text-align: left;
        margin-top: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Order Confirmed!</h1>
    </div>
    <div class="content">
      <p class="greeting">Hi <strong>${data.customerName}</strong>,</p>
      <p>Thank you for your order! Your Jastiper <strong>${data.jastiperName}</strong> has received your request.</p>

      <div class="order-details">
        <h3>📦 Order Details</h3>
        <div class="detail-row">
          <span class="detail-label">Order ID:</span>
          <span class="detail-value"><strong>${data.orderId}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${data.orderDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Products:</span>
          <span class="detail-value">${data.productList}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">DP Paid:</span>
          <span class="detail-value amount">${data.dpAmount}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Remaining:</span>
          <span class="detail-value">${data.remainingAmount}</span>
        </div>
      </div>

      <div class="magic-link-section">
        <h3>📤 Upload Payment Proof</h3>
        <p>Click the button below to upload your payment proof (DP receipt)</p>
        <a href="${data.magicLink}" class="button">Upload Payment Proof</a>
        <p style="font-size: 13px; margin-top: 15px;">This link is valid for 7 days and is secure for your order only.</p>
      </div>

      <div class="backup-note">
        <strong>💡 Note:</strong> This email is sent as a backup. If you already uploaded your payment proof on the website after checkout, you can ignore this email.
      </div>

      <div class="next-steps">
        <h3>🚀 What's Next?</h3>
        <ol>
          <li>Upload your DP payment proof using the link above</li>
          <li>Your Jastiper will validate your order within 1-2 days</li>
          <li>You'll receive final amount and payment details</li>
          <li>Track your order status in real-time</li>
        </ol>
      </div>

      <div class="button-container">
        <a href="${data.dashboardUrl}" style="display: inline-block; padding: 12px 24px; background: #F3F4F6; color: #4F46E5 !important; text-decoration: none; border-radius: 6px; font-weight: 600;">View Order Status</a>
      </div>

      <p style="margin-top: 30px; color: #6B7280;">If you have any questions, please contact your Jastiper directly.</p>
    </div>
    <div class="footer">
      <p><strong>Jastipin</strong> - Your Trusted Jastip Platform</p>
      <p>&copy; 2025 Jastipin. All rights reserved.</p>
      <p style="margin-top: 10px;">This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Render Order Confirmation WITH Magic Link (Plain Text)
   */
  static renderOrderConfirmationWithMagicLinkText(data: OrderConfirmationData & { magicLink: string }): string {
    return `
Order Confirmed!

Hi ${data.customerName},

Thank you for your order! Your Jastiper ${data.jastiperName} has received your request.

ORDER DETAILS
=============
Order ID: ${data.orderId}
Date: ${data.orderDate}
Products: ${data.productList}
DP Paid: ${data.dpAmount}
Remaining: ${data.remainingAmount}

UPLOAD PAYMENT PROOF
====================
Click this link to upload your DP payment proof:
${data.magicLink}

This link is valid for 7 days and is secure for your order only.

💡 NOTE: This email is sent as a backup. If you already uploaded your payment proof on the website after checkout, you can ignore this email.

WHAT'S NEXT?
============
1. Upload your DP payment proof using the link above
2. Your Jastiper will validate your order within 1-2 days
3. You'll receive final amount and payment details
4. Track your order status in real-time

View your order: ${data.dashboardUrl}

If you have any questions, please contact your Jastiper directly.

---
Jastipin - Your Trusted Jastip Platform
© 2025 Jastipin. All rights reserved.
This is an automated email. Please do not reply to this message.
    `.trim()
  }
}
