/**
 * Email Service Types
 * TypeScript interfaces for SendPulse email integration
 */

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
  orderCode: string  // Display code (JST-XXXXXX-XX)
  orderDate: string
  dpAmount: string
  remainingAmount: string
  jastiperName: string
  productList: string
  dashboardUrl: string
}

export interface PaymentLinkData {
  customerName: string
  orderId: string
  orderCode: string  // Display code (JST-XXXXXX-XX)
  remainingAmount: string
  deadline: string
  magicLink: string
  jastiperName: string
}

export interface PaymentReceivedData {
  customerName: string
  orderId: string
  orderCode: string  // Display code (JST-XXXXXX-XX)
  amountPaid: string
  receiptNumber: string
  jastiperName: string
}
