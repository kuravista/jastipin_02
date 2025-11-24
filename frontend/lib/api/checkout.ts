/**
 * Checkout API Client
 * Functions for DP checkout flow
 */

export interface CheckoutDPRequest {
  tripId: string
  participantName: string
  participantPhone: string
  items: {
    productId: string
    quantity: number
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
  notes?: string
}

export interface CheckoutDPResponse {
  success: boolean
  data: {
    orderId: string
    guestId: string
    dpAmount: number
    paymentLink: string
    uploadLink: string
    uploadToken: string
  }
  error?: string
}

export interface OrderSummary {
  id: string
  status: string
  dpAmount: number
  totalPrice: number
  participant: {
    name: string
    phone: string
  }
  items: {
    product: {
      title: string
      price: number
    }
    quantity: number
    priceAtOrder: number
  }[]
  address?: {
    recipientName: string
    phone: string
    addressText: string
    districtName: string
    cityName: string
    provinceName: string
  }
  createdAt: string
}

/**
 * Process DP checkout
 */
export async function checkoutDP(data: CheckoutDPRequest): Promise<CheckoutDPResponse> {
  const response = await fetch('/api/checkout/dp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Checkout failed')
  }

  return result
}

/**
 * Get order summary
 */
export async function getOrderSummary(orderId: string): Promise<OrderSummary> {
  const response = await fetch(`/api/checkout/order/${orderId}`)
  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch order')
  }

  return result.data
}
