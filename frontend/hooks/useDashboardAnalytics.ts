/**
 * Custom hook for dashboard analytics
 */

import { useState, useEffect, useCallback } from 'react'
import {
  fetchDashboardAnalytics,
  DashboardData,
  MonthlyAnalytics,
  DashboardAlerts
} from '@/lib/api/analytics'

interface UseDashboardAnalyticsResult {
  analytics: MonthlyAnalytics | null
  alerts: DashboardAlerts | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and manage dashboard analytics data
 * Automatically fetches on mount and provides refetch function
 */
export function useDashboardAnalytics(): UseDashboardAnalyticsResult {
  const [analytics, setAnalytics] = useState<MonthlyAnalytics | null>(null)
  const [alerts, setAlerts] = useState<DashboardAlerts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchDashboardAnalytics()
      setAnalytics(data.analytics)
      setAlerts(data.alerts)
    } catch (err: any) {
      console.error('Failed to fetch dashboard analytics:', err)
      setError(err.message || 'Failed to fetch dashboard analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    analytics,
    alerts,
    loading,
    error,
    refetch: fetchData
  }
}
