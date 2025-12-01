import db from '../../lib/prisma.js'
/**
 * Email Trigger Service
 * Handles automated email notifications for order events
 */

import { getSendPulseService } from './sendpulse.service.js'
import { TokenService } from '../token.service.js'

const tokenService = new TokenService(db)

export class EmailTriggerService {
  /**
   * Send validation notification email when order is validated
   * Includes order details and next steps for customer
   */
  static async sendOrderValidatedEmail(orderId: string): Promise<void> {
    try {
      console.log(`[EmailTrigger] Sending validation notification for order ${orderId}`)

      // 1. Get order details with all relations
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          Participant: true,
          Trip: {
            include: {
              User: {
                select: {
                  profileName: true,
                  slug: true,
                  whatsappNumber: true
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

      // 2. Fetch guest if guestId exists
      let guest = null
      if (order.guestId) {
        guest = await db.guest.findUnique({
          where: { id: order.guestId }
        })
      }

      // 3. Check if guest/participant has email
      const email = guest?.email || order.Participant?.email
      if (!email) {
        console.log(`[EmailTrigger] No email found for order ${orderId}, skipping`)
        return
      }

      // 4. Prepare email data
      const customerName = order.Participant?.name || guest?.name || 'Customer'
      const jastiperName = order.Trip?.User?.profileName || order.Trip?.User?.slug || 'Jastiper'
      const jastiperPhone = order.Trip?.User?.whatsappNumber || '-'

      // 5. Generate magic link for final payment upload
      const tokenData = await tokenService.generateUploadToken(orderId, order.guestId || undefined)
      const magicLink = `https://jastipin.me/order/upload/${tokenData.token}`

      // 6. Get breakdown details
      const shippingFee = order.shippingFee || 0
      const serviceFee = order.serviceFee || 0
      const platformCommission = order.platformCommission || 0
      const totalAmount = order.totalPrice || 0
      const dpPaid = order.dpAmount || 0
      const finalAmount = order.finalAmount || 0

      // Calculate subtotal (product prices only)
      const subtotal = order.OrderItem.reduce((sum: number, item: any) => {
        return sum + (item.priceAtOrder * item.quantity)
      }, 0)

      // 7. Format email content - use orderCode with fallback to truncated id
      const orderDisplayCode = order.orderCode || `#${order.id.slice(0, 8).toUpperCase()}`
      const emailData = {
        customerName,
        orderId: order.id,
        orderCode: orderDisplayCode,
        jastiperName,
        jastiperPhone,
        magicLink,
        // Breakdown
        subtotal: `Rp ${subtotal.toLocaleString('id-ID')}`,
        shippingFee: `Rp ${shippingFee.toLocaleString('id-ID')}`,
        serviceFee: `Rp ${serviceFee.toLocaleString('id-ID')}`,
        platformCommission: `Rp ${platformCommission.toLocaleString('id-ID')}`,
        totalAmount: `Rp ${totalAmount.toLocaleString('id-ID')}`,
        dpPaid: `Rp ${dpPaid.toLocaleString('id-ID')}`,
        finalAmount: `Rp ${finalAmount.toLocaleString('id-ID')}`,
        itemCount: order.OrderItem.length,
        items: order.OrderItem.map((item: any) => ({
          name: item.Product.title,
          quantity: item.quantity,
          price: `Rp ${(item.priceAtOrder * item.quantity).toLocaleString('id-ID')}`
        }))
      }

      // 8. Render email template (simplified for validation notification)
      const html = this.renderValidationEmail(emailData)
      const text = this.renderValidationEmailText(emailData)

      // 9. Send email
      const sendpulseService = getSendPulseService()
      const result = await sendpulseService.sendEmail({
        to: [{
          name: customerName,
          email
        }],
        subject: `Pesanan Divalidasi - ${orderDisplayCode}`,
        html,
        text
      })

      if (result.success) {
        console.log(`[EmailTrigger] ✅ Validation email sent to ${email}`)
        console.log(`[EmailTrigger] Message ID: ${result.messageId}`)
      } else {
        console.error(`[EmailTrigger] ❌ Failed to send: ${result.error}`)
      }

    } catch (error) {
      console.error('[EmailTrigger] Error sending validation email:', error)
      // Don't throw - email failure shouldn't break the validation process
    }
  }

  /**
   * Send rejection notification email when final payment is rejected
   * Includes rejection reason and new magic link for re-upload
   */
  static async sendFinalPaymentRejectedEmail(orderId: string, rejectionReason: string): Promise<void> {
    try {
      console.log(`[EmailTrigger] Sending final payment rejection notification for order ${orderId}`)

      // 1. Get order details with all relations
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          Participant: true,
          Trip: {
            include: {
              User: {
                select: {
                  profileName: true,
                  slug: true,
                  whatsappNumber: true
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

      // 2. Fetch guest if guestId exists
      let guest = null
      if (order.guestId) {
        guest = await db.guest.findUnique({
          where: { id: order.guestId }
        })
      }

      // 3. Check if guest/participant has email
      const email = guest?.email || order.Participant?.email
      if (!email) {
        console.log(`[EmailTrigger] No email found for order ${orderId}, skipping`)
        return
      }

      // 4. Prepare email data
      const customerName = order.Participant?.name || guest?.name || 'Customer'
      const jastiperName = order.Trip?.User?.profileName || order.Trip?.User?.slug || 'Jastiper'
      const jastiperPhone = order.Trip?.User?.whatsappNumber || '-'

      // 5. Generate new magic link for re-upload
      const tokenData = await tokenService.generateUploadToken(orderId, order.guestId || undefined)
      const magicLink = `https://jastipin.me/order/upload/${tokenData.token}`

      // 6. Get breakdown details
      const shippingFee = order.shippingFee || 0
      const serviceFee = order.serviceFee || 0
      const platformCommission = order.platformCommission || 0
      const totalAmount = order.totalPrice || 0
      const dpPaid = order.dpAmount || 0
      const finalAmount = order.finalAmount || 0

      // Calculate subtotal (product prices only)
      const subtotal = order.OrderItem.reduce((sum: number, item: any) => {
        return sum + (item.priceAtOrder * item.quantity)
      }, 0)

      // 7. Format email content
      const orderDisplayCode = order.orderCode || `#${order.id.slice(0, 8).toUpperCase()}`
      const emailData = {
        customerName,
        orderId: order.id,
        orderCode: orderDisplayCode,
        jastiperName,
        jastiperPhone,
        magicLink,
        rejectionReason: rejectionReason || 'Bukti pembayaran tidak valid',
        // Breakdown
        subtotal: `Rp ${subtotal.toLocaleString('id-ID')}`,
        shippingFee: `Rp ${shippingFee.toLocaleString('id-ID')}`,
        serviceFee: `Rp ${serviceFee.toLocaleString('id-ID')}`,
        platformCommission: `Rp ${platformCommission.toLocaleString('id-ID')}`,
        totalAmount: `Rp ${totalAmount.toLocaleString('id-ID')}`,
        dpPaid: `Rp ${dpPaid.toLocaleString('id-ID')}`,
        finalAmount: `Rp ${finalAmount.toLocaleString('id-ID')}`,
        itemCount: order.OrderItem.length,
        items: order.OrderItem.map((item: any) => ({
          name: item.Product.title,
          quantity: item.quantity,
          price: `Rp ${(item.priceAtOrder * item.quantity).toLocaleString('id-ID')}`
        }))
      }

      // 8. Render email template
      const html = this.renderRejectionEmail(emailData)
      const text = this.renderRejectionEmailText(emailData)

      // 9. Send email
      const sendpulseService = getSendPulseService()
      const result = await sendpulseService.sendEmail({
        to: [{
          name: customerName,
          email
        }],
        subject: `Bukti Pelunasan Ditolak - ${orderDisplayCode}`,
        html,
        text
      })

      if (result.success) {
        console.log(`[EmailTrigger] ✅ Rejection email sent to ${email}`)
        console.log(`[EmailTrigger] Message ID: ${result.messageId}`)
      } else {
        console.error(`[EmailTrigger] ❌ Failed to send: ${result.error}`)
      }

    } catch (error) {
      console.error('[EmailTrigger] Error sending rejection email:', error)
      // Don't throw - email failure shouldn't break the rejection process
    }
  }

  /**
   * Render validation email HTML
   */
  private static renderValidationEmail(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pesanan Divalidasi</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ✅ Pesanan Divalidasi!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Halo <strong>${data.customerName}</strong>,
              </p>

              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                Kabar baik! Pesanan Anda <strong>${data.orderCode}</strong> telah divalidasi oleh <strong>${data.jastiperName}</strong>.
              </p>

              <!-- Order Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 30px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px; font-weight: 600;">
                      📦 Ringkasan Pesanan
                    </h3>

                    ${data.items.map((item: any) => `
                    <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                      <div style="display: flex; justify-content: space-between; color: #4b5563; font-size: 14px;">
                        <span>${item.name} x${item.quantity}</span>
                        <span style="font-weight: 600;">${item.price}</span>
                      </div>
                    </div>
                    `).join('')}

                    <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e5e7eb;">
                      <table width="100%" cellpadding="5" cellspacing="0">
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Subtotal Produk:</td>
                          <td align="right" style="color: #1f2937; font-size: 14px; font-weight: 600;">${data.subtotal}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Ongkir:</td>
                          <td align="right" style="color: #1f2937; font-size: 14px; font-weight: 600;">${data.shippingFee}</td>
                        </tr>
                        ${data.serviceFee !== 'Rp 0' ? `
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Biaya Jasa:</td>
                          <td align="right" style="color: #1f2937; font-size: 14px; font-weight: 600;">${data.serviceFee}</td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Komisi Platform:</td>
                          <td align="right" style="color: #1f2937; font-size: 14px; font-weight: 600;">${data.platformCommission}</td>
                        </tr>
                        <tr style="border-top: 1px solid #e5e7eb;">
                          <td style="color: #1f2937; font-size: 15px; font-weight: 600; padding-top: 8px;">Total:</td>
                          <td align="right" style="color: #1f2937; font-size: 15px; font-weight: 600; padding-top: 8px;">${data.totalAmount}</td>
                        </tr>
                        <tr>
                          <td style="color: #10b981; font-size: 14px;">DP Terbayar:</td>
                          <td align="right" style="color: #10b981; font-size: 14px; font-weight: 600;">${data.dpPaid}</td>
                        </tr>
                        <tr style="border-top: 2px solid #e5e7eb;">
                          <td style="color: #1f2937; font-size: 18px; font-weight: 700; padding-top: 10px;">Sisa Pembayaran:</td>
                          <td align="right" style="color: #f26b8a; font-size: 20px; font-weight: 700; padding-top: 10px;">${data.finalAmount}</td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Payment Amount Highlight -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border: 2px solid #f26b8a; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 8px; color: #991b1b; font-size: 14px; font-weight: 600; text-transform: uppercase;">
                      Total yang Harus Dibayar
                    </p>
                    <p style="margin: 0; color: #f26b8a; font-size: 32px; font-weight: 700;">
                      ${data.finalAmount}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 10px; color: #92400e; font-size: 16px; font-weight: 600;">
                      📋 Langkah Selanjutnya
                    </h3>
                    <ol style="margin: 10px 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.8;">
                      <li>Transfer <strong>${data.finalAmount}</strong> ke rekening Jastiper</li>
                      <li>Klik tombol "Upload Bukti Transfer" di bawah</li>
                      <li>Masukkan 4 digit terakhir nomor WhatsApp Anda</li>
                      <li>Upload foto bukti transfer</li>
                      <li>Tunggu konfirmasi dari Jastiper</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <!-- Upload Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center" style="padding: 20px;">
                    <a href="${data.magicLink}" style="display: inline-block; background: linear-gradient(135deg, #f26b8a 0%, #e05576 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(242, 107, 138, 0.3);">
                      📤 Upload Bukti Transfer
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.6;">
                      🔒 <strong>Link aman:</strong> Link upload ini hanya valid untuk pelunasan pesanan ini dan akan kedaluwarsa dalam 7 hari. Jangan bagikan link ini ke orang lain.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Jastiper Contact -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 10px; color: #1e40af; font-size: 16px; font-weight: 600;">
                      📞 Kontak Jastiper
                    </h3>
                    <p style="margin: 5px 0; color: #1e3a8a; font-size: 14px;">
                      <strong>${data.jastiperName}</strong><br>
                      WhatsApp: <a href="https://wa.me/${data.jastiperPhone.replace(/[^0-9]/g, '')}" style="color: #2563eb; text-decoration: none;">${data.jastiperPhone}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Terima kasih telah menggunakan Jastipin! 🎉
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px;">
                Email ini dikirim otomatis oleh sistem Jastipin
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2025 Jastipin. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }

  /**
   * Render validation email plain text version
   */
  private static renderValidationEmailText(data: any): string {
    return `
PESANAN DIVALIDASI!

Halo ${data.customerName},

Kabar baik! Pesanan Anda ${data.orderCode} telah divalidasi oleh ${data.jastiperName}.

RINGKASAN PESANAN:
${data.items.map((item: any) => `- ${item.name} x${item.quantity}: ${item.price}`).join('\n')}

RINCIAN PEMBAYARAN:
Subtotal Produk: ${data.subtotal}
Ongkir: ${data.shippingFee}
${data.serviceFee !== 'Rp 0' ? `Biaya Jasa: ${data.serviceFee}\n` : ''}Komisi Platform: ${data.platformCommission}
---------------------------------
Total: ${data.totalAmount}
DP Terbayar: ${data.dpPaid}
=================================
SISA PEMBAYARAN: ${data.finalAmount}

LANGKAH SELANJUTNYA:
1. Transfer ${data.finalAmount} ke rekening Jastiper
2. Klik link upload: ${data.magicLink}
3. Masukkan 4 digit terakhir nomor WhatsApp Anda
4. Upload foto bukti transfer
5. Tunggu konfirmasi dari Jastiper

🔒 CATATAN KEAMANAN:
Link upload ini hanya valid untuk pelunasan pesanan ini dan akan kedaluwarsa dalam 7 hari.
Jangan bagikan link ini ke orang lain.

KONTAK JASTIPER:
${data.jastiperName}
WhatsApp: ${data.jastiperPhone}

Terima kasih telah menggunakan Jastipin!

---
Email ini dikirim otomatis oleh sistem Jastipin
© 2025 Jastipin. All rights reserved.
    `
  }

  /**
   * Render rejection email HTML
   */
  private static renderRejectionEmail(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bukti Pelunasan Ditolak</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ❌ Bukti Pelunasan Ditolak
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Halo <strong>${data.customerName}</strong>,
              </p>

              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                Mohon maaf, bukti pelunasan untuk pesanan <strong>${data.orderCode}</strong> ditolak oleh <strong>${data.jastiperName}</strong>.
              </p>

              <!-- Rejection Reason Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 10px; color: #991b1b; font-size: 16px; font-weight: 600;">
                      📋 Alasan Penolakan
                    </h3>
                    <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">
                      ${data.rejectionReason}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Order Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 30px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px; font-weight: 600;">
                      📦 Ringkasan Pesanan
                    </h3>

                    ${data.items.map((item: any) => `
                    <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                      <div style="display: flex; justify-content: space-between; color: #4b5563; font-size: 14px;">
                        <span>${item.name} x${item.quantity}</span>
                        <span style="font-weight: 600;">${item.price}</span>
                      </div>
                    </div>
                    `).join('')}

                    <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e5e7eb;">
                      <table width="100%" cellpadding="5" cellspacing="0">
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Subtotal Produk:</td>
                          <td align="right" style="color: #1f2937; font-size: 14px; font-weight: 600;">${data.subtotal}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Ongkir:</td>
                          <td align="right" style="color: #1f2937; font-size: 14px; font-weight: 600;">${data.shippingFee}</td>
                        </tr>
                        ${data.serviceFee !== 'Rp 0' ? `
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Biaya Jasa:</td>
                          <td align="right" style="color: #1f2937; font-size: 14px; font-weight: 600;">${data.serviceFee}</td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Komisi Platform:</td>
                          <td align="right" style="color: #1f2937; font-size: 14px; font-weight: 600;">${data.platformCommission}</td>
                        </tr>
                        <tr style="border-top: 1px solid #e5e7eb;">
                          <td style="color: #1f2937; font-size: 15px; font-weight: 600; padding-top: 8px;">Total:</td>
                          <td align="right" style="color: #1f2937; font-size: 15px; font-weight: 600; padding-top: 8px;">${data.totalAmount}</td>
                        </tr>
                        <tr>
                          <td style="color: #10b981; font-size: 14px;">DP Terbayar:</td>
                          <td align="right" style="color: #10b981; font-size: 14px; font-weight: 600;">${data.dpPaid}</td>
                        </tr>
                        <tr style="border-top: 2px solid #e5e7eb;">
                          <td style="color: #1f2937; font-size: 18px; font-weight: 700; padding-top: 10px;">Sisa Pembayaran:</td>
                          <td align="right" style="color: #f26b8a; font-size: 20px; font-weight: 700; padding-top: 10px;">${data.finalAmount}</td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Payment Amount Highlight -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border: 2px solid #f26b8a; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 8px; color: #991b1b; font-size: 14px; font-weight: 600; text-transform: uppercase;">
                      Total yang Harus Dibayar Ulang
                    </p>
                    <p style="margin: 0; color: #f26b8a; font-size: 32px; font-weight: 700;">
                      ${data.finalAmount}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 10px; color: #92400e; font-size: 16px; font-weight: 600;">
                      📋 Langkah Selanjutnya
                    </h3>
                    <ol style="margin: 10px 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.8;">
                      <li>Pastikan transfer <strong>${data.finalAmount}</strong> sudah dilakukan dengan benar</li>
                      <li>Ambil foto bukti transfer yang jelas dan lengkap</li>
                      <li>Klik tombol "Upload Bukti Transfer Ulang" di bawah</li>
                      <li>Masukkan 4 digit terakhir nomor WhatsApp Anda</li>
                      <li>Upload foto bukti transfer yang baru</li>
                      <li>Tunggu konfirmasi dari Jastiper</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <!-- Important Note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 10px; color: #92400e; font-size: 16px; font-weight: 600;">
                      ⚠️ Penting
                    </h3>
                    <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                      Pastikan bukti transfer yang Anda upload mencakup:<br>
                      • Tanggal dan waktu transfer<br>
                      • Jumlah transfer yang sesuai (<strong>${data.finalAmount}</strong>)<br>
                      • Nama penerima (Jastiper: ${data.jastiperName})<br>
                      • Nomor rekening tujuan<br>
                      • Foto yang jelas dan tidak blur
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Upload Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center" style="padding: 20px;">
                    <a href="${data.magicLink}" style="display: inline-block; background: linear-gradient(135deg, #f26b8a 0%, #e05576 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(242, 107, 138, 0.3);">
                      📤 Upload Bukti Transfer Ulang
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.6;">
                      🔒 <strong>Link aman:</strong> Link upload ini hanya valid untuk pelunasan pesanan ini dan akan kedaluwarsa dalam 7 hari. Jangan bagikan link ini ke orang lain.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Jastiper Contact -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 10px; color: #1e40af; font-size: 16px; font-weight: 600;">
                      📞 Kontak Jastiper
                    </h3>
                    <p style="margin: 5px 0; color: #1e3a8a; font-size: 14px;">
                      Jika Anda memiliki pertanyaan atau membutuhkan klarifikasi, silakan hubungi Jastiper Anda:<br><br>
                      <strong>${data.jastiperName}</strong><br>
                      WhatsApp: <a href="https://wa.me/${data.jastiperPhone.replace(/[^0-9]/g, '')}" style="color: #2563eb; text-decoration: none;">${data.jastiperPhone}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Terima kasih atas pengertian Anda.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px;">
                Email ini dikirim otomatis oleh sistem Jastipin
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2025 Jastipin. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }

  /**
   * Render rejection email plain text version
   */
  private static renderRejectionEmailText(data: any): string {
    return `
BUKTI PELUNASAN DITOLAK

Halo ${data.customerName},

Mohon maaf, bukti pelunasan untuk pesanan ${data.orderCode} ditolak oleh ${data.jastiperName}.

ALASAN PENOLAKAN:
${data.rejectionReason}

RINGKASAN PESANAN:
${data.items.map((item: any) => `- ${item.name} x${item.quantity}: ${item.price}`).join('\n')}

RINCIAN PEMBAYARAN:
Subtotal Produk: ${data.subtotal}
Ongkir: ${data.shippingFee}
${data.serviceFee !== 'Rp 0' ? `Biaya Jasa: ${data.serviceFee}\n` : ''}Komisi Platform: ${data.platformCommission}
---------------------------------
Total: ${data.totalAmount}
DP Terbayar: ${data.dpPaid}
=================================
SISA PEMBAYARAN: ${data.finalAmount}

LANGKAH SELANJUTNYA:
1. Pastikan transfer ${data.finalAmount} sudah dilakukan dengan benar
2. Ambil foto bukti transfer yang jelas dan lengkap
3. Klik link upload: ${data.magicLink}
4. Masukkan 4 digit terakhir nomor WhatsApp Anda
5. Upload foto bukti transfer yang baru
6. Tunggu konfirmasi dari Jastiper

⚠️ PENTING:
Pastikan bukti transfer yang Anda upload mencakup:
• Tanggal dan waktu transfer
• Jumlah transfer yang sesuai (${data.finalAmount})
• Nama penerima (Jastiper: ${data.jastiperName})
• Nomor rekening tujuan
• Foto yang jelas dan tidak blur

🔒 CATATAN KEAMANAN:
Link upload ini hanya valid untuk pelunasan pesanan ini dan akan kedaluwarsa dalam 7 hari.
Jangan bagikan link ini ke orang lain.

KONTAK JASTIPER:
Jika Anda memiliki pertanyaan atau membutuhkan klarifikasi, silakan hubungi Jastiper Anda:

${data.jastiperName}
WhatsApp: ${data.jastiperPhone}

Terima kasih atas pengertian Anda.

---
Email ini dikirim otomatis oleh sistem Jastipin
© 2025 Jastipin. All rights reserved.
    `
  }
}
