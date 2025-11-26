/**
 * DP Checkout Service
 * Handles minimal checkout with DP payment
 */

import { PrismaClient } from '@prisma/client'
import { calculateDPAmount } from './price-calculator.service.js'
import { GuestService } from './guest.service.js'
import { getSendPulseService } from './email/sendpulse.service.js'
import { EmailTemplateService } from './email/email-template.service.js'
import { TokenService } from './token.service.js'
import { generateOrderCode } from '../utils/order-code.js'

const db = new PrismaClient()
const guestService = new GuestService(db)
const tokenService = new TokenService(db)

export interface CheckoutDPRequest {
  tripId: string
  participantPhone: string
  participantName: string
  participantEmail?: string
  rememberMe?: boolean
  address?: {
    recipientName: string
    phone: string
    addressText: string
    provinceId: string
    provinceName: string
    cityId: string
    cityName: string
    districtId: string
    districtName: string
    villageId?: string
    villageName?: string
    postalCode?: string
    rajaOngkirDistrictId?: string
  }
  items: Array<{
    productId: string
    quantity: number
    notes?: string
  }>
}

export interface CheckoutDPResponse {
  success: boolean
  orderId?: string
  guestId?: string
  dpAmount?: number
  paymentLink?: string
  uploadLink?: string  // NEW: Magic link for upload
  uploadToken?: string // NEW: Raw token for frontend
  bankAccount?: {
    bankName: string
    accountNumber: string
    accountHolderName: string
  } | null
  error?: string
}

/**
 * Step 1: Create order with DP payment
 */
export async function processCheckoutDP(
  request: CheckoutDPRequest
): Promise<CheckoutDPResponse> {
  
  try {
    // 1. Validate trip and get jastiper info
    const trip = await db.trip.findUnique({
      where: { id: request.tripId },
      include: {
        User: {
          select: {
            profileName: true,
            slug: true
          }
        }
      }
    })
    
    if (!trip) {
      return { success: false, error: 'Trip not found' }
    }
    
    // 2. Get or create participant
    const normalizedPhone = request.participantPhone.startsWith('62') 
      ? request.participantPhone 
      : `62${request.participantPhone}`
    
    let participant = await db.participant.findFirst({
      where: {
        tripId: request.tripId,
        phone: normalizedPhone
      }
    })
    
    if (!participant) {
      participant = await db.participant.create({
        data: {
          tripId: request.tripId,
          phone: normalizedPhone,
          name: request.participantName,
          email: request.participantEmail || null
        }
      })
    } else {
      // Update existing participant with new email if provided
      participant = await db.participant.update({
        where: { id: participant.id },
        data: {
          name: request.participantName,
          email: request.participantEmail || participant.email
        }
      })
    }
    
    if (!participant) {
      return { success: false, error: 'Failed to create participant' }
    }
    
    // 3. Create or update guest profile
    console.log('[DEBUG] Creating guest with:', {
      name: request.participantName,
      phone: request.participantPhone,
      email: request.participantEmail,
      emailType: typeof request.participantEmail,
      emailValue: JSON.stringify(request.participantEmail),
      rememberMe: request.rememberMe,
    })
    
    const guest = await guestService.createOrUpdateGuest({
      name: request.participantName,
      phone: request.participantPhone,
      email: request.participantEmail,
      rememberMe: request.rememberMe,
    })
    
    console.log('[DEBUG] Guest created:', {
      id: guest.id,
      email: guest.email,
      emailValue: JSON.stringify(guest.email),
    })
    
    // 4. Validate products and check stock
    const products = await Promise.all(
      request.items.map(item => 
        db.product.findUnique({
          where: { id: item.productId },
          include: { Trip: true }
        })
      )
    )
    
    // Validate all products
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const item = request.items[i]
      
      if (!product) {
        return { success: false, error: `Product not found: ${item.productId}` }
      }
      
      if (product.tripId !== request.tripId) {
        return { success: false, error: `Product not in this trip` }
      }
      
      // Check stock for goods
      if (product.type === 'goods') {
        if (product.stock === null || product.stock < item.quantity) {
          return { 
            success: false, 
            error: `Insufficient stock for "${product.title}". Available: ${product.stock}, Requested: ${item.quantity}` 
          }
        }
      }
    }
    
    // 5. Create address if provided (with auto RajaOngkir mapping)
    let addressId: string | null = null

    if (request.address) {
      // Auto-map to RajaOngkir district ID only if not provided by frontend
      let rajaOngkirDistrictId = request.address.rajaOngkirDistrictId

      if (!rajaOngkirDistrictId) {
        const { autoMapToRajaOngkir } = await import('./rajaongkir.service.js')
        rajaOngkirDistrictId = await autoMapToRajaOngkir(
          request.address.cityName,
          request.address.districtName
        ) || undefined
      }

      const newAddress = await db.address.create({
        data: {
          participantId: participant!.id,
          recipientName: request.address.recipientName,
          phone: request.address.phone,
          addressText: request.address.addressText,
          provinceId: request.address.provinceId,
          provinceName: request.address.provinceName,
          cityId: request.address.cityId,
          cityName: request.address.cityName,
          districtId: request.address.districtId,
          districtName: request.address.districtName,
          villageId: request.address.villageId || null,
          villageName: request.address.villageName || null,
          postalCode: request.address.postalCode || null,
          rajaOngkirDistrictId: rajaOngkirDistrictId || null,
          isDefault: true // first address is default
        }
      })

      addressId = newAddress.id
    }
    
    // 6. Calculate subtotal and DP amount
    const subtotal = products.reduce((sum, product, i) => {
      return sum + (product!.price * request.items[i].quantity)
    }, 0)
    
    // Use trip's specific DP percentage, default to 20 if not set (fallback)
    const dpAmount = await calculateDPAmount(subtotal, trip.dpPercentage || 20)
    
    // 7. Create order with items (transaction)
    const order = await db.$transaction(async (tx) => {
      
      // Generate unique order code
      const orderCode = generateOrderCode()
      
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderCode,
          tripId: request.tripId,
          participantId: participant!.id,
          guestId: guest.id,
          addressId: addressId,
          dpAmount,
          totalPrice: subtotal,  // initial estimate
          status: 'pending_dp'
        }
      })
      
      // Create order items
      for (let i = 0; i < products.length; i++) {
        const product = products[i]!
        const item = request.items[i]
        
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: product.id,
            productType: product.type,
            priceAtOrder: product.price,
            quantity: item.quantity,
            itemSubtotal: product.price * item.quantity,
            note: item.notes || null
          }
        })
      }
      
      return newOrder
    })
    
    // 8. Generate magic link upload token
    console.log('[Checkout] Generating upload token for order:', order.id)
    const tokenData = await tokenService.generateUploadToken(order.id, guest.id)
    const uploadToken = tokenData.token
    const uploadLink = `https://jastipin.me/order/upload/${uploadToken}`

    console.log('[Checkout] Upload link generated:', uploadLink)

    // 9. Send order confirmation email with magic link (async, backup only)
    if (request.participantEmail) {
      sendOrderConfirmationWithMagicLink({
        customerName: request.participantName,
        customerEmail: request.participantEmail,
        orderId: order.id,
        orderCode: order.orderCode || `#${order.id.slice(0, 8).toUpperCase()}`,
        dpAmount,
        subtotal,
        jastiperName: trip.User?.profileName || trip.User?.slug || 'Jastiper',
        items: products.map((product, i) => ({
          name: product!.title,
          quantity: request.items[i].quantity,
          price: product!.price
        })),
        uploadLink  // Include magic link in email
      }).catch(error => {
        // Log error but don't fail the checkout
        console.error('[Checkout] Failed to send order confirmation email:', error)
      })
    }

    // 10. Get jastiper's primary bank account for display
    const bankAccount = await db.bankAccount.findFirst({
      where: {
        userId: trip.jastiperId,
        status: 'active',
        isPrimary: true
      },
      select: {
        bankName: true,
        accountNumber: true,
        accountHolderName: true
      }
    })

    // 11. Return response with upload link for frontend popup
    return {
      success: true,
      orderId: order.id,
      guestId: guest.id,
      dpAmount,
      paymentLink: `https://payment.jastipin.me/dp/${order.id}`,
      uploadLink,      // NEW: For frontend popup
      uploadToken,     // NEW: Raw token
      bankAccount: bankAccount ? {
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        accountHolderName: bankAccount.accountHolderName
      } : null
    }
    
  } catch (error: any) {
    console.error('Checkout DP error:', error)
    return {
      success: false,
      error: error.message || 'Checkout failed'
    }
  }
}

/**
 * Get order summary with items
 */
export async function getOrderSummary(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        OrderItem: {
          include: {
            Product: true
          }
        },
        Participant: true,
        Address: true,
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
    
    return order
  } catch (error) {
    console.error('Error fetching order summary:', error)
    return null
  }
}

/**
 * Send order confirmation email WITH magic link
 * @internal Helper function for sending emails after checkout
 * Email serves as BACKUP - primary method is frontend popup
 */
async function sendOrderConfirmationWithMagicLink(data: {
  customerName: string
  customerEmail: string
  orderId: string
  orderCode: string
  dpAmount: number
  subtotal: number
  jastiperName: string
  items: Array<{ name: string; quantity: number; price: number }>
  uploadLink: string  // NEW: Magic link
}): Promise<void> {
  try {
    const sendpulseService = getSendPulseService()

    // Format data for email template
    const emailData = {
      customerName: data.customerName,
      orderId: data.orderId,
      orderCode: data.orderCode,
      orderDate: new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      dpAmount: `Rp ${data.dpAmount.toLocaleString('id-ID')}`,
      remainingAmount: `Rp ${(data.subtotal - data.dpAmount).toLocaleString('id-ID')}`,
      jastiperName: data.jastiperName,
      productList: data.items
        .map(item => `${item.name} (${item.quantity}x)`)
        .join(', '),
      dashboardUrl: `https://jastipin.me/orders/${data.orderId}`,
      magicLink: data.uploadLink  // NEW: Include magic link
    }

    // Render HTML with magic link
    const html = EmailTemplateService.renderOrderConfirmationWithMagicLink(emailData)
    const text = EmailTemplateService.renderOrderConfirmationWithMagicLinkText(emailData)

    // Send email (as backup)
    console.log(`[Email] Sending order confirmation with magic link to ${data.customerEmail}`)
    console.log(`[Email] Magic link: ${data.uploadLink}`)
    const result = await sendpulseService.sendEmail({
      to: [{ name: data.customerName, email: data.customerEmail }],
      subject: `Order Confirmation - ${data.orderCode}`,
      html,
      text
    })

    if (result.success) {
      console.log(`[Email] ✅ Order confirmation with magic link sent (backup)`)
      console.log(`[Email] Message ID: ${result.messageId}`)
    } else {
      console.error(`[Email] ❌ Failed to send confirmation: ${result.error}`)
    }
  } catch (error) {
    // Don't throw error - email failure should not fail checkout
    console.error('[Email] Error sending order confirmation:', error)
  }
}
