/**
 * Custom hook for checkout operations
 */

import { useState } from 'react'
import { checkoutDP, getOrderSummary, CheckoutDPRequest } from '@/lib/api/checkout'

export function useCheckoutDP() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkout = async (data: CheckoutDPRequest) => {
    setLoading(true)
    setError(null)

    try {
      const result = await checkoutDP(data)
      return result
    } catch (err: any) {
      setError(err.message || 'Checkout failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    checkout,
    loading,
    error
  }
}

export function useOrderSummary(orderId: string | null) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrder = async () => {
    if (!orderId) return

    setLoading(true)
    setError(null)

    try {
      const result = await getOrderSummary(orderId)
      setOrder(result)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order')
    } finally {
      setLoading(false)
    }
  }

  return {
    order,
    loading,
    error,
    refetch: fetchOrder
  }
}
