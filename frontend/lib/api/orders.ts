/**
 * Orders API Client
 * Functions for order management and validation
 */

export interface Order {
  id: string
  status: string
  dpAmount: number
  dpPaidAt: string | null
  finalAmount: number | null
  finalPaidAt: string | null
  validatedAt: string | null
  shippedAt: string | null
  completedAt: string | null
  rejectionReason: string | null
  participant: {
    name: string
    phone: string
  }
  items: {
    product: {
      id: string
      title: string
      price: number
      weightGram?: number
    }
    quantity: number
    priceAtOrder: number
    itemSubtotal: number
  }[]
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
  }
  trip: {
    id: string
    title: string
    jastiperId: string
  }
  createdAt: string
  updatedAt: string
}

export interface ValidateOrderRequest {
  action: 'accept' | 'reject'
  shippingFee?: number
  serviceFee?: number
  rejectionReason?: string
}

export interface ShippingOption {
  courier: string
  service: string
  cost: number
  etd: string
}

export interface PriceBreakdown {
  orderId: string
  status: string
  dpAmount: number
  finalAmount: number | null
  totalPrice: number
  fees: {
    shippingFee: number | null
    serviceFee: number | null
    platformCommission: number | null
  }
  breakdown: any | null
}

/**
 * Validate order (jastiper only)
 */
export async function validateOrder(
  orderId: string, 
  data: ValidateOrderRequest,
  token?: string
): Promise<{ success: boolean; data?: Order; error?: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`/api/orders/${orderId}/validate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Validation failed')
  }

  return result
}

/**
 * Calculate shipping cost (jastiper only)
 */
export async function calculateShipping(
  orderId: string,
  options: {
    origin?: string
    courier?: string
  },
  token?: string
): Promise<{ success: boolean; data: { options: ShippingOption[] } }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`/api/orders/${orderId}/calculate-shipping`, {
    method: 'POST',
    headers,
    body: JSON.stringify(options)
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to calculate shipping')
  }

  return result
}

/**
 * Get price breakdown
 */
export async function getPriceBreakdown(orderId: string): Promise<PriceBreakdown> {
  const response = await fetch(`/api/orders/${orderId}/breakdown`)
  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch breakdown')
  }

  return result.data
}

/**
 * Get orders awaiting validation (jastiper only)
 */
export async function getAwaitingValidationOrders(
  token?: string
): Promise<Order[]> {
  const headers: Record<string, string> = {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch('/api/orders?status=awaiting_validation', {
    headers
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch orders')
  }

  return result.data
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string, token?: string): Promise<Order> {
  const headers: Record<string, string> = {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`/api/orders/${orderId}`, { headers })
  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch order')
  }

  return result.data
}
