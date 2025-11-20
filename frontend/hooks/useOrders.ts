/**
 * Custom hooks for order management
 */

import { useState, useEffect } from 'react'
import { 
  validateOrder, 
  calculateShipping, 
  getPriceBreakdown,
  getAwaitingValidationOrders,
  getOrderById,
  Order,
  ValidateOrderRequest
} from '@/lib/api/orders'

export function useOrderValidation(token?: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validate = async (orderId: string, data: ValidateOrderRequest) => {
    setLoading(true)
    setError(null)

    try {
      const result = await validateOrder(orderId, data, token)
      return result
    } catch (err: any) {
      setError(err.message || 'Validation failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    validate,
    loading,
    error
  }
}

export function useShippingCalculator(token?: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<any[]>([])

  const calculate = async (orderId: string, params: { origin?: string; courier?: string }) => {
    setLoading(true)
    setError(null)

    try {
      const result = await calculateShipping(orderId, params, token)
      setOptions(result.data.options)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to calculate shipping')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    calculate,
    options,
    loading,
    error
  }
}

export function useOrderBreakdown(orderId: string | null) {
  const [breakdown, setBreakdown] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orderId) {
      fetchBreakdown()
    }
  }, [orderId])

  const fetchBreakdown = async () => {
    if (!orderId) return

    setLoading(true)
    setError(null)

    try {
      const result = await getPriceBreakdown(orderId)
      setBreakdown(result)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch breakdown')
    } finally {
      setLoading(false)
    }
  }

  return {
    breakdown,
    loading,
    error,
    refetch: fetchBreakdown
  }
}

export function useAwaitingOrders(token?: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [token])

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getAwaitingValidationOrders(token)
      setOrders(result)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders
  }
}

export function useOrder(orderId: string | null, token?: string) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId, token])

  const fetchOrder = async () => {
    if (!orderId) return

    setLoading(true)
    setError(null)

    try {
      const result = await getOrderById(orderId, token)
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
