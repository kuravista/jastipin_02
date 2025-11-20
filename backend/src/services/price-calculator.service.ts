/**
 * Price Calculator Service
 * Central pricing logic for DP flow
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

export interface OrderItemInput {
  productId: string
  productType: 'goods' | 'tasks'
  priceAtOrder: number
  quantity: number
  markupType: 'percent' | 'flat'
  markupValue: number
}

export interface CalculatePriceInput {
  items: OrderItemInput[]
  shippingFee?: number  // set by jastiper (for goods) or 0
  serviceFee?: number   // optional extra fee
}

export interface PriceBreakdown {
  subtotal: number
  shippingFee: number
  jastipherMarkup: number
  taskFee: number
  serviceFee: number
  platformCommission: number
  totalFinal: number
  dpAmount: number
  remainingAmount: number
}

/**
 * Calculate DP amount
 * Uses provided percentage or defaults to 20%
 */
export async function calculateDPAmount(subtotal: number, percentage: number = 20): Promise<number> {
  const MIN_DP = 10000 // Rp 10,000
  
  const dpAmount = Math.max(
    Math.ceil(subtotal * (percentage / 100)),
    MIN_DP
  )
  
  return dpAmount
}

/**
 * Calculate complete price breakdown
 * Called during jastiper validation step
 */
export async function calculatePriceBreakdown(
  input: CalculatePriceInput
): Promise<PriceBreakdown> {
  
  // 1. Calculate subtotal
  const subtotal = input.items.reduce((sum, item) => {
    return sum + (item.priceAtOrder * item.quantity)
  }, 0)
  
  // 2. Calculate shipping fee (only if goods present)
  const hasGoods = input.items.some(item => item.productType === 'goods')
  const shippingFee = hasGoods ? (input.shippingFee || 0) : 0
  
  // 3. Calculate task fee (sum of tasks prices)
  const taskFee = input.items
    .filter(item => item.productType === 'tasks')
    .reduce((sum, item) => {
      return sum + (item.priceAtOrder * item.quantity)
    }, 0)
  
  // 4. Calculate jastiper markup
  let jastipherMarkup = 0
  for (const item of input.items) {
    const itemTotal = item.priceAtOrder * item.quantity
    
    if (item.markupType === 'percent') {
      jastipherMarkup += itemTotal * (item.markupValue / 100)
    } else {
      // flat markup per item
      jastipherMarkup += item.markupValue * item.quantity
    }
  }
  jastipherMarkup = Math.ceil(jastipherMarkup)
  
  // 5. Service fee (optional)
  const serviceFee = input.serviceFee || 0
  
  // 6. Platform commission (5% of subtotal + markup)
  const platformCommissionRate = await getCommissionRate()
  const platformCommission = Math.ceil(
    (subtotal + jastipherMarkup) * (platformCommissionRate / 100)
  )
  
  // 7. Total final
  const totalFinal = subtotal + shippingFee + jastipherMarkup + serviceFee + platformCommission
  
  // 8. DP amount (already paid)
  const dpAmount = await calculateDPAmount(subtotal)
  
  // 9. Remaining amount
  const remainingAmount = Math.max(totalFinal - dpAmount, 0)
  
  return {
    subtotal,
    shippingFee,
    jastipherMarkup,
    taskFee,
    serviceFee,
    platformCommission,
    totalFinal,
    dpAmount,
    remainingAmount
  }
}

/**
 * Get platform commission rate from config
 * Default: 5%
 */
async function getCommissionRate(): Promise<number> {
  try {
    const config = await db.feesConfig.findFirst({
      where: {
        scope: 'platform_commission',
        isActive: true
      }
    })
    
    return config?.value || 5  // default 5%
  } catch (error) {
    console.error('Error fetching commission rate:', error)
    return 5  // fallback to default
  }
}

/**
 * Calculate total weight for shipping calculation
 */
export function calculateTotalWeight(items: Array<{ weightGram?: number | null, quantity: number }>): number {
  return items.reduce((total, item) => {
    const weight = item.weightGram || 1000 // default 1kg if not specified
    return total + (weight * item.quantity)
  }, 0)
}

/**
 * Validate price breakdown consistency
 */
export function validateBreakdown(breakdown: PriceBreakdown): boolean {
  const calculatedTotal = 
    breakdown.subtotal + 
    breakdown.shippingFee + 
    breakdown.jastipherMarkup + 
    breakdown.serviceFee + 
    breakdown.platformCommission
  
  return Math.abs(calculatedTotal - breakdown.totalFinal) < 1 // allow 1 rupiah rounding difference
}
